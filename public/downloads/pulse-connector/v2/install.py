#!/usr/bin/env python3
"""Customer installer for the unchanged qualified Pulse connector bundle.

No cloud infrastructure is provisioned. Secrets are read interactively or from
a protected file, never passed as command arguments or printed.
"""
import argparse
import getpass
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import pwd
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import uuid

BUNDLE_SHA256 = 'beee0852ecfc6d58c1c009eb4aef3849388eb53e1d85459fa56505bd60000f93'
ROOT = Path('/opt/corvinth-pulse')
ETC = Path('/etc/corvinth-pulse')


def validate_config(value):
    if set(value) != {'api_origin', 'platform_id', 'region', 'journal_root', 'integration_id', 'prefix', 'connector_id'}:
        raise ValueError('Unexpected configuration fields')
    u = urlsplit(value['api_origin'])
    if u.scheme != 'https' or not u.hostname or u.username or u.password or u.path not in ('', '/') or u.query or u.fragment:
        raise ValueError('An HTTPS API origin is required')
    if value['journal_root'] != '/var/lib/corvinth-pulse':
        raise ValueError('Use the supported persistent journal location')
    if any(not isinstance(value[k], str) or not value[k] or '\x00' in value[k] or '\n' in value[k]
           for k in ('platform_id', 'integration_id', 'region')):
        raise ValueError('Invalid tenant/integration configuration')
    if not isinstance(value['prefix'], str) or len(value['prefix']) > 1024 or any(ord(c) < 32 for c in value['prefix']):
        raise ValueError('Invalid S3 prefix')
    uuid.UUID(value['connector_id'])
    return value


def unpack(bundle, target):
    if hashlib.sha256(bundle.read_bytes()).hexdigest() != BUNDLE_SHA256:
        raise ValueError('Connector bundle digest mismatch')
    with tarfile.open(bundle, 'r:') as archive:
        for member in archive.getmembers():
            path = PurePosixPath(member.name)
            if not member.isfile() or path.is_absolute() or '..' in path.parts or path.parts[0] != 'corvinth-pulse-connector':
                raise ValueError('Unsafe bundle member')
        archive.extractall(target, filter='data')
    result = Path(target)/'corvinth-pulse-connector'
    manifest = json.loads((result/'MANIFEST.json').read_text())
    for name, digest in manifest['files_sha256'].items():
        if hashlib.sha256((result/name).read_bytes()).hexdigest() != digest:
            raise ValueError('Bundle member digest mismatch')
    return result


def protected_file(path, data, uid, gid):
    if path.is_symlink():
        raise ValueError('Refusing a symlink configuration target')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
    try:
        os.fchmod(fd, 0o600); os.fchown(fd, uid, gid)
        os.write(fd, data)
    finally:
        os.close(fd)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True, type=Path)
    parser.add_argument('--bundle', required=True, type=Path)
    parser.add_argument('--api-key-file', type=Path)
    parser.add_argument('--check', action='store_true', help='Verify configuration and archive only; install nothing')
    args = parser.parse_args()
    config = validate_config(json.loads(args.config.read_text()))
    with tempfile.TemporaryDirectory(prefix='corvinth-pulse-install-') as temporary:
        source = unpack(args.bundle, temporary)
        if args.check:
            print('Configuration and pinned connector archive verified. No installation or cloud action performed.')
            return
        if sys.version_info[:2] != (3, 12) or sys.platform != 'linux' or platform.machine() not in ('x86_64', 'amd64'):
            raise ValueError('Linux x86_64 and Python 3.12 are required')
        if os.geteuid() != 0 or not shutil.which('systemctl'):
            raise ValueError('Run with sudo on a systemd host')
        if ETC.exists() and ETC.is_symlink() or ROOT.is_symlink():
            raise ValueError('Existing installation paths must not be symlinks')
        old = ETC/'config.json'
        runtime_config = {k: v for k, v in config.items() if k != 'platform_id'}
        if old.exists() and json.loads(old.read_text()) != runtime_config:
            raise ValueError('Existing configuration differs. Preserve the installation identity and journal; reconcile before replacing it.')
        if args.api_key_file:
            if args.api_key_file.is_symlink() or stat.S_IMODE(args.api_key_file.stat().st_mode) & 0o077:
                raise ValueError('Credential file must be private (chmod 600) and not a symlink')
            key = args.api_key_file.read_text().strip()
        else:
            key = getpass.getpass('Platform integration API credential (hidden): ').strip()
        if not key.startswith('crv_') or key.startswith(('crv_dashboard_', 'crv_console_')) or '\n' in key:
            raise ValueError('Use the existing platform integration credential, not a console credential')
        # No redirect may forward the credential to another origin.
        import urllib.request
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs): return None
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        with opener.open(Request(config['api_origin'].rstrip('/')+'/platform/verify', headers={'X-API-Key': key}), timeout=15) as response:
            tenant = json.load(response)
        if tenant.get('platform_id') != config['platform_id'] or tenant.get('status') != 'active':
            raise ValueError('Credential does not belong to the configured active platform')
        try: account = pwd.getpwnam('corvinth-pulse')
        except KeyError:
            subprocess.run(['useradd', '--system', '--user-group', '--home-dir', '/var/lib/corvinth-pulse', '--shell', '/usr/sbin/nologin', 'corvinth-pulse'], check=True)
            account = pwd.getpwnam('corvinth-pulse')
        if ROOT.exists():
            if (ROOT/'MANIFEST.json').read_bytes() != (source/'MANIFEST.json').read_bytes():
                raise ValueError('Existing connector differs from the pinned bundle')
            for name, digest in json.loads((source/'MANIFEST.json').read_text())['files_sha256'].items():
                if hashlib.sha256((ROOT/name).read_bytes()).hexdigest() != digest:
                    raise ValueError('Existing connector content differs; installation stopped')
        else:
            shutil.copytree(source, ROOT)
        if not (ROOT/'venv/bin/python').exists():
            subprocess.run([sys.executable, '-m', 'venv', str(ROOT/'venv')], check=True)
        subprocess.run([str(ROOT/'venv/bin/python'), '-m', 'pip', 'install', '--no-index', '--require-hashes', '--find-links', str(ROOT/'wheels'), '-r', str(ROOT/'requirements.lock')], check=True)
        ETC.mkdir(mode=0o750, exist_ok=True); os.chown(ETC, 0, account.pw_gid); os.chmod(ETC, 0o750)
        protected_file(ETC/'config.json', (json.dumps(runtime_config, indent=2)+'\n').encode(), 0, account.pw_gid)
        os.chmod(ETC/'config.json', 0o640)
        protected_file(ETC/'api-key', key.encode(), account.pw_uid, account.pw_gid)
        key = None
        shutil.copy2(source/'corvinth-pulse-connector.service', '/etc/systemd/system/corvinth-pulse-connector.service')
        # Run under the actual service identity. A root-shell AWS profile must
        # not make installation appear ready when the daemon cannot access S3.
        subprocess.run(['runuser','-u','corvinth-pulse','--','env',
            'CORVINTH_API_KEY_FILE='+str(ETC/'api-key'),str(ROOT/'venv/bin/python'),
            str(ROOT/'onboarding_check.py'),'--config',str(ETC/'config.json'),
            '--platform-id',config['platform_id']],check=True)
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        subprocess.run(['systemctl', 'enable', '--now', 'corvinth-pulse-connector'], check=True)
        subprocess.run(['systemctl', 'is-active', '--quiet', 'corvinth-pulse-connector'], check=True)
        print('Scoped onboarding preflight passed and connector process started. Confirm its heartbeat in the console. No scan or GPU work was started; scan completion remains separately verified.')


if __name__ == '__main__':
    try: main()
    except Exception as exc:
        # Never echo HTTP exceptions, request headers, response bodies or credentials.
        print(str(exc) if isinstance(exc, ValueError) else 'Installation failed: '+type(exc).__name__+'. Inspect local service status; credentials were not logged.', file=sys.stderr)
        raise SystemExit(1) from None

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const appRoot = join(root, 'app');
const disabledRoute = join(appRoot, 'api', 'check', 'route.js');
const privilegedBackendPath = '/hash/check-and-archive';

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:js|jsx|ts|tsx|mjs|cjs)$/.test(entry.name) ? [path] : [];
  });
}

test('the public privileged check proxy is absent', () => {
  assert.equal(
    existsSync(disabledRoute),
    false,
    'app/api/check/route.js must stay removed so /api/check resolves as not found',
  );
});

test('public frontend code contains no privileged check-and-archive target', () => {
  const inspected = [
    ...sourceFiles(appRoot),
    join(root, 'next.config.ts'),
    join(root, 'middleware.ts'),
    join(root, 'middleware.js'),
    join(root, 'proxy.ts'),
    join(root, 'proxy.js'),
  ].filter(existsSync);

  const violations = inspected
    .filter((path) => readFileSync(path, 'utf8').includes(privilegedBackendPath))
    .map((path) => relative(root, path));

  assert.deepEqual(
    violations,
    [],
    `public frontend code must not proxy, alias, or rewrite to ${privilegedBackendPath}`,
  );
});

test('the legacy public demo proxy is absent', () => {
  assert.equal(existsSync(join(appRoot, 'api', 'demo', 'route.js')), false);
});

test('frontend runtime code has no stale demo endpoint integration', () => {
  const violations = sourceFiles(appRoot)
    .filter((path) => /\/demo\/check|\/api\/demo/.test(readFileSync(path, 'utf8')))
    .map((path) => relative(root, path));

  assert.deepEqual(violations, [], 'Legacy backend demo must remain disconnected from the frontend');
});

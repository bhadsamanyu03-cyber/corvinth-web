import { displayManifest } from './demo-display-manifest.mjs';

// A public display catalogue, not an execution manifest. Backend mappings and
// signal/profile versions must be approved separately before compute is enabled.
export function approvedDemoCatalogue() {
  return {
    available: true,
    manifest_version: displayManifest.manifest_version,
    assets: displayManifest.assets.map((asset) => {
      const parts = asset.path.split('/');
      const filename = parts.at(-1);
      const original = asset.kind === 'original';
      return {
        id: asset.id,
        preview_url: '/demo-assets/' + parts.map(encodeURIComponent).join('/'),
        label: asset.label || filename,
        alt: `Approved demo ${original ? 'original' : 're-upload image'}: ${filename}`,
        can_reference: original,
        can_upload: !original,
        ...(asset.slide ? { slide: asset.slide } : {}),
      };
    }),
  };
}

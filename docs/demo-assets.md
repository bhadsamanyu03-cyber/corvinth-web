# Approved demo display assets

Source inspected: `/Users/samanyu_bhad03/before/images`. Its actual top-level
directory names are `originals ` and `variants ` (trailing spaces). The source was
not renamed, edited, recompressed or supplemented.

35 current approved files are copied byte-for-byte into `public/demo-assets/`, using clean top-level
`originals` / `variants` URL directories and preserving every filename and slide
subfolder. The originals contain four PNG/JPG files; variants contain 12 files in
slide1, 12 in slide2 and seven in slide3. No other website artwork,
synthetic image or placeholder becomes a production asset.

`app/lib/demo-display-manifest.mjs` is the frozen display inventory. Its file digest
and byte length verify content; opaque IDs bind each public relative path and its
exact content digest. `app/lib/demo-catalogue.mjs` projects only display IDs, encoded
same-origin URLs, labels/alt text and mutually exclusive picker roles. Labels retain
filenames without extensions; originals are exactly Original 01 through Original 04.
URLs and catalogue order retain the explicitly supplied slide placement.
SHA-256 file digests are not PDQ hashes or DINO vectors. The `display_` manifest
version is not evidence of qualification or a backend processing profile.

`liveDemoClient.listAssets` returns this catalogue for either compute mode. Existing
picker/reducer guards allow only originals in the reference stage and only variants
in the upload stage. Confirmed reference registration alone unlocks upload selection.
There is no guessed variant-family filter or preassigned match classification.

## Qualified execution mapping

The backend `demo_assets.manifest.json` binds these same display IDs and content
digests to immutable S3 object versions and SDK 1.1.0 signals. Its profile identifies
the canonical 512-capped compute digest, algorithm/configuration and exact qualified
native/Python runtime. None of that processing data enters the browser catalogue.

Managed compute creates a fresh 60-second presigned URL for the selected exact S3
version, verifies the fetched bytes and derives signals with the qualified server
path. Customer compute uses the installed SDK wheel's precomputed signals for those
same bytes. It does not fetch the image or require DINO. Both use the existing real
PDQ classifier against only the session-local reference.

Only confirmed backend registration unlocks the 31 variants. The upload picker
shows the exact 12/12/7 slides (four columns on desktop), with search scoped to the
current slide. Up to three selections can be retained across slides.
No family filter, transformation label or classification is inferred from a filename.

## Verification

`node --test tests/demo-catalogue.test.mjs` verifies the complete 35-file inventory,
digests and byte lengths, encoded filename paths, slide counts, role separation
in both compute modes, failed-report behavior, mode freeze and no compute activation.
Run the existing flow/gateway/access tests, build, lint and browser regression too.
The local fixture browser test is separate from live integration proof. See
[Current batch release evidence](demo-batch-release-2026-10-07.md) for real production
redemption, reporting, checking and exact public/S3 byte verification.

The current approved files total 45,148,382 bytes (about 45.1 MB). Gallery images are lazy
loaded and variants paginated. No smaller/recompressed derivatives are generated.

Old public files are retained only for compatibility with already-loaded image URLs;
they are not in the current catalogue or qualified execution manifest.

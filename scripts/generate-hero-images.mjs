// Static illustration assets only; these are not matching qualification results.
// Uses Sharp already provided by Next.js. No runtime image processing is added.
// Usage: node scripts/generate-hero-images.mjs [path/to/generated-source.png]
// Without an input, regenerate variants from the checked-in canonical WebP.
// Canonical photo generated with the built-in image tool, then edited with this final prompt:
// Edit this single canonical photograph. Reposition the woman's phone and the hand holding
// it so the phone fully covers her face from forehead through chin: no visible eyes, nose,
// or mouth, the face is concealed by the phone in a natural mirror selfie pose. Keep the
// same adult woman, long brown hair, opaque loose black crew-neck sweater fully covering
// chest, stomach, waist and hips, dark trousers, room, lighting, colors, camera framing
// and photo dimensions. Preserve the ordinary non-provocative personal-photo character.
// Change only the phone/hand position and the immediately affected face area. No text,
// UI, watermark, frame, or extra images.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const asset = name => fileURLToPath(new URL(`../public/screen01-personal-${name}.webp`, import.meta.url));
const canonical = asset('original');

if (process.argv[2]) {
  await sharp(process.argv[2]).resize({ width: 480, height: 600, fit: 'inside' })
    .toColourspace('srgb').webp({ lossless: true }).toFile(canonical);
}

const { width, height } = await sharp(canonical).metadata();
const variants = [
  ['mirrored', sharp(canonical).flop()],
  // The ORIGINAL thumbnail uses the canonical file directly.
  ['pink', sharp(canonical).tint({ r: 215, g: 143, b: 174 })],
  ['rotated', sharp(canonical).rotate(90)],
  ['cropped', sharp(canonical).extract({
    left: Math.round(width * .07), top: Math.round(height * .02),
    width: Math.round(width * .86), height: Math.round(height * .86),
  })],
  ['blurred', sharp(canonical).blur(8)],
];

for (const [name, pipeline] of variants) {
  await pipeline.webp({ lossless: true }).toFile(asset(name));
}
console.log('Saved canonical photo and five derived variants in public/screen01-personal-*.webp');

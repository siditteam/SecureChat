const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [128, 256, 512, 1024];
const assetsDir = path.join(__dirname, '..', 'public', 'assets');
const outDir = path.join(assetsDir, 'pngs');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.svg'));
if (files.length === 0) {
  console.error('No SVG files found in', assetsDir);
  process.exit(1);
}

(async () => {
  for (const file of files) {
    const inPath = path.join(assetsDir, file);
    const name = path.parse(file).name;
    for (const s of sizes) {
      const out = path.join(outDir, `${name}-${s}.png`);
      try {
        await sharp(inPath)
          .resize({ width: s, height: s, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ quality: 90 })
          .toFile(out);
        console.log('Wrote', out);
      } catch (err) {
        console.error('Failed', inPath, err.message);
      }
    }
  }
  console.log('All done');
})();

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_PATH = path.resolve('src/logo/nora-logo.svg');
const PUBLIC_DIR = path.resolve('public');
const ICONS_DIR = path.resolve('public/icons');

// Assurer les répertoires
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// SVG propre sans métadonnées superflues
const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#000000"/>
  <path d="M150 380V132H200L312 290V132H362V380H312L200 222V380Z" fill="#FFFFFF"/>
</svg>`;

// SVG sans coins arrondis pour maskable icon (avec padding interne pour safe area)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#000000"/>
  <g transform="translate(64, 64) scale(0.75)">
    <path d="M150 380V132H200L312 290V132H362V380H312L200 222V380Z" fill="#FFFFFF"/>
  </g>
</svg>`;

// Écrire les SVG dans public
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), cleanSvg, 'utf8');

const svgBuffer = Buffer.from(cleanSvg);
const maskableBuffer = Buffer.from(maskableSvg);

async function generate() {
  console.log('Generating PWA & Apple icons from nora-logo.svg...');

  const sizes = [
    { name: 'icon-192x192.png', size: 192, buf: svgBuffer },
    { name: 'icon-512x512.png', size: 512, buf: svgBuffer },
    { name: 'icon-maskable-192x192.png', size: 192, buf: maskableBuffer },
    { name: 'icon-maskable-512x512.png', size: 512, buf: maskableBuffer },
    { name: 'apple-touch-icon.png', size: 180, buf: svgBuffer },
    { name: 'apple-touch-icon-180x180.png', size: 180, buf: svgBuffer },
    { name: 'apple-touch-icon-167x167.png', size: 167, buf: svgBuffer },
    { name: 'apple-touch-icon-152x152.png', size: 152, buf: svgBuffer },
    { name: 'apple-touch-icon-120x120.png', size: 120, buf: svgBuffer },
    { name: 'favicon-32x32.png', size: 32, buf: svgBuffer },
    { name: 'favicon-16x16.png', size: 16, buf: svgBuffer },
  ];

  for (const item of sizes) {
    const dest = path.join(ICONS_DIR, item.name);
    await sharp(item.buf)
      .resize(item.size, item.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Copier apple-touch-icon aussi à la racine de public/ pour Safari
  fs.copyFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  // Favicon 32 à la racine comme favicon.png
  fs.copyFileSync(path.join(ICONS_DIR, 'favicon-32x32.png'), path.join(PUBLIC_DIR, 'favicon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

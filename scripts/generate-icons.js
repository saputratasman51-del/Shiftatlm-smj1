import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean Brand SVG with ATLM medical cross & microscope/flask theme
const brandSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#115e59" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#042f2e" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />

  <!-- Inner border glow -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="#2dd4bf" stroke-width="3" stroke-opacity="0.35" />

  <!-- Medical Cross / Shield background -->
  <g filter="url(#shadow)">
    <!-- White Shield / Card base -->
    <rect x="96" y="86" width="320" height="340" rx="36" fill="#ffffff" />
    
    <!-- Red/Teal Medical Cross -->
    <path d="M226 130 h60 v66 h66 v60 h-66 v66 h-60 v-66 h-66 v-60 h66 z" fill="#0d9488" rx="8" />

    <!-- Laboratory Flask & Droplet icon overlay in center of cross -->
    <circle cx="256" cy="226" r="28" fill="#ffffff" />
    <!-- Lab Droplet -->
    <path d="M256 206 C256 206 242 224 242 233 C242 240.7 248.3 247 256 247 C263.7 247 270 240.7 270 233 C270 224 256 206 256 206 Z" fill="#0284c7" />

    <!-- Text ATLM RSUD SMJ I -->
    <text x="256" y="360" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#0f766e" text-anchor="middle" letter-spacing="4">ATLM</text>
    <text x="256" y="388" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#64748b" text-anchor="middle" letter-spacing="1.5">RSUD SMJ I</text>
    <text x="256" y="406" font-family="Arial, sans-serif" font-weight="600" font-size="11" fill="#0ea5e9" text-anchor="middle" letter-spacing="1">KAYONG UTARA</text>
  </g>
</svg>`;

// 2. Create Maskable SVG with safe-zone margin (central 80% circle, safe padding of ~15-20%)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#115e59" />
    </linearGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#042f2e" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Full bleed background for Android clipping -->
  <rect width="512" height="512" fill="url(#bgGrad2)" />

  <!-- Scaled content centered safely within safe zone (80% circle diameter = 410px, radius = 205px) -->
  <g transform="translate(51.2, 51.2) scale(0.8)" filter="url(#shadow2)">
    <!-- White Card base -->
    <rect x="96" y="86" width="320" height="340" rx="36" fill="#ffffff" />
    
    <!-- Medical Cross -->
    <path d="M226 130 h60 v66 h66 v60 h-66 v66 h-60 v-66 h-66 v-60 h66 z" fill="#0d9488" />

    <!-- Lab Droplet center -->
    <circle cx="256" cy="226" r="28" fill="#ffffff" />
    <path d="M256 206 C256 206 242 224 242 233 C242 240.7 248.3 247 256 247 C263.7 247 270 240.7 270 233 C270 224 256 206 256 206 Z" fill="#0284c7" />

    <!-- Text ATLM RSUD SMJ I -->
    <text x="256" y="360" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#0f766e" text-anchor="middle" letter-spacing="4">ATLM</text>
    <text x="256" y="388" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#64748b" text-anchor="middle" letter-spacing="1.5">RSUD SMJ I</text>
    <text x="256" y="406" font-family="Arial, sans-serif" font-weight="600" font-size="11" fill="#0ea5e9" text-anchor="middle" letter-spacing="1">KAYONG UTARA</text>
  </g>
</svg>`;

async function generate() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), brandSvg, 'utf8');
  console.log('Written icon.svg');

  const brandBuffer = Buffer.from(brandSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 192x192 PNG
  await sharp(brandBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Written pwa-192x192.png');

  // 512x512 PNG
  await sharp(brandBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Written pwa-512x512.png');

  // 512x512 Maskable PNG
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Written pwa-maskable-512x512.png');

  // Apple Touch Icon (180x180 PNG)
  await sharp(brandBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Written apple-touch-icon.png');

  // Favicon PNG fallback (64x64)
  await sharp(brandBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Written favicon.ico');

  console.log('All PWA icons generated successfully!');
}

generate().catch(console.error);

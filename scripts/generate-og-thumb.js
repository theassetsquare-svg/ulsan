const sharp = require('sharp');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 1200;

const MAIN_TEXT = '춘자';
const SUB_TEXT = '울산챔피언';
const PHONE = '010-5653-0069';

async function generate() {
  const outPath = path.join(__dirname, '..', 'og', 'og-thumb.png');

  // Create base image with navy background
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 13, g: 31, b: 51, alpha: 1 } // #0D1F33
    }
  }).png();

  // Create purple glow overlay
  const glowSvg = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgb(124,58,237)" stop-opacity="0.3"/>
        <stop offset="60%" stop-color="rgb(124,58,237)" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
    <rect width="${WIDTH}" height="8" fill="#7C3AED"/>
    <rect y="${HEIGHT-8}" width="${WIDTH}" height="8" fill="#7C3AED"/>
    <rect x="80" y="80" width="1040" height="1040" rx="40" fill="none" stroke="rgba(124,58,237,0.15)" stroke-width="2"/>
  </svg>`);

  // Create text using sharp's text feature
  const mainTextSvg = Buffer.from(`<svg width="${WIDTH}" height="400">
    <text x="600" y="280" text-anchor="middle" font-size="320" font-weight="900" fill="white" font-family="Noto Sans KR, sans-serif">${MAIN_TEXT}</text>
  </svg>`);

  const subTextSvg = Buffer.from(`<svg width="${WIDTH}" height="120">
    <text x="600" y="80" text-anchor="middle" font-size="80" font-weight="900" fill="white" font-family="Noto Sans KR, sans-serif" letter-spacing="12">${SUB_TEXT}</text>
  </svg>`);

  const phoneTextSvg = Buffer.from(`<svg width="${WIDTH}" height="80">
    <text x="600" y="55" text-anchor="middle" font-size="48" font-weight="700" fill="rgba(255,255,255,0.5)" font-family="sans-serif" letter-spacing="4">${PHONE}</text>
  </svg>`);

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 13, g: 31, b: 51, alpha: 1 }
    }
  })
  .composite([
    { input: await sharp(glowSvg).resize(WIDTH, HEIGHT).toBuffer(), top: 0, left: 0 },
    { input: await sharp(subTextSvg).resize(WIDTH, 120).toBuffer(), top: 320, left: 0 },
    { input: await sharp(mainTextSvg).resize(WIDTH, 400).toBuffer(), top: 420, left: 0 },
    { input: await sharp(phoneTextSvg).resize(WIDTH, 80).toBuffer(), top: 850, left: 0 },
  ])
  .png()
  .toFile(outPath);

  const fs = require('fs');
  const stats = fs.statSync(outPath);
  console.log('Generated:', outPath, '(' + Math.round(stats.size / 1024) + 'KB)');
}

generate().catch(console.error);

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generate 180x180 PNG favicon (apple-touch-icon size)
const W = 180, H = 180;

const NAVY = [30, 58, 95];
const NAVY_LIGHT = [42, 77, 122];
const GOLD = [201, 169, 110];
const GOLD_LIGHT = [219, 191, 138];

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcBuf = Buffer.alloc(4); crcBuf.writeInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crcBuf]);
}

function dist(x, y, cx, cy) { return Math.sqrt((x-cx)**2 + (y-cy)**2); }

// Build pixel data
const rawRows = [];
for (let y = 0; y < H; y++) {
  const row = [0]; // filter: None
  for (let x = 0; x < W; x++) {
    let r, g, b;

    // Background: navy gradient with rounded corners
    const cornerR = 34;
    const inCorner = (
      (x < cornerR && y < cornerR && dist(x, y, cornerR, cornerR) > cornerR) ||
      (x > W-cornerR && y < cornerR && dist(x, y, W-cornerR, cornerR) > cornerR) ||
      (x < cornerR && y > H-cornerR && dist(x, y, cornerR, H-cornerR) > cornerR) ||
      (x > W-cornerR && y > H-cornerR && dist(x, y, W-cornerR, H-cornerR) > cornerR)
    );

    if (inCorner) {
      r = 0; g = 0; b = 0; // transparent (black for PNG without alpha)
      row.push(r, g, b);
      continue;
    }

    // Navy gradient background
    const t = (x / W) * 0.4 + (y / H) * 0.6;
    r = Math.round(NAVY[0] + (NAVY_LIGHT[0] - NAVY[0]) * t);
    g = Math.round(NAVY[1] + (NAVY_LIGHT[1] - NAVY[1]) * t);
    b = Math.round(NAVY[2] + (NAVY_LIGHT[2] - NAVY[2]) * t);

    // Trophy shape (simplified)
    const cx = 90, tTop = 45, tBot = 110, tW = 50;
    const stemTop = 110, stemBot = 125, stemW = 12;
    const baseTop = 125, baseBot = 138, baseW = 40;

    // Trophy cup (trapezoid)
    if (y >= tTop && y <= tBot) {
      const progress = (y - tTop) / (tBot - tTop);
      const halfW = tW - progress * 14;
      if (x >= cx - halfW && x <= cx + halfW) {
        const shine = x < cx - halfW + 16 ? 0.3 : 0;
        r = Math.min(255, Math.round(GOLD[0] + (GOLD_LIGHT[0] - GOLD[0]) * shine));
        g = Math.min(255, Math.round(GOLD[1] + (GOLD_LIGHT[1] - GOLD[1]) * shine));
        b = Math.min(255, Math.round(GOLD[2] + (GOLD_LIGHT[2] - GOLD[2]) * shine));
      }
    }

    // Trophy handles
    const handleL = dist(x, y, cx - 52, 72);
    const handleR = dist(x, y, cx + 52, 72);
    if ((handleL > 22 && handleL < 30 && x < cx - 30 && y > 50 && y < 95) ||
        (handleR > 22 && handleR < 30 && x > cx + 30 && y > 50 && y < 95)) {
      [r, g, b] = GOLD;
    }

    // Stem
    if (y >= stemTop && y <= stemBot && x >= cx - stemW && x <= cx + stemW) {
      [r, g, b] = GOLD;
    }

    // Base
    if (y >= baseTop && y <= baseBot && x >= cx - baseW && x <= cx + baseW) {
      const baseShade = y > baseTop + 8 ? 0.8 : 1;
      r = Math.round(GOLD[0] * baseShade);
      g = Math.round(GOLD[1] * baseShade);
      b = Math.round(GOLD[2] * baseShade);
    }

    // Star on trophy (simple 5-point check)
    const starCx = 90, starCy = 75, starR = 12;
    const starDist = dist(x, y, starCx, starCy);
    if (starDist < starR) {
      const angle = Math.atan2(y - starCy, x - starCx);
      const normAngle = ((angle + Math.PI * 2) % (Math.PI * 2));
      const spike = Math.cos(normAngle * 5 / 2);
      if (starDist < starR * (spike > 0 ? 1 : 0.45)) {
        [r, g, b] = NAVY;
      }
    }

    row.push(r, g, b);
  }
  rawRows.push(Buffer.from(row));
}

const rawData = Buffer.concat(rawRows);
const compressed = zlib.deflateSync(rawData, { level: 9 });

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync(path.join(__dirname, '..', 'favicon-192.png'), png);
console.log('Generated: favicon-192.png (' + (png.length/1024).toFixed(1) + 'KB)');

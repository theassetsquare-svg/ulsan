const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generate minimal valid PNG (solid color with gradient-like pattern)
// 1200x630 PNG

const W = 1200;
const H = 630;

function colorAt(x, y, bg1, bg2) {
  const t = (x / W) * 0.6 + (y / H) * 0.4;
  return [
    Math.round(bg1[0] + (bg2[0] - bg1[0]) * t),
    Math.round(bg1[1] + (bg2[1] - bg1[1]) * t),
    Math.round(bg1[2] + (bg2[2] - bg1[2]) * t),
  ];
}

function makePNG(bg1, bg2, barColor) {
  // Build raw image data (filter byte + RGB for each row)
  const rawRows = [];
  for (let y = 0; y < H; y++) {
    const row = [0]; // filter: None
    for (let x = 0; x < W; x++) {
      let r, g, b;
      if (y >= H - 8) {
        // Bottom gold bar
        [r, g, b] = barColor;
      } else {
        [r, g, b] = colorAt(x, y, bg1, bg2);
        // Add subtle circle highlight top-right
        const dx = x - 900, dy = y - 180;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const factor = (1 - dist / 250) * 0.12;
          r = Math.min(255, Math.round(r + (barColor[0] - r) * factor));
          g = Math.min(255, Math.round(g + (barColor[1] - g) * factor));
          b = Math.min(255, Math.round(b + (barColor[2] - b) * factor));
        }
      }
      row.push(r, g, b);
    }
    rawRows.push(Buffer.from(row));
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = compressed;
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

// CRC32
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

const NAVY_DARK = [19, 40, 67];
const NAVY = [30, 58, 95];
const NAVY_LIGHT = [42, 77, 122];
const GOLD = [201, 169, 110];

const pages = [
  { file: 'og-home.png', bg1: NAVY_DARK, bg2: NAVY_LIGHT },
  { file: 'og-story.png', bg1: NAVY_DARK, bg2: NAVY },
  { file: 'og-atmosphere.png', bg1: [26, 5, 51], bg2: NAVY },
  { file: 'og-first-visit.png', bg1: NAVY, bg2: NAVY_LIGHT },
  { file: 'og-access.png', bg1: NAVY_DARK, bg2: [42, 77, 122] },
  { file: 'og-review.png', bg1: NAVY, bg2: NAVY_DARK },
  { file: 'og-faq.png', bg1: NAVY_DARK, bg2: NAVY },
  { file: 'og-contact.png', bg1: NAVY, bg2: [42, 77, 122] },
];

const outDir = path.join(__dirname, '..', 'og');

pages.forEach(({ file, bg1, bg2 }) => {
  const png = makePNG(bg1, bg2, GOLD);
  fs.writeFileSync(path.join(outDir, file), png);
  console.log('Generated:', file, `(${(png.length / 1024).toFixed(1)}KB)`);
});

console.log('All OG images generated!');

#!/usr/bin/env node
// favicon-192.png를 192/512 PWA 아이콘으로 변환
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'favicon-192.png');
const ROOT = path.resolve(__dirname, '..');

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Missing source: ${SRC}`);
    process.exit(1);
  }
  await sharp(SRC).resize(192, 192, { fit: 'cover' }).png().toFile(path.join(ROOT, 'icon-192.png'));
  await sharp(SRC).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(ROOT, 'icon-512.png'));
  console.log('OK: icon-192.png, icon-512.png');
}

main().catch((e) => { console.error(e); process.exit(1); });

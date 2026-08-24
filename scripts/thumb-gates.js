/**
 * G9 — 네이버/구글 검색 썸네일 노출 조건 게이트.
 *
 * 전 HTML 페이지에 대해 다음 6개를 실측한다. 하나라도 실패하면 exit 1.
 *   1) 본문 <img> 존재
 *   2) og:image 와 본문 img 가 같은 파일
 *   3) 메타 9종 완비 (og:image, secure_url, width, height, type, alt,
 *      twitter:card=summary, twitter:image, thumbnail)
 *   4) PNG 1200x1200 실측
 *   5) PNG 300KB 이하
 *   6) alt 에 가게(엔티티) 이름 포함
 *
 * 실행: node scripts/thumb-gates.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://a.nolcool.com';
const SKIP = ['node_modules', '.git', 'scripts', 'docs'];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function pngMeta(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(24);
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), kb: fs.statSync(file).size / 1024 };
}

const meta = (head, attr, key) => {
  const m = head.match(new RegExp(`<meta ${attr}="${key.replace(/[:]/g, ':')}" content="([^"]*)"`, 'g'));
  if (!m) return { n: 0, v: null };
  const v = m[0].match(/content="([^"]*)"/)[1];
  return { n: m.length, v };
};

const files = walk(ROOT).sort();
const rows = [];
let fail = 0;

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const html = fs.readFileSync(f, 'utf8');
  const [head, body] = html.split('</head>');
  const g = {};
  const og = meta(head, 'property', 'og:image');
  g['og:image'] = og.v;

  const need = {
    'og:image': og.v && og.v.startsWith(SITE + '/og/'),
    'og:image:secure_url': meta(head, 'property', 'og:image:secure_url').v === og.v,
    'og:image:width': meta(head, 'property', 'og:image:width').v === '1200',
    'og:image:height': meta(head, 'property', 'og:image:height').v === '1200',
    'og:image:type': meta(head, 'property', 'og:image:type').v === 'image/png',
    'og:image:alt': !!meta(head, 'property', 'og:image:alt').v,
    'twitter:card': meta(head, 'name', 'twitter:card').v === 'summary',
    'twitter:image': meta(head, 'name', 'twitter:image').v === og.v,
    'thumbnail': meta(head, 'name', 'thumbnail').v === og.v,
  };
  const metaOK = Object.values(need).every(Boolean);
  const metaMiss = Object.entries(need).filter(([, v]) => !v).map(([k]) => k);

  // 중복 삽입 금지
  const dup = ['og:image', 'og:image:secure_url', 'og:image:alt']
    .filter((k) => meta(head, 'property', k).n > 1)
    .concat(['twitter:card', 'twitter:image', 'thumbnail'].filter((k) => meta(head, 'name', k).n > 1));

  const ogPath = og.v ? og.v.replace(SITE, '') : null;
  const imgRe = new RegExp(`<img[^>]+src="${ogPath}"[^>]*>`);
  const imgTag = body ? (body.match(imgRe) || [null])[0] : null;
  const altM = imgTag ? imgTag.match(/alt="([^"]*)"/) : null;
  const alt = altM ? altM[1] : null;

  // 엔티티 이름 후보 — JSON-LD name / og:site_name / title 첫 토큰
  const names = [...head.matchAll(/"name":\s*"([^"]+)"/g)].map((m) => m[1]);
  const site = meta(head, 'property', 'og:site_name').v;
  const title = (head.match(/<title>(.*?)<\/title>/s) || [, ''])[1];
  const first = title.split(/[\s,—·]/)[0];
  const cands = [...names, site, first].filter(Boolean);
  const altOK = !!alt && cands.some((c) => alt.includes(c));

  const png = ogPath ? path.join(ROOT, ogPath.replace(/^\//, '')) : null;
  const pm = png && fs.existsSync(png) ? pngMeta(png) : null;

  const checks = {
    '①본문img': !!imgTag,
    '②동일파일': !!imgTag,
    '③메타9종': metaOK && dup.length === 0,
    '④1200각': !!pm && pm.w === 1200 && pm.h === 1200,
    '⑤300KB이하': !!pm && pm.kb <= 300,
    '⑥alt업소명': altOK,
  };
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) {
    fail++;
    console.log(`[FAIL] ${rel}  →  ${bad.join(', ')}` +
      (metaMiss.length ? `  (메타: ${metaMiss.join(',')})` : '') +
      (dup.length ? `  (중복: ${dup.join(',')})` : ''));
  }
  rows.push({ rel, og: ogPath, kb: pm ? Math.round(pm.kb) : null, ok: bad.length === 0 });
}

console.log(`\n총 ${rows.length}페이지 · 통과 ${rows.length - fail} · 실패 ${fail}`);
if (fail) { console.log('G9 FAILED — 배포 금지'); process.exit(1); }
console.log('G9 PASSED');

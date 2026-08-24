#!/usr/bin/env node
'use strict';
/**
 * 배포된 페이지에 실제로 붙어 있는 광고주(닉네임·전화번호)를 원고 파일에 되돌려 넣는다.
 *
 * 왜 필요한가
 *   광고주는 나중에 페이지 HTML 에 직접 넣었고, 원고(scripts/night/*.js)에는 안 들어갔다.
 *   그래서 build-night-pages.js 를 그냥 돌리면 **광고주 전화바가 통째로 지워진다**
 *   (2026-08-25 실측: 13개 페이지 중 7곳에서 사라짐).
 *   원고가 유일한 기준이 되어야 생성기를 안심하고 돌릴 수 있다.
 *
 * 어떻게
 *   night/<폴더>/index.html 의 고정 전화바에서 가게이름·닉네임·번호를 읽어,
 *   같은 가게의 원고 파일에 group/contact 를 채운다.
 *   배포본에 없는 값은 만들지 않는다(추측 금지).
 *
 * 쓰는 법:  node scripts/sync-advertisers.js          (미리보기)
 *          node scripts/sync-advertisers.js --apply  (실제 반영)
 */
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(__dirname, '..');
const NIGHT = path.join(ROOT, 'night');
const SRC = path.join(__dirname, 'night');

/** 빵부스러기 마지막 항목의 가게이름 */
function venueName(html) {
  const a = html.indexOf('BreadcrumbList');
  if (a < 0) return null;
  const b = html.indexOf('</script>', a);
  const blk = html.slice(a, b < 0 ? html.length : b);
  const j = blk.lastIndexOf('"name":');
  if (j < 0) return null;
  const k = blk.indexOf('"', blk.indexOf(':', j) + 1);
  if (k < 0) return null;
  const e = blk.indexOf('"', k + 1);
  if (e < 0) return null;
  return blk.slice(k + 1, e);
}

/** 고정 전화바에서 담당자·번호를 읽는다 */
function advertiser(html, name) {
  const m = html.match(/class="callbar" href="tel:([0-9-]+)"[^>]*>\s*📞\s*([^<]+)/);
  if (!m) return null;
  const tel = m[1].trim();
  /* 표시 문구는 "가게이름 닉네임 번호" 꼴이다. 가게이름과 번호를 떼면 닉네임만 남는다. */
  const label = m[2].trim();
  const person = label.replace(name, '').replace(tel, '').trim();
  if (!person) return null;
  return { person, tel, raw: tel.replace(/-/g, ''), intl: '+82-' + tel.replace(/^0/, '') };
}

/* 배포본 읽기 */
const deployed = new Map();
for (const folder of fs.readdirSync(NIGHT)) {
  const f = path.join(NIGHT, folder, 'index.html');
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  const name = venueName(html);
  if (!name) continue;
  deployed.set(name, { folder, ad: advertiser(html, name) });
}

/* 원고 훑기 */
let filled = 0, already = 0, none = 0;
const notes = [];
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.js'))) {
  const p = path.join(SRC, file);
  const src = fs.readFileSync(p, 'utf8');
  const nm = src.match(/name:\s*'([^']+)'/);
  if (!nm) continue;
  const name = nm[1];
  const d = deployed.get(name);
  if (!d || !d.ad) { none++; continue; }

  const hasContact = /contact:\s*\{/.test(src);
  const isA = /group:\s*'A'/.test(src);
  if (hasContact && isA) { already++; continue; }

  let out = src;
  const block = "  group: 'A',\n"
    + "  contact: { person: '" + d.ad.person + "', tel: '" + d.ad.tel + "', raw: '" + d.ad.raw + "', intl: '" + d.ad.intl + "' },";

  if (/group:\s*'[AB]'/.test(out)) {
    out = out.replace(/  group:\s*'[AB]',(\n  contact:[^\n]*\n)?/, block + '\n');
  } else {
    /* group 이 없으면 name 줄 다음에 넣는다 */
    out = out.replace(/(  name:\s*'[^']+',\n)/, '$1' + block + '\n');
  }
  if (out === src) { notes.push('  ! ' + file + ' — 넣을 자리를 못 찾음'); continue; }

  if (APPLY) fs.writeFileSync(p, out, 'utf8');
  filled++;
  notes.push('  + ' + file.padEnd(30) + name.padEnd(16) + d.ad.person + ' ' + d.ad.tel);
}

console.log('원고에 광고주 채우기' + (APPLY ? '' : ' (미리보기)'));
for (const n of notes) console.log(n);
console.log('');
console.log('  채움 ' + filled + ' · 이미 있음 ' + already + ' · 배포본에 광고주 없음 ' + none);

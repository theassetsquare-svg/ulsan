'use strict';
/* 최종 라이브 실측 — 40 업소 (+허브·홈)
   | 업소명 | URL | HTTP | 전화바 표기 | 썸네일 1200×1200 | G11 통과 | */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { ORDER, SITE } = require('./build-night40.js');

const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));

function get(url, bin) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'nolcool-final-check/1.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(get(res.headers.location.startsWith('http') ? res.headers.location : SITE + res.headers.location, bin));
      }
      const cs = [];
      res.on('data', (c) => cs.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: bin ? Buffer.concat(cs) : Buffer.concat(cs).toString('utf8') }));
    });
    req.on('error', () => resolve({ status: 0, body: bin ? Buffer.alloc(0) : '' }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ status: 0, body: bin ? Buffer.alloc(0) : '' }); });
  });
}
const pngSize = (b) => (b.length > 24 && b.slice(1, 4).toString() === 'PNG')
  ? { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } : { w: 0, h: 0 };
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const count = (h, n) => h.split(n).length - 1;

async function main() {
  const rows = [];
  for (const v of venues) {
    const url = SITE + '/night-1/' + v.slug + '/';
    const p = await get(url, false);
    const src = p.body;
    const img = await get(SITE + '/og/' + v.slug + '.png', true);
    const d = img.status === 200 ? pngSize(img.body) : { w: 0, h: 0 };

    /* 전화바 */
    const barM = src.match(/<a class="callbar"[^>]*>[\s\S]*?<\/a>/);
    const bar = barM ? barM[0].replace(/\s+/g, ' ') : '';
    let barLabel = '(없음)', barOk = false;
    if (v.contact) {
      const want = 'tel:' + v.contact.tel;
      barOk = bar.includes('href="' + want + '"') && bar.includes(v.contact.person + ' ' + v.contact.tel);
      barLabel = barOk ? v.contact.person + ' ' + v.contact.tel : '불일치: ' + bar.slice(0, 60);
    } else {
      barOk = bar.includes('https://open.kakao.com/o/sBesta12') && bar.includes('광고문의 카카오톡 besta12');
      barLabel = barOk ? '광고문의 besta12' : '불일치: ' + bar.slice(0, 60);
    }

    /* G11 */
    const main = strip(src.slice(src.indexOf('<main'), src.indexOf('</main>')));
    const title = (src.match(/<title>([^<]*)<\/title>/) || [, ''])[1];
    const desc = (src.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];
    const h2s = [...src.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
    const n = count(main, v.name);
    const dn = count(desc, v.name);
    const g11 = {
      title: title.startsWith(v.name), lead: strip(src).includes(v.lead.slice(0, 20)),
      h2: h2s.some((h) => h.includes(v.name)), body: n >= 3 && n <= 5, desc: dn === 1
    };
    const g11ok = Object.values(g11).every(Boolean);

    rows.push({
      name: v.name, url, http: p.status, barLabel, barOk,
      imgW: d.w, imgH: d.h, imgOk: d.w === 1200 && d.h === 1200,
      g11ok, g11detail: 'title' + (g11.title ? '✓' : '✗') + ' 첫문단' + (g11.lead ? '✓' : '✗') +
        ' H2' + (g11.h2 ? '✓' : '✗') + ' 본문' + n + '회 desc' + dn + '회'
    });
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  const hub = await get(SITE + '/night-1/', false);
  const hubBar = (hub.body.match(/<a class="callbar"[^>]*>[\s\S]*?<\/a>/) || [''])[0];
  const home = await get(SITE + '/', false);
  const homeBar = (home.body.match(/<a href="tel:[^"]*" class="phone-bar"[\s\S]*?<\/a>/) || [''])[0].replace(/\s+/g, ' ');
  const llms = await get(SITE + '/llms.txt', false);

  fs.writeFileSync(path.join(__dirname, 'night40-final-live-report.json'),
    JSON.stringify({ rows, hubOk: hubBar.includes('besta12'), homeBar, llmsStatus: llms.status, llmsBytes: llms.body.length }, null, 2));

  console.log('| 업소명 | URL | HTTP | 전화바 표기 | 썸네일 1200×1200 | G11 통과 |');
  console.log('|---|---|---|---|---|---|');
  rows.forEach((r) => console.log('| ' + r.name + ' | ' + r.url + ' | ' + r.http + ' | ' + r.barLabel +
    ' | ' + (r.imgOk ? '1200×1200' : r.imgW + '×' + r.imgH) + ' | ' + (r.g11ok ? '통과' : '실패: ' + r.g11detail) + ' |'));

  const bad = rows.filter((r) => r.http !== 200 || !r.barOk || !r.imgOk || !r.g11ok);
  console.log('\n허브 바: ' + (hubBar.includes('광고문의 카카오톡 besta12') ? 'OK 광고문의 besta12' : 'FAIL'));
  console.log('홈 바: ' + (homeBar.includes('010-5653-0069') ? 'OK 춘자 010-5653-0069' : 'FAIL'));
  console.log('llms.txt: HTTP ' + llms.status + ' · ' + llms.body.length + ' bytes · 전화번호 ' + (/01[016789]-/.test(llms.body) ? '포함(위반)' : '0건'));
  console.log('실패 항목: ' + bad.length + (bad.length ? ' — ' + bad.map((b) => b.name).join(', ') : ''));
}
main();

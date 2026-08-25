'use strict';
/* 라이브 고정 하단바 실측 — 업소 40 + 허브 + 지역 13 + 홈
   규칙: 광고주 3곳(+홈, +해당 지역 페이지)만 전화번호 / 그 외 전부 카톡 besta12
   추가: 페이지 전체에 비인가 전화번호가 한 건도 없는지 스캔 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { ORDER, REGION_ORDER, SITE } = require('./build-night40.js');

const ADV = { '01056530069': '춘자', '01075284936': '로또', '01022211937': '손흥민' };
const PHONE_PAGES = {
  '/': '01056530069',
  '/ulsan-champion-night-1/': '01056530069',
  '/changwon-lululala-night-1/': '01075284936',
  '/bulgwang-hobak-night-1/': '01022211937',
  '/ulsan-night/': '01056530069',
  '/changwon-night/': '01075284936',
  '/eunpyeong-night/': '01022211937'
};

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'nolcool-callbar-check/1.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(get(res.headers.location.startsWith('http') ? res.headers.location : SITE + res.headers.location));
      }
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ status: 0, body: '' }); });
  });
}

const PHONE_RE = /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g;

async function check(pathname, label) {
  const r = await get(SITE + pathname);
  const src = r.body;
  const expectTel = PHONE_PAGES[pathname] || null;

  /* 고정바 추출 — a.callbar(업소·허브) 또는 div.callbar(지역) 또는 a.phone-bar(홈) */
  let bar = '';
  const m1 = src.match(/<a class="callbar"[^>]*>[\s\S]*?<\/a>/);
  const m2 = src.match(/<div class="callbar"[\s\S]*?<\/div>/);
  const m3 = src.match(/<a href="tel:[^"]*" class="phone-bar"[\s\S]*?<\/a>/);
  bar = (m1 || m2 || m3 || [''])[0].replace(/\s+/g, ' ').trim();

  const barNums = [...new Set((bar.match(PHONE_RE) || []).map((s) => s.replace(/[-.\s]/g, '')))];
  const pageNums = [...new Set((src.match(PHONE_RE) || []).map((s) => s.replace(/[-.\s]/g, '')))];
  const hasKakao = /besta12/.test(bar);

  let verdict;
  if (expectTel) {
    verdict = (barNums.length === 1 && barNums[0] === expectTel && pageNums.every((n) => n === expectTel))
      ? 'OK 번호바 ' + ADV[expectTel] + ' ' + expectTel : 'FAIL';
  } else {
    verdict = (barNums.length === 0 && hasKakao && pageNums.length === 0) ? 'OK besta12바' : 'FAIL';
  }
  return { pathname, label, http: r.status, bar: bar.slice(0, 110), barNums, pageNums, verdict };
}

async function main() {
  const targets = [
    ['/', '홈(울산챔피언 본사이트)'],
    ['/night-1/', '허브'],
    ...ORDER.map((s) => ['/night-1/' + s + '/', s]),
    ...REGION_ORDER.map((s) => ['/night-1/' + s + '/', s + ' (지역)'])
  ];
  const rows = [];
  for (const [p, l] of targets) { rows.push(await check(p, l)); process.stderr.write('.'); }
  process.stderr.write('\n');
  fs.writeFileSync(path.join(__dirname, 'night40-callbar-live-report.json'), JSON.stringify(rows, null, 2));

  console.log('| 페이지 | URL | HTTP | 고정 하단바 | 페이지 내 전화번호 | 판정 |');
  console.log('|---|---|---|---|---|---|');
  rows.forEach((r) => console.log('| ' + r.label + ' | ' + SITE + r.pathname + ' | ' + r.http + ' | ' +
    (r.barNums.length ? '📞 ' + r.barNums.join(',') : (/besta12/.test(r.bar) ? '💬 광고문의 카톡: besta12' : '(없음)')) +
    ' | ' + (r.pageNums.length ? r.pageNums.join(', ') : '없음') + ' | ' + r.verdict + ' |'));

  const bad = rows.filter((r) => r.verdict === 'FAIL' || r.http !== 200);
  console.log('\n총 ' + rows.length + '페이지 · 실패 ' + bad.length + '건' + (bad.length ? '\n' + JSON.stringify(bad, null, 2) : ''));
}
main();

'use strict';
/* 배포 후 라이브 실측 — 40 업소 + 홈 + 허브
   측정: HTTP 상태 / <title> 일치 / og 썸네일 실측(1200x1200) / 주소 확인 상태
   결과: scripts/night40-live-report.json + 표준출력 마크다운 표 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { ORDER, SITE, HUB_TITLE } = require('./build-night40.js');

const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));

function get(url, binary) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'nolcool-live-check/1.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http') ? res.headers.location : SITE + res.headers.location;
        return resolve(get(next, binary));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', (e) => resolve({ status: 0, body: '', error: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ status: 0, body: '', error: 'timeout' }); });
  });
}

const pngSize = (buf) => (buf.length > 24 && buf.slice(1, 4).toString() === 'PNG')
  ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : { w: 0, h: 0 };

function addrState(v) {
  if (v.addr && v.addr.street) return '확인 (' + v.addr.street + ')';
  if (v.addr && v.addr.jibun) return '지번만 확인 (' + v.addr.jibun + ')';
  return '확인 불가 (' + (v.landmark ? v.landmark + ' 권역까지' : '권역만') + ')';
}

async function one(url, expectTitle, imgUrl) {
  const page = await get(url, false);
  const m = typeof page.body === 'string' ? page.body.match(/<title>([^<]*)<\/title>/) : null;
  const title = m ? m[1] : '';
  const img = await get(imgUrl, true);
  const dim = img.status === 200 ? pngSize(img.body) : { w: 0, h: 0 };
  return {
    url, http: page.status, title, titleOk: title === expectTitle,
    img: imgUrl, imgHttp: img.status, imgW: dim.w, imgH: dim.h, imgOk: dim.w === 1200 && dim.h === 1200
  };
}

async function main() {
  const rows = [];
  for (const v of venues) {
    const r = await one(SITE + '/night/' + v.slug + '/', v.title, SITE + '/og/' + v.slug + '.png');
    rows.push({ name: v.name, slug: v.slug, addr: addrState(v), ...r });
    process.stderr.write('.');
  }
  const hub = await one(SITE + '/night/', HUB_TITLE, SITE + '/og/night-hub.png');
  const homePage = await get(SITE + '/', false);
  const homeTitle = (homePage.body.match(/<title>([^<]*)<\/title>/) || [, ''])[1];
  const homeImg = await get(SITE + '/og/home.png', true);
  const homeDim = homeImg.status === 200 ? pngSize(homeImg.body) : { w: 0, h: 0 };
  process.stderr.write('\n');

  const report = {
    checkedAt: new Date().toISOString(),
    venues: rows,
    hub,
    home: { url: SITE + '/', http: homePage.status, title: homeTitle, imgHttp: homeImg.status, imgW: homeDim.w, imgH: homeDim.h }
  };
  fs.writeFileSync(path.join(__dirname, 'night40-live-report.json'), JSON.stringify(report, null, 2));

  console.log('| 업소명 | URL | HTTP | title 일치 | 썸네일 1200×1200 | 주소 확인 |');
  console.log('|---|---|---|---|---|---|');
  rows.forEach((r) => {
    console.log('| ' + r.name + ' | /night/' + r.slug + '/ | ' + r.http + ' | ' + (r.titleOk ? '일치' : '불일치: ' + r.title) +
      ' | ' + (r.imgOk ? r.imgW + '×' + r.imgH : 'HTTP ' + r.imgHttp + ' ' + r.imgW + '×' + r.imgH) + ' | ' + r.addr + ' |');
  });
  console.log('| (허브) 전국 나이트 40 | /night/ | ' + hub.http + ' | ' + (hub.titleOk ? '일치' : '불일치: ' + hub.title) +
    ' | ' + (hub.imgOk ? '1200×1200' : 'HTTP ' + hub.imgHttp) + ' | — |');
  console.log('| (홈) | / | ' + homePage.status + ' | ' + homeTitle + ' | ' + homeDim.w + '×' + homeDim.h + ' | — |');

  const bad = rows.filter((r) => r.http !== 200 || !r.titleOk || !r.imgOk);
  console.log('\n실패 항목: ' + bad.length + (bad.length ? ' — ' + bad.map((b) => b.slug).join(', ') : ''));
}

main();

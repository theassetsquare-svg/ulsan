'use strict';
/**
 * 2차 지역 13페이지 .callbar 고정 검증 (G05·G06·G07·G08·G12) + 조상 체인 위험 속성 검사.
 * 사용: node scripts/region-callbar-check.js <baseUrl>
 */
const path = require('path');
const fs = require('fs');
const PW = process.env.PW_PATH || '/tmp/claude-1000/-home-user-ulsan/05007846-aa31-4548-96ce-d957ed0594ab/scratchpad/node_modules/playwright-core';
const { chromium } = require(PW);
const CHROME = process.env.CHROME_PATH || '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium';

const { regions } = require('./build-region-pages.js');
const BASE = (process.argv[2] || 'http://127.0.0.1:8099').replace(/\/$/, '');
const VIEWS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1920, height: 1080 }
];
const RISKY = ['transform', 'filter', 'perspective', 'backdropFilter', 'willChange', 'contain'];
const STAMP = process.env.CB || String(Date.now());

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const rows = [];
  let fails = 0;
  const ancestorFindings = [];
  const barText = {};
  const footerOk = {};

  for (const v of regions) {
    for (const view of VIEWS) {
      const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const url = BASE + '/night-1/' + v.slug + '/?cb=' + STAMP;
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(200);

      const data = await page.evaluate((RISKY) => {
        const bar = document.querySelector('.callbar');
        if (!bar) return { missing: true };
        const anc = [];
        let n = bar.parentElement;
        while (n) {
          const cs = getComputedStyle(n);
          const hit = RISKY.filter((p) => {
            const val = cs[p];
            if (!val || val === 'none' || val === 'normal' || val === 'auto') return false;
            if (p === 'willChange' && !/transform/.test(val)) return false;
            if (p === 'contain' && !/paint|strict|content/.test(val)) return false;
            return true;
          });
          anc.push({ tag: n.tagName.toLowerCase(), id: n.id || null, hit });
          n = n.parentElement;
        }
        return {
          missing: false,
          scrollable: document.body.scrollHeight > window.innerHeight,
          top0: bar.getBoundingClientRect().top,
          anc,
          barText: bar.textContent.replace(/\s+/g, ' ').trim(),
          parentTag: bar.parentElement.tagName.toLowerCase(),
          docH: document.body.scrollHeight, winH: window.innerHeight
        };
      }, RISKY);

      if (data.missing) { rows.push({ slug: v.slug, view: view.name, err: '.callbar 없음' }); fails++; await ctx.close(); continue; }
      if (!data.scrollable) { rows.push({ slug: v.slug, view: view.name, err: '스크롤 없음 ' + data.docH + '<=' + data.winH }); fails++; await ctx.close(); continue; }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => {
        const bar = document.querySelector('.callbar');
        const ad = document.querySelector('.ad-inquiry');
        const b = bar.getBoundingClientRect(), a = ad.getBoundingClientRect();
        return { top1: b.top, overlap: !(a.bottom <= b.top || a.top >= b.bottom), adBottom: a.bottom, barTop: b.top, scrollY: window.scrollY };
      });

      const diff = Math.abs(after.top1 - data.top0);
      const ok = diff === 0;
      if (!ok) fails++;
      if (after.overlap) fails++;

      rows.push({
        slug: v.slug, kw: v.kw, group: v.group, view: view.name, top0: data.top0, top1: after.top1, diff,
        overlap: after.overlap, adBottom: Math.round(after.adBottom), barTop: Math.round(after.barTop),
        docH: data.docH, winH: data.winH, pass: ok && !after.overlap
      });
      if (view.name === 'mobile') {
        barText[v.slug] = data.barText;
        const risky = data.anc.filter((a) => a.hit.length);
        ancestorFindings.push({ slug: v.slug, parent: data.parentTag, chain: data.anc.map((a) => a.tag).join('>'), risky });
        footerOk[v.slug] = await page.evaluate(() => {
          const ad = document.querySelector('.ad-inquiry');
          return !!ad && /besta12/.test(ad.textContent);
        });
      }
      await ctx.close();
    }
  }
  await browser.close();

  console.log('BASE = ' + BASE);
  console.log('\n=== G05/G12 고정바 좌표 실측 (26행) ===');
  rows.forEach((r) => {
    if (r.err) { console.log('FAIL ' + r.slug + ' ' + r.view + ' ' + r.err); return; }
    console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + (r.kw + '').padEnd(8) + r.slug.padEnd(18) + r.view.padEnd(8) +
      'top(전) ' + r.top0 + '  top(후) ' + r.top1 + '  차이 ' + r.diff + '  푸터겹침 ' + (r.overlap ? 'YES' : 'NO') +
      '  문서 ' + r.docH + 'px');
  });

  console.log('\n=== 조상 체인 위험 속성 검사 ===');
  let riskyCount = 0;
  ancestorFindings.forEach((f) => { if (f.risky.length) { riskyCount++; console.log('WARN ' + f.slug + ' → ' + JSON.stringify(f.risky)); } });
  console.log('.callbar 부모 태그: ' + [...new Set(ancestorFindings.map((f) => f.parent))].join(',') +
    ' / 위험 속성 보유 조상 ' + riskyCount + '건');

  console.log('\n=== G06/G07 고정바 문구 ===');
  regions.forEach((v) => {
    const t = barText[v.slug] || '';
    const has = /besta12/.test(t);
    const ok = v.group === 'A' ? !has : has;
    if (!ok) fails++;
    console.log((ok ? 'PASS' : 'FAIL') + '  [' + v.group + '] ' + v.slug.padEnd(18) + t);
  });

  const f8 = regions.filter((v) => !footerOk[v.slug]);
  console.log('\n=== G08 푸터 besta12 ===');
  console.log(f8.length ? 'FAIL ' + f8.map((v) => v.slug).join(',') : 'PASS 13/13 노출');
  if (f8.length) fails++;

  fs.writeFileSync(path.join(__dirname, 'region-callbar-report.json'), JSON.stringify({ base: BASE, rows, ancestorFindings, barText, footerOk }, null, 2));
  console.log('\n' + (fails ? 'FAIL 총 ' + fails + '건' : '고정바 검증 전부 PASS'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

'use strict';
/**
 * 허용된 4종 파일에만 append 한다.
 *   ① sitemap.xml  ② robots.txt  ③ llms.txt  ④ index.html (링크 블록 1개)
 * 기존 내용은 한 글자도 지우지 않는다. 재실행해도 중복되지 않도록 마커로 막는다.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { ORDER, SITE, TODAY } = require('./build-night-pages.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night', s + '.js')));

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

/* ① sitemap.xml — 정적 파일이므로 </urlset> 앞에 13개 url 삽입 */
(function sitemap() {
  let x = read('sitemap.xml');
  if (x.includes('/night-1/')) { console.log('skip sitemap (이미 반영)'); return; }
  const block = venues.map((v) => `  <url>
    <loc>${SITE}/night/${v.slug}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${SITE}/og/${v.slug}-og.png</image:loc>
      <image:caption>${v.name}</image:caption>
    </image:image>
  </url>`).join('\n');
  write('sitemap.xml', x.replace('</urlset>', block + '\n</urlset>'));
  console.log('OK sitemap.xml +13 url');
})();

/* ② robots.txt — 지정된 블록 append */
(function robots() {
  let x = read('robots.txt');
  if (x.includes('# night pages')) { console.log('skip robots (이미 반영)'); return; }
  write('robots.txt', x.replace(/\s*$/, '\n') + `
# night pages
User-agent: Yeti
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);
  console.log('OK robots.txt append');
})();

/* ③ llms.txt — "URL — 업소명 — 지역 — 한 줄 설명" 13줄 append */
(function llms() {
  let x = read('llms.txt');
  if (x.includes('## 지역별 나이트 위치 안내')) { console.log('skip llms (이미 반영)'); return; }
  const lines = venues.map((v) => {
    const loc = v.addr.street ? v.addr.street + (v.addr.floor ? ' ' + v.addr.floor : '') : (v.landmark || v.addr.locality);
    const extra = v.age ? ' 출입 ' + v.age + '.' : '';
    const station = v.station ? ' 가장 가까운 역 ' + v.station + '.' : '';
    return `- ${SITE}/night/${v.slug}/ — ${v.name} — ${v.region} — ${loc}.${station}${extra} 영업시간 등 미확인 항목은 페이지에 확인 불가로 표기.`;
  }).join('\n');
  write('llms.txt', x.replace(/\s*$/, '\n') + `
## 지역별 나이트 위치 안내 (13곳, 2026-08-15 추가)
목록 페이지: ${SITE}/night/
각 페이지는 교차 확인된 주소·가장 가까운 역만 싣고, 확인되지 않은 영업시간·요금·연령은 "확인 불가"로 명시합니다.

${lines}
`);
  console.log('OK llms.txt +13행');
})();

/* ④ index.html — 링크 블록 1개만 </main> 앞에 삽입 */
(function indexLinks() {
  let x = read('index.html');
  if (x.includes('night-index-block')) { console.log('skip index.html (이미 반영)'); return; }
  const items = venues.map((v) => {
    const loc = v.addr.street ? v.addr.street : (v.landmark || v.addr.locality);
    return `      <li style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,.08);"><a href="/night/${v.slug}/" style="font-weight:700;">${v.name}</a> <span style="color:#4B5563;font-size:.92rem;">${loc}</span></li>`;
  }).join('\n');
  const block = `
<section class="section section-light" id="night-index-block" aria-labelledby="night-index-title">
  <div class="wrap">
    <h2 class="section-title" id="night-index-title">지역별 나이트 위치 안내</h2>
    <p class="section-sub">확인된 주소와 가장 가까운 역만 정리한 안내 페이지입니다.</p>
    <ul style="margin-top:18px;">
${items}
      <li style="padding:8px 0;"><a href="/night-1/" style="font-weight:800;">전체 목록 보기 →</a></li>
    </ul>
  </div>
</section>

`;
  const i = x.lastIndexOf('</main>');
  if (i < 0) throw new Error('index.html 에 </main> 없음');
  write('index.html', x.slice(0, i) + block + x.slice(i));
  console.log('OK index.html 링크 블록 삽입');
})();

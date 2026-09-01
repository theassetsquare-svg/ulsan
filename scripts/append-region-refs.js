'use strict';
/**
 * sitemap.xml · llms.txt 에 다음 자리 지역 페이지 13개를 append 한다.
 * 기존 항목은 한 글자도 건드리지 않는다. 이미 들어 있으면 아무것도 하지 않는다.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { regions, SITE, TODAY } = require('./build-region-pages.js');

/* ---- sitemap.xml ---- */
{
  const p = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(p, 'utf8');
  const missing = regions.filter((r) => !xml.includes(SITE + '/night-1/' + r.slug + '/'));
  if (missing.length) {
    const block = missing.map((r) =>
      '  <url>\n' +
      '    <loc>' + SITE + '/night-1/' + r.slug + '/</loc>\n' +
      '    <lastmod>' + TODAY + '</lastmod>\n' +
      '    <changefreq>weekly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '    <image:image>\n' +
      '      <image:loc>' + SITE + '/og/' + r.slug + '-og.png</image:loc>\n' +
      '      <image:caption>' + r.kw + '</image:caption>\n' +
      '    </image:image>\n' +
      '  </url>'
    ).join('\n');
    xml = xml.replace(/<\/urlset>\s*$/, block + '\n</urlset>\n');
    fs.writeFileSync(p, xml);
    console.log('sitemap.xml  +' + missing.length + '개 URL append');
  } else {
    console.log('sitemap.xml  이미 13개 모두 있음 — 변경 없음');
  }
}

/* ---- llms.txt ---- */
{
  const p = path.join(ROOT, 'llms.txt');
  let txt = fs.readFileSync(p, 'utf8');
  const missing = regions.filter((r) => !txt.includes('/night-1/' + r.slug + '/'));
  if (missing.length) {
    const oneLiner = (r) => {
      const age = r.age ? ' (연결 업소 출입 ' + r.age + ')' : '';
      return '- ' + SITE + '/night-1/' + r.slug + '/ — ' + r.kw + ' — ' + r.region + ' — ' +
        r.angleName + '으로 정리한 지역 밤 문화 안내, 연결 업소 ' + r.venue.name + age;
    };
    const block = '\n## 지역 키워드 안내 13곳 (2026-08-15 신설)\n' +
      '업소 소개와 별개로, 지역 단위 밤 문화를 각각 다른 각도로 정리한 페이지입니다. ' +
      '확인되지 않은 영업시간·요금·연령은 싣지 않았습니다.\n\n' +
      missing.map(oneLiner).join('\n') + '\n';
    txt = txt.replace(/\s*$/, '\n') + block;
    fs.writeFileSync(p, txt);
    console.log('llms.txt     +' + missing.length + '줄 append');
  } else {
    console.log('llms.txt     이미 13줄 모두 있음 — 변경 없음');
  }
}

/* ---- robots.txt 확인만 ---- */
{
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  const yeti = /User-agent:\s*Yeti[\s\S]*?Allow:\s*\//.test(robots);
  const google = /User-agent:\s*Googlebot[\s\S]*?Allow:\s*\//.test(robots);
  const disallow = /Disallow:\s*\S/.test(robots);
  console.log('robots.txt   Yeti Allow ' + (yeti ? 'O' : 'X') + ' / Googlebot Allow ' + (google ? 'O' : 'X') +
    ' / Disallow 항목 ' + (disallow ? '있음' : '0건') + ' → 변경 없음');
}

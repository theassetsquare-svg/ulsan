'use strict';
/* sitemap.xml 재생성 — 홈 + 레거시 + /night/ 허브 + 업소 40 + 지역 13, lastmod = 오늘 */
const fs = require('fs');
const path = require('path');
const { ORDER, REGION_ORDER, SITE, TODAY } = require('./build-night40.js');

const ROOT = path.join(__dirname, '..');
const urls = [
  ['/', '1.0', 'daily'],
  ['/story-1/', '0.8', 'weekly'],
  ['/atmosphere-1/', '0.8', 'weekly'],
  ['/first-1/', '0.8', 'weekly'],
  ['/access-1/', '0.8', 'weekly'],
  ['/review-1/', '0.8', 'weekly'],
  ['/faq-1/', '0.8', 'weekly'],
  ['/contact-1/', '0.8', 'weekly'],
  ['/policy-1/', '0.3', 'monthly'],
  ['/bulgwang-1/', '0.8', 'weekly'],
  ['/night-1/', '0.9', 'daily'],
  ...ORDER.map((s) => ['/night-1/' + s + '/', '0.9', 'weekly']),
  ...REGION_ORDER.map((s) => ['/night-1/' + s + '/', '0.8', 'weekly'])
];

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([u, pr, cf]) =>
    '  <url>\n    <loc>' + SITE + u + '</loc>\n    <lastmod>' + TODAY + '</lastmod>\n    <changefreq>' + cf + '</changefreq>\n    <priority>' + pr + '</priority>\n  </url>'
  ).join('\n') + '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log('sitemap.xml written:', urls.length, 'URLs');
module.exports = { urls };

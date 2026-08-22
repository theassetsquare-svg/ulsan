/**
 * 공개 URL을 확장자 없는 형태로 통일한다.
 *
 * 왜: Cloudflare Pages가 /access.html 을 /access-1 로 308 리다이렉트한다.
 * canonical / og:url / sitemap 이 .html 을 가리키면 "정식 주소"로 신고한 URL이
 * 실제로는 리다이렉트되는 주소가 된다. 실제 서빙 주소로 맞춘다.
 *
 * 바꾸는 것   : canonical, og:url, JSON-LD의 url/@id/mainEntityOfPage/breadcrumb,
 *               본문 내부 링크, sitemap.xml, rss.xml, llms.txt,
 *               engage.js의 pageOrder url, 라이브 URL을 치는 워크플로
 * 안 바꾸는 것: 로컬 파일 경로(scripts의 file 목록, 워크플로의 files 배열,
 *               on.push.paths 필터). 바꾸면 빌드가 깨진다.
 *
 * 실행: node scripts/normalize-urls.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://love-8r5.pages.dev';
const SLUGS = ['story', 'atmosphere', 'first-visit', 'access', 'review', 'faq', 'contact'];

const HTML_FILES = [
  'index.html', 'story.html', 'atmosphere.html', 'first-visit.html',
  'access.html', 'review.html', 'faq.html', 'contact.html', 'legal/index.html',
];

/** 절대 URL: https://도메인/slug.html -> https://도메인/slug (index.html -> /) */
function absUrls(s) {
  for (const g of SLUGS) s = s.split(`${ORIGIN}/${g}.html`).join(`${ORIGIN}/${g}`);
  return s.split(`${ORIGIN}/index.html`).join(`${ORIGIN}/`);
}

/** 내부 링크: href="slug.html" 또는 href="/slug.html" -> href="/slug" */
function hrefs(s) {
  for (const g of SLUGS) {
    s = s.split(`href="${g}.html"`).join(`href="/${g}"`);
    s = s.split(`href="/${g}.html"`).join(`href="/${g}"`);
  }
  return s.split('href="index.html"').join('href="/"').split('href="/index.html"').join('href="/"');
}

const changed = [];
const touch = (rel, fn) => {
  const fp = path.join(ROOT, rel);
  const before = fs.readFileSync(fp, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(fp, after);
    changed.push(rel);
  }
};

// 1) HTML — 절대 URL + 내부 링크
for (const f of HTML_FILES) touch(f, (s) => hrefs(absUrls(s)));

// 2) 사이트 전역 데이터 파일
for (const f of ['sitemap.xml', 'rss.xml', 'llms.txt']) touch(f, absUrls);

// 3) engage.js 의 pageOrder url (클라이언트 내부 링크). 경로 매칭 로직은 그대로 둔다.
touch('engage.js', (s) => {
  for (const g of SLUGS) s = s.split(`{ url: '/${g}.html'`).join(`{ url: '/${g}'`);
  return s;
});

// 4) 라이브 URL을 치는 워크플로만 (로컬 files 배열은 건드리지 않음)
for (const f of [
  '.github/workflows/live-health-check.yml',
  '.github/workflows/lighthouse-ci.yml',
  '.github/workflows/seo-daily-cron.yml',
]) touch(f, absUrls);

// 5) 스키마 생성기의 slug(=URL 조각). file 키는 로컬 경로라 유지.
touch('scripts/inject-schema.js', (s) => {
  for (const g of SLUGS) s = s.split(`slug: '${g}.html'`).join(`slug: '${g}'`);
  return s;
});

console.log(`갱신된 파일 ${changed.length}개:`);
changed.forEach((c) => console.log('  -', c));

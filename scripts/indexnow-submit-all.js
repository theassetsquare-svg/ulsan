/**
 * IndexNow 전 페이지 일괄 재제출.
 * sitemap.xml 의 <loc> 를 그대로 읽어 보내므로 페이지가 늘어도 수정이 필요 없다.
 * 키 파일: /{KEY}.txt (리포 루트에 이미 존재)
 *
 * 실행: node scripts/indexnow-submit-all.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://love-8r5.pages.dev';
const HOST = 'love-8r5.pages.dev';
const KEY = '584e7bc8bafe5edd3494299f6b582313';

const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) { console.error('sitemap.xml 에서 URL을 못 읽었습니다.'); process.exit(1); }

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList });
const endpoints = ['api.indexnow.org', 'www.bing.com', 'searchadvisor.naver.com'];

console.log(`제출 URL ${urlList.length}개 → ${endpoints.join(', ')}`);
let done = 0;
endpoints.forEach((host) => {
  const req = https.request({
    host, path: '/indexnow', method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
  }, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log(`[${host}] HTTP ${res.statusCode} ${String(data).slice(0, 200).trim()}`);
      if (++done === endpoints.length) console.log('완료');
    });
  });
  req.on('error', (e) => {
    console.log(`[${host}] 실패: ${e.message}`);
    if (++done === endpoints.length) console.log('완료');
  });
  req.write(body); req.end();
});

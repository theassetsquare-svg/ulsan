'use strict';
/* IndexNow 일괄 제출 — 키 파일: /{KEY}.txt (기존 존재) */
const https = require('https');
const { ORDER, REGION_ORDER, SITE } = require('./build-night40.js');

const KEY = '584e7bc8bafe5edd3494299f6b582313';
const urlList = [
  SITE + '/',
  SITE + '/night-1/',
  ...ORDER.map((s) => SITE + '/night-1/' + s + '/'),
  ...REGION_ORDER.map((s) => SITE + '/night-1/' + s + '/')
];

const body = JSON.stringify({
  host: 'love-8r5.pages.dev',
  key: KEY,
  keyLocation: SITE + '/' + KEY + '.txt',
  urlList
});

const endpoints = ['api.indexnow.org', 'www.bing.com', 'searchadvisor.naver.com'];
let done = 0;
endpoints.forEach((host) => {
  const req = https.request({
    host, path: host === 'searchadvisor.naver.com' ? '/indexnow' : '/indexnow',
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
  }, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log(host, res.statusCode, data.slice(0, 200));
      if (++done === endpoints.length) console.log('submitted', urlList.length, 'URLs');
    });
  });
  req.on('error', (e) => { console.log(host, 'ERROR', e.message); if (++done === endpoints.length) console.log('submitted', urlList.length, 'URLs'); });
  req.write(body); req.end();
});

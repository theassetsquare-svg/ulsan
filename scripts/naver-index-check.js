'use strict';
/*
 * 네이버 색인(검색 목록 등록) 여부 수동 점검 도구
 *
 * ⚠️ 자동 실행 금지. 사람이 요청했을 때만 돌린다.
 *    네이버에 짧은 시간 많은 검색을 날리면 우리 사이트가 어뷰징으로 의심받아
 *    이미 등록된 페이지까지 불이익을 받을 수 있다. 그래서:
 *      - 기본 대상은 확인이 필요한 소수 URL뿐 (전체 스캔은 --all 을 명시해야 함)
 *      - 검색 간격 15초 (사람이 검색하는 속도)
 *      - cron / GitHub Actions 에 절대 연결하지 않는다
 *
 * 사용법:
 *   node scripts/naver-index-check.js                     # 기본 대상(TARGETS)만 점검
 *   node scripts/naver-index-check.js --only=/policy-1/,/faq-1 # 지정한 주소만
 *   node scripts/naver-index-check.js --all               # sitemap 전체 (꼭 필요할 때만)
 *
 * 판정 근거: 검색결과 HTML의 data-url="..." 속성 (결과 항목 1개당 1개).
 *   href나 도메인 문자열을 세면 페이지네이션·재검색 링크까지 잡혀 오탐이 난다.
 * 주의: 2페이지 이후는 서버 렌더링이 안 되므로 URL 1개씩 개별 쿼리해야 한다.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE = 'https://a.nolcool.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const DELAY_MS = 15000;
const OUT = path.join(__dirname, 'naver-index-report.json');

/* 2026-08-18 슬러그 개편으로 새로 만든 8개 — 네이버 등록을 기다리는 중 */
const TARGETS = [
  '/policy-1/',
  '/bulgwang-1',
  '/night-1/suyu-shampoo/',
  '/night-1/suwon-chance-dome/',
  '/club/ilsan-shampoo-night/',
  '/club/bulgwang-hobak-night/',
  '/club/cheongju-hobak-night/',
  '/night-1/suwon-nightclub/'
];

const argAll = process.argv.includes('--all');
const argOnly = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');

function get(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 30000 }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (u) => u.replace(/\/$/, '');
const abs = (p) => (p.startsWith('http') ? p : SITE + '/' + p.replace(/^\//, ''));

async function loadUrls() {
  if (argOnly) return argOnly.split(',').filter(Boolean).map(abs);
  if (!argAll) return TARGETS.map(abs);
  const { status, body } = await get(SITE + '/sitemap.xml', { 'User-Agent': UA });
  if (status !== 200) throw new Error('sitemap.xml HTTP ' + status);
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/** 라이브에서 실제 페이지가 뜨는지 확인 (SPA 폴백이 200을 내주므로 canonical 본문으로 판정) */
async function checkLive(url) {
  try {
    const { status, body } = await get(url, { 'User-Agent': UA });
    const m = body.match(/rel="canonical" href="([^"]+)"/);
    const canonical = m ? m[1] : '';
    return { status, canonical, ok: status === 200 && norm(canonical) === norm(url) };
  } catch (e) {
    return { status: 0, canonical: '', ok: false };
  }
}

/*
 * 네이버가 자동 조회를 제한할 때는 HTTP 200 을 주면서도
 * 검색결과를 아예 렌더링하지 않은 축약 페이지(약 70KB)를 돌려준다.
 * 이걸 걸러내지 않으면 멀쩡히 등록된 페이지까지 "미등록"으로 잘못 보고하게 된다.
 * → 결과 컨테이너가 하나도 없으면 "미등록"이 아니라 "판정 불가"로 처리한다.
 */
function hasRenderedResults(html) {
  return /sds-comps-vertical-layout/.test(html);
}

function naverSearchUrl(target) {
  const q = encodeURIComponent('site:' + target.replace(/^https?:\/\//, ''));
  return `https://search.naver.com/search.naver?where=web&query=${q}`;
}

/** 네이버가 지금 정상 응답을 주는 상태인지 먼저 확인 (도메인 전체 검색 1회) */
async function probeNaver() {
  try {
    const res = await get(naverSearchUrl(SITE), { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' });
    return res.status === 200 && hasRenderedResults(res.body);
  } catch (e) {
    return false;
  }
}

/** 네이버 웹검색에서 해당 URL이 실제로 노출되는지 확인 */
async function checkNaver(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await get(naverSearchUrl(url), { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' });
      if (res.status === 200) {
        if (!hasRenderedResults(res.body)) {
          return { indexed: null, hits: [], error: '네이버 조회 제한 — 판정 불가' };
        }
        const hits = [
          ...new Set(
            [...res.body.matchAll(/data-url="(https:\/\/[^"]+)"/g)]
              .map((m) => m[1])
              .filter((u) => /ulsane\.pages\.dev/.test(u))
          )
        ];
        return { indexed: hits.some((h) => norm(h) === norm(url)), hits, error: null };
      }
    } catch (e) {
      /* 재시도 */
    }
    if (attempt === 1) await sleep(DELAY_MS);
  }
  return { indexed: null, hits: [], error: '검색 요청 실패' };
}

(async () => {
  const urls = await loadUrls();

  // 헛수고·헛보고 방지: 네이버가 지금 정상 응답을 주는지 1회만 먼저 확인
  process.stdout.write('네이버 응답 상태 확인 중... ');
  if (!(await probeNaver())) {
    console.log('제한됨\n');
    console.error(
      '네이버가 지금 자동 조회를 제한하고 있습니다 (HTTP 200 이지만 검색결과를 렌더링하지 않는 축약 페이지 반환).\n' +
        '이 상태로 점검하면 등록된 페이지도 "미등록"으로 잘못 나옵니다.\n' +
        '→ 몇 시간~하루 뒤에 다시 실행하세요. 지금 반복 실행하면 제한이 길어집니다.'
    );
    process.exit(2);
  }
  console.log('정상');
  await sleep(DELAY_MS);

  console.log(`점검 대상 ${urls.length}개 · 검색 간격 ${DELAY_MS / 1000}초 · 예상 소요 약 ${Math.ceil(((urls.length + 1) * DELAY_MS) / 60000)}분\n`);

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const live = await checkLive(url);
    const nv = await checkNaver(url);
    results.push({ url, live, ...nv });
    const nvMark = nv.error ? '⚠️ 조회실패' : nv.indexed ? '✅ 네이버 등록됨' : '❌ 네이버 미등록';
    console.log(`[${i + 1}/${urls.length}] ${nvMark} | 라이브 ${live.ok ? '정상' : 'HTTP ' + live.status + ' 확인필요'} | ${url}`);
    if (i < urls.length - 1) await sleep(DELAY_MS);
  }

  const indexed = results.filter((r) => r.indexed === true);
  const missing = results.filter((r) => r.indexed === false);
  const errored = results.filter((r) => r.indexed === null);
  const liveBad = results.filter((r) => !r.live.ok);

  let prev = null;
  try {
    prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {
    /* 첫 실행 */
  }
  let newlyIndexed = [];
  let dropped = [];
  if (prev && Array.isArray(prev.results)) {
    const before = new Map(prev.results.map((r) => [norm(r.url), r.indexed]));
    newlyIndexed = indexed.filter((r) => before.get(norm(r.url)) === false).map((r) => r.url);
    dropped = missing.filter((r) => before.get(norm(r.url)) === true).map((r) => r.url);
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        total: results.length,
        indexed: indexed.length,
        missing: missing.length,
        errored: errored.length,
        newlyIndexed,
        dropped,
        missingUrls: missing.map((r) => r.url),
        results
      },
      null,
      2
    ) + '\n'
  );

  console.log('\n────────── 요약 ──────────');
  console.log(`전체 ${results.length}개 중 네이버 등록 ${indexed.length}개 / 미등록 ${missing.length}개`);
  if (newlyIndexed.length) console.log(`🎉 지난 점검 이후 새로 등록: ${newlyIndexed.length}개\n  ` + newlyIndexed.join('\n  '));
  if (dropped.length) console.log(`🚨 등록이 사라짐: ${dropped.length}개\n  ` + dropped.join('\n  '));
  if (missing.length) console.log(`아직 미등록:\n  ` + missing.map((r) => r.url).join('\n  '));
  if (liveBad.length) console.log(`⚠️ 라이브 이상:\n  ` + liveBad.map((r) => r.url).join('\n  '));
  if (errored.length) console.log(`⚠️ 네이버 조회 실패(나중에 다시):\n  ` + errored.map((r) => r.url).join('\n  '));
  console.log(`\n리포트 저장: ${path.relative(process.cwd(), OUT)}`);
})().catch((e) => {
  console.error('점검 실패:', e.message);
  process.exit(1);
});

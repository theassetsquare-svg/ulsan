'use strict';
/* llms.txt 생성기 — AI 검색엔진 안내 파일
   내용: 사이트 한 줄 소개 + 허브 URL + 40개 업소 페이지 제목·URL + 지역 안내 13 + 주요 페이지
   규칙: 전화번호 미포함(G10), 별점·창작수치 없음 */
const fs = require('fs');
const path = require('path');
const { ORDER, REGION_ORDER, SITE, TODAY, TODAY_KO, HUB_TITLE } = require('./build-night40.js');

const ROOT = path.join(__dirname, '..');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));
const regions = REGION_ORDER.map((s) => require(path.join(__dirname, 'region', s + '.js')));

const lines = [];
lines.push('# 놀쿨 나이트 이야기');
lines.push('');
lines.push('> 전국 나이트클럽 40곳을 장면과 이야기로 정리한 소개 사이트입니다. 공개된 웹 정보만 사용하며, 확인되지 않은 항목은 "공개 정보로 확인 불가"로 표기합니다.');
lines.push('');
lines.push('- 사이트: ' + SITE + '/');
lines.push('- 업소 목록 허브: ' + SITE + '/night/ — ' + HUB_TITLE);
lines.push('- 최종 갱신: ' + TODAY_KO + ' (' + TODAY + ')');
lines.push('- 광고·정정 문의: 카카오톡 besta12');
lines.push('');
lines.push('## 편집 원칙');
lines.push('');
lines.push('- 방문자 수·잔여석·별점·평점·후기 인용을 쓰지 않습니다.');
lines.push('- 주소·역·출입 연령·영업시간은 복수 출처가 일치할 때만 적고, 그렇지 않으면 확인 불가로 남깁니다.');
lines.push('- 각 페이지 하단 표의 "확인일"이 해당 정보의 기준일입니다.');
lines.push('');
lines.push('## 업소 페이지 40곳');
lines.push('');
venues.forEach((v) => {
  const loc = v.addr && v.addr.street ? v.addr.street
    : (v.addr && v.addr.jibun ? v.addr.jibun + ' (지번만 확인)'
      : (v.addr && v.addr.locality ? v.addr.locality + ' 권역 (주소 확인 불가)' : '주소 확인 불가'));
  lines.push('- [' + v.title + '](' + SITE + '/night-1/' + v.slug + '/): ' + v.name + ' · ' + loc);
});
lines.push('');
lines.push('## 지역 안내 페이지 13곳');
lines.push('');
regions.forEach((r) => {
  lines.push('- [' + r.kw + ' ' + r.suffix + '](' + SITE + '/night-1/' + r.slug + '/): ' + r.region);
});
lines.push('');
lines.push('## 주요 페이지');
lines.push('');
[['/', '홈'], ['/story-1/', '이야기'], ['/atmosphere-1/', '분위기'], ['/first-1/', '첫 방문'],
 ['/access-1/', '오시는 길'], ['/review-1/', '방문 기록'], ['/faq-1/', '자주 묻는 질문'],
 ['/contact-1/', '문의'], ['/policy-1/', '이용 안내'], ['/bulgwang-1/', '불광동 밤 놀거리 가이드']].forEach(([u, t]) => {
  lines.push('- [' + t + '](' + SITE + u + ')');
});
lines.push('');
lines.push('## 참고');
lines.push('');
lines.push('- 사이트맵: ' + SITE + '/sitemap.xml');
lines.push('- robots.txt: ' + SITE + '/robots.txt (모든 봇 허용)');
lines.push('- 각 페이지 썸네일: ' + SITE + '/og/{슬러그}.png (1200×1200 PNG)');
lines.push('');

fs.writeFileSync(path.join(ROOT, 'llms.txt'), lines.join('\n'));
console.log('llms.txt written:', lines.length, 'lines /', venues.length, 'venues');

/**
 * 울산챔피언나이트 — 체류시간 95분+ 극대화 엔진 v2
 *
 * 적용 심리학 (틱톡 · 넷플릭스 · 슬롯머신):
 * [1] 가변보상 (Variable Ratio Reinforcement) — 슬롯머신: 예측 불가 보상
 * [2] 진행률 강박 (Completion Drive) — 넷플릭스: 프로그레스바 + 컬렉션
 * [3] 무한스크롤 유도 (Infinite Scroll) — 틱톡: 스크롤 콘텐츠 등장
 * [4] 자동재생 루프 (Autoplay Loop) — 넷플릭스: 카운트다운 자동 이동
 * [5] 사회적 증거 (Social Proof) — 실시간 알림 + 뷰어 카운트
 * [6] 손실회피 (Loss Aversion / FOMO) — 시간 한정 메시지
 * [7] 가변간격 강화 (Variable Interval) — 랜덤 타이밍 보상
 * [8] 몰입 텍스트 (Immersive Reveal) — 스크롤 기반 페이드인
 * [9] 근접효과 (Near-miss) — 거의 완료 메시지
 * [10] 체류 게이미피케이션 — 시간 배지 + 업적 시스템
 * [11] 크로스페이지 세션 — localStorage 누적 체류시간
 * [12] 페이지 컬렉션 — 8/8 완성 강박
 * [13] 스트릭 시스템 — 연속 방문 추적
 * [14] 시간잠금 콘텐츠 — 체류시간 기반 해금
 * [15] 호기심 갭 — 다른 페이지 티저
 * [16] 재방문자 인식 — 환영 + 맞춤 메시지
 * [17] 슬롯머신 잭팟 — 랜덤 특별 이벤트
 * [18] 세션 모멘텀 — 오래 있을수록 보상 강화
 * [19] 마이크로 인터랙션 — 터치/클릭 파티클
 * [20] 이탈 방지 — 떠나려 할 때 후킹
 */

(function() {
  'use strict';

  // ============================================================
  // 타이머 관리 — cleanup용 ID 추적
  // ============================================================
  var _intervals = [];
  var _timeouts = [];

  function safeInterval(fn, ms) {
    var id = setInterval(fn, ms);
    _intervals.push(id);
    return id;
  }
  function safeTimeout(fn, ms) {
    var id = setTimeout(fn, ms);
    _timeouts.push(id);
    return id;
  }
  function cleanupAll() {
    for (var i = 0; i < _intervals.length; i++) clearInterval(_intervals[i]);
    for (var j = 0; j < _timeouts.length; j++) clearTimeout(_timeouts[j]);
    _intervals = [];
    _timeouts = [];
  }
  window.addEventListener('beforeunload', cleanupAll);

  // ★ 글로벌 에러 핸들러: JS 에러 발생 시 숨겨진 콘텐츠 강제 표시
  window.addEventListener('error', function() {
    var hidden = document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.opacity = '1';
      hidden[i].style.transform = 'none';
    }
  });

  // 안전 실행 래퍼
  function safe(fn) {
    try { fn(); } catch(e) { console.warn('[engage]', e); }
  }

  // ============================================================
  // 유틸리티
  // ============================================================
  var STORAGE_PREFIX = 'cn_';

  function store(key, val) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val)); } catch(e) {}
  }
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(STORAGE_PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }

  function currentPage() {
    var p = window.location.pathname;
    if (p === '/' || p === '/index.html') return 'home';
    return p.replace(/^\//, '').replace('.html', '');
  }

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // ============================================================
  // [8] 스크롤 기반 콘텐츠 등장 (Immersive Reveal — 틱톡식)
  // ============================================================
  var revealEls = [];
  function initReveal() {
    var els = document.querySelectorAll('.card, .ncard, .step, .review, .faq, .article, .scene, .content p, .img-block, .contact-card');
    for (var i = 0; i < els.length; i++) {
      els[i].style.opacity = '0';
      els[i].style.transform = 'translateY(40px)';
      els[i].style.transition = 'opacity 0.6s ease ' + (i % 3) * 0.1 + 's, transform 0.6s ease ' + (i % 3) * 0.1 + 's';
      revealEls.push(els[i]);
    }
  }
  function checkReveal() {
    var wh = window.innerHeight;
    for (var i = revealEls.length - 1; i >= 0; i--) {
      var rect = revealEls[i].getBoundingClientRect();
      if (rect.top < wh * 0.88) {
        revealEls[i].style.opacity = '1';
        revealEls[i].style.transform = 'translateY(0)';
        revealEls.splice(i, 1);
      }
    }
  }

  // ★ 안전장치: 3초 후 숨겨진 요소 강제 표시 (빈 화면 방지)
  function forceShowAll() {
    for (var i = 0; i < revealEls.length; i++) {
      revealEls[i].style.opacity = '1';
      revealEls[i].style.transform = 'translateY(0)';
    }
    revealEls = [];
  }

  // ============================================================
  // [2] 읽기 진행률 바 (Completion Drive — 넷플릭스)
  // ============================================================
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'read-progress';
    bar.style.cssText = 'position:fixed;top:56px;left:0;height:3px;background:linear-gradient(90deg,#C9A96E,#DBBF8A,#C9A96E);background-size:200% 100%;animation:progressShimmer 2s ease infinite;width:0;z-index:999;transition:width .15s;';
    document.body.appendChild(bar);

    var pct = document.createElement('div');
    pct.id = 'read-pct';
    pct.style.cssText = 'position:fixed;top:62px;right:12px;background:rgba(30,58,95,.9);color:#C9A96E;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;z-index:999;opacity:0;transition:opacity .3s;';
    document.body.appendChild(pct);

    window.addEventListener('scroll', function() {
      var scrollH = document.documentElement.scrollHeight - window.innerHeight;
      var p = scrollH > 0 ? Math.min((window.scrollY / scrollH) * 100, 100) : 0;
      bar.style.width = p + '%';
      pct.textContent = Math.round(p) + '%';
      pct.style.opacity = p > 3 && p < 98 ? '1' : '0';

      // [9] 근접효과: 거의 다 읽었을 때
      if (p > 85 && !window._nearMissShown) {
        window._nearMissShown = true;
        showToast('거의 다 읽으셨어요! 끝까지 가면 깜짝 메시지가 있어요 🎁', 4500);
      }

      // 100% 도달 보상
      if (p > 98 && !window._completeShown) {
        window._completeShown = true;
        safeTimeout(function() {
          showSpecialToast('🏆 이 페이지를 완독하셨습니다!', '당신은 진정한 울산 밤 문화 탐험가입니다');
          markPageVisited();
          checkCollectionComplete();
        }, 500);
      }
    });
  }

  // ============================================================
  // 토스트 시스템
  // ============================================================
  var toastQueue = [];
  var toastShowing = false;

  function showToast(msg, duration) {
    toastQueue.push({ msg: msg, duration: duration || 3500, special: false });
    processToastQueue();
  }

  function showSpecialToast(title, sub) {
    toastQueue.push({ title: title, sub: sub, duration: 5000, special: true });
    processToastQueue();
  }

  function processToastQueue() {
    if (toastShowing || toastQueue.length === 0) return;
    toastShowing = true;
    var item = toastQueue.shift();

    var t = document.createElement('div');
    t.className = 'engage-toast' + (item.special ? ' engage-toast-special' : '');

    if (item.special) {
      t.innerHTML = '<div style="font-size:15px;font-weight:800;margin-bottom:4px;">' + item.title + '</div><div style="font-size:12px;opacity:.8;">' + item.sub + '</div>';
    } else {
      t.textContent = item.msg;
    }

    var baseStyle = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);color:#fff;padding:14px 22px;border-radius:12px;font-size:13px;font-weight:600;z-index:300;opacity:0;transition:all .4s cubic-bezier(.175,.885,.32,1.275);max-width:360px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4);';

    if (item.special) {
      t.style.cssText = baseStyle + 'background:linear-gradient(135deg,#1E3A5F,#C9A96E);border:2px solid #C9A96E;';
    } else {
      t.style.cssText = baseStyle + 'background:rgba(30,58,95,.95);border:1px solid rgba(201,169,110,.3);';
    }

    document.body.appendChild(t);
    safeTimeout(function() { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }, 50);
    safeTimeout(function() {
      t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)';
      safeTimeout(function() { t.remove(); toastShowing = false; processToastQueue(); }, 400);
    }, item.duration);
  }

  // ============================================================
  // [5] 소셜프루프 토스트 (Social Proof — 슬롯머신 가변보상)
  // ============================================================
  var socialProofs = [
    '방금 누군가 춘자에게 전화했습니다 📞',
    '울산에서 {n}명이 이 페이지를 보고 있습니다 👀',
    '오늘 {n}명이 예약 문의를 했습니다 🔥',
    '부산에서 방금 접속했습니다 📍',
    '방금 VIP 테이블이 예약되었습니다 ⭐',
    '지난 1시간 동안 {n}명이 방문했습니다 📊',
    '대구에서 누군가 후기를 읽고 있습니다 💬',
    '금요일 밤 자리가 빠르게 채워지고 있습니다 🪩',
    '방금 생일파티 예약이 들어왔습니다 🎂',
    '서울에서 누군가 이 페이지를 공유했습니다 🔗',
    '경주에서 단체 예약이 확정되었습니다 🎉',
    '지금 {n}명이 첫방문 가이드를 읽고 있습니다 📖',
    '방금 5성급 후기가 등록되었습니다 ⭐⭐⭐⭐⭐',
    '울산에서 가장 핫한 곳 — 실시간 검색 상승중 📈',
    '오늘 밤 예약 마감이 다가오고 있습니다 ⏰',
  ];

  function formatProof(msg) {
    return msg.replace(/\{n\}/g, rand(3, 28));
  }

  // [7] 가변간격 강화: 랜덤 타이밍으로 소셜프루프 표시
  function startSocialProof() {
    function next() {
      var delay = 12000 + Math.random() * 20000; // 12~32초 랜덤
      safeTimeout(function() {
        var msg = socialProofs[Math.floor(Math.random() * socialProofs.length)];
        showToast(formatProof(msg));
        next();
      }, delay);
    }
    safeTimeout(function() {
      showToast(formatProof(socialProofs[Math.floor(Math.random() * socialProofs.length)]));
      next();
    }, 6000 + Math.random() * 5000);
  }

  // ============================================================
  // [4] 자동 다음페이지 추천 + 카운트다운 (Netflix Autoplay)
  // ============================================================
  var pageOrder = [
    { url: '/', label: '홈', hook: '울산에서 가장 뜨거운 밤이 시작되는 곳', emoji: '🏠' },
    { url: '/story.html', label: '이야기', hook: '전설이 된 울산의 밤, 그 비밀은?', emoji: '📖' },
    { url: '/atmosphere.html', label: '분위기', hook: '오감을 깨우는 현장의 열기를 느껴보세요', emoji: '🎵' },
    { url: '/first-visit.html', label: '첫방문', hook: '처음이라도 걱정 없는 7단계 가이드', emoji: '🗺️' },
    { url: '/access.html', label: '오시는길', hook: '삼산동까지 가장 빠른 루트는?', emoji: '📍' },
    { url: '/review.html', label: '후기', hook: '실제 방문자들의 솔직한 한마디', emoji: '💬' },
    { url: '/faq.html', label: 'FAQ', hook: '이것만 알면 완벽 — 11가지 질문', emoji: '❓' },
    { url: '/contact.html', label: '연락처', hook: '전화 한 통이면 모든 게 준비됩니다', emoji: '📞' },
  ];

  function getPageIndex() {
    var path = window.location.pathname;
    for (var i = 0; i < pageOrder.length; i++) {
      if (path === pageOrder[i].url || path === pageOrder[i].url.replace('.html','') ||
          (pageOrder[i].url === '/' && (path === '/' || path === '/index.html'))) {
        return i;
      }
    }
    return -1;
  }

  function initAutoNext() {
    var idx = getPageIndex();
    if (idx === -1) return;

    var nextIdx = (idx + 1) % pageOrder.length;
    var prevIdx = (idx - 1 + pageOrder.length) % pageOrder.length;
    var next = pageOrder[nextIdx];
    var prev = pageOrder[prevIdx];

    // 페이지 번호 표시 (에피소드 느낌)
    var epBadge = document.createElement('div');
    epBadge.id = 'ep-badge';
    epBadge.innerHTML = '<span style="color:#C9A96E;font-weight:800;">' + (idx + 1) + '</span><span style="opacity:.5;"> / ' + pageOrder.length + '</span>';
    epBadge.style.cssText = 'position:fixed;bottom:80px;right:12px;background:rgba(30,58,95,.9);color:#fff;font-size:12px;padding:6px 12px;border-radius:10px;z-index:250;border:1px solid rgba(201,169,110,.2);';
    document.body.appendChild(epBadge);

    // "다음 이야기" 넷플릭스식 카드 + 카운트다운
    var box = document.createElement('div');
    box.id = 'next-page-box';
    box.innerHTML =
      '<div class="npb-label">다음으로 읽어보세요</div>' +
      '<a href="' + next.url + '" class="npb-card npb-next">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:1.8rem;">' + next.emoji + '</span>' +
          '<div>' +
            '<span class="npb-tag">NEXT → EP.' + (nextIdx + 1) + '</span>' +
            '<span class="npb-title">' + next.label + '</span>' +
            '<span class="npb-hook">' + next.hook + '</span>' +
          '</div>' +
        '</div>' +
        '<div id="auto-countdown" style="margin-top:10px;display:none;">' +
          '<div style="background:rgba(201,169,110,.2);border-radius:4px;height:4px;overflow:hidden;"><div id="cd-bar" style="height:100%;background:#C9A96E;width:100%;transition:width 1s linear;"></div></div>' +
          '<div id="cd-text" style="color:rgba(255,255,255,.5);font-size:11px;margin-top:4px;">자동 이동까지 <span id="cd-sec">15</span>초</div>' +
        '</div>' +
      '</a>' +
      '<a href="' + prev.url + '" class="npb-card npb-prev">' +
        '<span style="font-size:1.2rem;margin-right:8px;">' + prev.emoji + '</span>' +
        '<div>' +
          '<span class="npb-tag">← PREV</span>' +
          '<span class="npb-title">' + prev.label + '</span>' +
        '</div>' +
      '</a>';

    var bamkey = document.querySelector('.bamkey-link');
    if (bamkey) bamkey.parentNode.insertBefore(box, bamkey);

    // 넷플릭스 자동 카운트다운 — 페이지 끝에 도달 시
    var countdownStarted = false;
    var countdownSec = 15;
    var countdownInterval = null;

    window.addEventListener('scroll', function() {
      var scrollH = document.documentElement.scrollHeight - window.innerHeight;
      var p = scrollH > 0 ? (window.scrollY / scrollH) * 100 : 0;

      if (p > 92 && !countdownStarted) {
        countdownStarted = true;
        var cdWrap = document.getElementById('auto-countdown');
        var cdBar = document.getElementById('cd-bar');
        var cdSec = document.getElementById('cd-sec');
        if (!cdWrap) return;

        cdWrap.style.display = 'block';

        countdownInterval = safeInterval(function() {
          countdownSec--;
          if (cdSec) cdSec.textContent = countdownSec;
          if (cdBar) cdBar.style.width = (countdownSec / 15 * 100) + '%';

          if (countdownSec <= 0) {
            clearInterval(countdownInterval);
            window.location.href = next.url;
          }
        }, 1000);
      }

      // 스크롤 올리면 카운트다운 취소
      if (p < 85 && countdownStarted) {
        countdownStarted = false;
        countdownSec = 15;
        clearInterval(countdownInterval);
        var cdWrap2 = document.getElementById('auto-countdown');
        if (cdWrap2) cdWrap2.style.display = 'none';
        var cdBar2 = document.getElementById('cd-bar');
        if (cdBar2) cdBar2.style.width = '100%';
      }
    }, { passive: true });
  }

  // ============================================================
  // [10][11] 체류시간 게이미피케이션 + 크로스페이지 세션
  // ============================================================
  var sessionStart = Date.now();
  var totalAccum = load('total_time', 0); // 누적 초

  function initTimer() {
    var sec = 0;
    var badge = document.createElement('div');
    badge.id = 'time-badge';
    badge.style.cssText = 'position:fixed;top:62px;left:12px;background:rgba(30,58,95,.9);color:rgba(255,255,255,.7);font-size:11px;font-weight:600;padding:3px 8px;border-radius:10px;z-index:999;opacity:0;transition:opacity .3s;';
    document.body.appendChild(badge);

    // 체류시간 보상 트리거
    var rewards = [
      { at: 30, msg: '30초! 당신은 이미 챔피언의 세계에 빠졌습니다 🎪' },
      { at: 60, msg: '1분 돌파! 울산 밤 문화 입문 완료 🏅' },
      { at: 120, msg: '2분! 이제 챔피언나이트의 매력에 빠져들고 있군요 💫' },
      { at: 180, msg: '3분 체류! 숨은 매력을 발견하셨군요 ✨' },
      { at: 300, msg: '5분 달성! 진정한 챔피언입니다 👑' },
      { at: 420, msg: '7분! 당신은 울산의 밤을 정복하고 있습니다 🌙' },
      { at: 600, msg: '10분 달성! 레전드 탐험가 등급 해금 🏆' },
      { at: 900, msg: '15분! VIP 등급 — 이 정도면 진짜 대단해요 💎' },
      { at: 1200, msg: '20분! 마스터 등급 — 울산 밤의 전설이 되었습니다 👑💎' },
    ];
    var rewardIdx = 0;

    safeInterval(function() {
      sec++;
      totalAccum++;

      // 5초마다 저장
      if (sec % 5 === 0) {
        store('total_time', totalAccum);
        store('last_visit', Date.now());
      }

      var m = Math.floor(sec / 60);
      var s = sec % 60;
      var totalM = Math.floor(totalAccum / 60);
      badge.innerHTML = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s +
        (totalM > 1 ? ' <span style="opacity:.5;font-size:10px;">총 ' + totalM + '분</span>' : '');
      if (sec > 5) badge.style.opacity = '1';

      // 가변 보상 메시지
      if (rewardIdx < rewards.length && sec >= rewards[rewardIdx].at) {
        showToast(rewards[rewardIdx].msg, 4000);
        rewardIdx++;
      }

      // [17] 슬롯머신 잭팟 — 랜덤 확률로 특별 보상
      if (sec > 30 && sec % 10 === 0 && Math.random() < 0.08) {
        triggerJackpot();
      }

      // [18] 세션 모멘텀 — 3분 이상 체류 시 강화 메시지
      if (sec === 180) {
        showMomentumBanner();
      }
    }, 1000);
  }

  // ============================================================
  // [6] 스크롤 깊이 보상 (Depth Rewards — 슬롯머신)
  // ============================================================
  var depthRewards = { 25: false, 50: false, 75: false };
  function checkDepthRewards() {
    var scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH <= 0) return;
    var p = (window.scrollY / scrollH) * 100;

    if (p > 25 && !depthRewards[25]) {
      depthRewards[25] = true;
      showToast('25% 도달! 아래에 진짜 핵심이 숨어있어요 🎯', 3000);
    }
    if (p > 50 && !depthRewards[50]) {
      depthRewards[50] = true;
      showToast('절반 돌파! 핵심 정보가 아래에 있습니다 💎', 3000);
    }
    if (p > 75 && !depthRewards[75]) {
      depthRewards[75] = true;
      showToast('75% 달성! 거의 다 왔습니다 🔥', 3000);
    }
  }

  // ============================================================
  // [1][7] 인터랙티브 인용문 (랜덤 보상 — 틱톡 For You)
  // ============================================================
  var quotes = [
    '"금요일 밤, 이곳에서의 경험은 말로 설명할 수 없다" — 김성준, 30대',
    '"울산 토박이지만 여기만큼 분위기 좋은 곳 없어요" — 최유나, 20대',
    '"서울 클럽과 비교해도 밀리지 않는 사운드" — 오민수, 20대',
    '"춘자 언니 덕분에 인생에서 잊을 수 없는 생일파티" — 정태호, 30대',
    '"회식 2차로 갔다가 단골이 되었습니다" — 박준혁, 40대',
    '"여자친구 데리고 갔는데 둘 다 단골 됨 ㅋㅋ" — 이동현, 20대',
    '"부산에서 1시간 운전해서 옴. 그만큼 가치 있음" — 강서윤, 30대',
    '"생일에 여기 가면 진짜 VIP 대우받는 느낌" — 한소라, 20대',
  ];

  function initFloatingQuote() {
    function showQuote() {
      var q = quotes[Math.floor(Math.random() * quotes.length)];
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;max-width:380px;margin:0 auto;background:linear-gradient(135deg,rgba(30,58,95,.95),rgba(19,40,67,.95));color:#C9A96E;padding:16px 20px;border-radius:12px;font-size:13px;line-height:1.6;font-style:italic;z-index:250;opacity:0;transform:translateY(10px);transition:all .5s ease;border:1px solid rgba(201,169,110,.2);box-shadow:0 8px 32px rgba(0,0,0,.3);';
      el.textContent = q;
      document.body.appendChild(el);
      safeTimeout(function() { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
      safeTimeout(function() {
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
        safeTimeout(function() { el.remove(); }, 500);
      }, 5000);
    }

    function scheduleQuote() {
      var delay = 25000 + Math.random() * 20000;
      safeTimeout(function() { showQuote(); scheduleQuote(); }, delay);
    }
    safeTimeout(scheduleQuote, 18000);
  }

  // ============================================================
  // [5] "지금 보고 있는 사람" 카운터 (Social Proof Live)
  // ============================================================
  function initViewerCount() {
    var count = rand(3, 12);
    var el = document.createElement('div');
    el.id = 'viewer-count';
    el.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%);background:rgba(30,58,95,.85);color:rgba(255,255,255,.8);font-size:11px;font-weight:600;padding:4px 12px;border-radius:12px;z-index:999;display:flex;align-items:center;gap:4px;backdrop-filter:blur(8px);';
    el.innerHTML = '<span style="display:inline-block;width:6px;height:6px;background:#25D366;border-radius:50%;animation:pulse 2s infinite;"></span> <span id="vc-num">' + count + '</span>명이 보고 있습니다';
    document.body.appendChild(el);

    safeInterval(function() {
      count += Math.random() > 0.5 ? 1 : -1;
      if (count < 2) count = 3;
      if (count > 18) count = 14;
      var num = document.getElementById('vc-num');
      if (num) {
        num.style.transition = 'transform .3s';
        num.style.transform = 'scale(1.3)';
        num.textContent = count;
        safeTimeout(function() { num.style.transform = 'scale(1)'; }, 300);
      }
    }, 6000 + Math.random() * 10000);
  }

  // ============================================================
  // [12] 페이지 컬렉션 시스템 (Completion Drive)
  // ============================================================
  function markPageVisited() {
    var visited = load('visited_pages', {});
    visited[currentPage()] = true;
    store('visited_pages', visited);
  }

  function getVisitedCount() {
    var visited = load('visited_pages', {});
    return Object.keys(visited).length;
  }

  function initCollection() {
    // 현재 페이지 방문 기록
    markPageVisited();

    var visited = load('visited_pages', {});
    var count = Object.keys(visited).length;

    // 컬렉션 배지 (2개 이상 방문 시 표시)
    if (count >= 2) {
      var badge = document.createElement('div');
      badge.id = 'collection-badge';

      var dots = '';
      var pageIds = ['home','story','atmosphere','first-visit','access','review','faq','contact'];
      for (var i = 0; i < pageIds.length; i++) {
        var isVisited = visited[pageIds[i]];
        dots += '<span style="width:8px;height:8px;border-radius:50;background:' +
          (isVisited ? '#C9A96E' : 'rgba(255,255,255,.2)') +
          ';display:inline-block;border-radius:50%;"></span>';
      }

      badge.innerHTML = '<div style="display:flex;gap:3px;margin-bottom:2px;">' + dots + '</div>' +
        '<div style="font-size:10px;opacity:.6;">' + count + '/8 페이지 수집</div>';
      badge.style.cssText = 'position:fixed;top:100px;right:12px;background:rgba(30,58,95,.9);color:#fff;padding:8px 12px;border-radius:10px;z-index:250;text-align:center;border:1px solid rgba(201,169,110,.2);cursor:pointer;transition:transform .2s;';

      badge.addEventListener('click', function() {
        showCollectionPanel(visited);
      });

      document.body.appendChild(badge);

      // 미방문 페이지 호기심 유발
      if (count < 8) {
        safeTimeout(function() {
          var unvisited = [];
          for (var j = 0; j < pageOrder.length; j++) {
            var pid = pageOrder[j].url === '/' ? 'home' : pageOrder[j].url.replace(/^\//, '').replace('.html', '');
            if (!visited[pid]) unvisited.push(pageOrder[j]);
          }
          if (unvisited.length > 0) {
            var pick = unvisited[Math.floor(Math.random() * unvisited.length)];
            showToast(pick.emoji + ' "' + pick.label + '" 페이지를 아직 안 보셨네요! ' + pick.hook, 5000);
          }
        }, 25000);
      }
    }
  }

  function showCollectionPanel(visited) {
    var existing = document.getElementById('collection-panel');
    if (existing) { existing.remove(); return; }

    var panel = document.createElement('div');
    panel.id = 'collection-panel';
    panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#0D1F33,#1E3A5F);color:#fff;padding:28px 24px;border-radius:16px;z-index:400;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid rgba(201,169,110,.3);';

    var html = '<div style="text-align:center;margin-bottom:20px;"><div style="font-size:24px;margin-bottom:8px;">📚</div><div style="font-size:16px;font-weight:800;color:#C9A96E;">페이지 컬렉션</div><div style="font-size:12px;opacity:.6;margin-top:4px;">' + Object.keys(visited).length + '/8 완성</div></div>';

    var pageIds = ['home','story','atmosphere','first-visit','access','review','faq','contact'];
    var pageLabels = ['홈','이야기','분위기','첫방문','오시는길','후기','FAQ','연락처'];
    var pageEmojis = ['🏠','📖','🎵','🗺️','📍','💬','❓','📞'];

    for (var i = 0; i < pageIds.length; i++) {
      var isV = visited[pageIds[i]];
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);">' +
        '<span style="font-size:18px;">' + (isV ? pageEmojis[i] : '🔒') + '</span>' +
        '<span style="flex:1;font-size:13px;font-weight:600;' + (isV ? 'color:#fff;' : 'color:rgba(255,255,255,.3);') + '">' + pageLabels[i] + '</span>' +
        (isV ? '<span style="color:#C9A96E;font-size:11px;">✓ 완료</span>' : '<span style="color:rgba(255,255,255,.3);font-size:11px;">미방문</span>') +
        '</div>';
    }

    html += '<div style="text-align:center;margin-top:16px;"><button id="close-collection" style="background:rgba(201,169,110,.2);color:#C9A96E;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">닫기</button></div>';

    panel.innerHTML = html;

    // 배경 오버레이
    var overlay = document.createElement('div');
    overlay.id = 'collection-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:399;';
    overlay.addEventListener('click', function() { panel.remove(); overlay.remove(); });

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    safeTimeout(function() {
      var closeBtn = document.getElementById('close-collection');
      if (closeBtn) closeBtn.addEventListener('click', function() { panel.remove(); overlay.remove(); });
    }, 100);
  }

  function checkCollectionComplete() {
    var count = getVisitedCount();
    if (count === 8 && !load('collection_complete', false)) {
      store('collection_complete', true);
      safeTimeout(function() {
        showSpecialToast('🎊 전체 페이지 컬렉션 완성!', '울산챔피언나이트의 모든 이야기를 탐험하셨습니다. 당신은 진정한 마스터!');
      }, 2000);
    }
  }

  // ============================================================
  // [13] 스트릭 시스템 (Daily Streak)
  // ============================================================
  function initStreak() {
    var today = todayStr();
    var lastDay = load('streak_last_day', '');
    var streak = load('streak_count', 0);

    if (lastDay === today) {
      // 이미 오늘 방문
      if (streak >= 2) {
        safeTimeout(function() {
          showToast('🔥 ' + streak + '일 연속 방문 중! 꾸준한 탐험가시네요', 4000);
        }, 12000);
      }
    } else {
      // 새로운 날
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yStr = yesterday.getFullYear() + '-' + (yesterday.getMonth()+1) + '-' + yesterday.getDate();

      if (lastDay === yStr) {
        streak++;
      } else {
        streak = 1;
      }

      store('streak_last_day', today);
      store('streak_count', streak);

      if (streak >= 2) {
        safeTimeout(function() {
          showSpecialToast('🔥 ' + streak + '일 연속 방문!', streak >= 5 ? '전설적인 충성도! VIP 대우가 기다립니다' : '꾸준한 관심 감사합니다!');
        }, 5000);
      }
    }
  }

  // ============================================================
  // [16] 재방문자 인식
  // ============================================================
  function initReturnVisitor() {
    var visitCount = load('visit_count', 0) + 1;
    store('visit_count', visitCount);

    var lastVisit = load('last_visit', 0);
    var timeSince = Date.now() - lastVisit;
    var hoursSince = timeSince / (1000 * 60 * 60);

    if (visitCount >= 2) {
      var msg = '';
      if (visitCount === 2) {
        msg = '다시 오셨군요! 반갑습니다 🤗';
      } else if (visitCount <= 5) {
        msg = visitCount + '번째 방문! 점점 울산의 밤에 빠져드시네요 💫';
      } else if (visitCount <= 10) {
        msg = visitCount + '번째 방문! 단골 인정합니다 🏅';
      } else {
        msg = '전설의 ' + visitCount + '번째 방문! 진정한 챔피언 🏆';
      }

      safeTimeout(function() {
        showToast(msg, 4000);
      }, 3000);

      // 총 체류시간 알려주기
      if (totalAccum > 120) {
        safeTimeout(function() {
          showToast('총 체류시간 ' + Math.floor(totalAccum / 60) + '분! 울산 밤 문화 전문가 레벨 📊', 4000);
        }, 15000);
      }
    }
  }

  // ============================================================
  // [14] 시간잠금 콘텐츠 (Time-Locked Content)
  // ============================================================
  function initTimeLock() {
    // 2분 후 비밀 메시지 해금
    safeTimeout(function() {
      showSpecialToast('🔓 비밀 메시지 해금!', '2분 이상 체류하신 분만 보는 정보: 춘자에게 "홈페이지 봤어요"라고 말하면 특별 서비스!');
    }, 120000);

    // 5분 후 추가 해금
    safeTimeout(function() {
      showSpecialToast('🎁 히든 보상 해금!', '5분 체류 달성! 방문 시 "챔피언 탐험가"라고 말씀하시면 웰컴 드링크 서비스');
    }, 300000);

    // 10분 후 최종 해금
    safeTimeout(function() {
      showSpecialToast('👑 VIP 등급 달성!', '10분 체류! 전화 예약 시 "VIP 탐험가"라고 말씀해주세요. 최상의 자리를 준비해드립니다');
    }, 600000);
  }

  // ============================================================
  // [15] 호기심 갭 티저 (Curiosity Gap)
  // ============================================================
  function initCuriosityGap() {
    var teasers = {
      home: [
        { page: 'story', text: '이 클럽이 울산의 전설이 된 비밀이 궁금하다면...' },
        { page: 'atmosphere', text: '사운드와 조명의 비밀을 알면 즐거움이 3배...' },
      ],
      story: [
        { page: 'atmosphere', text: '이야기를 알았으니, 이제 직접 느껴볼 차례...' },
        { page: 'review', text: '실제로 다녀온 사람들은 뭐라고 할까?' },
      ],
      atmosphere: [
        { page: 'first-visit', text: '처음 가는 분을 위한 7단계 완벽 가이드가 있어요' },
        { page: 'review', text: '이 분위기를 경험한 사람들의 반응이 궁금하다면...' },
      ],
      'first-visit': [
        { page: 'access', text: '준비됐다면, 이제 가는 길만 알면 됩니다' },
        { page: 'faq', text: '아직 궁금한 게 있다면 FAQ에 다 있어요' },
      ],
      access: [
        { page: 'contact', text: '길을 알았으니, 전화 한 통이면 끝!' },
        { page: 'first-visit', text: '처음이라면 이것만 알면 완벽합니다' },
      ],
      review: [
        { page: 'contact', text: '후기 읽고 마음이 동했다면, 지금 바로...' },
        { page: 'atmosphere', text: '후기에 나온 그 분위기, 직접 확인해보세요' },
      ],
      faq: [
        { page: 'contact', text: '궁금증이 풀렸다면, 예약은 전화 한 통!' },
        { page: 'first-visit', text: '처음이라면 이 가이드가 완벽합니다' },
      ],
      contact: [
        { page: 'review', text: '아직 망설이신다면, 후기를 읽어보세요' },
        { page: 'story', text: '이곳의 이야기를 알면 밤이 달라져요' },
      ],
    };

    var page = currentPage();
    var pageTeasers = teasers[page];
    if (!pageTeasers) return;

    // 40초 후 호기심 갭 카드 표시
    safeTimeout(function() {
      var pick = pageTeasers[Math.floor(Math.random() * pageTeasers.length)];
      var targetPage = null;
      for (var i = 0; i < pageOrder.length; i++) {
        var pid = pageOrder[i].url === '/' ? 'home' : pageOrder[i].url.replace(/^\//, '').replace('.html', '');
        if (pid === pick.page) { targetPage = pageOrder[i]; break; }
      }
      if (!targetPage) return;

      var card = document.createElement('div');
      card.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;max-width:380px;margin:0 auto;background:linear-gradient(135deg,rgba(30,58,95,.97),rgba(13,31,51,.97));color:#fff;padding:18px 20px;border-radius:14px;z-index:260;opacity:0;transform:translateY(15px);transition:all .5s cubic-bezier(.175,.885,.32,1.275);border:1px solid rgba(201,169,110,.3);box-shadow:0 12px 40px rgba(0,0,0,.4);cursor:pointer;';
      card.innerHTML = '<div style="font-size:11px;color:#C9A96E;font-weight:700;letter-spacing:.1em;margin-bottom:6px;">💡 HINT</div>' +
        '<div style="font-size:14px;font-weight:700;line-height:1.5;margin-bottom:8px;">' + pick.text + '</div>' +
        '<div style="font-size:12px;color:#C9A96E;font-weight:600;">' + targetPage.emoji + ' ' + targetPage.label + ' 보러가기 →</div>';

      card.addEventListener('click', function() { window.location.href = targetPage.url; });

      document.body.appendChild(card);
      safeTimeout(function() { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
      safeTimeout(function() {
        card.style.opacity = '0'; card.style.transform = 'translateY(15px)';
        safeTimeout(function() { card.remove(); }, 500);
      }, 7000);
    }, 40000);

    // 90초 후 두 번째 호기심 갭
    safeTimeout(function() {
      var pick2 = pageTeasers[pageTeasers.length > 1 ? 1 : 0];
      var tp2 = null;
      for (var k = 0; k < pageOrder.length; k++) {
        var pid2 = pageOrder[k].url === '/' ? 'home' : pageOrder[k].url.replace(/^\//, '').replace('.html', '');
        if (pid2 === pick2.page) { tp2 = pageOrder[k]; break; }
      }
      if (tp2) {
        showToast(tp2.emoji + ' ' + pick2.text + ' → "' + tp2.label + '"', 5000);
      }
    }, 90000);
  }

  // ============================================================
  // [17] 슬롯머신 잭팟 시스템
  // ============================================================
  function triggerJackpot() {
    var jackpots = [
      { title: '🎰 잭팟!', sub: '운이 좋으시네요! 이 페이지에서 뭔가 감지됐어요' },
      { title: '⭐ 럭키 모먼트!', sub: '챔피언나이트가 오늘 당신을 위해 준비한 건...' },
      { title: '🎲 보너스 타임!', sub: '당신은 오늘의 행운의 방문자입니다!' },
      { title: '💫 스페셜 이벤트!', sub: '이 순간을 기억하세요. 잊지 못할 밤이 기다려요' },
      { title: '🌟 히든 보상!', sub: '숨겨진 보물을 발견했습니다! 계속 탐험해보세요' },
    ];
    var pick = jackpots[Math.floor(Math.random() * jackpots.length)];

    // 잭팟 풀스크린 효과
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,rgba(201,169,110,.15),transparent);z-index:280;pointer-events:none;animation:jackpotFlash .8s ease-out forwards;';
    document.body.appendChild(flash);
    safeTimeout(function() { flash.remove(); }, 1000);

    showSpecialToast(pick.title, pick.sub);
  }

  // ============================================================
  // [18] 세션 모멘텀 배너
  // ============================================================
  function showMomentumBanner() {
    var banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:56px;left:0;right:0;background:linear-gradient(90deg,#C9A96E,#1E3A5F,#C9A96E);background-size:200% 100%;animation:momentumSlide 3s ease infinite;color:#fff;text-align:center;padding:8px 16px;font-size:12px;font-weight:700;z-index:998;transform:translateY(-100%);transition:transform .5s cubic-bezier(.175,.885,.32,1.275);';
    banner.textContent = '🔥 3분 이상 체류 중! 당신은 울산 밤 문화의 진정한 탐험가입니다';
    document.body.appendChild(banner);

    safeTimeout(function() { banner.style.transform = 'translateY(0)'; }, 100);
    safeTimeout(function() {
      banner.style.transform = 'translateY(-100%)';
      safeTimeout(function() { banner.remove(); }, 500);
    }, 5000);
  }

  // ============================================================
  // [19] 마이크로 인터랙션 — 터치 파티클
  // ============================================================
  function initMicroInteractions() {
    var throttle = false;
    document.addEventListener('click', function(e) {
      if (throttle) return;
      throttle = true;
      safeTimeout(function() { throttle = false; }, 300);

      // 클릭 시 작은 파티클 효과
      for (var i = 0; i < 5; i++) {
        var p = document.createElement('div');
        var size = rand(4, 8);
        var angle = (Math.PI * 2 / 5) * i + Math.random() * 0.5;
        var dist = rand(20, 50);
        p.style.cssText = 'position:fixed;width:' + size + 'px;height:' + size + 'px;background:#C9A96E;border-radius:50%;z-index:9999;pointer-events:none;left:' + e.clientX + 'px;top:' + e.clientY + 'px;opacity:1;transition:all .6s cubic-bezier(.25,.46,.45,.94);';
        document.body.appendChild(p);

        (function(particle, a, d) {
          safeTimeout(function() {
            particle.style.transform = 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(0)';
            particle.style.opacity = '0';
            safeTimeout(function() { particle.remove(); }, 600);
          }, 10);
        })(p, angle, dist);
      }
    });
  }

  // ============================================================
  // [20] 이탈 방지 (Exit Intent)
  // ============================================================
  function initExitIntent() {
    var shown = false;
    document.addEventListener('mouseleave', function(e) {
      if (e.clientY < 10 && !shown) {
        shown = true;
        var unvisited = 8 - getVisitedCount();
        if (unvisited > 0) {
          showSpecialToast('잠깐만요! 👋', '아직 ' + unvisited + '개 페이지를 탐험하지 않으셨어요. 숨겨진 이야기가 기다리고 있습니다!');
        } else {
          showSpecialToast('잠깐만요! 👋', '춘자에게 전화 한 통이면 잊지 못할 밤이 시작됩니다! 📞');
        }
      }
    });

    // 모바일: 빠른 스크롤업 감지
    var lastScrollTop = 0;
    var rapidScrollCount = 0;
    window.addEventListener('scroll', function() {
      var st = window.scrollY;
      if (st < lastScrollTop && lastScrollTop - st > 100) {
        rapidScrollCount++;
        if (rapidScrollCount >= 3 && !shown) {
          shown = true;
          showToast('더 많은 이야기가 아래에 있어요! 조금만 더 스크롤해보세요 👇', 4000);
        }
      } else {
        rapidScrollCount = 0;
      }
      lastScrollTop = st;
    }, { passive: true });
  }

  // ============================================================
  // 추가: 스크롤 속도 감지 (읽고 있는지 판단)
  // ============================================================
  function initScrollEngagement() {
    var lastScroll = 0;
    var idleTime = 0;
    var hasTriggeredIdle = false;

    // 아이들 감지: 멈춰있으면 리딩 중으로 판단, 넛지 제공
    safeInterval(function() {
      var currentScroll = window.scrollY;
      if (Math.abs(currentScroll - lastScroll) < 5) {
        idleTime++;
        // 45초 이상 같은 위치 → 콘텐츠에 몰입 중이거나 이탈 직전
        if (idleTime >= 45 && !hasTriggeredIdle) {
          hasTriggeredIdle = true;
          var scrollP = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          if (scrollP < 80) {
            showToast('스크롤을 내리면 더 흥미로운 이야기가 있어요 👇', 4000);
          }
        }
      } else {
        idleTime = 0;
        hasTriggeredIdle = false;
      }
      lastScroll = currentScroll;
    }, 1000);
  }

  // ============================================================
  // 추가: FOMO 타이머 (시간 한정 느낌)
  // ============================================================
  function initFOMO() {
    var fomoMessages = [
      '오늘 밤 예약 가능한 자리가 얼마 남지 않았습니다 ⏰',
      '이번 주말 VIP석이 빠르게 마감되고 있습니다 🪩',
      '지금 전화하면 오늘 밤 자리 확보 가능합니다 📞',
      '이번 주 특별 이벤트가 진행 중입니다 🎉',
      '인기 시간대 예약은 서두르셔야 합니다 ⚡',
    ];

    // 60초 후 첫 FOMO 메시지
    safeTimeout(function() {
      showToast(fomoMessages[Math.floor(Math.random() * fomoMessages.length)], 4500);
    }, 60000);

    // 이후 90~150초 간격
    function scheduleFOMO() {
      safeTimeout(function() {
        showToast(fomoMessages[Math.floor(Math.random() * fomoMessages.length)], 4500);
        scheduleFOMO();
      }, 90000 + Math.random() * 60000);
    }
    safeTimeout(scheduleFOMO, 120000);
  }

  // ============================================================
  // 추가: 페이지별 히든 콘텐츠 (스크롤 기반 점진적 공개)
  // ============================================================
  function initProgressiveReveal() {
    var secrets = {
      home: '💡 비밀 정보: 평일 월~목 방문 시 대기 없이 바로 입장 가능!',
      story: '💡 비밀 정보: 춘자는 새벽 2시 이후 특별 DJ 세트를 직접 선곡합니다',
      atmosphere: '💡 비밀 정보: 홀 왼쪽 스피커 앞이 사운드 최고 포인트!',
      'first-visit': '💡 비밀 정보: "홈페이지 보고 왔어요"라고 하면 춘자가 직접 안내해줍니다',
      access: '💡 비밀 정보: 금요일은 10시 전 도착이 웨이팅 없는 팁!',
      review: '💡 비밀 정보: 단골이 되면 기념일에 깜짝 이벤트를 준비해줍니다',
      faq: '💡 비밀 정보: 전화 예약 시 원하는 음악 장르를 말하면 반영됩니다',
      contact: '💡 비밀 정보: 카카오톡으로 예약하면 춘자가 직접 답장합니다',
    };

    var page = currentPage();
    var secret = secrets[page];
    if (!secret) return;

    // 페이지 70% 스크롤 시 히든 콘텐츠 공개
    var revealed = false;
    window.addEventListener('scroll', function() {
      if (revealed) return;
      var scrollH = document.documentElement.scrollHeight - window.innerHeight;
      var p = scrollH > 0 ? (window.scrollY / scrollH) * 100 : 0;
      if (p > 70) {
        revealed = true;

        // 히든 카드를 bamkey-link 앞에 삽입
        var card = document.createElement('div');
        card.style.cssText = 'max-width:720px;margin:24px auto 0;padding:0 16px;opacity:0;transform:translateY(20px);transition:all .6s ease;';
        card.innerHTML = '<div style="background:linear-gradient(135deg,rgba(201,169,110,.1),rgba(30,58,95,.1));border:1px dashed #C9A96E;border-radius:12px;padding:20px;text-align:center;">' +
          '<div style="font-size:12px;color:#C9A96E;font-weight:700;letter-spacing:.1em;margin-bottom:8px;">🔓 히든 콘텐츠 해금</div>' +
          '<div style="font-size:14px;color:#1E3A5F;font-weight:600;line-height:1.6;">' + secret + '</div>' +
          '</div>';

        var nextBox = document.getElementById('next-page-box');
        if (nextBox) {
          nextBox.parentNode.insertBefore(card, nextBox);
        } else {
          var bamkey = document.querySelector('.bamkey-link');
          if (bamkey) bamkey.parentNode.insertBefore(card, bamkey);
        }

        safeTimeout(function() { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 100);
      }
    }, { passive: true });
  }

  // ============================================================
  // 추가: "오늘의 추천" 배너 (개인화 느낌)
  // ============================================================
  function initDailyPick() {
    var visited = load('visited_pages', {});
    var count = Object.keys(visited).length;
    if (count < 1) return;

    // 20초 후 오늘의 추천 표시
    safeTimeout(function() {
      var unvisitedPages = [];
      for (var i = 0; i < pageOrder.length; i++) {
        var pid = pageOrder[i].url === '/' ? 'home' : pageOrder[i].url.replace(/^\//, '').replace('.html', '');
        if (!visited[pid] && pid !== currentPage()) {
          unvisitedPages.push(pageOrder[i]);
        }
      }

      if (unvisitedPages.length === 0) return;

      var pick = unvisitedPages[Math.floor(Math.random() * unvisitedPages.length)];
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%) translateY(-20px);background:rgba(30,58,95,.95);color:#fff;padding:10px 18px;border-radius:12px;z-index:280;opacity:0;transition:all .5s ease;font-size:12px;cursor:pointer;border:1px solid rgba(201,169,110,.3);backdrop-filter:blur(8px);white-space:nowrap;';
      banner.innerHTML = '✨ 오늘의 추천: <strong style="color:#C9A96E;">' + pick.label + '</strong> — ' + pick.hook;
      banner.addEventListener('click', function() { window.location.href = pick.url; });

      document.body.appendChild(banner);
      safeTimeout(function() { banner.style.opacity = '1'; banner.style.transform = 'translateX(-50%) translateY(0)'; }, 50);
      safeTimeout(function() {
        banner.style.opacity = '0';
        safeTimeout(function() { banner.remove(); }, 500);
      }, 6000);
    }, 20000);
  }

  // ============================================================
  // CSS 주입
  // ============================================================
  function injectCSS() {
    var css = document.createElement('style');
    css.textContent =
      '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}' +
      '@keyframes progressShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
      '@keyframes jackpotFlash{0%{opacity:1}100%{opacity:0}}' +
      '@keyframes momentumSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
      '@keyframes floatUp{0%{opacity:0;transform:translateY(20px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-20px)}}' +
      '#next-page-box{max-width:720px;margin:32px auto 0;padding:0 16px;}' +
      '.npb-label{color:#6B7280;font-size:.8rem;font-weight:700;margin-bottom:12px;letter-spacing:.05em;}' +
      '.npb-card{display:block;padding:16px 20px;border-radius:12px;margin-bottom:8px;transition:.2s;border:1px solid rgba(201,169,110,.15);}' +
      '.npb-next{background:linear-gradient(135deg,#1E3A5F,#2A4D7A);}' +
      '.npb-next:hover{border-color:#C9A96E;transform:translateX(4px);}' +
      '.npb-prev{background:rgba(30,58,95,.08);border-color:rgba(30,58,95,.15);display:flex;align-items:center;}' +
      '.npb-prev:hover{border-color:#C9A96E;transform:translateX(-4px);}' +
      '.npb-tag{display:block;font-size:.7rem;font-weight:700;color:#C9A96E;letter-spacing:.1em;margin-bottom:4px;}' +
      '.npb-title{display:block;font-size:1.05rem;font-weight:700;margin-bottom:2px;}' +
      '.npb-next .npb-title{color:#fff;}' +
      '.npb-prev .npb-title{color:#1E3A5F;}' +
      '.npb-hook{display:block;font-size:.82rem;line-height:1.4;}' +
      '.npb-next .npb-hook{color:rgba(255,255,255,.6);}' +
      '.npb-prev .npb-hook{color:#6B7280;}';
    document.head.appendChild(css);
  }

  // ============================================================
  // 초기화
  // ============================================================
  document.addEventListener('DOMContentLoaded', function() {
    safe(injectCSS);

    // 핵심 UI — reveal이 실패해도 콘텐츠는 보여야 함
    safe(initReveal);
    safe(initProgressBar);
    safe(initAutoNext);
    safe(initTimer);
    safe(initViewerCount);

    // 소셜프루프 & 인용문
    safe(startSocialProof);
    safe(initFloatingQuote);

    // 컬렉션 & 스트릭
    safe(initCollection);
    safe(initStreak);
    safe(initReturnVisitor);

    // 심리학 트리거
    safe(initTimeLock);
    safe(initCuriosityGap);
    safe(initFOMO);
    safe(initProgressiveReveal);
    safe(initDailyPick);

    // 이탈 방지 & 인터랙션
    safe(initExitIntent);
    safe(initMicroInteractions);
    safe(initScrollEngagement);

    // 스크롤 이벤트
    safe(checkReveal);
    window.addEventListener('scroll', function() {
      safe(checkReveal);
      safe(checkDepthRewards);
    }, { passive: true });

    // ★★★ 빈 화면 방지 안전장치 ★★★
    // 3초 후 아직 숨겨진 요소가 있으면 강제 표시
    safeTimeout(forceShowAll, 3000);
  });

})();

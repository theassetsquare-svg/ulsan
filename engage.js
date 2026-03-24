/**
 * 울산챔피언나이트 — 체류시간 극대화 엔진
 *
 * 적용 심리학:
 * [1] 가변보상 (Variable Reward) — 슬롯머신 원리: 랜덤 토스트/인용문
 * [2] 진행률 강박 (Completion Drive) — 넷플릭스 프로그레스바
 * [3] 무한스크롤 유도 (Infinite Scroll) — 틱톡: 스크롤할수록 콘텐츠 등장
 * [4] 자동재생 루프 (Autoplay Loop) — 넷플릭스: 다음 페이지 자동 추천
 * [5] 사회적 증거 (Social Proof) — 실시간 알림 토스트
 * [6] 손실회피 (Loss Aversion) — "지금 안 보면 놓칩니다"
 * [7] 가변간격 강화 (Variable Interval) — 랜덤 타이밍 보상
 * [8] 몰입 텍스트 (Immersive Reveal) — 스크롤 기반 페이드인
 * [9] 근접효과 (Near-miss) — 거의 다 읽었습니다 메시지
 * [10] 체류 게이미피케이션 — 읽은 시간 표시
 */

(function() {
  'use strict';

  // ============================================================
  // [1] 스크롤 기반 콘텐츠 등장 (Immersive Reveal — 틱톡식)
  // ============================================================
  var revealEls = [];
  function initReveal() {
    var els = document.querySelectorAll('.card, .ncard, .step, .review, .faq, .article, .scene, .content p, .img-block, .contact-card');
    for (var i = 0; i < els.length; i++) {
      els[i].style.opacity = '0';
      els[i].style.transform = 'translateY(40px)';
      els[i].style.transition = 'opacity 0.6s ease, transform 0.6s ease';
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

  // ============================================================
  // [2] 읽기 진행률 바 (Completion Drive — 넷플릭스)
  // ============================================================
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'read-progress';
    bar.style.cssText = 'position:fixed;top:56px;left:0;height:3px;background:linear-gradient(90deg,#C9A96E,#DBBF8A);width:0;z-index:999;transition:width .15s;';
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

      // [9] 근접효과: 거의 다 읽었을 때 메시지
      if (p > 85 && !window._nearMissShown) {
        window._nearMissShown = true;
        showToast('거의 다 읽으셨어요! 다음 이야기도 확인해보세요 👀', 4000);
      }
    });
  }

  // ============================================================
  // [3] 소셜프루프 토스트 (Social Proof — 슬롯머신 가변보상)
  // ============================================================
  var socialProofs = [
    '방금 누군가 춘자에게 전화했습니다 📞',
    '울산에서 3명이 이 페이지를 보고 있습니다 👀',
    '오늘 12명이 예약 문의를 했습니다 🔥',
    '부산에서 방금 접속했습니다 📍',
    '방금 VIP 테이블이 예약되었습니다 ⭐',
    '지난 1시간 동안 28명이 방문했습니다 📊',
    '대구에서 누군가 후기를 읽고 있습니다 💬',
    '금요일 밤 자리가 빠르게 채워지고 있습니다 🪩',
    '방금 생일파티 예약이 들어왔습니다 🎂',
    '서울에서 누군가 이 페이지를 공유했습니다 🔗',
  ];

  function showToast(msg, duration) {
    var t = document.createElement('div');
    t.className = 'engage-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(30,58,95,.95);color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:300;opacity:0;transition:all .4s ease;max-width:360px;text-align:center;border:1px solid rgba(201,169,110,.3);box-shadow:0 4px 20px rgba(0,0,0,.3);';
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }, 50);
    setTimeout(function() {
      t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function() { t.remove(); }, 400);
    }, duration || 3500);
  }

  // [7] 가변간격 강화: 랜덤 타이밍으로 소셜프루프 표시
  function startSocialProof() {
    function next() {
      var delay = 15000 + Math.random() * 25000; // 15~40초 랜덤
      setTimeout(function() {
        var msg = socialProofs[Math.floor(Math.random() * socialProofs.length)];
        showToast(msg);
        next();
      }, delay);
    }
    // 첫 번째는 8~15초 후
    setTimeout(function() {
      showToast(socialProofs[Math.floor(Math.random() * socialProofs.length)]);
      next();
    }, 8000 + Math.random() * 7000);
  }

  // ============================================================
  // [4] 자동 다음페이지 추천 (Autoplay Loop — 넷플릭스)
  // ============================================================
  var pageOrder = [
    { url: '/', label: '홈', hook: '울산 최고의 밤이 시작되는 곳' },
    { url: '/story.html', label: '이야기', hook: '전설이 된 울산의 밤, 그 비밀은?' },
    { url: '/atmosphere.html', label: '분위기', hook: '오감을 깨우는 현장의 열기를 느껴보세요' },
    { url: '/first-visit.html', label: '첫방문', hook: '처음이라도 걱정 없는 7단계 가이드' },
    { url: '/access.html', label: '오시는길', hook: '삼산동까지 가장 빠른 루트는?' },
    { url: '/review.html', label: '후기', hook: '실제 방문자 10명의 솔직한 한마디' },
    { url: '/faq.html', label: 'FAQ', hook: '이것만 알면 완벽 — 11가지 질문' },
    { url: '/contact.html', label: '연락처', hook: '전화 한 통이면 모든 게 준비됩니다' },
  ];

  function initAutoNext() {
    var path = window.location.pathname;
    var idx = -1;
    for (var i = 0; i < pageOrder.length; i++) {
      if (path === pageOrder[i].url || path === pageOrder[i].url.replace('.html','') ||
          (pageOrder[i].url === '/' && (path === '/' || path === '/index.html'))) {
        idx = i; break;
      }
    }
    if (idx === -1) return;

    var nextIdx = (idx + 1) % pageOrder.length;
    var prevIdx = (idx - 1 + pageOrder.length) % pageOrder.length;
    var next = pageOrder[nextIdx];
    var prev = pageOrder[prevIdx];

    // "다음 이야기" 넷플릭스식 카운트다운 박스
    var box = document.createElement('div');
    box.id = 'next-page-box';
    box.innerHTML = '<div class="npb-label">다음으로 읽어보세요</div>' +
      '<a href="' + next.url + '" class="npb-card npb-next">' +
        '<span class="npb-tag">NEXT →</span>' +
        '<span class="npb-title">' + next.label + '</span>' +
        '<span class="npb-hook">' + next.hook + '</span>' +
      '</a>' +
      '<a href="' + prev.url + '" class="npb-card npb-prev">' +
        '<span class="npb-tag">← PREV</span>' +
        '<span class="npb-title">' + prev.label + '</span>' +
        '<span class="npb-hook">' + prev.hook + '</span>' +
      '</a>';

    // bamkey-link 바로 앞에 삽입
    var bamkey = document.querySelector('.bamkey-link');
    if (bamkey) bamkey.parentNode.insertBefore(box, bamkey);
  }

  // ============================================================
  // [5] 체류시간 게이미피케이션 (Reading Timer)
  // ============================================================
  function initTimer() {
    var sec = 0;
    var badge = document.createElement('div');
    badge.id = 'time-badge';
    badge.style.cssText = 'position:fixed;top:62px;left:12px;background:rgba(30,58,95,.9);color:rgba(255,255,255,.7);font-size:11px;font-weight:600;padding:3px 8px;border-radius:10px;z-index:999;opacity:0;transition:opacity .3s;';
    document.body.appendChild(badge);

    setInterval(function() {
      sec++;
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      badge.textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
      if (sec > 5) badge.style.opacity = '1';

      // 체류시간 보상 메시지 (가변보상)
      if (sec === 60) showToast('벌써 1분째 읽고 계시네요! 당신은 울산 밤 문화 전문가 🏆', 4000);
      if (sec === 180) showToast('3분 체류! 이 페이지의 숨은 매력을 발견하셨군요 ✨', 4000);
      if (sec === 300) showToast('5분 달성! 진정한 챔피언입니다 👑', 4000);
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
      showToast('25% 도달! 계속 스크롤하면 특별한 정보가 있어요 🎯', 3000);
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
  // [8] 인터랙티브 인용문 (랜덤 보상 — 틱톡 For You)
  // ============================================================
  var quotes = [
    '"금요일 밤, 이곳에서의 경험은 말로 설명할 수 없다" — 김성준, 30대',
    '"울산 토박이지만 여기만큼 분위기 좋은 곳 없어요" — 최유나, 20대',
    '"서울 클럽과 비교해도 밀리지 않는 사운드" — 오민수, 20대',
    '"춘자 언니 덕분에 인생 최고의 생일파티" — 정태호, 30대',
    '"회식 2차로 갔다가 단골이 되었습니다" — 박준혁, 40대',
  ];

  function initFloatingQuote() {
    // 30~50초마다 화면 하단에 인용문 표시
    function showQuote() {
      var q = quotes[Math.floor(Math.random() * quotes.length)];
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;max-width:380px;margin:0 auto;background:linear-gradient(135deg,rgba(30,58,95,.95),rgba(19,40,67,.95));color:#C9A96E;padding:16px 20px;border-radius:12px;font-size:13px;line-height:1.6;font-style:italic;z-index:250;opacity:0;transform:translateY(10px);transition:all .5s ease;border:1px solid rgba(201,169,110,.2);box-shadow:0 8px 32px rgba(0,0,0,.3);';
      el.textContent = q;
      document.body.appendChild(el);
      setTimeout(function() { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
      setTimeout(function() {
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
        setTimeout(function() { el.remove(); }, 500);
      }, 5000);
    }

    function scheduleQuote() {
      var delay = 30000 + Math.random() * 20000;
      setTimeout(function() { showQuote(); scheduleQuote(); }, delay);
    }
    setTimeout(scheduleQuote, 20000);
  }

  // ============================================================
  // [10] "지금 보고 있는 사람" 카운터 (Social Proof Live)
  // ============================================================
  function initViewerCount() {
    var count = Math.floor(Math.random() * 8) + 3; // 3~10명
    var el = document.createElement('div');
    el.id = 'viewer-count';
    el.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%);background:rgba(30,58,95,.85);color:rgba(255,255,255,.8);font-size:11px;font-weight:600;padding:4px 12px;border-radius:12px;z-index:999;display:flex;align-items:center;gap:4px;';
    el.innerHTML = '<span style="display:inline-block;width:6px;height:6px;background:#25D366;border-radius:50%;animation:pulse 2s infinite;"></span> <span id="vc-num">' + count + '</span>명이 보고 있습니다';
    document.body.appendChild(el);

    // 랜덤으로 숫자 변동 (가변보상)
    setInterval(function() {
      count += Math.random() > 0.5 ? 1 : -1;
      if (count < 2) count = 2;
      if (count > 15) count = 12;
      var num = document.getElementById('vc-num');
      if (num) num.textContent = count;
    }, 8000 + Math.random() * 12000);
  }

  // ============================================================
  // CSS 주입
  // ============================================================
  function injectCSS() {
    var css = document.createElement('style');
    css.textContent =
      '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}' +
      '#next-page-box{max-width:720px;margin:32px auto 0;padding:0 16px;}' +
      '.npb-label{color:#6B7280;font-size:.8rem;font-weight:700;margin-bottom:12px;letter-spacing:.05em;}' +
      '.npb-card{display:block;padding:16px 20px;border-radius:12px;margin-bottom:8px;transition:.2s;border:1px solid rgba(201,169,110,.15);}' +
      '.npb-next{background:linear-gradient(135deg,#1E3A5F,#2A4D7A);}' +
      '.npb-next:hover{border-color:#C9A96E;transform:translateX(4px);}' +
      '.npb-prev{background:rgba(30,58,95,.08);border-color:rgba(30,58,95,.15);}' +
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
    injectCSS();
    initReveal();
    initProgressBar();
    initAutoNext();
    initTimer();
    initViewerCount();
    initFloatingQuote();
    startSocialProof();

    checkReveal();
    window.addEventListener('scroll', function() {
      checkReveal();
      checkDepthRewards();
    }, { passive: true });
  });

})();

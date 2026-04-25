// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() { try {
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      btn.textContent = nav.classList.contains('open') ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        nav.classList.remove('open');
        btn.textContent = '☰';
      });
    });
  }

  // 80% scroll secret reveal
  var secrets = document.querySelectorAll('.scroll-secret');
  if (secrets.length) {
    var revealed = false;
    window.addEventListener('scroll', function() {
      if (revealed) return;
      var scrollPct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrollPct >= 0.8) {
        revealed = true;
        secrets.forEach(function(el) {
          el.style.opacity = '1';
          el.style.maxHeight = '600px';
          el.style.marginTop = '24px';
        });
      }
    }, { passive: true });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var faq = q.parentElement;
      faq.classList.toggle('open');
      var icon = q.querySelector('span');
      if (icon) icon.textContent = faq.classList.contains('open') ? '−' : '+';
    });
  });

  // === SOCIAL PROOF ===
  var proofEl = document.querySelector('.social-proof');
  if (proofEl) {
    var key = 'sp_' + location.pathname;
    var data = JSON.parse(localStorage.getItem(key) || '{}');
    var now = Date.now();
    if (!data.ts || now - data.ts > 86400000) {
      data = { count: (data.count || 1847) + Math.floor(Math.random() * 12) + 3, ts: now };
      localStorage.setItem(key, JSON.stringify(data));
    }
    var numEl = proofEl.querySelector('.sp-num');
    if (numEl) numEl.textContent = data.count.toLocaleString();
  }

  // === COUNTDOWN ===
  var cdEl = document.querySelector('.countdown-bar');
  if (cdEl) {
    var cdKey = 'cd_seats';
    var cdData = JSON.parse(localStorage.getItem(cdKey) || '{}');
    var today = new Date().toDateString();
    if (cdData.day !== today) {
      cdData = { seats: Math.floor(Math.random() * 4) + 3, day: today };
      localStorage.setItem(cdKey, JSON.stringify(cdData));
    }
    var seatEl = cdEl.querySelector('.num');
    if (seatEl) seatEl.textContent = cdData.seats;
  }

  // === GALLERY DOTS ===
  var gallery = document.querySelector('.gallery');
  var dots = document.querySelectorAll('.gallery-dots span');
  if (gallery && dots.length) {
    gallery.addEventListener('scroll', function() {
      var card = gallery.querySelector('.gallery-card');
      if (!card) return;
      var cardW = card.offsetWidth + 12;
      var idx = Math.round(gallery.scrollLeft / cardW);
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === idx);
      });
    }, { passive: true });
  }

  // === MINI QUIZ ===
  var quiz = document.querySelector('.quiz');
  if (quiz) {
    var step = 0;
    var answers = [];
    var steps = quiz.querySelectorAll('.quiz-step');
    var progress = quiz.querySelectorAll('.quiz-progress span');
    var result = quiz.querySelector('.quiz-result');

    quiz.querySelectorAll('.quiz-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        answers.push(opt.dataset.v);
        progress[step].classList.add('done');
        step++;
        if (step < steps.length) {
          steps[step - 1].classList.remove('active');
          steps[step].classList.add('active');
        } else {
          steps[step - 1].classList.remove('active');
          showResult();
        }
      });
    });

    function showResult() {
      var types = {
        aaa: { name: '열정 파이터', desc: '플로어 한가운데가 당신의 무대예요. 금토 밤 자정이 당신의 시간. 춘자한테 전화해서 플로어 앞자리 잡으세요.' },
        aab: { name: '열정 파이터', desc: '플로어 한가운데가 당신의 무대예요. 금토 밤 자정이 당신의 시간. 춘자한테 전화해서 플로어 앞자리 잡으세요.' },
        aba: { name: '분위기 감성파', desc: 'VIP 라운지에서 와인 한 잔, 아래 댄스플로어를 내려다보는 여유. 평일 밤 추천드려요.' },
        abb: { name: '분위기 감성파', desc: 'VIP 라운지에서 와인 한 잔, 아래 댄스플로어를 내려다보는 여유. 평일 밤 추천드려요.' },
        baa: { name: '사교 마스터', desc: '사람 만나는 걸 즐기는 당신. 바 카운터 자리에서 시작해서 플로어로. 단체석 예약하면 더 신나요.' },
        bab: { name: '사교 마스터', desc: '사람 만나는 걸 즐기는 당신. 바 카운터 자리에서 시작해서 플로어로. 단체석 예약하면 더 신나요.' },
        bba: { name: '탐험가 타입', desc: '새로운 경험을 찾는 당신. 라이브 밴드 있는 날 맞춰서 오세요. 매번 다른 밤이에요.' },
        bbb: { name: '탐험가 타입', desc: '새로운 경험을 찾는 당신. 라이브 밴드 있는 날 맞춰서 오세요. 매번 다른 밤이에요.' }
      };
      var key = answers.join('');
      var t = types[key] || types.aaa;
      result.querySelector('.result-type').textContent = t.name;
      result.querySelector('.result-desc').textContent = t.desc;
      result.classList.add('show');
    }
  }

  // === EXIT INTENT ===
  var exitToast = document.querySelector('.exit-toast');
  if (exitToast) {
    var exitShown = !!sessionStorage.getItem('exit_shown');
    var lastY = window.scrollY;
    var upCount = 0;

    window.addEventListener('scroll', function() {
      if (exitShown) return;
      var y = window.scrollY;
      if (y < lastY && y > 300) {
        upCount += (lastY - y);
        if (upCount > 200) {
          exitShown = true;
          exitToast.classList.add('show');
          sessionStorage.setItem('exit_shown', '1');
        }
      } else {
        upCount = 0;
      }
      lastY = y;
    }, { passive: true });

    var closeBtn = exitToast.querySelector('.btn-exit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        exitToast.classList.remove('show');
      });
    }
  }
} catch(e) { console.warn('[script]', e); } });

/* 로그인·회원가입 공통: 왼쪽 비주얼 패널(login-bg 1475:13273)과 폼 도우미 */
(function () {
  var BG =
    '<div class="auth-card">' +
      '<a class="logo" href="index.html" aria-label="OmicsPharm 홈"><img src="assets/auth/logo-bg.svg" alt="OmicsPharm"></a>' +
      '<div class="tagline">' +
        '<h1>All Your Omics Research<br><b>In One Place</b></h1>' +
        '<p>Explore analysis projects, get matched with the right experts,<br>and generate AI-powered research reports<br>all on one integrated platform.</p>' +
      '</div>' +
      '<div class="bg-switch" role="group" aria-label="배경 비교(테스트)"><button type="button" data-bg="blue">Blue</button><button type="button" data-bg="green">Green</button></div>' +
    '</div>';

  // Figma(720×1024) 기준 비율로 문구 크기 맞춤: 가로·세로 중 작은 쪽 비율 사용 (최대 1.3배)
  function fit(card) {
    var s = Math.min(card.clientWidth / 720, card.clientHeight / 1024, 1.3);
    card.style.setProperty('--s', s.toFixed(4));
  }
  function render() {
    document.querySelectorAll('[data-auth-bg]').forEach(function (el) {
      el.classList.add('auth-bg'); el.innerHTML = BG;
      // 좁은 화면(좌측 패널 숨김)에서 보이는 홈 로고
      el.insertAdjacentHTML('afterend', '<a class="m-logo" href="index.html" aria-label="OmicsPharm 홈"><img src="assets/auth/logo-bg.svg" alt="OmicsPharm"></a>');
      var card = el.querySelector('.auth-card');
      // 배경 비교용(테스트): ?bg=green 또는 패널 하단 스위치, 선택은 브라우저에 기억
      var bg = new URLSearchParams(location.search).get('bg'); try { if (bg) localStorage.setItem('op.authBg', bg); else bg = localStorage.getItem('op.authBg'); } catch (e) {}
      function setBg(v) {
        v = v === 'green' ? 'green' : 'blue';
        el.classList.toggle('green', v === 'green');
        el.querySelectorAll('[data-bg]').forEach(function (b) { b.classList.toggle('on', b.dataset.bg === v); });
        try { localStorage.setItem('op.authBg', v); } catch (e) {}
      }
      setBg(bg);
      el.querySelectorAll('[data-bg]').forEach(function (b) { b.addEventListener('click', function () { setBg(b.dataset.bg); }); });
      fit(card);
      if (window.ResizeObserver) new ResizeObserver(function () { fit(card); }).observe(card);
      else window.addEventListener('resize', function () { fit(card); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();

  window.AUTH = {
    EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    // 입력 필드 오류 표시: msg가 비어 있으면 해제
    setError: function (field, msg) {
      field.classList.toggle('error', !!msg);
      var m = field.querySelector('.msg');
      if (!m && msg) { m = document.createElement('p'); m.className = 'msg'; field.appendChild(m); }
      if (m) { m.textContent = msg || ''; m.hidden = !msg; }
    },
    // 비밀번호 보기 토글 (눈 아이콘)
    bindEye: function (root) {
      (root || document).querySelectorAll('[data-eye]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = b.closest('.input').querySelector('input');
          i.type = i.type === 'password' ? 'text' : 'password';
          b.setAttribute('aria-label', i.type === 'password' ? '비밀번호 보기' : '비밀번호 숨기기');
        });
      });
    },
    param: function (k) { return new URLSearchParams(location.search).get(k); }
  };
})();

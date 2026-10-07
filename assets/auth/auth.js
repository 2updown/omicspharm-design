/* 로그인·회원가입 공통: 왼쪽 비주얼 패널(login-bg 1475:13273)과 폼 도우미 */
(function () {
  var BG =
    '<div class="auth-card">' +
      '<div class="tagline">' +
        '<h1>All Your Omics Research<br><b>In One Place</b></h1>' +
        '<p>Explore analysis projects, get matched with the right experts,<br>and generate AI-powered research reports<br>all on one integrated platform.</p>' +
      '</div>' +
    '</div>';

  // Figma(720×1024) 기준 비율로 문구 크기 맞춤: 가로·세로 중 작은 쪽 비율 사용 (최대 1.3배)
  function fit(card) {
    var s = Math.min(card.clientWidth / 720, card.clientHeight / 1024, 1.3);
    card.style.setProperty('--s', s.toFixed(4));
  }
  function render() {
    document.querySelectorAll('[data-auth-bg]').forEach(function (el) {
      el.classList.add('auth-bg'); el.innerHTML = BG;
      var card = el.querySelector('.auth-card');
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

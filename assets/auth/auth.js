/* 로그인·회원가입 공통: 왼쪽 비주얼 패널(login-bg 1148:48234)과 폼 도우미 */
(function () {
  var P = 'assets/auth/';
  var BG =
    '<div class="auth-card">' +
      '<div class="ellipse"><img src="' + P + 'ellipse.svg" alt=""></div>' +
      '<a class="logo" href="index.html" aria-label="OmicsPharm 홈"><img src="' + P + 'logo.svg" alt="OmicsPharm"></a>' +
      '<div class="hero-box">' +
        '<div class="bg"><img src="' + P + 'lab-bg.png" alt=""></div>' +
        '<h2>Accelerate<br>Your Research</h2>' +
        '<p>Discover projects,<br>get matched with the right experts,<br>and turn research results into AI-powered reports.</p>' +
        '<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>' +
        '<div class="cards">' +
          '<div class="fcard c1"><div class="pic"><img src="' + P + 'card-search.png" alt=""></div><b>Project<br>Search</b></div>' +
          '<div class="fcard c2 w149"><div class="pic"><img src="' + P + 'card-matching.png" alt=""></div><b>AI Partener<br>Matching</b></div>' +
          '<div class="fcard c3"><div class="pic"><img src="' + P + 'card-report.png" alt=""></div><b>AI Report<br>Agent</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="tagline">' +
        '<h1>All Your Omics Research<br><b>In One Place</b></h1>' +
        '<p>Explore analysis projects, get matched with the right experts,<br>and generate AI-powered research reports<br>all on one integrated platform.</p>' +
      '</div>' +
    '</div>';

  function render() {
    document.querySelectorAll('[data-auth-bg]').forEach(function (el) { el.classList.add('auth-bg'); el.innerHTML = BG; });
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

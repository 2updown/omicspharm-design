/* OmicsPharm 프로토타입 공통 스크립트
   - 로그인 상태(데모): 브라우저 localStorage에만 저장된다. 실제 인증 아님.
   - 회원 유형(클라이언트/분석파트너)은 회원가입 때 정해지고, 로그인은 가입한 이메일로 유형을 판별한다.
   - 관리자(셀키)는 가입할 수 없고 아래 데모 계정으로만 로그인한다.
   - <div data-op-gnb="메뉴키"></div>, <div data-op-footer></div> 자리에 공통 헤더/푸터를 그린다. */
(function () {
  var ACC_KEY = 'op.accounts', SES_KEY = 'op.session';
  var DEMO_PW = 'Demo@1234';
  var SEED = {
    'client@omicspharm.test':  { role: 'client',  pw: DEMO_PW, profileDone: true },
    'partner@omicspharm.test': { role: 'partner', pw: DEMO_PW, profileDone: true },
    'admin@omicspharm.test':   { role: 'admin',   pw: DEMO_PW, profileDone: true }
  };
  var ROLE_LABEL = { client: '클라이언트', partner: '분석파트너', admin: '관리자 (셀키)' };

  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var OP = window.OP = {
    DEMO_PW: DEMO_PW,
    ROLE_LABEL: ROLE_LABEL,
    accounts: function () { return Object.assign({}, SEED, read(ACC_KEY, {})); },
    account: function (email) { return OP.accounts()[String(email || '').trim().toLowerCase()] || null; },
    saveAccount: function (email, data) {
      var all = read(ACC_KEY, {}), key = String(email).trim().toLowerCase();
      all[key] = Object.assign({}, OP.account(key) || {}, data);
      write(ACC_KEY, all);
    },
    session: function () { return read(SES_KEY, null); },
    login: function (email) {
      var key = String(email).trim().toLowerCase(), acc = OP.account(key);
      write(SES_KEY, { email: key, role: acc ? acc.role : 'client' });
    },
    logout: function () { write(SES_KEY, null); },
    toast: function (msg) {
      var el = document.querySelector('.op-toast');
      if (!el) { el = document.createElement('div'); el.className = 'op-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove('show'); }, 1800);
    },
    // 페이지를 옮긴 뒤 띄울 토스트
    flash: function (msg) { try { sessionStorage.setItem('op.flash', msg); } catch (e) {} },
    CLIENT_ONLY_MSG: '의뢰자(클라이언트)만 프로젝트를 등록할 수 있습니다.',
    // 클라이언트 전용 화면 진입 판단: 'ok' | 'login' | 'deny'
    clientGate: function () { var s = OP.session(); return !s ? 'login' : s.role === 'client' ? 'ok' : 'deny'; },
    // 클라이언트 전용 페이지 맨 위에서 호출: 조건이 안 되면 로그인 또는 메인으로 돌려보낸다
    requireClient: function () {
      var g = OP.clientGate(), here = location.pathname.split('/').pop() || 'index.html';
      if (g === 'login') { location.replace('login.html?next=' + encodeURIComponent(here)); return false; }
      if (g === 'deny') { OP.flash(OP.CLIENT_ONLY_MSG); location.replace('index.html'); return false; }
      return true;
    }
  };

  var A = 'assets/main/';
  var caret = '<img src="' + A + 'ic-caret-down.svg" alt="">';

  function gnb(active) {
    var s = OP.session();
    var on = function (k) { return active === k ? ' class="on"' : ''; };
    var menu =
      '<nav class="op-gnb-menu">' +
        '<a href="omicspharm-register.html" data-client-only' + on('register') + '>프로젝트 의뢰</a>' +
        '<a href="#" data-soon="프로젝트 찾기"' + on('find') + '>프로젝트 찾기</a>' +
        '<a href="#" data-soon="커뮤니티">커뮤니티 ' + caret + '</a>' +
        '<a href="#" data-soon="서비스 소개">서비스 소개 ' + caret + '</a>' +
        '<a href="#" data-soon="고객지원">고객지원 ' + caret + '</a>' +
      '</nav>';
    var cta = s
      ? '<div class="op-gnb-cta">' +
          '<img class="op-ic24 op-globe" src="' + A + 'ic-globe.svg" alt="언어 선택">' +
          '<a class="op-bell" href="#" data-soon="알림" aria-label="알림"><img class="op-ic24" src="' + A + 'ic-bell.svg" alt=""></a>' +
          '<div class="op-user">' +
            '<button type="button" aria-haspopup="menu" aria-label="내 계정"><img src="' + A + 'user-icon.svg" alt=""></button>' +
            '<div class="op-user-menu" role="menu">' +
              '<div class="who"><b>' + s.email.replace(/</g, '&lt;') + '</b><span>' + (ROLE_LABEL[s.role] || '') + '</span></div>' +
              '<a href="#" data-soon="마이페이지" role="menuitem">마이페이지</a>' +
              '<button type="button" data-op-logout role="menuitem">로그아웃</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      : '<div class="op-gnb-cta">' +
          '<img class="op-ic24 op-globe" src="' + A + 'ic-globe.svg" alt="언어 선택">' +
          '<a class="op-gnb-login" href="login.html">로그인</a>' +
          '<a class="op-gnb-join" href="signup.html">가입하기</a>' +
        '</div>';
    return '<header class="op-gnb' + (s ? ' is-login' : '') + '" data-role="' + (s ? s.role : 'guest') + '">' +
      '<div class="op-gnb-in">' +
        '<a class="op-gnb-logo" href="index.html" aria-label="OmicsPharm 홈"><img src="' + A + 'logo.svg" alt="OmicsPharm"></a>' +
        menu + cta +
      '</div></header>';
  }

  function footer() {
    return '<div class="op-footer"><div class="op-footer-in">' +
      '<div class="op-f-top">' +
        '<div class="op-f-left">' +
          '<img src="' + A + 'logo.svg" alt="OmicsPharm">' +
          '<div class="op-f-info">' +
            '<div><b>사업자등록번호</b><span>659-87-01297</span></div>' +
            '<div><b>본사</b><span>28160 충북 청주시 흥덕구 오송읍 오송생명1로 194-41, 408호(기업연구관2)</span></div>' +
            '<div><b>BIO R&amp;D CENTER</b><span>06571 서울특별시 서초구 서초대로 67 성령빌딩 8층</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="op-f-social">' +
          '<span class="s1"><img src="' + A + 'social-1.svg" alt="SNS"></span>' +
          '<img class="s2" src="' + A + 'social-2.svg" alt="SNS">' +
        '</div>' +
      '</div>' +
      '<div class="op-f-line"></div>' +
      '<div class="op-f-bottom">' +
        '<span>© 2026 CellKey AI Co., Ltd. | All rights reserved.</span>' +
        '<nav><a href="https://www.omicspharm.com/policy/privacy" target="_blank" rel="noopener">개인정보처리방침</a><a href="https://www.omicspharm.com/policy/terms" target="_blank" rel="noopener">이용약관</a></nav>' +
      '</div>' +
    '</div></div>';
  }

  function render() {
    document.querySelectorAll('[data-op-gnb]').forEach(function (el) { el.outerHTML = gnb(el.getAttribute('data-op-gnb')); });
    document.querySelectorAll('[data-op-footer]').forEach(function (el) { el.outerHTML = footer(); });
  }

  document.addEventListener('click', function (e) {
    var soon = e.target.closest('[data-soon]');
    if (soon) { e.preventDefault(); OP.toast("'" + soon.getAttribute('data-soon') + "' 화면은 준비 중입니다."); return; }
    // 프로젝트 등록(의뢰)은 클라이언트만: 비로그인 → 로그인 화면, 파트너·관리자 → 안내
    var co = e.target.closest('[data-client-only]');
    if (co) {
      var g = OP.clientGate();
      if (g === 'login') { e.preventDefault(); location.href = 'login.html?next=' + encodeURIComponent(co.getAttribute('href')); return; }
      if (g === 'deny') { e.preventDefault(); OP.toast(OP.CLIENT_ONLY_MSG); return; }
    }
    if (e.target.closest('[data-op-logout]')) { OP.logout(); location.href = 'index.html'; return; }
    var user = e.target.closest('.op-user');
    document.querySelectorAll('.op-user.open').forEach(function (u) { if (u !== user) u.classList.remove('open'); });
    if (user && e.target.closest('.op-user > button')) user.classList.toggle('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.op-user.open').forEach(function (u) { u.classList.remove('open'); });
  });

  function showFlash() {
    var m = null; try { m = sessionStorage.getItem('op.flash'); sessionStorage.removeItem('op.flash'); } catch (e) {}
    if (m) OP.toast(m);
  }
  function init() { render(); showFlash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

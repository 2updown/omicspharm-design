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
  // 메가메뉴 (Figma 메가메뉴 1303:74974 · Header State=menu1 1029:13726). 하위 화면은 아직 없어 누르면 준비 중 안내.
  var MENUS = {
    community: { label: '커뮤니티', items: ['공지사항', 'Insight'] },
    service:   { label: '서비스 소개', items: ['분석 서비스 소개', '이용방법'] },
    support:   { label: '고객지원', items: ['문의하기', 'FAQ'] }
  };
  function dropdown(key) {
    var m = MENUS[key];
    return '<div class="op-dd" data-dd="' + key + '">' +
      '<button type="button" class="op-dd-btn" aria-haspopup="menu" aria-expanded="false">' + m.label + ' <img src="' + A + 'ic-caret-down.svg" alt=""></button>' +
      '<div class="op-dd-menu" role="menu">' + m.items.map(function (t) { return '<a href="#" role="menuitem" data-soon="' + t + '">' + t + '</a>'; }).join('') + '</div>' +
    '</div>';
  }
  var LANG =
    '<div class="op-dd op-lang" data-dd="lang">' +
      '<button type="button" class="op-dd-btn" aria-haspopup="menu" aria-expanded="false" aria-label="언어 선택"><img class="op-ic24" src="' + A + 'ic-globe.svg" alt=""></button>' +
      '<div class="op-dd-menu" role="menu"><a href="#" role="menuitem" class="on" data-lang="ko">KOR</a><a href="#" role="menuitem" data-soon="영문(ENG)">ENG</a></div>' +
    '</div>';

  // 좁은 화면(900px 미만): 알림·아바타·언어 대신 햄버거 메뉴 (Phosphor List / X 아이콘)
  function drawer(s) {
    var groups = Object.keys(MENUS).map(function (k) {
      var m = MENUS[k];
      return '<div class="op-dr-group">' +
        '<button type="button" class="op-dr-toggle" aria-expanded="false">' + m.label + '<img src="' + A + 'ic-caret-down.svg" alt=""></button>' +
        '<div class="op-dr-sub">' + m.items.map(function (t) { return '<a href="#" data-soon="' + t + '">' + t + '</a>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
    var account = s
      ? '<div class="op-dr-who"><img src="' + A + 'user-icon.svg" alt=""><div><b>' + s.email.replace(/</g, '&lt;') + '</b><span>' + (ROLE_LABEL[s.role] || '') + '</span></div></div>' +
        '<a class="op-dr-link sm" href="#" data-soon="알림">알림</a>' +
        '<a class="op-dr-link sm" href="#" data-soon="마이페이지">마이페이지</a>' +
        '<button type="button" class="op-dr-link sm" data-op-logout>로그아웃</button>'
      : '<div class="op-dr-auth"><a class="op-dr-btn line" href="login.html">로그인</a><a class="op-dr-btn" href="signup.html">가입하기</a></div>';
    return '<div class="op-drawer" id="opDrawer" hidden>' +
      '<nav class="op-dr-nav" aria-label="전체 메뉴">' +
        '<a class="op-dr-link" href="omicspharm-register.html" data-client-only>프로젝트 의뢰</a>' +
        '<a class="op-dr-link" href="projects.html">프로젝트 찾기</a>' +
        groups +
      '</nav>' +
      '<div class="op-dr-lang"><span>언어</span><div><a href="#" class="on" data-lang="ko">KOR</a><a href="#" data-soon="영문(ENG)">ENG</a></div></div>' +
      '<div class="op-dr-account">' + account + '</div>' +
    '</div>';
  }
  var BURGER = '<button type="button" class="op-burger" aria-controls="opDrawer" aria-expanded="false" aria-label="메뉴 열기"><img class="i-open" src="' + A + 'ic-list.svg" alt=""><img class="i-close" src="' + A + 'ic-x.svg" alt=""></button>';

  function gnb(active) {
    var s = OP.session();
    var on = function (k) { return active === k ? ' class="on"' : ''; };
    var menu =
      '<nav class="op-gnb-menu">' +
        '<a href="omicspharm-register.html" data-client-only' + on('register') + '>프로젝트 의뢰</a>' +
        '<a href="projects.html"' + on('find') + '>프로젝트 찾기</a>' +
        dropdown('community') + dropdown('service') + dropdown('support') +
      '</nav>';
    var cta = s
      ? '<div class="op-gnb-cta">' +
          LANG +
          '<a class="op-bell" href="#" data-soon="알림" aria-label="알림"><img class="op-ic24" src="' + A + 'ic-bell.svg" alt=""></a>' +
          '<div class="op-user">' +
            '<button type="button" aria-haspopup="menu" aria-label="내 계정"><img src="' + A + 'user-icon.svg" alt=""></button>' +
            '<div class="op-user-menu" role="menu">' +
              '<div class="who"><b>' + s.email.replace(/</g, '&lt;') + '</b><span>' + (ROLE_LABEL[s.role] || '') + '</span></div>' +
              '<a href="#" data-soon="마이페이지" role="menuitem">마이페이지</a>' +
              '<button type="button" data-op-logout role="menuitem">로그아웃</button>' +
            '</div>' +
          '</div>' +
          BURGER +
        '</div>'
      : '<div class="op-gnb-cta">' +
          LANG +
          '<a class="op-gnb-login" href="login.html">로그인</a>' +
          '<a class="op-gnb-join" href="signup.html">가입하기</a>' +
          BURGER +
        '</div>';
    return '<header class="op-gnb' + (s ? ' is-login' : '') + '" data-role="' + (s ? s.role : 'guest') + '">' +
      '<div class="op-gnb-in">' +
        '<a class="op-gnb-logo" href="index.html" aria-label="OmicsPharm 홈"><img src="' + A + 'logo.svg" alt="OmicsPharm"></a>' +
        menu + cta +
      '</div></header>' + drawer(s);
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

  var FLOAT =
    '<div class="op-float">' +
      '<button type="button" class="op-top" aria-label="맨 위로"><img src="' + A + 'ic-arrow-up.svg" alt=""></button>' +
      '<a class="op-chat" href="#" data-soon="상담 챗봇" aria-label="상담 챗봇"><img src="' + A + 'fab.svg" alt=""></a>' +
    '</div>';

  function render() {
    document.querySelectorAll('[data-op-gnb]').forEach(function (el) { el.outerHTML = gnb(el.getAttribute('data-op-gnb')); });
    var hasFooter = !!document.querySelector('[data-op-footer]');
    document.querySelectorAll('[data-op-footer]').forEach(function (el) { el.outerHTML = footer(); });
    // 헤더·푸터가 있는 일반 페이지에만 맨 위로 + 챗봇 버튼 (로그인·회원가입 풀페이지 제외)
    if (hasFooter && !document.querySelector('.op-float')) document.body.insertAdjacentHTML('beforeend', FLOAT);
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
    if (e.target.closest('[data-lang="ko"]')) { e.preventDefault(); closeDropdowns(); return; }
    if (e.target.closest('.op-top')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (e.target.closest('.op-burger')) { setDrawer(document.getElementById('opDrawer').hidden); return; }
    var tg = e.target.closest('.op-dr-toggle');
    if (tg) { var g = tg.parentNode, o = !g.classList.contains('open'); g.classList.toggle('open', o); tg.setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
    var ddBtn = e.target.closest('.op-dd-btn');
    if (ddBtn) { var dd = ddBtn.parentNode, open = !dd.classList.contains('open'); closeDropdowns(); setDropdown(dd, open); }
    else if (!e.target.closest('.op-dd-menu')) closeDropdowns();
    var user = e.target.closest('.op-user');
    document.querySelectorAll('.op-user.open').forEach(function (u) { if (u !== user) u.classList.remove('open'); });
    if (user && e.target.closest('.op-user > button')) user.classList.toggle('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { document.querySelectorAll('.op-user.open').forEach(function (u) { u.classList.remove('open'); }); closeDropdowns(); setDrawer(false); }
  });

  function setDropdown(dd, open) {
    dd.classList.toggle('open', open);
    dd.querySelector('.op-dd-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function setDrawer(open) {
    var d = document.getElementById('opDrawer'), b = document.querySelector('.op-burger');
    if (!d || !b) return;
    d.hidden = !open;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.documentElement.classList.toggle('op-drawer-open', open);
  }
  // 넓은 화면으로 돌아가면 햄버거 메뉴 닫기
  window.addEventListener('resize', function () { if (window.innerWidth >= 900) setDrawer(false); });
  function closeDropdowns() { document.querySelectorAll('.op-dd.open').forEach(function (d) { setDropdown(d, false); }); }
  // 마우스를 올리면 열리고, 벗어나면 닫힌다 (터치 기기는 클릭으로)
  document.addEventListener('mouseover', function (e) {
    var dd = e.target.closest && e.target.closest('.op-dd');
    if (!dd || dd.classList.contains('open') || !window.matchMedia('(hover:hover)').matches) return;
    closeDropdowns(); setDropdown(dd, true);
  });
  document.addEventListener('mouseout', function (e) {
    var dd = e.target.closest && e.target.closest('.op-dd');
    if (!dd || dd.contains(e.relatedTarget) || !window.matchMedia('(hover:hover)').matches) return;
    setDropdown(dd, false);
  });

  function showFlash() {
    var m = null; try { m = sessionStorage.getItem('op.flash'); sessionStorage.removeItem('op.flash'); } catch (e) {}
    if (m) OP.toast(m);
  }
  // GNB 배경: 맨 위에서는 반투명, 조금이라도 내리면 흰색
  function syncGnb() {
    var g = document.querySelector('.op-gnb'); if (g) g.classList.toggle('is-scrolled', window.scrollY > 0);
    var t = document.querySelector('.op-top'); if (t) t.classList.toggle('show', window.scrollY > 400); // 어느 정도 내려야 맨 위로 버튼 표시
  }
  window.addEventListener('scroll', syncGnb, { passive: true });
  function init() { render(); syncGnb(); showFlash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

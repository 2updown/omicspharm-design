/* OmicsPharm 프로토타입 공통 스크립트
   - 로그인 상태(데모): 브라우저 localStorage에만 저장된다. 실제 인증 아님.
   - 회원 유형(클라이언트/분석파트너)은 회원가입 때 정해지고, 로그인은 가입한 이메일로 유형을 판별한다.
   - 관리자(셀키)는 가입할 수 없고 아래 데모 계정으로만 로그인한다.
   - <div data-op-gnb="메뉴키"></div>, <div data-op-footer></div> 자리에 공통 헤더/푸터를 그린다. */
(function () {
  var ACC_KEY = 'op.accounts', SES_KEY = 'op.session';
  var DEMO_PW = 'Demo@1234';
  var SEED = {
    'client@omicspharm.test':  { role: 'client',  pw: DEMO_PW, profileDone: true, name: '홍길동', org: '○○연구소' },
    'partner@omicspharm.test': { role: 'partner', pw: DEMO_PW, profileDone: true, name: '김파트너', org: '○○분석센터' },
    'admin@omicspharm.test':   { role: 'admin',   pw: DEMO_PW, profileDone: true, name: '셀키 컨설턴트', org: '셀키' }
  };
  var ROLE_LABEL = { client: '클라이언트', partner: '분석파트너', admin: '컨설턴트' }; // admin = 셀키 컨설턴트

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

  /* ── 소속(회사)·부서: DB 기반 자동완성 + 직접 입력 ──
     데모 DB = 가입된 계정들의 소속·부서 + localStorage 'op.orgs' { 소속명: [부서…] }.
     실제 서비스에서는 서버 DB 검색 API로 바꾼다. */
  var ORG_SEED = { '○○연구소': ['단백체연구팀', '유전체분석실'], '○○대학교 의과대학': ['생화학교실', '약리학교실'], '○○바이오': ['연구개발팀'], '○○병원': ['임상연구센터'], '○○제약': ['신약개발팀', '품질관리팀'], '○○분석센터': ['질량분석팀'], '셀키': ['컨설팅팀'] };
  var norm = function (t) { return String(t || '').replace(/\s+/g, ' ').trim(); };
  OP.orgDB = function () {
    var db = {};
    var add = function (o, d) { o = norm(o); if (!o) return; db[o] = db[o] || []; d = norm(d); if (d && db[o].indexOf(d) < 0) db[o].push(d); };
    Object.keys(ORG_SEED).forEach(function (o) { add(o); ORG_SEED[o].forEach(function (d) { add(o, d); }); });
    var acc = OP.accounts(); Object.keys(acc).forEach(function (k) { add(acc[k].org, acc[k].dept); });
    var st = read('op.orgs', {}); Object.keys(st).forEach(function (o) { add(o); (st[o] || []).forEach(function (d) { add(o, d); }); });
    return db;
  };
  OP.saveOrg = function (org, dept) {
    org = norm(org); dept = norm(dept); if (!org) return;
    var st = read('op.orgs', {}); st[org] = st[org] || []; if (dept && st[org].indexOf(dept) < 0) st[org].push(dept); write('op.orgs', st);
  };
  // 입력칸 아래 자동완성 목록. items(q) → [{v, sub}], 일치하는 항목이 없으면 '직접 추가'
  OP.combo = function (input, items, opt) {
    opt = opt || {};
    var host = input.closest('.fbody') || input.closest('.field') || input.parentNode, box = document.createElement('ul'), cur = -1, list = [];
    box.className = 'op-ac'; box.setAttribute('role', 'listbox'); box.hidden = true; box.id = input.id + '-ac';
    host.style.position = 'relative'; host.appendChild(box);
    input.setAttribute('autocomplete', 'off'); input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', box.id); input.setAttribute('aria-expanded', 'false');
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    function mark(t, q) { var i = q ? t.toLowerCase().indexOf(q.toLowerCase()) : -1; return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<b>' + esc(t.slice(i, i + q.length)) + '</b>' + esc(t.slice(i + q.length)); }
    function open() {
      var q = norm(input.value), all = items(q) || [];
      list = all.filter(function (x) { return !q || x.v.toLowerCase().indexOf(q.toLowerCase()) > -1; }).slice(0, 8);
      var exact = all.some(function (x) { return x.v.toLowerCase() === q.toLowerCase(); });
      if (q && !exact) list.push({ v: q, add: true });
      cur = -1;
      box.innerHTML = list.length ? list.map(function (x, i) {
        return '<li role="option" data-i="' + i + '"' + (x.add ? ' class="add"' : '') + '>' + (x.add ? '<span>' + esc(x.v) + '</span><em>+ 직접 추가</em>' : '<span>' + mark(x.v, q) + '</span>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '')) + '</li>';
      }).join('') : '<li class="none">' + esc(opt.empty || '입력해서 검색하세요.') + '</li>';
      box.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    function close() { box.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    function pick(i) { var x = list[i]; if (!x) return; input.value = x.v; close(); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); if (opt.onPick) opt.onPick(x); }
    function hi(n) { var li = box.querySelectorAll('li[data-i]'); if (!li.length) return; cur = (n + li.length) % li.length; li.forEach(function (l, k) { l.classList.toggle('on', k === cur); }); li[cur].scrollIntoView({ block: 'nearest' }); }
    input.addEventListener('focus', open);
    input.addEventListener('input', function (e) { if (e.isTrusted) open(); });
    input.addEventListener('keydown', function (e) {
      if (box.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { open(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); hi(cur + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hi(cur - 1); }
      else if (e.key === 'Enter' && !box.hidden && cur > -1) { e.preventDefault(); pick(cur); }
      else if (e.key === 'Escape' || e.key === 'Tab') close();
    });
    box.addEventListener('mousedown', function (e) { var li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
    input.addEventListener('blur', function () { setTimeout(close, 100); });
    return { open: open, close: close };
  };
  // 소속 → 부서 연결 (같은 소속을 고르면 그 소속에 등록된 부서가 뜬다)
  OP.orgCombo = function (orgInput, deptInput) {
    OP.combo(orgInput, function () {
      var db = OP.orgDB();
      return Object.keys(db).sort(function (a, b) { return a.localeCompare(b, 'ko'); }).map(function (o) { return { v: o, sub: db[o].length ? '부서 ' + db[o].length + '개' : '' }; });
    }, { empty: '소속을 입력해 검색하세요.' });
    if (deptInput) OP.combo(deptInput, function () {
      return (OP.orgDB()[norm(orgInput.value)] || []).map(function (d) { return { v: d }; });
    }, { empty: '이 소속에 등록된 부서가 없습니다. 직접 입력해주세요.' });
  };

  var A = 'assets/main/';
  // 메가메뉴 (Figma 메가메뉴 1303:74974 · Header State=menu1 1029:13726). 하위 화면은 아직 없어 누르면 준비 중 안내.
  var MENUS = {
    community: { label: '커뮤니티', items: ['공지사항', 'Insight'] },
    service:   { label: '서비스 소개', items: ['분석 서비스 안내', '이용방법'] },
    support:   { label: '고객지원', items: ['문의하기', 'FAQ'] }
  };
  var PAGES = { '문의하기': 'contact.html', 'FAQ': 'faq.html', 'Insight': 'blog.html', '공지사항': 'notice.html', '분석 서비스 안내': 'service.html', '이용방법': 'guide.html' };
  function link(t) { return PAGES[t] ? 'href="' + PAGES[t] + '"' : 'href="#" data-soon="' + t + '"'; }
  function dropdown(key) {
    var m = MENUS[key];
    return '<div class="op-dd" data-dd="' + key + '">' +
      '<button type="button" class="op-dd-btn" aria-haspopup="menu" aria-expanded="false">' + m.label + ' <img src="' + A + 'ic-caret-down.svg" alt=""></button>' +
      '<div class="op-dd-menu" role="menu">' + m.items.map(function (t) { return '<a role="menuitem" ' + link(t) + '>' + t + '</a>'; }).join('') + '</div>' +
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
        '<div class="op-dr-sub">' + m.items.map(function (t) { return '<a ' + link(t) + '>' + t + '</a>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
    // 기존 오믹스팜 모바일 메뉴처럼 한 줄씩 꽉 찬 목록 (언어·알림·마이페이지·계정 정보는 제외)
    var account = s
      ? '<button type="button" class="op-dr-link" data-op-logout>로그아웃</button>'
      : '<div class="op-dr-auth"><a class="op-dr-btn line" href="login.html">로그인</a><a class="op-dr-btn" href="signup.html">가입하기</a></div>';
    return '<div class="op-drawer" id="opDrawer" hidden>' +
      '<nav class="op-dr-nav" aria-label="전체 메뉴">' +
        '<a class="op-dr-link" href="omicspharm-register.html" data-client-only>프로젝트 의뢰</a>' +
        '<a class="op-dr-link" href="projects.html">프로젝트 찾기</a>' +
        groups +
        (s ? account : '') +
      '</nav>' +
      (s ? '' : account) +
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
          '<a class="op-bell" href="mypage-alarm.html" aria-label="알림"><img class="op-ic24" src="' + A + 'ic-bell.svg" alt=""></a>' +
          '<div class="op-user">' +
            '<button type="button" aria-haspopup="menu" aria-label="내 계정"><img src="' + ((OP.account(s.email) || {}).photo || A + 'user-icon.svg?v=2') + '" alt=""></button>' +
            '<div class="op-user-menu" role="menu">' +
              '<div class="who"><b>' + s.email.replace(/</g, '&lt;') + '</b><span>' + (ROLE_LABEL[s.role] || '') + '</span></div>' +
              // 프로토타입 확인용: 로그아웃 없이 데모 계정으로 유형 전환
              '<div class="op-switch"><p>화면 전환 (데모)</p><div>' +
                [['client', '클라이언트'], ['partner', '분석파트너'], ['admin', '컨설턴트']].map(function (r) {
                  return '<button type="button" data-op-as="' + r[0] + '"' + (s.role === r[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + r[1] + '</button>';
                }).join('') + '</div></div>' +
              '<a href="mypage.html" role="menuitem">마이페이지</a>' +
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
            '<div><b>사업자등록번호</b><span>695-87-01297</span></div>' +
            '<div><b>본사</b><span>28160 충북 청주시 흥덕구 오송읍 오송생명1로 194-41, 408호(기업연구관2)</span></div>' +
            '<div><b>BIO R&amp;D CENTER</b><span>06571 서울특별시 서초구 서초대로 67 성령빌딩 8층</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="op-f-social">' +
          '<a class="s1" href="https://blog.naver.com/cellkeyai" target="_blank" rel="noopener" aria-label="네이버 블로그 (새 창)"><img src="' + A + 'social-1.svg" alt=""></a>' +
          '<a class="s2" href="https://www.linkedin.com/company/cellkey/" target="_blank" rel="noopener" aria-label="링크드인 (새 창)"><img src="' + A + 'social-2.svg" alt=""></a>' +
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
    if (hasFooter && !document.body.hasAttribute('data-op-no-enter')) enterAnim();
  }
  // 페이지 진입 효과: 헤더·푸터·고정 요소(모달, 플로팅 버튼 등)를 뺀 본문 블록에 차례로 적용 (상단 영역은 글자만) (메인은 자체 스크롤 효과 사용)
  function enterAnim() {
    var skip = /(^|\s)(op-gnb|op-footer|op-float|op-drawer|op-toast)(\s|$)/, n = 0;
    [].forEach.call(document.body.children, function (el) {
      if (/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName) || skip.test(el.className) || el.hidden) return;
      if (getComputedStyle(el).position === 'fixed') return;
      // 배경(섹션 배경·배경 이미지)은 그대로 두고 안쪽 내용만 올라오게
      //  - 안쪽 .in 래퍼가 있으면: 상단(첫 블록)은 그 안의 글자 요소 하나하나, 나머지는 .in 통째로
      //  - 없으면: 블록의 직계 자식 중 배경용 이미지·영상·절대배치 요소를 뺀 것
      var box = el.querySelector(':scope > .in');
      // 배경을 가진 박스(배경색·배경 이미지·깔린 이미지)는 통째로 움직이지 않고 그 안쪽으로 들어감
      var hasBg = function (c) {
        var cs = getComputedStyle(c);
        return cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ||
          [].some.call(c.children, function (k) { return /^(IMG|VIDEO|PICTURE)$/i.test(k.tagName) && getComputedStyle(k).position === 'absolute'; });
      };
      var kids = function (p) {
        var out = [];
        [].forEach.call(p.children, function (c) {
          if (/^(IMG|VIDEO|PICTURE|SVG|CANVAS)$/i.test(c.tagName) || getComputedStyle(c).position === 'absolute') return;
          if (hasBg(c) && c.children.length && !/^(A|BUTTON|LABEL|INPUT|SELECT|TEXTAREA|FORM)$/.test(c.tagName)) out = out.concat(kids(c)); else out.push(c); // 버튼·입력창은 통째로
        });
        return out;
      };
      var targets = box ? (n === 0 ? kids(box) : [box]) : kids(el);
      targets.forEach(function (t) { t.classList.add('op-enter'); t.style.setProperty('--op-d', Math.min(n++, 5) * 0.1 + 's'); });
    });
  }

  // 내용이 짧은 페이지: 푸터를 화면 맨 아래에 붙임 (푸터 위 여백만 늘려서 다른 레이아웃은 그대로)
  function stickFooter() {
    var f = document.querySelector('.op-footer'); if (!f) return;
    f.style.marginTop = '';
    var gap = window.innerHeight - (f.getBoundingClientRect().bottom + window.scrollY);
    if (gap > 0) f.style.marginTop = gap + 'px';
  }
  var sfT;
  function queueFooter() { clearTimeout(sfT); sfT = setTimeout(stickFooter, 0); }
  function watchFooter() {
    if (!document.querySelector('.op-footer')) return;
    stickFooter();
    window.addEventListener('load', queueFooter);
    window.addEventListener('resize', queueFooter);
    if (window.ResizeObserver) new ResizeObserver(queueFooter).observe(document.body);
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
    var as = e.target.closest('[data-op-as]');
    if (as) {
      var role = as.getAttribute('data-op-as'), cur = OP.session();
      if (cur && cur.role === role) { closeDropdowns(); return; }
      OP.login(role + '@omicspharm.test'); // 데모 계정 (SEED)
      OP.flash(ROLE_LABEL[role] + ' 화면으로 전환했습니다.');
      // 클라이언트 전용 화면(프로젝트 의뢰)에서 분석파트너로 바꾸면 마이페이지로
      if (role !== 'client' && /omicspharm-register\.html/.test(location.pathname)) location.href = 'mypage.html';
      else location.reload();
      return;
    }
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
  function initAll() { init(); watchFooter(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
})();

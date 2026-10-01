/* 마이페이지 공통 — 로그인 확인, 왼쪽 프로필·메뉴, 데모 데이터(이 브라우저 localStorage 기준)
   메뉴: 대시보드 / 프로젝트 관리 / 문의내역 / 알림 / 내 정보 관리 (분석파트너 +견적관리, 컨설턴트 = 분석파트너 화면 +클라이언트·분석파트너 관리·관리자 페이지)
   (기존 '분석결과 관리'는 프로젝트 상세의 '결과보고서' 탭으로 통합)
   사용: <aside class="side" data-op-side></aside> + var me = OP.mypage('dash'); */
(function () {
  // [키, 이름, 주소, 보이는 유형(없으면 모두)]
  // admin = 컨설턴트(셀키): 당분간 분석파트너와 같은 화면 + 관리 메뉴 추가 (메뉴는 바뀌거나 통폐합될 수 있음)
  var MENU = [
    ['dash', '대시보드', 'mypage.html'],
    ['quote', '견적관리', '#', ['partner', 'admin']], // 셀키가 보낸 견적 요청 확인·견적 제출 (화면 준비 중)
    ['project', '프로젝트 관리', 'mypage-project.html'],
    ['inquiry', '문의내역', 'mypage-inquiry.html'],
    ['alarm', '알림', 'mypage-alarm.html'],
    ['account', '내 정보 관리', 'mypage-account.html'],
    ['clients', '클라이언트 관리', '#', ['admin']],
    ['partners', '분석파트너 관리', '#', ['admin']],
    ['admin', '관리자 페이지', '#', ['admin']]
  ];
  function read(k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  function ymd(t) { var d = new Date(t); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function ymdhm(t) { var d = new Date(t); return ymd(t) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // 답변 완료 예시 문의 (프로토타입용)
  var DEMO_INQ = {
    id: 'Q-DEMO01', demo: true, at: new Date(2026, 8, 18, 14, 20).getTime(), type: '분석 견적', svc: 'Proteomics', ref: '',
    title: '혈장 시료 20개 단백체 분석 견적 문의',
    body: '혈장 시료 20개(대조군 10, 실험군 10)로 정량 단백체 분석을 진행하려고 합니다. 대략적인 견적과 소요 기간이 궁금합니다.',
    answer: { at: new Date(2026, 8, 19, 10, 5).getTime(), body: '안녕하세요, OmicsPharm입니다.\n문의하신 조건(혈장 20개, 정량 단백체 분석)은 프로젝트로 등록하시면 분석파트너들의 견적을 비교해 받아보실 수 있습니다.\n일반적으로 시료 수령 후 4~6주 정도 소요되며, 고농도 단백질 제거(depletion) 여부에 따라 비용이 달라집니다.' }
  };

  // 분석파트너 프로젝트 관리 예시: 셀키 매칭 후 계약된 프로젝트만 (계약 → 분석 → 보고서 등록 → 보고서 검토 → 보고서 승인 → 완료)
  var P_STAGES = ['계약', '분석', '보고서 등록', '보고서 검토', '보고서 승인', '완료'];
  var PARTNER_DEMO = [
    { id: 'PRJ-2609C1', svc: 'Glycoproteomics', stage: '계약', title: '항체 의약품 N-glycan 당쇄 프로파일링', client: '○○바이오', samples: 6, amount: '920만원', contract: '2026-09-26', due: '2026-12-05', at: new Date(2026, 8, 26).getTime(), qa: 0 },
    { id: 'PRJ-2609A7', svc: 'Metabolomics', stage: '분석', title: '대장암 환자 혈청 대사체 프로파일링', client: '○○대학교 의과대학', samples: 48, amount: '1,850만원', contract: '2026-09-12', due: '2026-11-20', at: new Date(2026, 8, 12).getTime(), qa: 1 },
    { id: 'PRJ-2608B3', svc: 'Transcriptomics', stage: '보고서 등록', title: '마우스 간 조직 RNA-seq 발현 차이 분석', client: '○○연구소', samples: 24, amount: '1,200만원', contract: '2026-08-04', due: '2026-10-10', at: new Date(2026, 7, 4).getTime(), qa: 0 },
    { id: 'PRJ-2607D2', svc: 'Olink', stage: '보고서 검토', title: '혈장 Olink Target 96 염증 패널 분석', client: '○○병원', samples: 80, amount: '2,400만원', contract: '2026-07-21', due: '2026-09-30', at: new Date(2026, 6, 21).getTime(), qa: 2 },
    { id: 'PRJ-2607E5', svc: 'Genomics', stage: '보고서 승인', title: '세포주 전장 유전체 변이 분석 (WGS)', client: '○○제약', samples: 12, amount: '1,560만원', contract: '2026-07-02', due: '2026-09-15', at: new Date(2026, 6, 2).getTime(), qa: 0 },
    { id: 'PRJ-2605F8', svc: 'Proteomics', stage: '완료', title: '인슐린 유사체 LC-MS 펩타이드 매핑', client: '○○바이오로직스', samples: 4, amount: '680만원', contract: '2026-05-18', due: '2026-07-31', at: new Date(2026, 4, 18).getTime(), qa: 0, review: 1 }
  ];

  var D = {
    P_STAGES: P_STAGES,
    partnerProjects: function () { var s = OP.session(); return s && (s.role === 'partner' || s.role === 'admin') ? PARTNER_DEMO.slice() : []; }, // 컨설턴트도 같은 화면
    esc: esc, ymd: ymd, ymdhm: ymdhm,
    projects: function () { return read('op.submitted', []); },
    // 로그인한 계정이 보낸 문의만 (+ 클라이언트에게는 답변 완료 예시 1건)
    inquiries: function () {
      var s = OP.session() || {};
      return read('op.inquiries', []).filter(function (q) { return (q.owner || String(q.email || '').toLowerCase()) === s.email; })
        .concat(s.role === 'client' ? [DEMO_INQ] : []);
    },
    // 알림은 이 브라우저의 의뢰·문의 기록으로 만든다
    // 프로젝트: 클라이언트는 자기가 의뢰한 것. 분석파트너는 셀키(관리자)가 견적 요청을 보낸 의뢰만 볼 수 있다 (아직 데이터 없음)
    myProjects: function () { var s = OP.session(); return s && s.role === 'client' ? D.projects() : []; },
    alarms: function () {
      var readIds = read('op.alarmRead', []), L = [];
      // 의뢰 접수 알림은 의뢰한 클라이언트에게만 (분석파트너는 셀키의 견적 요청을 받은 뒤에만 의뢰를 확인)
      D.myProjects().forEach(function (p) {
        L.push({ id: 'p-' + p.id, cat: 'project', at: p.at, t: "'" + (p.title || p.id) + "' 프로젝트 의뢰가 접수되었습니다.", sub: '분석파트너의 견적이 도착하면 알려드릴게요.', href: 'mypage-project.html?id=' + encodeURIComponent(p.id) });
      });
      D.inquiries().forEach(function (q) {
        if (q.answer) L.push({ id: 'a-' + q.id, cat: 'inquiry', at: q.answer.at, t: "'" + q.title + "' 문의에 답변이 등록되었습니다.", href: 'mypage-inquiry.html?id=' + q.id });
        L.push({ id: 'q-' + q.id, cat: 'inquiry', at: q.at, t: "'" + q.title + "' 문의가 접수되었습니다.", href: 'mypage-inquiry.html?id=' + q.id });
      });
      D.partnerProjects().forEach(function (p) {
        if (p.qa) L.push({ id: 'qa-' + p.id, cat: 'project', at: p.at + 864e5 * 10, t: "'" + p.title + "' 프로젝트에 새 Q&A " + p.qa + '건이 등록되었습니다.', href: 'mypage-project.html?id=' + p.id });
        if (p.review) L.push({ id: 'rv-' + p.id, cat: 'project', at: new Date(2026, 7, 5).getTime(), t: "'" + p.title + "' 프로젝트에 리뷰가 등록되었습니다.", href: 'mypage-project.html?id=' + p.id });
        if (p.stage === '계약') L.push({ id: 'ct-' + p.id, cat: 'project', at: p.at, t: "'" + p.title + "' 프로젝트가 매칭되어 계약 단계가 시작되었습니다.", href: 'mypage-project.html?id=' + p.id });
      });
      L.push({ id: 'n-21', cat: 'notice', at: new Date(2026, 8, 28, 9, 0).getTime(), t: '[공지] OmicsPharm 서비스 리뉴얼 오픈 안내', href: 'notice-view.html?id=21' });
      L.push({ id: 'n-20', cat: 'notice', at: new Date(2026, 8, 15, 9, 0).getTime(), t: '[공지] 개인정보처리방침 변경 안내', href: 'notice-view.html?id=20' });
      L.push({ id: 'w', cat: 'notice', at: new Date(2026, 8, 1, 9, 0).getTime(), t: 'OmicsPharm 회원이 되신 것을 환영합니다.', sub: '이용방법에서 프로젝트 의뢰부터 결과 수령까지의 과정을 확인해보세요.', href: 'guide.html' });
      L.sort(function (a, b) { return b.at - a.at; });
      L.forEach(function (a) { a.read = readIds.indexOf(a.id) > -1; });
      return L;
    },
    markRead: function (ids) { var r = read('op.alarmRead', []); ids.forEach(function (i) { if (r.indexOf(i) < 0) r.push(i); }); write('op.alarmRead', r); },
    unread: function () { return D.alarms().filter(function (a) { return !a.read; }).length; }
  };

  // 확인 모달: OP.confirm('제목', '설명', '삭제', 확인 시 실행할 함수)
  D.confirm = function (title, desc, yes, cb) {
    var m = document.createElement('div');
    m.className = 'op-confirm'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="box"><h3>' + esc(title) + '</h3><p>' + esc(desc) + '</p><div class="btns"><button type="button" class="no">취소</button><button type="button" class="yes">' + esc(yes) + '</button></div></div>';
    var close = function () { m.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.classList.contains('no')) close();
      else if (e.target.classList.contains('yes')) { close(); cb(); }
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(m); m.querySelector('.no').focus();
  };
  D.removeProject = function (id) { write('op.submitted', D.projects().filter(function (p) { return p.id !== id; })); };

  OP.my = D;
  OP.mypage = function (key) {
    var s = OP.session();
    if (!s) { location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return null; }
    var acc = OP.account(s.email) || {};
    var name = acc.name || s.email.split('@')[0];
    var org = acc.org || (D.projects()[0] || {}).org || '';
    var side = document.querySelector('[data-op-side]');
    if (side) {
      var n = D.unread();
      side.innerHTML =
        '<div class="me"><img src="' + esc(acc.photo || 'assets/main/user-icon.svg?v=2') + '" alt="">' +
          '<span class="roles"><span class="role">' + esc(OP.ROLE_LABEL[s.role] || '') + '</span>' +
            (s.role === 'partner' ? '<span class="op-vchip' + (OP.partnerVerified() ? ' ok">인증' : '">미인증') + '</span>' : '') + '</span>' +
          '<b>' + esc(name) + ' 님</b><span>(' + esc(s.email) + ')</span>' + (org ? '<span>' + esc(org) + '</span>' : '') + '</div>' +
        '<nav class="menu" aria-label="마이페이지 메뉴">' + MENU.filter(function (m) { return !m[3] || m[3].indexOf(s.role) > -1; }).map(function (m) {
          var on = m[0] === key, label = m[1];
          return '<a href="' + m[2] + '"' + (m[2] === '#' ? ' data-soon="' + label + '"' : '') + (on ? ' class="on" aria-current="page"' : '') + '>' + label +
            (m[0] === 'alarm' && n ? '<span class="cnt">' + n + '</span>' : '') + '</a>';
        }).join('') + '</nav>';
    }
    return { s: s, acc: acc, name: name, org: org };
  };
})();

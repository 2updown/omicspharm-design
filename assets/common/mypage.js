/* 마이페이지 공통 — 로그인 확인, 왼쪽 프로필·메뉴, 데모 데이터(이 브라우저 localStorage 기준)
   메뉴: 대시보드 / 프로젝트 관리 / 문의내역 / 알림 / 내 정보 관리
   (기존 '분석결과 관리'는 프로젝트 상세의 '결과보고서' 탭으로 통합)
   사용: <aside class="side" data-op-side></aside> + var me = OP.mypage('dash'); */
(function () {
  var MENU = [
    ['dash', '대시보드', 'mypage.html'],
    ['project', '프로젝트 관리', 'mypage-project.html'],
    ['inquiry', '문의내역', 'mypage-inquiry.html'],
    ['alarm', '알림', 'mypage-alarm.html'],
    ['account', '내 정보 관리', 'mypage-account.html']
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

  var D = {
    esc: esc, ymd: ymd, ymdhm: ymdhm,
    projects: function () { return read('op.submitted', []); },
    inquiries: function () { return read('op.inquiries', []).concat([DEMO_INQ]); },
    // 알림은 이 브라우저의 의뢰·문의 기록으로 만든다
    alarms: function () {
      var readIds = read('op.alarmRead', []), L = [];
      D.projects().forEach(function (p) {
        L.push({ id: 'p-' + p.id, cat: 'project', at: p.at, t: "'" + (p.title || p.id) + "' 프로젝트 의뢰가 접수되었습니다.", sub: '분석파트너의 견적이 도착하면 알려드릴게요.', href: 'mypage-project.html?id=' + encodeURIComponent(p.id) });
      });
      D.inquiries().forEach(function (q) {
        if (q.answer) L.push({ id: 'a-' + q.id, cat: 'inquiry', at: q.answer.at, t: "'" + q.title + "' 문의에 답변이 등록되었습니다.", href: 'mypage-inquiry.html?id=' + q.id });
        L.push({ id: 'q-' + q.id, cat: 'inquiry', at: q.at, t: "'" + q.title + "' 문의가 접수되었습니다.", href: 'mypage-inquiry.html?id=' + q.id });
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
        '<div class="me"><img src="' + esc(acc.photo || 'assets/main/user-icon.svg') + '" alt="">' +
          '<span class="role">' + esc(OP.ROLE_LABEL[s.role] || '') + '</span>' +
          '<b>' + esc(name) + ' 님</b><span>(' + esc(s.email) + ')</span>' + (org ? '<span>' + esc(org) + '</span>' : '') + '</div>' +
        '<nav class="menu" aria-label="마이페이지 메뉴">' + MENU.map(function (m) {
          var on = m[0] === key;
          return '<a href="' + m[2] + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + m[1] +
            (m[0] === 'alarm' && n ? '<span class="cnt">' + n + '</span>' : '') + '</a>';
        }).join('') + '</nav>';
    }
    return { s: s, acc: acc, name: name, org: org };
  };
})();

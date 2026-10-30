/* Contact Us → 상담내역 (2026-10-22 결정)
   비회원은 Contact Us(contact.html)에 문의 유형·이름·이메일·제목·내용만 쓰고, 메일로 받은 링크(consult-view.html?t=)에서 답변을 본다.
   추가 상담은 회원가입 후 (이름·이메일 자동 입력, 메일 링크로 들어왔으니 이메일 인증 생략). 첫 문의부터 한 대화로 이어짐.
   컨설턴트는 마이페이지 > 상담내역에서 답변 + 상담 기록(컨설턴트만 보임). 프로젝트 문의 챗봇·문의내역과는 별개.
   데모: localStorage op.consults = [{ id, at, type, svc, name, email, title, file, owner, token, linkAt, msgs:[{at, by:'user'|'admin', text}], note, noteAt }] */
(function () {
  var OP = window.OP = window.OP || {};
  var KEY = 'op.consults', DAY = 864e5, LINK_DAYS = 7; // 링크 유효기간 7일 (미정, 일단 7일)
  var read = function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var write = function (L) { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} };
  var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var ymd = function (t) { var d = new Date(t); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); };
  var ymdhm = function (t) { var d = new Date(t); return ymd(t) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var tok = function () { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); };

  // 예시 상담 (처음 한 번만 넣음). 시각은 오늘 기준
  function seed() {
    var now = Date.now(), H = 36e5;
    return [
      { id: 'C-DEMO4', demo: true, at: now - DAY * 12, type: '분석 견적', svc: '대사체 분석', name: '최수아', email: 'sua.choi@example.com', title: '혈청 아미노산 표적 대사체 분석 비용 문의', token: 'demo-expired', linkAt: now - DAY * 12,
        msgs: [{ at: now - DAY * 12, by: 'user', text: '혈청 30개로 아미노산 표적 대사체 분석을 하려고 합니다. 대략적인 비용과 기간을 알고 싶습니다.' },
               { at: now - DAY * 11, by: 'admin', text: '안녕하세요, OmicsPharm 컨설턴트입니다.\n혈청 30개 아미노산 표적 분석은 보통 시료 수령 후 3~4주가 걸립니다. 프로젝트로 의뢰해 주시면 분석파트너 견적을 받아 정리해 드리겠습니다.' }], note: '' },
      { id: 'C-DEMO3', demo: true, at: now - H * 5, type: '서비스 이용', svc: '', name: '박지훈', email: 'jihoon.park@example.com', title: '프로젝트 의뢰 후 진행 절차가 궁금합니다', token: 'demo-wait', linkAt: now - H * 5,
        msgs: [{ at: now - H * 5, by: 'user', text: '처음 이용하려고 합니다. 의뢰서를 등록하면 견적은 언제쯤 받을 수 있나요? 시료는 언제 보내면 되는지도 궁금합니다.' }], note: '' },
      { id: 'C-DEMO2', demo: true, at: now - DAY * 6, type: '분석 견적', svc: '단백체 분석', name: '홍길동', email: 'client@omicspharm.test', owner: 'client@omicspharm.test', title: '세포 배양액 분비 단백질 분석 가능 여부', token: 'demo-member', linkAt: now - DAY * 6,
        msgs: [{ at: now - DAY * 6, by: 'user', text: '세포 배양액(무혈청 배지)에서 분비 단백질을 정량하고 싶습니다. 시료 12개 정도인데 분석이 가능한지 궁금합니다.' },
               { at: now - DAY * 6 + H * 3, by: 'admin', text: '안녕하세요, OmicsPharm 컨설턴트입니다.\nLabel-free 정량으로 가능합니다. 배양액은 단백질 농도가 낮아 농축이 필요해서, 시료당 최소 10 mL 정도를 권장드립니다.' },
               { at: now - DAY * 4, by: 'user', text: '가입했습니다. 10 mL 준비가 가능하고, 대조군 6개·처리군 6개입니다. 견적을 받으려면 어떻게 하면 될까요?' },
               { at: now - DAY * 4 + H * 2, by: 'admin', text: '말씀하신 조건으로 프로젝트 의뢰서를 작성해 주시면 바로 견적 요청을 진행하겠습니다. 의뢰서 작성 중 막히는 부분이 있으면 여기에 남겨 주세요.' }],
        note: '10/16 전화 통화: 다음 달 초 시료 준비 예정, 예산 800만원 내외. 의뢰서 등록되면 단백체 파트너 3곳에 견적 요청.', noteAt: now - DAY * 4 },
      { id: 'C-DEMO1', demo: true, at: now - DAY * 2, type: '분석 견적', svc: '단백체 분석', name: '이서연', email: 'seoyeon.lee@example.com', title: '혈장 시료 TMT 정량 단백체 분석 가능 여부', token: 'demo-guest', linkAt: now - DAY * 2,
        msgs: [{ at: now - DAY * 2, by: 'user', text: '혈장 시료 20개(대조군 10, 실험군 10)로 TMT 정량 단백체 분석을 하고 싶습니다. 고농도 단백질 제거(depletion)도 함께 가능한지 궁금합니다.' },
               { at: now - DAY * 2 + H * 4, by: 'admin', text: '안녕하세요, OmicsPharm 컨설턴트입니다.\nTMT 정량과 depletion 모두 가능합니다. 20개 시료면 TMTpro 16plex 두 세트로 진행하는 경우가 많고, 보통 시료 수령 후 5~6주가 걸립니다.\n시료량이나 예산이 정해지면 더 구체적으로 안내드리겠습니다.' }], note: '' }
    ];
  }
  function all() {
    var L = read(); if (!L) { L = seed(); write(L); }
    // 데모: 홍길동의 상담(C-DEMO2)은 그 뒤에 올린 의뢰 PRJ-2026-0046에 연결된 상태로 (2026-10-27, 한 번만)
    var d2 = L.filter(function (c) { return c.id === 'C-DEMO2'; })[0];
    if (d2 && !d2.linkSet) { d2.linkSet = 1; d2.link = 'PRJ-2026-0046'; d2.linkedAt = d2.msgs[d2.msgs.length - 1].at + 36e5; write(L); }
    return L;
  }
  function save(c) { var L = all(), i = L.map(function (x) { return x.id; }).indexOf(c.id); if (i < 0) L.unshift(c); else L[i] = c; write(L); return c; }
  function get(id) { return all().filter(function (c) { return c.id === id; })[0] || null; }
  function last(c) { return c.msgs[c.msgs.length - 1] || {}; }

  OP.consult = {
    LINK_DAYS: LINK_DAYS, esc: esc, ymd: ymd, ymdhm: ymdhm,
    all: all, get: get, save: save,
    byToken: function (t) { return t ? all().filter(function (c) { return c.token === t; })[0] || null : null; },
    expired: function (c) { return Date.now() - c.linkAt > LINK_DAYS * DAY; },
    linkUntil: function (c) { return c.linkAt + LINK_DAYS * DAY; },
    // 답변대기 = 마지막 메시지가 문의자, 답변완료 = 마지막 메시지가 컨설턴트 (실서비스의 '처리상태 대기/처리완료' 대신 자동)
    waiting: function (c) { return !c.link && last(c).by !== 'admin'; }, // 의뢰로 이어진 상담은 끝난 대화 (이후는 프로젝트 문의에서)
    lastAt: function (c) { return last(c).at || c.at; },
    // Contact Us 제출 (비회원이면 메일 링크 발급, 회원이면 내 상담내역에 바로)
    create: function (o) {
      var s = OP.session && OP.session(), c = { id: 'C-' + Date.now().toString(36).toUpperCase(), at: Date.now(), type: o.type, svc: o.svc || '', ref: o.ref || '', rid: o.rid || '', pj: !!o.pj, name: o.name, email: o.email.toLowerCase(), title: o.title,
        file: o.file || '', owner: s && s.email === o.email.toLowerCase() ? s.email : '', token: tok(), linkAt: Date.now(), msgs: [{ at: Date.now(), by: 'user', text: o.body, file: o.file || '' }], note: '' };
      return save(c);
    },
    // 프로젝트 문의 (2026-10-22): 그 프로젝트의 의뢰 클라이언트 · 견적 요청을 받은 분석파트너(선정 전까지, 선정되면 선정된 곳만)는
    // 프로젝트 상세 [문의하기] → 상담내역의 그 프로젝트 대화로 바로. 그 외(비회원·관계없는 회원)는 Contact Us 폼(제목 '[프로젝트명] 관련 문의드립니다')
    participant: function (rid, email) {
      var F = OP.flow, r = F && F.req(rid); if (!r || !email) return false;
      if ((r.owner || 'client@omicspharm.test') === email) return true;
      var s = F.state(rid), x = s.P && s.P[email];
      return !!x && !(s.st === 'matched' && s.pick !== email) && !s.cancel;
    },
    // 상담 두 갈래 (2026-10-27): 상담내역 = 프로젝트와 무관한 상담(Contact Us), 프로젝트 문의내역 = 프로젝트별 대화(참여자의 [문의하기]).
    // 예전 데이터(pj 없음)는 관련 프로젝트의 참여자가 남긴 대화면 프로젝트 문의로 봄
    isProj: function (c) { return c.pj != null ? !!c.pj : !!(c.rid && OP.flow && OP.consult.participant(c.rid, c.owner || c.email)); },
    // 내 그 프로젝트 대화 (한 사람당 프로젝트 하나에 대화 하나)
    byProject: function (rid, email) { return all().filter(function (c) { return c.rid === rid && OP.consult.isProj(c) && (c.owner === email || c.email === email); })[0] || null; },
    // 의뢰 전 상담 연결: Contact Us 상담을 의뢰(rid)에 붙임. 붙은 상담은 그대로 남고, 그 의뢰의 프로젝트 문의 맨 위에 '의뢰 전 상담'으로 보임
    pre: function (rid, email) { return all().filter(function (c) { return c.link === rid && (!email || c.owner === email || c.email === email); }).sort(function (a, b) { return a.at - b.at; }); },
    linkable: function (email) { email = String(email || '').toLowerCase(); return all().filter(function (c) { return !c.link && !OP.consult.isProj(c) && (c.owner === email || c.email === email); }).sort(function (a, b) { return OP.consult.lastAt(b) - OP.consult.lastAt(a); }); },
    link: function (id, rid) { var c = get(id); if (!c) return null; c.link = rid; c.linkedAt = Date.now(); return save(c); },
    unlink: function (id) { var c = get(id); if (!c) return null; delete c.link; delete c.linkedAt; return save(c); },
    add: function (id, by, text, file) { var c = get(id); if (!c) return null; c.msgs.push({ at: Date.now(), by: by, text: text, file: file || '' }); if (by === 'admin' && !c.owner) c.linkAt = Date.now(); return save(c); }, // 비회원은 답변 메일과 함께 링크가 새로 나가므로 유효기간도 그때부터 // file: 첨부 파일 이름 (이어 쓰는 글에도 첨부, 2026-10-26)
    setNote: function (id, text) { var c = get(id); if (!c) return null; c.note = text; c.noteAt = Date.now(); return save(c); },
    // 만료된 링크 다시 받기: 같은 이메일의 상담마다 새 링크 (데모: 첫 번째 것을 돌려줌)
    renew: function (email) {
      var L = all().filter(function (c) { return c.email === String(email || '').trim().toLowerCase(); });
      L.forEach(function (c) { c.token = tok(); c.linkAt = Date.now(); save(c); });
      return L[0] || null;
    },
    // 가입·로그인하면 같은 이메일로 남긴 상담을 이 계정에 붙인다
    claim: function (email) { email = String(email || '').toLowerCase(); all().forEach(function (c) { if (c.email === email && !c.owner) { c.owner = email; save(c); } }); },
    mine: function () { var s = OP.session && OP.session(); if (!s) return []; return all().filter(function (c) { return c.owner === s.email || c.email === s.email; }); },
    // 의뢰 전 상담 묶음 (접힘). 프로젝트 문의 대화 맨 위 · 컨설턴트 의뢰 상세에서 같이 씀
    preHTML: function (L, viewer) {
      if (!L.length) return '';
      return '<div class="cs-pre"><p class="cs-pre-h">의뢰 전 상담 <b>' + L.length + '</b><span>Contact Us로 나눈 상담이 이 의뢰에 연결되어 있습니다.</span></p>' + L.map(function (c) {
        return '<details><summary><span class="t">' + esc(c.title) + '</span><span class="d">' + ymd(c.at) + ' ~ ' + ymd(OP.consult.lastAt(c)) + ' · 대화 ' + c.msgs.length + '개</span></summary>' + OP.consult.thread(c, viewer) + '</details>';
      }).join('') + '</div>';
    },
    // 대화창. viewer = 'user' | 'admin'. 상담 기록(note)은 컨설턴트에게만
    thread: function (c, viewer) {
      return '<ol class="cs-thread">' + c.msgs.map(function (m) {
        var me = m.by === viewer;
        return '<li class="' + (m.by === 'admin' ? 'adm' : 'usr') + (me ? ' mine' : '') + '">' +
          (m.by === 'admin' ? '<span class="av" aria-hidden="true">O</span>' : '') +
          '<div class="bub"><b>' + (m.by === 'admin' ? 'OmicsPharm 컨설턴트' : esc(c.name)) + '</b>' + (m.text ? '<p>' + esc(m.text) + '</p>' : '') + (m.file ? '<span class="att">첨부 · ' + esc(m.file) + '</span>' : '') + '</div>' +
          '<time>' + ymdhm(m.at) + '</time></li>';
      }).join('') + '</ol>';
    }
  };
})();

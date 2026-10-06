/* 견적 중개 흐름 (프로토타입, 이 브라우저 localStorage 'op.flow' 기준)
   클라이언트 의뢰 → 컨설턴트(셀키) 검토 → 분석파트너에게 견적 요청 → 파트너 견적 제출·거절
   → 컨설턴트 확인 (필요하면 수정 요청) → 여러 견적을 클라이언트에게 전달 → 클라이언트가 하나를 선택 → 매칭 완료(계약)
   - 파트너는 견적 요청을 받은 의뢰만 볼 수 있다
   - 파트너 견적은 수정 없이 그대로 전달하고, 기관명도 공개한다
   - 데모: 로그인 가능한 파트너는 partner@omicspharm.test 하나이고, 나머지 파트너는 요청을 받으면 바로 응답한다
   사용: mypage.js 다음에 불러오고 OP.flow.* 사용 */
(function () {
  var KEY = 'op.flow', VER = 1;
  function read(k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var ymd = function (t) { var d = new Date(t); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); };
  var iso = function (t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var DAY = 864e5;
  var ME_PARTNER = 'partner@omicspharm.test';

  // 분석파트너 목록 (svc: 의뢰 서비스명에 들어 있으면 '추천')
  var PARTNERS = [
    { key: ME_PARTNER, org: '○○분석센터', svc: ['단백체', '대사체', '바이오의약품'], verified: true, done: 38, lead: '평균 6주', login: true },
    { key: 'p-bio', org: '△△바이오랩', svc: ['단백체', 'Olink', '대사체'], verified: true, done: 52, lead: '평균 5주', rate: .92, weeks: 5 },
    { key: 'p-omx', org: '□□오믹스', svc: ['전사체', '유전체', '단백체'], verified: true, done: 27, lead: '평균 7주', rate: 1.08, weeks: 7 },
    { key: 'p-gen', org: '◇◇유전체센터', svc: ['유전체', '전사체'], verified: true, done: 64, lead: '평균 6주', rate: 1, weeks: 6 },
    { key: 'p-met', org: '☆☆대사체연구소', svc: ['대사체', 'Olink'], verified: true, done: 19, lead: '평균 6주', rate: .97, weeks: 6 },
    { key: 'p-adc', org: '◎◎바이오로직스', svc: ['바이오의약품', '단백체'], verified: true, done: 11, lead: '평균 8주', rate: 1.15, weeks: 8 },
    { key: 'p-new', org: '▽▽랩', svc: ['단백체', '전사체'], verified: false, done: 0, lead: '-' }
  ];
  var partner = function (k) { return PARTNERS.filter(function (p) { return p.key === k; })[0] || { key: k, org: k, svc: [] }; };
  var fits = function (p, svc) { return p.svc.some(function (s) { return String(svc || '').indexOf(s) > -1; }); };

  // 예시 의뢰 (클라이언트 데모 계정 client@omicspharm.test 소유) — 단계별로 하나씩
  var T0 = new Date(2026, 9, 6, 10, 0).getTime();
  var DEMO_REQS = [
    { id: 'REQ-D3MO1', demo: true, at: T0 - DAY * 1, svc: '단백체 분석', title: '혈장 시료 TMT 정량 단백체 분석', org: '○○연구소', manager: '홍길동', samples: '20', due: '2026-12-18', from: '2026-10-05', to: '2026-10-19', budget: '1,000만원 이상', open: '공개',
      purpose: '대조군 10명, 환자군 10명 혈장에서 차등 발현 단백질을 찾고, 후보 바이오마커를 선별하고자 합니다.',
      sections: [{ title: '시료 정보', rows: [['Taxonomy (Source)', 'Human'], ['시료 종류', '혈장'], ['시료 수', '20개 (대조군 10 · 환자군 10)'], ['보관 상태', '-80℃ 냉동']] },
        { title: '분석 요청', rows: [['분석 방법', 'TMT 16plex 정량'], ['고농도 단백질 제거', '필요 (Top14 depletion)'], ['원하는 결과', '차등 발현 단백질 목록, Pathway 분석']] },
        { title: '기타 분석 요구사항', note: '시료는 계약 후 드라이아이스로 발송 예정입니다. 분석 일정 제안 부탁드립니다.' }] },
    { id: 'REQ-D3MO2', demo: true, at: T0 - DAY * 4, svc: '대사체 분석', title: '마우스 뇌 조직 비표적 대사체 프로파일링', org: '○○연구소', manager: '홍길동', samples: '24', due: '2026-12-31', from: '2026-10-02', to: '2026-10-16', budget: '500만~1,000만원', open: '비공개',
      purpose: '약물 투여군과 대조군 마우스 뇌 조직에서 대사체 변화를 확인하고자 합니다.',
      sections: [{ title: '시료 정보', rows: [['Taxonomy (Source)', 'Mouse'], ['시료 종류', '뇌 조직 (해마)'], ['시료 수', '24개 (3군 × 8)'], ['보관 상태', '-80℃ 냉동']] },
        { title: '분석 요청', rows: [['플랫폼', 'LC-MS (Untargeted)'], ['후속 분석', '대사 경로 분석']] }] },
    { id: 'REQ-D3MO3', demo: true, at: T0 - DAY * 9, svc: '전사체 분석', title: '종양 조직 RNA-seq 차등 발현 분석', org: '○○연구소', manager: '홍길동', samples: '16', due: '2026-12-10', from: '2026-09-25', to: '2026-10-09', budget: '1,000만원 이상', open: '공개',
      purpose: '항암제 처리 전후 종양 조직의 유전자 발현 변화를 비교하고자 합니다.',
      sections: [{ title: '시료 정보', rows: [['Taxonomy (Source)', 'Human'], ['시료 종류', 'FFPE 종양 조직'], ['시료 수', '16개 (처리 전 8 · 후 8)']] },
        { title: '분석 요청', rows: [['시퀀싱', 'Total RNA-seq, PE150, 40M reads'], ['원하는 결과', 'DEG 목록, GSEA, 시각화 리포트']] }] }
  ];

  // 가상 파트너 견적 (서비스·시료 수 기준으로 만든 예시)
  var BASE = [['단백체', 38], ['Olink', 22], ['대사체', 26], ['유전체', 46], ['전사체', 32], ['바이오의약품', 62]];
  function genQuote(p, r, k) {
    var unit = (BASE.filter(function (b) { return String(r.svc).indexOf(b[0]) > -1; })[0] || [0, 30])[1] * 10000;
    var n = parseInt(r.samples, 10) || 12, rate = (p.rate || 1) * (k || 1);
    var prep = Math.round(unit * .35 * rate / 1000) * 1000, run = Math.round(unit * .65 * rate / 1000) * 1000, data = Math.round(n * unit * .18 * rate / 10000) * 10000;
    var groups = [
      { name: r.svc.replace(' 분석', '') + ' 분석', lines: [{ d: '시료 전처리 및 QC', q: n, u: 'sample', p: prep }, { d: '기기 분석', q: n, u: 'sample', p: run }] },
      { name: '데이터 분석', lines: [{ d: '통계 분석 및 결과 리포트', q: 1, u: '식', p: data }] }
    ];
    var q = { at: Date.now(), cur: 'KRW', groups: groups, sale: p.rate < 1 ? String(Math.round(n * unit * .03 / 10000) * 10000) : '', addSale: '', weeks: String(p.weeks || 6),
      supplier: { s_org: p.org, s_ceo: '-', s_tel: '-', s_biz: '-', s_mgr: p.org + ' 담당자', s_mail: '-', s_addr: '-' },
      memo: '시료 수령 후 ' + (p.weeks || 6) + '주 이내 결과 리포트를 전달드립니다.\n분석 결과에 대한 1회 해석 미팅이 포함되어 있습니다.' };
    q.final = total(q).final;
    return q;
  }
  var num = function (v) { return parseFloat(String(v).replace(/[^\d.]/g, '')) || 0; };
  function total(q) {
    var sum = (q.groups || []).reduce(function (s, g) { return s + g.lines.reduce(function (t, l) { return t + num(l.q) * num(l.p); }, 0); }, 0);
    var net = Math.max(0, sum - num(q.sale) - num(q.addSale)), vat = q.cur === 'KRW' || !q.cur ? Math.round(net * .1) : 0;
    return { sum: sum, net: net, vat: vat, final: net + vat };
  }
  var CUR = { KRW: '₩', USD: '$', JPY: '¥' };
  var money = function (n, c) { return (CUR[c] || '₩') + ' ' + Math.round(n || 0).toLocaleString('ko-KR'); };
  var man = function (n) { return n >= 1e4 ? Math.round(n / 1e4).toLocaleString('ko-KR') + '만원' : Math.round(n).toLocaleString('ko-KR') + '원'; };

  // ── 상태 저장 ──
  // S[의뢰id] = { st:'review'|'quoting'|'sent'|'matched', due, memo, reqAt, P:{ 파트너키:{ at, status:'req'|'draft'|'sub'|'rev'|'dec', quote, subAt, rev:{at,note}, revN, dec:{at,why}, fwd } }, sentAt, msg, pick, pickAt }
  function seed() {
    var r2 = DEMO_REQS[1], r3 = DEMO_REQS[2], S = {};
    S[r2.id] = { st: 'quoting', reqAt: T0 - DAY * 3, due: '2026-10-10', memo: '시료 수가 많아 일정 제안을 함께 부탁드립니다.', P: {} };
    S[r2.id].P[ME_PARTNER] = { at: T0 - DAY * 3, status: 'req' };
    ['p-bio', 'p-met'].forEach(function (k, i) { var p = partner(k); S[r2.id].P[k] = { at: T0 - DAY * 3, status: 'sub', quote: genQuote(p, r2), subAt: T0 - DAY * (2 - i) }; });
    S[r3.id] = { st: 'sent', reqAt: T0 - DAY * 8, due: '2026-10-01', memo: '', P: {}, sentAt: T0 - DAY * 2, msg: '세 기관 모두 FFPE 시료 경험이 있습니다. 일정이 급하시면 △△바이오랩보다 ◇◇유전체센터를 추천드립니다.' };
    [['p-gen', 1], ['p-omx', 1], ['p-bio', 0]].forEach(function (a, i) {
      var p = partner(a[0]); S[r3.id].P[a[0]] = a[1] ? { at: T0 - DAY * 8, status: 'sub', quote: genQuote(p, r3), subAt: T0 - DAY * (6 - i), fwd: true }
        : { at: T0 - DAY * 8, status: 'dec', dec: { at: T0 - DAY * 7, why: '해당 기간 시퀀싱 장비 일정이 모두 차 있습니다.' } };
    });
    // 전달된 견적 하나는 수정 요청을 한 번 거친 것으로
    S[r3.id].P['p-omx'].revN = 1;
    return { v: VER, S: S };
  }
  function db() { var d = read(KEY, null); if (!d || d.v !== VER) { d = seed(); write(KEY, d); } return d; }
  function save(d) { write(KEY, d); }
  function state(id) { return db().S[id] || { st: 'review', P: {} }; }
  function put(id, fn) { var d = db(), s = d.S[id] || { st: 'review', P: {} }; fn(s); d.S[id] = s; save(d); return s; }

  // 의뢰 목록: 이 브라우저에서 제출된 의뢰(V4) + 예시 의뢰
  function requests() { return ((OP.my && OP.my.projects()) || []).concat(DEMO_REQS).sort(function (a, b) { return b.at - a.at; }); }
  function req(id) { return requests().filter(function (r) { return r.id === id; })[0] || null; }

  var F = {
    PARTNERS: PARTNERS, partner: partner, fits: fits, ME_PARTNER: ME_PARTNER,
    requests: requests, req: req, state: state, total: total, money: money, man: man, num: num, esc: esc, ymd: ymd, iso: iso,
    // 단계 이름
    ADMIN_ST: { review: '검토 대기', quoting: '견적 수집 중', sent: '클라이언트 검토', matched: '매칭 완료' },
    CLIENT_ST: { review: '의뢰접수', quoting: '의뢰접수', sent: '견적 비교', matched: '계약' },
    CLIENT_STEPS: ['의뢰접수', '견적 비교', '계약', '분석 진행', '결과 수령'],
    // 파트너 쪽에서 본 견적 상태
    pst: function (s, k) {
      var x = s.P[k]; if (!x) return null;
      if (s.st === 'matched' && x.status === 'sub') return s.pick === k ? '선정' : '미선정';
      if (x.status === 'sub') return x.fwd && s.st === 'sent' ? '클라이언트 검토 중' : '제출 완료';
      return { req: '작성 대기', draft: '임시저장', rev: '수정 요청', dec: '거절' }[x.status];
    },
    // 견적 요청 보내기 (추가 요청도 같은 함수)
    send: function (id, keys, due, memo) {
      var r = req(id);
      return put(id, function (s) {
        if (s.st === 'review') { s.st = 'quoting'; s.reqAt = Date.now(); s.due = due; s.memo = memo; }
        keys.forEach(function (k) {
          if (s.P[k]) return;
          var p = partner(k), x = { at: Date.now(), status: 'req' };
          if (!p.login) { // 가상 파트너는 바로 응답
            if (fits(p, r.svc)) { x.status = 'sub'; x.quote = genQuote(p, r); x.subAt = Date.now(); }
            else { x.status = 'dec'; x.dec = { at: Date.now(), why: '요청하신 분석 분야는 현재 수행이 어렵습니다.' }; }
          }
          s.P[k] = x;
        });
      });
    },
    // 컨설턴트 → 파트너 수정 요청
    revise: function (id, k, note) {
      var r = req(id);
      return put(id, function (s) {
        var x = s.P[k]; x.status = 'rev'; x.rev = { at: Date.now(), note: note }; x.revN = (x.revN || 0) + 1; x.fwd = false;
        var p = partner(k);
        if (!p.login) { // 가상 파트너는 바로 다시 제출 (금액 5% 조정)
          var q = genQuote(p, r, 1 - .05 * x.revN); q.memo += '\n[수정 반영] ' + note; x.quote = q; x.status = 'sub'; x.subAt = Date.now() + 1000;
        }
      });
    },
    // 파트너 저장·제출·거절
    partnerSave: function (id, k, quote, submit) {
      return put(id, function (s) { var x = s.P[k]; if (!x) return; x.quote = quote; if (submit) { x.status = 'sub'; x.subAt = Date.now(); } else if (x.status === 'req') x.status = 'draft'; });
    },
    decline: function (id, k, why) { return put(id, function (s) { var x = s.P[k]; x.status = 'dec'; x.dec = { at: Date.now(), why: why }; }); },
    // 컨설턴트 → 클라이언트 전달
    forward: function (id, keys, msg) {
      return put(id, function (s) { Object.keys(s.P).forEach(function (k) { s.P[k].fwd = keys.indexOf(k) > -1; }); s.st = 'sent'; s.sentAt = Date.now(); s.msg = msg; });
    },
    // 클라이언트 선택 → 매칭 완료
    pick: function (id, k) { return put(id, function (s) { s.st = 'matched'; s.pick = k; s.pickAt = Date.now(); }); },
    remove: function (id) { var d = db(); delete d.S[id]; save(d); },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem('op.alarmRead'); } catch (e) {} },
    // 클라이언트 단계
    clientStage: function (id) { return F.CLIENT_ST[state(id).st]; },
    // 분석파트너가 받은 견적 요청
    inbox: function (k) {
      var d = db().S;
      return requests().filter(function (r) { return d[r.id] && d[r.id].P[k]; }).map(function (r) { return { r: r, s: d[r.id], x: d[r.id].P[k] }; })
        .sort(function (a, b) { return b.x.at - a.x.at; });
    },
    // 매칭 완료된 의뢰 → 분석파트너·컨설턴트 프로젝트 관리 '계약' 단계 프로젝트
    matched: function (k) {
      var d = db().S;
      return requests().filter(function (r) { var s = d[r.id]; return s && s.st === 'matched' && (!k || s.pick === k); }).map(function (r) {
        var s = d[r.id], q = s.P[s.pick].quote;
        return { id: r.id, flow: true, svc: r.svc, stage: '계약', title: r.title, client: r.org || '-', partner: partner(s.pick).org, samples: r.samples || '-', amount: man(total(q).net), contract: iso(s.pickAt), due: r.due || iso(s.pickAt + DAY * 7 * (+q.weeks || 6)), at: s.pickAt, qa: 0 };
      });
    }
  };

  // 알림 (역할별)
  F.alarms = function () {
    var ses = OP.session(); if (!ses) return [];
    var L = [], d = db().S, R = requests(), role = ses.role;
    var t = function (r) { return "'" + (r.title || r.id) + "'"; };
    R.forEach(function (r) {
      var s = d[r.id] || { st: 'review', P: {} };
      if (role === 'admin') {
        var href = 'mypage-request.html?id=' + encodeURIComponent(r.id);
        L.push({ id: 'f-new-' + r.id, cat: 'project', at: r.at, t: t(r) + ' 새 의뢰가 접수되었습니다.', sub: '의뢰 내용을 검토하고 분석파트너에게 견적을 요청해주세요.', href: href });
        Object.keys(s.P).forEach(function (k) {
          var x = s.P[k], o = partner(k).org;
          if (x.subAt) L.push({ id: 'f-sub-' + r.id + k + (x.revN || 0), cat: 'project', at: x.subAt, t: o + '에서 ' + t(r) + ' 견적' + (x.revN ? '(수정본)' : '') + '을 제출했습니다.', href: href });
          if (x.dec) L.push({ id: 'f-dec-' + r.id + k, cat: 'project', at: x.dec.at, t: o + '에서 ' + t(r) + ' 견적 요청을 거절했습니다.', sub: x.dec.why, href: href });
        });
        if (s.pick) L.push({ id: 'f-pick-' + r.id, cat: 'project', at: s.pickAt, t: '클라이언트가 ' + t(r) + '에서 ' + partner(s.pick).org + ' 견적을 선택했습니다.', sub: '매칭이 완료되어 계약 단계로 넘어갔습니다.', href: href });
      } else if (role === 'partner') {
        var x = s.P[ses.email]; if (!x) return;
        var qh = 'mypage-quote.html?rid=' + encodeURIComponent(r.id);
        L.push({ id: 'f-req-' + r.id, cat: 'project', at: x.at, t: t(r) + ' 견적 요청이 도착했습니다.', sub: '견적 마감일 ' + (s.due ? s.due.replace(/-/g, '.') : '-'), href: qh });
        if (x.rev) L.push({ id: 'f-rev-' + r.id + x.revN, cat: 'project', at: x.rev.at, t: t(r) + ' 견적에 수정 요청이 있습니다.', sub: x.rev.note, href: qh });
        if (s.st === 'matched' && x.status === 'sub') L.push(s.pick === ses.email
          ? { id: 'f-win-' + r.id, cat: 'project', at: s.pickAt, t: t(r) + ' 프로젝트에 선정되어 매칭이 완료되었습니다.', sub: '프로젝트 관리에서 계약 내용을 확인해주세요.', href: 'mypage-project.html?id=' + encodeURIComponent(r.id) }
          : { id: 'f-lose-' + r.id, cat: 'project', at: s.pickAt, t: t(r) + ' 견적은 이번에 선정되지 않았습니다.', sub: '참여해주셔서 감사합니다.', href: qh });
      } else if (role === 'client' && (!r.demo || ses.email === 'client@omicspharm.test')) {
        var ph = 'mypage-project.html?id=' + encodeURIComponent(r.id);
        if (r.demo) L.push({ id: 'p-' + r.id, cat: 'project', at: r.at, t: t(r) + ' 프로젝트 의뢰가 접수되었습니다.', sub: '분석파트너의 견적이 도착하면 알려드릴게요.', href: ph });
        if (s.sentAt) L.push({ id: 'f-arr-' + r.id, cat: 'project', at: s.sentAt, t: t(r) + ' 견적 ' + Object.keys(s.P).filter(function (k) { return s.P[k].fwd; }).length + '건이 도착했습니다.', sub: '견적을 비교하고 분석파트너를 선택해주세요.', href: ph + '&tab=quote' });
        if (s.pick) L.push({ id: 'f-mat-' + r.id, cat: 'project', at: s.pickAt, t: t(r) + ' 프로젝트가 ' + partner(s.pick).org + '와 매칭되었습니다.', sub: '계약 진행을 위해 OmicsPharm 컨설턴트가 연락드릴 예정입니다.', href: ph });
      }
    });
    return L;
  };

  // ── 화면 조각 ──
  // 의뢰 내용 (요약 + 섹션)
  F.reqHTML = function (r) {
    var dot = function (v) { return v ? String(v).replace(/-/g, '.') : '-'; };
    return '<div class="fsum">' +
        '<div><img src="assets/find/ic-user.svg" alt="">' + esc((r.org || '-') + (r.manager ? '(' + r.manager + ')' : '')) + '</div>' +
        '<div><img src="assets/find/ic-flask.svg" alt=""><em>샘플</em>' + (r.samples ? esc(r.samples) + '개' : '-') + '</div>' +
        '<div><img src="assets/find/ic-timer.svg" alt=""><em>희망완료일</em>' + (r.due ? '~' + dot(r.due) : '-') + '</div>' +
        '<div><img src="assets/detail/ic-currency-krw.svg" alt=""><em>예상금액</em>' + esc(r.budget || '-') + '</div>' +
      '</div>' +
      '<section class="fsec"><h4>기본 정보</h4><dl class="fkv">' +
        '<div><dt>분석 서비스</dt><dd>' + esc(r.svc) + '</dd></div>' +
        (r.purpose ? '<div><dt>연구 내용 및 목적</dt><dd>' + esc(r.purpose) + '</dd></div>' : '') +
        (r.open ? '<div><dt>공개여부</dt><dd>' + esc(r.open) + '</dd></div>' : '') +
      '</dl></section>' +
      (r.sections || []).map(function (sec) {
        if (sec.note) return '<section class="fsec"><h4>' + esc(sec.title) + '</h4><p class="fnote">' + esc(sec.note) + '</p></section>';
        return '<section class="fsec"><h4>' + esc(sec.title) + '</h4><dl class="fkv">' + sec.rows.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl></section>';
      }).join('');
  };

  // 견적서 문서 (A4) — 파트너가 쓴 그대로
  F.docHTML = function (r, q, k) {
    var cur = q.cur || 'KRW', sup = q.supplier || {}, tt = total(q), val = function (v) { return esc(v || '-'); };
    var party = function (h, v) { return '<div><h3>' + h + '</h3><table><tr><th>기업명</th><td>' + val(v[0]) + '</td><th>대표자성명</th><td>' + val(v[1]) + '</td></tr><tr><th>연락처</th><td>' + val(v[2]) + '</td><th>사업자등록번호</th><td>' + val(v[3]) + '</td></tr><tr><th>담당자</th><td>' + val(v[4]) + '</td><th>이메일</th><td>' + val(v[5]) + '</td></tr><tr><th>주소</th><td colspan="3">' + val(v[6]) + '</td></tr></table></div>'; };
    var sub = function (g) { return g.lines.reduce(function (s, l) { return s + num(l.q) * num(l.p); }, 0); };
    var rows = (q.groups || []).map(function (g) {
      return g.lines.map(function (l, i) {
        return '<tr>' + (i === 0 ? '<td rowspan="' + (g.lines.length + 1) + '">' + val(g.name) + '</td>' : '') + '<td>' + val(l.d) + '</td><td class="c">' + esc(l.q || '') + '</td><td class="c">' + esc(l.u || '') + '</td><td class="r">' + money(num(l.p), cur) + '</td><td class="r">' + money(num(l.q) * num(l.p), cur) + '</td></tr>';
      }).join('') + '<tr class="sub"><td colspan="4" style="text-align:right">소계</td><td class="r">' + money(sub(g), cur) + '</td></tr>';
    }).join('');
    var d = ymd(q.subAt || q.at || Date.now());
    return '<article class="doc">' +
      '<div class="doc-head"><img src="assets/main/logo.svg" alt="OmicsPharm"><h1>견 적 서</h1></div>' +
      '<div class="doc-meta"><span>견적번호 Q-' + esc(String(r.id).replace(/^REQ-/, '')) + '-' + esc(String(k || '').replace(/@.*/, '').toUpperCase()) + '</span><span>견적일자 ' + d + '</span></div>' +
      '<table><tr><th style="width:18%">프로젝트명</th><td>' + esc(r.title) + '</td></tr><tr><th>분석 분야</th><td>' + esc(r.svc) + ' · 시료 ' + esc(r.samples || '-') + '개' + (q.weeks ? ' · 소요 기간 ' + esc(q.weeks) + '주' : '') + '</td></tr></table>' +
      '<div class="parties" style="margin-top:16px">' +
        party('고객사', [r.org, '-', '-', '-', r.manager, '-', '-']) +
        party('공급자', [sup.s_org, sup.s_ceo, sup.s_tel, sup.s_biz, sup.s_mgr, sup.s_mail, sup.s_addr]) +
      '</div>' +
      '<h2>제안가 <span style="font-weight:400;color:#666">(' + ({ KRW: '원화, 공급가 VAT 별도', USD: '달러', JPY: '엔화' })[cur] + ')</span></h2>' +
      '<table class="it"><colgroup><col style="width:22%"><col><col style="width:9%"><col style="width:9%"><col style="width:15%"><col style="width:16%"></colgroup>' +
        '<tr><th>시험명</th><th>세부내용</th><th>수량</th><th>Unit</th><th>단가</th><th>금액</th></tr>' + rows + '</table>' +
      '<table class="tt"><tr><th>분석료 합계</th><td class="r">' + money(tt.sum, cur) + '</td></tr>' +
        (num(q.sale) ? '<tr class="minus"><th>할인</th><td class="r">-' + money(num(q.sale), cur) + '</td></tr>' : '') +
        (num(q.addSale) ? '<tr class="minus"><th>추가 할인</th><td class="r">-' + money(num(q.addSale), cur) + '</td></tr>' : '') +
        '<tr><th>분석료 총계</th><td class="r">' + money(tt.net, cur) + '</td></tr>' +
        (cur === 'KRW' ? '<tr><th>VAT 10%</th><td class="r">' + money(tt.vat, cur) + '</td></tr>' : '') +
        '<tr class="final"><th>최종 견적 금액</th><td class="r">' + money(tt.final, cur) + '</td></tr></table>' +
      '<h2>Notice</h2><div class="memo">' + (q.memo ? esc(q.memo) : '<span class="demo">작성된 내용이 없습니다.</span>') + '</div>' +
      '<div class="sign"><span>위와 같이 견적합니다.</span><b>' + val(sup.s_org) + '</b></div>' +
    '</article>';
  };
  // 견적서 보기 창
  F.showDoc = function (r, q, k, title) {
    var pv = document.createElement('div');
    pv.className = 'pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', title || '견적서');
    pv.innerHTML = '<div class="pv-bar"><b>' + esc(title || '견적서') + '</b><div><button type="button" data-print>인쇄 · PDF 저장</button><button type="button" class="x" data-close>닫기</button></div></div><div class="pv-scroll">' + F.docHTML(r, q, k) + '</div>';
    var close = function () { pv.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    pv.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === pv) close(); else if (e.target.closest('[data-print]')) window.print(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(pv); document.body.style.overflow = 'hidden'; pv.querySelector('[data-close]').focus();
  };
  // 입력 모달 (수정 요청 사유, 거절 사유, 전달 메시지): OP.flow.ask({title, desc, label, ph, yes, required}, cb(value))
  F.ask = function (o, cb) {
    var m = document.createElement('div');
    m.className = 'op-confirm fask'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="box"><h3>' + esc(o.title) + '</h3>' + (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') +
      (o.label !== false ? '<label class="fask-l">' + esc(o.label || '') + '<textarea placeholder="' + esc(o.ph || '') + '">' + esc(o.value || '') + '</textarea></label>' : '') +
      '<div class="btns"><button type="button" class="no">취소</button><button type="button" class="yes go">' + esc(o.yes || '확인') + '</button></div></div>';
    var ta = m.querySelector('textarea'), yes = m.querySelector('.yes');
    var sync = function () { if (o.required && ta) yes.disabled = !ta.value.trim(); };
    var close = function () { m.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    if (ta) ta.addEventListener('input', sync);
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.classList.contains('no')) close();
      else if (e.target === yes && !yes.disabled) { var v = ta ? ta.value.trim() : ''; close(); cb(v); }
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(m); sync(); (ta || m.querySelector('.no')).focus();
  };

  OP.flow = F;
})();

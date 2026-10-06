/* 견적 중개 흐름 (프로토타입, 이 브라우저 localStorage 'op.flow' 기준)
   클라이언트 의뢰 → 컨설턴트(셀키) 검토 → 분석파트너에게 견적 요청 → 파트너 견적 제출·거절
   → 컨설턴트 확인 (필요하면 수정 요청) → 여러 견적을 클라이언트에게 전달 → 클라이언트가 하나를 선택 → 매칭 완료(계약)
   - 파트너는 견적 요청을 받은 의뢰만 볼 수 있다
   - 파트너 견적은 수정 없이 그대로 전달하고, 기관명도 공개한다
   - 데모: 로그인 가능한 파트너는 partner@omicspharm.test 하나이고, 나머지 파트너는 요청을 받으면 바로 응답한다
   사용: mypage.js 다음에 불러오고 OP.flow.* 사용 */
(function () {
  var KEY = 'op.flow', VER = 2;
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
    // name·tel·mail: 견적제안메일 발송 목록용 (데모 값)
    { key: ME_PARTNER, org: '○○분석센터', name: '김파트너', tel: '010-2345-6789', mail: ME_PARTNER, svc: ['단백체', '대사체', '바이오의약품'], verified: true, done: 38, lead: '평균 6주', login: true },
    { key: 'p-bio', org: '△△바이오랩', name: '이담당', tel: '02-000-1001', mail: 'contact@biolab.test', svc: ['단백체', 'Olink', '대사체'], verified: true, done: 52, lead: '평균 5주', rate: .92, weeks: 5 },
    { key: 'p-omx', org: '□□오믹스', name: '박담당', tel: '031-000-1002', mail: 'sales@omics.test', svc: ['전사체', '유전체', '단백체'], verified: true, done: 27, lead: '평균 7주', rate: 1.08, weeks: 7 },
    { key: 'p-gen', org: '◇◇유전체센터', name: '최담당', tel: '042-000-1003', mail: 'info@genome.test', svc: ['유전체', '전사체'], verified: true, done: 64, lead: '평균 6주', rate: 1, weeks: 6 },
    { key: 'p-met', org: '☆☆대사체연구소', name: '정담당', tel: '02-000-1004', mail: 'lab@metabo.test', svc: ['대사체', 'Olink'], verified: true, done: 19, lead: '평균 6주', rate: .97, weeks: 6 },
    { key: 'p-adc', org: '◎◎바이오로직스', name: '한담당', tel: '032-000-1005', mail: 'bd@biologics.test', svc: ['바이오의약품', '단백체'], verified: true, done: 11, lead: '평균 8주', rate: 1.15, weeks: 8 },
    { key: 'p-new', org: '▽▽랩', name: '오담당', tel: '010-0000-1006', mail: 'hello@newlab.test', svc: ['단백체', '전사체'], verified: false, done: 0, lead: '-' }
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
    S[r2.id] = { st: 'quoting', ok: T0 - DAY * 3.5, reqAt: T0 - DAY * 3, due: '2026-10-10', memo: '시료 수가 많아 일정 제안을 함께 부탁드립니다.', P: {} };
    S[r2.id].P[ME_PARTNER] = { at: T0 - DAY * 3, status: 'req' };
    ['p-bio', 'p-met'].forEach(function (k, i) { var p = partner(k); S[r2.id].P[k] = { at: T0 - DAY * 3, status: 'sub', quote: genQuote(p, r2), subAt: T0 - DAY * (2 - i) }; });
    S[r3.id] = { st: 'sent', ok: T0 - DAY * 8.5, reqAt: T0 - DAY * 8, due: '2026-10-01', memo: '', P: {}, sentAt: T0 - DAY * 2, msg: '세 기관 모두 FFPE 시료 경험이 있습니다. 일정이 급하시면 △△바이오랩보다 ◇◇유전체센터를 추천드립니다.' };
    [['p-gen', 1], ['p-omx', 1], ['p-bio', 0]].forEach(function (a, i) {
      var p = partner(a[0]); S[r3.id].P[a[0]] = a[1] ? { at: T0 - DAY * 8, status: 'sub', quote: genQuote(p, r3), subAt: T0 - DAY * (6 - i), fwd: true }
        : { at: T0 - DAY * 8, status: 'dec', dec: { at: T0 - DAY * 7, why: '해당 기간 시퀀싱 장비 일정이 모두 차 있습니다.' } };
    });
    // 전달된 견적 하나는 수정 요청을 한 번 거친 것으로
    S[r3.id].P['p-omx'].revN = 1;
    return { v: VER, S: S };
  }
  function db() { var d = read(KEY, null); if (!d || d.v !== VER) { d = seed(); write(KEY, d); } d.X = d.X || []; return d; }
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
    // 컨설턴트 프로젝트 관리 단계 (요구사항정의서 '프로젝트상태' 시트 이름, 이름은 추후 맞출 예정)
    ADMIN_STAGES: ['의뢰접수', '의뢰확인', '견적 협의', '계약 진행 중', '분석 진행 중', '보고서 등록', '보고서 검토', '보고서 승인', '프로젝트 완료'],
    P2A: { '계약': '계약 진행 중', '분석': '분석 진행 중', '보고서 등록': '보고서 등록', '보고서 검토': '보고서 검토', '보고서 승인': '보고서 승인', '완료': '프로젝트 완료' },
    adminStage: function (id) { var s = state(id); return s.ct ? '분석 진행 중' : s.st === 'matched' ? '계약 진행 중' : s.st === 'review' ? (s.ok ? '의뢰확인' : '의뢰접수') : '견적 협의'; },
    quoteCount: function (id) { var s = state(id); return Object.keys(s.P).filter(function (k) { return s.P[k].status === 'sub'; }).length; },
    CLIENT_ST: { review: '의뢰접수', quoting: '의뢰접수', sent: '견적 비교', matched: '계약' }, // 계약서 등록 후에는 '분석 진행'
    CLIENT_STEPS: ['의뢰접수', '견적 비교', '계약', '분석 진행', '결과 수령'],
    // 파트너 쪽에서 본 견적 상태
    pst: function (s, k) {
      var x = s.P[k]; if (!x) return null;
      if (s.st === 'matched' && x.status === 'sub') return s.pick === k ? '선정' : '미선정';
      if (x.status === 'sub') return x.fwd && s.st === 'sent' ? '클라이언트 검토 중' : '제출 완료';
      return { req: '작성 대기', draft: '임시저장', rev: '수정 요청', dec: '거절' }[x.status];
    },
    // 분석파트너가 프로젝트 찾기에서 직접 견적 작성 시작 (컨설턴트 요청 없이)
    apply: function (id, k) {
      var r = req(id);
      return put(id, function (s) {
        if (!s.P[k]) s.P[k] = { at: Date.now(), status: 'req', self: true };
        if (s.st === 'review') { s.st = 'quoting'; s.reqAt = Date.now(); s.due = s.due || r.to || iso(Date.now() + DAY * 14); }
      });
    },
    // 견적을 받을 수 있는 단계 (승인 후 ~ 클라이언트에게 전달 전)
    // 견적 모집 중: 승인 후 ~ 클라이언트가 견적을 확정하기 전 (견적을 전달한 뒤에도 계속 받음)
    open: function (id) { var s = state(id); return !!s.ok && s.st !== 'matched'; },
    // 의뢰 승인: 컨설턴트가 의뢰서를 확인하고 승인 → 프로젝트로 등록(게시)
    approve: function (id) { return put(id, function (s) { s.ok = Date.now(); }); },
    // 견적 요청 보내기 (추가 요청도 같은 함수)
    // 견적제안메일 발송 (컨설턴트 추천): msg는 프로젝트 링크와 함께 메일로 전달
    send: function (id, keys, due, msg) {
      var r = req(id);
      return put(id, function (s) {
        if (s.st === 'review') { s.st = 'quoting'; s.reqAt = Date.now(); s.due = s.due || due || r.to || iso(Date.now() + DAY * 14); }
        keys.forEach(function (k) {
          if (s.P[k]) return;
          var p = partner(k), x = { at: Date.now(), status: 'req', msg: msg || '' };
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
    // 전달은 여러 번 가능 (나중에 도착한 견적을 추가로 전달). sends: 전달 기록
    forward: function (id, keys, msg) {
      return put(id, function (s) {
        keys.forEach(function (k) { s.P[k].fwd = true; });
        s.sends = s.sends || (s.sentAt ? [{ at: s.sentAt, keys: Object.keys(s.P).filter(function (k) { return s.P[k].fwd && keys.indexOf(k) < 0; }), msg: s.msg }] : []);
        s.sends.push({ at: Date.now(), keys: keys, msg: msg });
        s.st = 'sent'; s.sentAt = s.sentAt || Date.now(); if (msg) s.msg = msg;
      });
    },
    // 클라이언트 선택 → 매칭 완료
    pick: function (id, k) { return put(id, function (s) { s.st = 'matched'; s.pick = k; s.pickAt = Date.now(); }); },
    // 의뢰 삭제: 기록을 남겨 컨설턴트·견적 요청받은 파트너에게 알림
    remove: function (id) {
      var d = db(), r = req(id), s = d.S[id];
      if (r) d.X.push({ id: id, title: r.title, org: r.org, at: Date.now(), keys: s ? Object.keys(s.P) : [] });
      delete d.S[id]; save(d);
    },
    // 계약서 등록 (컨설턴트): c = { client:{type:'form'|'file', name}, partner:{...} } → 분석 진행 단계로
    contract: function (id, c) { return put(id, function (s) { s.ct = { at: Date.now(), client: c.client, partner: c.partner }; }); },
    // 프로젝트 찾기에 게시된 의뢰 (컨설턴트 승인 후)
    posted: function () {
      var d = db().S;
      return requests().filter(function (r) { return d[r.id] && d[r.id].ok; }).map(function (r) { return { r: r, s: d[r.id] }; });
    },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem('op.alarmRead'); } catch (e) {} },
    // 클라이언트 단계
    clientStage: function (id) { var s = state(id); return s.ct ? '분석 진행' : F.CLIENT_ST[s.st]; },
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
        return { id: r.id, flow: true, ct: s.ct, svc: r.svc, stage: s.ct ? '분석' : '계약', title: r.title, client: r.org || '-', partner: partner(s.pick).org, samples: r.samples || '-', amount: man(total(q).net), contract: iso(s.ct ? s.ct.at : s.pickAt), due: r.due || iso(s.pickAt + DAY * 7 * (+q.weeks || 6)), at: s.pickAt, qa: 0 };
      });
    }
  };

  // 알림 (역할별) — 요구사항정의서 '20260210_내부프로세스_알림' 시트의 '마이페이지 > 알림 표시 텍스트' 기준
  // k: 알림구분 (시트 이름 그대로). 시트에 없는 알림(수정 요청·거절·미선정)은 견적 중개 흐름에 맞춰 추가한 것
  var josa = function (w, a, b) { var c = String(w).replace(/[^가-힣a-zA-Z0-9]+$/, '').slice(-1).charCodeAt(0); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };
  var won = function (n) { return Math.round(n).toLocaleString('ko-KR') + '원'; };
  var qname = function (x) { return ((x.revN || 0) + 1) + '차 견적서'; };
  F.josa = josa;
  F.alarms = function () {
    var ses = OP.session(); if (!ses) return [];
    var L = [], d = db().S, R = requests(), role = ses.role;
    R.forEach(function (r) {
      var s = d[r.id] || { st: 'review', P: {} }, nm = r.title || r.id, cl = r.org || '의뢰사';
      if (role === 'admin') {
        var href = 'mypage-request.html?id=' + encodeURIComponent(r.id);
        L.push({ id: 'f-new-' + r.id, k: '의뢰접수', cat: 'project', at: r.at, t: cl + '의 ' + nm + ' 의뢰서가 접수 되었습니다. 확인 후 승인처리 해주세요.', href: href });
        Object.keys(s.P).forEach(function (k) {
          var x = s.P[k], o = partner(k).org;
          if (x.subAt && x.quote) L.push({ id: 'f-sub-' + r.id + k + (x.revN || 0), k: '견적등록', cat: 'project', at: x.subAt, t: o + '의 ' + qname(x) + '가 등록되었습니다.', sub: '프로젝트명: ' + nm + ' · 견적금액: ' + won(total(x.quote).final), href: href });
          if (x.dec) L.push({ id: 'f-dec-' + r.id + k, k: '견적거절', cat: 'project', at: x.dec.at, t: josa(o, '이', '가') + ' ' + nm + ' 견적 요청을 거절했습니다.', sub: x.dec.why, href: href });
        });
        if (r.updatedAt) L.push({ id: 'f-ed-' + r.id + r.updatedAt, k: '의뢰수정', cat: 'project', at: r.updatedAt, t: cl + '의 ' + nm + ' 의뢰서가 수정되었습니다. 변경 내용을 확인해주세요.', href: href });
        if (s.pick) L.push({ id: 'f-pick-' + r.id, k: '견적확정', cat: 'project', at: s.pickAt, t: josa(cl, '이', '가') + ' ' + nm + ' 프로젝트의 최종 견적을 확정 했습니다.', sub: '공급사: ' + partner(s.pick).org + ' · 견적금액: ' + won(total(s.P[s.pick].quote).final), href: href });
      } else if (role === 'partner') {
        var x = s.P[ses.email]; if (!x) return;
        var qh = 'mypage-quote.html?rid=' + encodeURIComponent(r.id);
        if (r.updatedAt && r.updatedAt > x.at) L.push({ id: 'f-ed-' + r.id + r.updatedAt, k: '의뢰수정', cat: 'project', at: r.updatedAt, t: nm + ' 프로젝트의 의뢰 내용이 수정되었습니다. 견적서 작성 전 변경 내용을 확인해주세요.', href: qh });
        if (s.ct && s.pick === ses.email) L.push({ id: 'f-ct-' + r.id, k: '계약', cat: 'project', at: s.ct.at, t: nm + ' 프로젝트의 계약서 최종본이 등록되었습니다.', href: 'mypage-project.html?id=' + encodeURIComponent(r.id) });
        if (!x.self) L.push({ id: 'f-req-' + r.id, k: '견적제안', cat: 'project', at: x.at, t: nm + ' 프로젝트 검토 후 견적서를 작성해주세요.', sub: '견적 마감일: ' + (s.due ? s.due.replace(/-/g, '.') : '-'), href: qh });
        if (x.rev) L.push({ id: 'f-rev-' + r.id + x.revN, k: '견적수정요청', cat: 'project', at: x.rev.at, t: nm + ' 프로젝트 견적서의 수정을 요청드립니다.', sub: x.rev.note, href: qh });
        if (s.st === 'matched' && x.status === 'sub') L.push(s.pick === ses.email
          ? { id: 'f-win-' + r.id, k: '견적확정', cat: 'project', at: s.pickAt, t: nm + '의 견적이 최종 선정되었습니다.', sub: '견적서명: ' + qname(x) + ' · 견적금액: ' + won(total(x.quote).final), href: 'mypage-project.html?id=' + encodeURIComponent(r.id) }
          : { id: 'f-lose-' + r.id, k: '견적미선정', cat: 'project', at: s.pickAt, t: nm + '의 견적은 이번에 선정되지 않았습니다.', sub: '참여해주셔서 감사합니다.', href: qh });
      } else if (role === 'client' && (!r.demo || ses.email === 'client@omicspharm.test')) {
        var ph = 'mypage-project.html?id=' + encodeURIComponent(r.id);
        if (s.ct) L.push({ id: 'f-ct-' + r.id, k: '계약', cat: 'project', at: s.ct.at, t: nm + ' 프로젝트의 계약서 최종본이 등록되었습니다.', href: ph + '&tab=contract' });
        if (s.ok) L.push({ id: 'f-ok-' + r.id, k: '의뢰승인', cat: 'project', at: s.ok, t: '의뢰하신 ' + nm + ' 프로젝트가 승인되어 등록되었습니다.', href: ph });
        (s.sends || (s.sentAt ? [{ at: s.sentAt, keys: Object.keys(s.P).filter(function (k) { return s.P[k].fwd; }) }] : [])).forEach(function (e, i) {
          var A = e.keys.map(function (k) { return total(s.P[k].quote).final; });
          L.push({ id: 'f-arr-' + r.id + (i ? '-' + i : ''), k: '견적확인요청', cat: 'project', at: e.at, t: '의뢰하신 ' + nm + ' 프로젝트에 대한 ' + (i ? '추가 ' : '') + '견적서 ' + e.keys.length + '건을 확인해주세요. 견적 관련 문의사항은 Q&A게시판을 통해서 문의해 주세요.',
            sub: '견적금액: ' + (A.length > 1 ? won(Math.min.apply(0, A)) + ' ~ ' + won(Math.max.apply(0, A)) : won(A[0] || 0)), href: ph + '&tab=quote' });
        });
      }
    });
    // 삭제된 의뢰
    db().X.forEach(function (x) {
      if (role === 'admin') L.push({ id: 'f-del-' + x.id, k: '의뢰삭제', cat: 'project', at: x.at, t: (x.org || '의뢰사') + '의 ' + x.title + ' 의뢰가 삭제되었습니다.', sub: x.keys.length ? '견적을 요청한 분석파트너 ' + x.keys.length + '곳에도 알림이 전달되었습니다.' : '', href: 'mypage-request.html' });
      if (role === 'partner' && x.keys.indexOf(ses.email) > -1) L.push({ id: 'f-del-' + x.id, k: '의뢰삭제', cat: 'project', at: x.at, t: x.title + ' 프로젝트 의뢰가 취소되어 견적 요청이 종료되었습니다.', href: 'mypage-quote.html' });
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

  // ── 계약서 (셀키 분석서비스 의뢰서 기본 양식) ──
  // 회사 시험의뢰서(docx) 구성: 1. 의뢰자 정보 / 2. 시료 정보 / 3. 분석 서비스(의뢰한 서비스 항목만) / 분석 유형별 샘플 요구량 / 서명 / 별첨1. 분석 견적서
  // 기관 자체 시험의뢰서를 쓰는 경우에는 파일 업로드로 대신한다
  var Y = 1, N = 0;
  var FORM = {
    '단백체': { name: '단백체 분석 (Proteomics)', blocks: [
      { h: 'Untargeted protein analysis', items: [['정성분석', '단백질 리스트 및 GO analysis를 제공해 드립니다.', Y], ['정량분석', '정량분석은 heatmap, volcano plot, foldchange 값을 제공합니다.', Y], ['통계처리 (p-value, volcano plot 등)', '통계 처리를 통한 비교 분석을 원하면 동일한 그룹의 시료 3개 이상 필요합니다.', Y, '통계|그룹|차등|DEG'], ['PTM', 'acetylation, methylation, phosphorylation, glycosylation', N, 'PTM|인산화|phospho|glyco|당화']] },
      { h: 'Targeted protein analysis', target: 1, fields: ['Target protein name', 'Target peptide', '내부표준물 (stable-isotope labeled synthetic peptide)', '시료 내 예상되는 타겟 단백질 농도 (선택사항)'] }] },
    '대사체': { name: '대사체 분석 (Metabolomics)', blocks: [
      { h: 'Untargeted metabolite analysis', items: [['정성분석', '대사체 리스트를 제공해 드립니다.', Y], ['정량분석', '정량분석은 heatmap, volcano plot, foldchange 값을 제공합니다.', Y], ['통계처리 (p-value, volcano plot 등)', '통계 처리를 통한 비교 분석을 원하면 시료 3개 이상 반복 분석이 필요합니다.', Y, '통계|군|그룹']] },
      { h: 'Targeted metabolite analysis', target: 1, fields: ['Target metabolite name'] }] },
    '유전체': { name: '유전체 분석 (Genomics)', blocks: [
      { h: 'Whole Genome / Whole Exome / Targeted Sequencing', items: [['WGS (Whole Genome Sequencing)', '전장 유전체 분석(30× 또는 90×), 변이(Variant) 전체 탐지 목적', N, 'WGS|전장'], ['WES (Whole Exome Sequencing)', '코딩 영역(Exon) 기반 변이 분석, 희귀질환·암 패널 분석에 최적', N, 'WES|Exome|엑솜'], ['Targeted Gene Panel', '선정된 유전자 패널 기반 변이 분석(예: 암패널, 희귀질환패널 등)', N, '패널|Panel'], ['Low-pass WGS / CNV sequencing', '저커버리지 WGS 기반 Copy number variation 분석', N, 'Low-pass']] },
      { h: 'Library Preparation & Sequencing-Type Options', items: [['DNA Library preparation', '샘플 품질 QC 후 Library 제작', Y], ['PCR-free Library', 'Bias 최소화, 고품질 분석 목적', N, 'PCR-free'], ['Paired-end sequencing (PE150 등)', 'Illumina PE 기반 표준 시퀀싱 방식', Y], ['Long-read sequencing (PacBio / Oxford Nanopore)', '구조변이·길이 긴 영역 분석 (선택 사항)', N, 'Long-read|PacBio|Nanopore']] },
      { h: 'Variant Calling & Bioinformatics', items: [['Alignment (BWA-MEM 등)', 'Reference genome과 매핑된 BAM 제공', Y], ['Variant Calling (SNV/INDEL)', 'GATK 기반 변이 리스트(VCF) 제공', Y], ['CNV 분석', 'Copy number variation 분석', N, 'CNV'], ['SV 분석', '구조변이 (inversion, deletion, translocation)', N, 'SV|구조변이'], ['Annotation Report', 'ClinVar, dbSNP, gnomAD 기반 해석', Y], ['Filtering Options', 'Pathogenic / likely pathogenic / novel variant 분류', N, 'Filtering|pathogenic']] }] },
    '전사체': { name: '유전체 분석 (Genomics) — RNA analysis', blocks: [
      { h: 'RNA analysis', items: [['RNA-seq (mRNA profiling)', '전사체 기반 유전자 발현량 분석', Y], ['Small RNA-seq (miRNA 등)', 'miRNA, siRNA, piRNA 등 200 nt 이하 small RNA 발현 분석', N, 'miRNA|small RNA'], ['Transcript isoform 분석', 'long-read 이용 시 정확도 향상', N, 'isoform'], ['Differential expression(DGE) 분석', 'DESeq2 / edgeR 기반 DEG 리스트 제공', Y, 'DEG|차등'], ['Functional pathway 분석', 'GO, KEGG pathway 제공', N, 'GSEA|pathway|Pathway|경로']] }] },
    '바이오의약품': { name: '바이오의약품 특성분석 (Biopharmaceutical Characterization)', blocks: [
      { h: '', items: [['Intact Mass', '항체 및 ADC의 전체 분자량 확인', N, 'Intact'], ['Peptide mapping fingerprinting', '단백질의 아미노산 서열 및 변형 확인', N, 'Peptide mapping|펩타이드 매핑'], ['Full length sequencing', '항체의 전체 서열 확인', N, 'Full length'], ['N/C terminal determination', '단백질 N말단 및 C말단의 서열 확인', N, '말단|terminal'], ['Amino acid composition', '단백질의 아미노산 조성 분석', N, '아미노산 조성'], ['Extinction Coefficient', '단백질의 광학적 흡광도 계수 측정', N, 'Extinction'],
        ['Modification (Oxidation, deamidation)', '산화 및 탈아미드화 같은 화학적 변형 확인', N, '산화|Oxidation|deamidation'], ['Disulfide bond', '이황화 결합 위치와 상태 확인', N, 'Disulfide|이황화'], ['Free thiol', 'Free thiol 그룹 존재 여부 확인', N, 'thiol'], ['Monosaccharide composition', '단당류 구성 분석', N, '단당류'], ['Sialic acid composition', '시알산의 조성 및 함량 분석', N, '시알산|Sialic'], ['N-linked glycan profile', 'N-연결 당구조 분석', N, 'N-glycan|N-linked|glycan'], ['O-linked glycan profile', 'O-연결 당구조 분석', N, 'O-linked'],
        ['N-Glycosylation site', 'N-당화 위치 분석', N, 'N-Glycosylation'], ['O-Glycosylation site', 'O-당화 위치 분석', N, 'O-Glycosylation'], ['UV', '자외선 흡광도 분석', N, 'UV'], ['Fluorescence', '형광 특성 분석', N, 'Fluorescence|형광'], ['Circular dichroism', '단백질의 이차 구조 분석', N, 'dichroism|CD'], ['Differential Scanning Calorimetry', '단백질 열 안정성 분석', N, 'DSC|열 안정'], ['FT-IR', '단백질의 구조 분석', N, 'FT-IR'], ['Dynamic Light Scattering', '입자 크기 및 분포 분석', N, 'DLS|Light Scattering'], ['SEC-UPLC', '단백질의 분자량 분포 확인', N, 'SEC'],
        ['ADC - DAR (Drug-to-Antibody Ratio)', '약물 대 항체 비율 분석', N, 'DAR'], ['ADC - Total antibody', 'Peptide를 이용한 항체 정량 분석', N, 'Total antibody'], ['ADC - Antibody-drug conjugation', '항체와 연결된 drug (linker+payload) 분석', N, 'conjugation|payload'], ['ADC - Free payload', '비결합 약물의 존재 확인', N, 'Free payload']] }] }
  };
  var NEED = {
    '단백체·대사체': ['정제 단백질: 100 μg 이상', '혈액: 30 μL 이상', 'Cell: 1×10⁷ cells 이상', 'CM: 2 mL 이상', 'EV: 5×10⁹ particles 이상', '조직: protein 100 μg 이상'],
    '유전체': ['gDNA: 500 ng+ (≥20 ng/µL) 이상', '혈액(EDTA): 1–3 mL 이상', 'Cell: 1×10⁶ cells 이상', '조직: 10–20 mg 이상', 'FFPE: 3–5 sections', 'RNA: 100 ng+ (RIN≥7) 이상', 'Long-read DNA: 5–10 µg 이상'],
    '바이오의약품 특성분석': ['단백질의약품 시료: 1 mg 이상 (분석 항목에 따라 변동)']
  };
  var formKey = function (svc) { return ['단백체', '대사체', '유전체', '전사체', '바이오의약품'].filter(function (k) { return String(svc).indexOf(k) > -1; })[0] || ''; };
  var rowVal = function (r, re) { var v = ''; (r.sections || []).forEach(function (sec) { (sec.rows || []).forEach(function (x) { if (re.test(x[0])) v = v || x[1]; }); }); return v; };
  F.contractHTML = function (r, s, side) {
    var k = formKey(r.svc), f = FORM[k], text = [r.title, r.purpose].concat((r.sections || []).map(function (sec) { return (sec.rows || []).map(function (x) { return x.join(' '); }).join(' ') + (sec.note || ''); })).join(' ');
    var targeted = /표적|Target|타겟/i.test(text) && !/비표적|Untargeted/i.test(text);
    var yn = function (it) { return (it[3] && new RegExp(it[3], 'i').test(text)) || it[2] ? '<b class="y">유</b>' : '<span class="n">무</span>'; };
    var svcHTML = f ? f.blocks.map(function (b) {
      var on = f.blocks.length === 1 || (b.target ? targeted : !targeted) || k === '유전체';
      var head = b.h ? '<p class="blk-t">(' + (on ? 'o' : '&nbsp;&nbsp;') + ') ' + esc(b.h) + '</p>' : '';
      if (b.fields) return head + '<table class="kv2">' + b.fields.map(function (x, i) { return '<tr><th>' + esc(x) + '</th><td>' + (on && i === 0 ? esc(rowVal(r, /타겟|Target|대상/) || '-') : '-') + '</td></tr>'; }).join('') + '</table>';
      return head + '<table class="it2"><tr><th>항목</th><th style="width:56px">선택</th><th>설명</th></tr>' + b.items.map(function (it) { return '<tr><td>' + esc(it[0]) + '</td><td class="c">' + (on ? yn(it) : '<span class="n">-</span>') + '</td><td class="d">' + esc(it[1]) + '</td></tr>'; }).join('') + '</table>';
    }).join('') : '<table class="kv2">' + (r.sections || []).filter(function (x) { return x.rows; }).map(function (sec) { return sec.rows.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join(''); }).join('') + '</table>';
    var need = k === '바이오의약품' ? '바이오의약품 특성분석' : (k === '유전체' || k === '전사체') ? '유전체' : '단백체·대사체';
    var p = partner(s.pick), dt = new Date(s.ct ? s.ct.at : Date.now()), cl = side === 'client';
    var who = cl ? [r.manager || '-', r.org || '-', '-'] : ['셀키 컨설턴트', '셀키에이아이', '02-3482-2743'];
    return '<article class="doc cdoc">' +
      '<div class="c-brand">C E L L K E Y</div>' +
      '<p class="c-lead">최첨단 분석 플랫폼과 전문성을 바탕으로,<br>한 차원 높은 정밀성과 효율성을 갖춘 프리미엄 바이오 분석 서비스를 제공합니다.</p>' +
      '<table class="c-party"><tr><th>의뢰기관</th><td>' + esc(cl ? r.org || '-' : '셀키에이아이') + '</td><th>수행기관</th><td>' + esc(cl ? '셀키에이아이 (분석 수행: ' + p.org + ')' : p.org) + '</td></tr><tr><th>프로젝트</th><td colspan="3">' + esc(r.title) + ' (' + esc(r.id) + ')</td></tr></table>' +
      '<h2>1. 의뢰자 정보</h2><table class="kv2"><tr><th>담당자</th><td>' + esc(who[0]) + '</td></tr><tr><th>소속</th><td>' + esc(who[1]) + '</td></tr><tr><th>연락처</th><td>' + esc(who[2]) + '</td></tr></table>' +
      '<h2>2. 시료 정보</h2><table class="kv2"><tr><th>Taxonomy (Source)</th><td>' + esc(rowVal(r, /Taxonomy/) || '-') + '</td></tr><tr><th>종류</th><td>' + esc(rowVal(r, /종류/) || '-') + '</td></tr><tr><th>시료 수</th><td>' + esc(r.samples || '-') + '</td></tr><tr><th>분석목적</th><td>' + esc(r.purpose || '-') + '</td></tr></table>' +
      '<h2>3. 분석 서비스</h2><p class="svc-t">' + esc(f ? f.name : r.svc) + '</p>' + svcHTML +
      '<h2>분석 유형별 샘플 요구량</h2><div class="need"><b>' + need + '</b><ul>' + NEED[need].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<p class="c-sign-t">위와 같은 내용의 시험을 의뢰합니다.</p>' +
      '<p class="c-date">' + dt.getFullYear() + ' 년 &nbsp; ' + (dt.getMonth() + 1) + ' 월 &nbsp; ' + dt.getDate() + ' 일</p>' +
      '<p class="c-sign">의뢰 담당자: <b>' + esc(who[0]) + '</b> (서명)</p>' +
    '</article>';
  };
  // 계약서 보기: 기본 양식이면 의뢰서 + 별첨1 견적서, 업로드 파일이면 파일 안내
  F.showContract = function (r, s, side) {
    var c = s.ct && s.ct[side], q = s.P[s.pick].quote, label = side === 'client' ? '클라이언트 계약서' : '분석파트너 계약서';
    var body = !c || c.type === 'form'
      ? F.contractHTML(r, s, side) + '<p class="attach-t"># 별첨1. 분석 견적서</p>' + F.docHTML(r, q, s.pick)
      : '<article class="doc cdoc file"><div class="c-brand">C E L L K E Y</div><div class="fileph"><b>' + esc(c.name) + '</b><p>기관 자체 양식으로 업로드한 계약서입니다.<br>프로토타입에서는 파일 내용을 표시하지 않습니다.</p></div></article>';
    var pv = document.createElement('div');
    pv.className = 'pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', label);
    pv.innerHTML = '<div class="pv-bar"><b>' + label + ' · ' + esc(r.title) + '</b><div><button type="button" data-print>인쇄 · PDF 저장</button><button type="button" class="x" data-close>닫기</button></div></div><div class="pv-scroll">' + body + '</div>';
    var close = function () { pv.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    pv.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === pv) close(); else if (e.target.closest('[data-print]')) window.print(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(pv); document.body.style.overflow = 'hidden'; pv.querySelector('[data-close]').focus();
  };
  // 계약서 목록 (클라이언트·파트너·컨설턴트 화면 공통)
  F.contractListHTML = function (s, sides) {
    return '<div class="ctlist">' + sides.map(function (side) {
      var c = s.ct[side];
      return '<div class="ctrow2"><div><b>' + (side === 'client' ? '클라이언트 계약서' : '분석파트너 계약서') + '</b><span>' + (c.type === 'form' ? '셀키 분석서비스 의뢰서 (기본 양식) + 별첨 견적서' : esc(c.name)) + ' · 등록 ' + ymd(s.ct.at) + '</span></div><button type="button" class="btn" data-ct="' + side + '">계약서 보기</button></div>';
    }).join('') + '</div>';
  };

  OP.flow = F;
})();

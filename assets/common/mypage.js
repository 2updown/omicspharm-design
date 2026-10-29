/* 마이페이지 공통 — 로그인 확인, 왼쪽 프로필·메뉴, 데모 데이터(이 브라우저 localStorage 기준)
   메뉴: 대시보드 / 프로젝트(견적관리·프로젝트 관리) / 상담내역 / 프로젝트 문의내역 / 알림 / 회원정보(내 정보 관리, 분석파트너 +파트너 인증·분석 서비스 정보) / 관리(컨설턴트)
   컨설턴트의 프로젝트 관리는 mypage-request.html
   (기존 '분석결과 관리'는 프로젝트 상세의 '결과보고서' 탭으로 통합)
   사용: <aside class="side" data-op-side></aside> + var me = OP.mypage('dash'); */
// 마이페이지 기본 디자인 = 화이트 + 카드 없음 (2026-10-21 확정). 예전 회색+카드 디자인은 ?ui=gray 로 볼 수 있게 보관 (git 태그 mypage-gray-20261021)
// 모바일도 화이트 (2026-10-23). 화면 폭과 관계없이 붙여서 창 크기를 바꿔도 디자인이 그대로 (전에는 처음 열 때 폭으로만 정해서 모바일→PC로 늘리면 예전 디자인이 나왔음)
// 화이트로 확정 (2026-10-26). 비교용: 주소에 ?ui=gray가 있는 화면에서만 2026-10-21 이전 회색+카드 디자인 (다른 화면으로 가면 다시 화이트). git 태그 mypage-gray-20261021
var OP_UI_GRAY = /[?&]ui=gray\b/.test(location.search);
try { sessionStorage.removeItem('op.ui'); } catch (e) {} // 잠시 '계속 유지'로 했을 때 남은 값 정리
if (!OP_UI_GRAY && !/mypage-ai\.html/.test(location.pathname)) document.documentElement.classList.add('ui-white');
// 상단 (2026-10-23 시안 C를 기본으로): '마이페이지' 제목 줄 없앰 → 본문 맨 위에 메뉴 이름, 왼쪽 메뉴 아래에 AI Agent 카드·역할별 바로가기
// 예전 제목 줄 디자인은 ?head=a (Figma 1646:7138에 시안 A·B로 비교용)
if (!/[?&]head=a\b/.test(location.search) && document.documentElement.classList.contains('ui-white')) document.documentElement.classList.add('ui-headc');
// 메뉴 아이콘 (2026-10-23 기본 적용). 아이콘 없는 비교: ?micon=0 (마이페이지 안에서 이동해도 유지), 다시 켜기 ?micon=1
(function () { var m = /[?&]micon=([01])/.exec(location.search), off = false; try { if (m) sessionStorage.setItem('op.micon', m[1]); off = sessionStorage.getItem('op.micon') === '0'; } catch (e) {} if (!off) document.documentElement.classList.add('ui-micon'); })();
(function () {
  // [키, 이름, 주소, 보이는 유형(없으면 모두)]
  // admin = 컨설턴트(셀키): 당분간 분석파트너와 같은 화면 + 관리 메뉴 추가 (메뉴는 바뀌거나 통폐합될 수 있음)
  // [키, 이름, 주소, 보이는 유형(없으면 모두), 묶음]
  // 묶음별 드롭다운(기본 모두 펼침, 접으면 마이페이지 안에서는 계속 접힘). 보이는 메뉴가 1개뿐인 묶음은 묶음 없이 그 메뉴만 보임
  var MENU = [
    ['dash', '대시보드', 'mypage.html'],
    ['project', '프로젝트 관리', 'mypage-project.html', null, 'prj'], // 세 역할 모두 이 메뉴 하나 (2026-10-27: 분석파트너 견적관리를 합침, 견적 단계는 목록 안 단계로). 컨설턴트는 mypage-request.html
    ['consult', '상담내역', 'mypage-consult.html'], // 프로젝트와 무관한 상담: Contact Us(첫 문의부터 한 대화, consult.js). 실서비스 메뉴명과 같음. 챗봇(FAB)은 CS봇 그대로
    ['inquiry', '프로젝트 문의내역', 'mypage-inquiry.html'], // 2026-10-27: 프로젝트별 대화([문의하기]) + 의뢰할 때 연결한 '의뢰 전 상담'. 세 역할 같은 구조
    ['alarm', '알림', 'mypage-alarm.html'], // 알림은 묶지 않고 최상위에 (안 읽은 수가 항상 보이게)
    ['account', '내 정보 관리', 'mypage-account.html', null, 'me'],
    ['verify', '파트너 인증', 'mypage-verify.html', ['partner'], 'me'],
    ['service', '분석 서비스 정보', 'mypage-service.html', ['partner'], 'me'],
    ['clients', '클라이언트 관리', 'mypage-clients.html', ['admin'], 'mgmt'],
    ['partners', '분석파트너 관리', 'mypage-partners.html', ['admin'], 'mgmt'], // 파트너 인증 검토 (인증 완료 / 재제출 요청)
    ['admin', '관리자 페이지', '#', ['admin']], // 백오피스 연결은 나중에 (누르면 '준비 중' 안내만). 화면 예시는 admin.html에 따로 있음
    ['ai', 'AI Agent', 'mypage-ai.html'] // 맨 아래. 로그인 회원용 AI 에이전트 (beta, 2026-10-21 내부 미팅). 별도 화면(BioEOS, Figma 1665:7158). CS 챗봇(오른쪽 아래·문의하기)과는 별개
  ];
  var GROUP = { prj: '프로젝트', me: '회원정보', mgmt: '회원 관리' };
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
    answer: { at: new Date(2026, 8, 19, 10, 5).getTime(), body: '안녕하세요, OmicsPharm입니다.\n문의하신 조건(혈장 20개, 정량 단백체 분석)은 프로젝트로 등록하시면 OmicsPharm이 분석파트너 견적을 받아 정리해 드립니다.\n일반적으로 시료 수령 후 4~6주 정도 소요되며, 고농도 단백질 제거(depletion) 여부에 따라 비용이 달라집니다.' }
  };

  // 분석파트너 프로젝트 관리 예시: 셀키 매칭 후 계약된 프로젝트만 (계약 진행 중 → 분석 진행 중 → 보고서 등록 → 보고서 검토 → 프로젝트 완료)
  var P_STAGES = ['계약 진행 중', '분석 진행 중', '보고서 등록', '보고서 검토', '프로젝트 완료']; // 2026-10-26 시트 이름 (보고서 등록 = 결과를 올려 OmicsPharm 검토 중, 보고서 검토 = 클라이언트 확인 중)
  var PARTNER_DEMO = [
    { id: 'PRJ-2026-0037', svc: 'Glycoproteomics', stage: '계약 진행 중', title: '항체 의약품 N-glycan 당쇄 프로파일링', client: '그린셀바이오', samples: 6, amount: '920만원', contract: '2026-09-26', due: '2026-12-05', at: new Date(2026, 8, 26).getTime() },
    { id: 'PRJ-2026-0038', svc: 'Metabolomics', stage: '분석 진행 중', title: '대장암 환자 혈청 대사체 프로파일링', client: '해솔대학교 의과대학', samples: 48, amount: '1,850만원', contract: '2026-09-12', due: '2026-11-20', at: new Date(2026, 8, 12).getTime() },
    { id: 'PRJ-2026-0039', svc: 'Transcriptomics', stage: '분석 진행 중', title: '마우스 간 조직 RNA-seq 발현 차이 분석', client: '한결연구소', samples: 24, amount: '1,200만원', contract: '2026-08-04', due: '2026-10-10', at: new Date(2026, 7, 4).getTime() },
    { id: 'PRJ-2026-0040', svc: 'Olink', stage: '보고서 등록', title: '혈장 Olink Target 96 염증 패널 분석', client: '한마음병원', samples: 80, amount: '2,400만원', contract: '2026-07-21', due: '2026-09-30', at: new Date(2026, 6, 21).getTime() },
    { id: 'PRJ-2026-0041', svc: 'Genomics', stage: '보고서 검토', title: '세포주 전장 유전체 변이 분석 (WGS)', client: '다인제약', samples: 12, amount: '1,560만원', contract: '2026-07-02', due: '2026-09-15', at: new Date(2026, 6, 2).getTime() },
    { id: 'PRJ-2026-0042', svc: 'Proteomics', stage: '프로젝트 완료', title: '인슐린 유사체 LC-MS 펩타이드 매핑', client: '소담바이오로직스', samples: 4, amount: '680만원', contract: '2026-05-18', due: '2026-07-31', at: new Date(2026, 4, 18).getTime(), review: 1 }
  ];

  // 의뢰 번호가 바뀌면 그 의뢰의 견적 중개 기록(op.flow)과 다시 올린 사업자등록증 파일도 새 번호로 옮김
  function renumber(a, b) {
    var f = read('op.flow', null);
    if (f && f.S && f.S[a]) { f.S[b] = f.S[a]; delete f.S[a]; write('op.flow', f); }
    if (window.OP && OP.files) OP.files.get('biz:req:' + a).then(function (x) { if (x) OP.files.put('biz:req:' + b, x).then(function () { OP.files.del('biz:req:' + a); }); });
  }

  var D = {
    // 예시 프로젝트의 영문 서비스명 → 의뢰 폼과 같은 한글 서비스명 (클라이언트 화면과 같은 배지)
    svcKo: function (v) { return { Proteomics: '단백체 분석', Glycoproteomics: '단백체 분석', Metabolomics: '대사체 분석', Genomics: '유전체 분석', Transcriptomics: '전사체 분석', Olink: 'Olink 분석' }[v] || v; },
    P_STAGES: P_STAGES,
    // 분석파트너도 컨설턴트와 같은 실제 단계 이름으로 표시 (예전: 보고서 검토·승인을 '보고서 등록'에 묶고 '확인 대기' 배지)
    // 2026-10-28: 분석파트너는 보고서 등록(OmicsPharm 검토)·보고서 검토(클라이언트 확인)를 '보고서 검토' 한 단계로. 컨설턴트는 그대로 두 단계
    P4: ['계약 진행 중', '분석 진행 중', '보고서 검토', '프로젝트 완료'],
    pStage: function (p) { return p.stage === '보고서 등록' ? '보고서 검토' : p.stage; },
    pWaiting: function () { return false; },
    // 인증 분석파트너·컨설턴트만 (미인증은 매칭·계약된 프로젝트가 없음). 견적 중개로 매칭된 프로젝트(계약 단계)가 앞에 붙는다
    partnerProjects: function () {
      var s = OP.session(); if (!s || !(s.role === 'admin' || OP.partnerVerified())) return [];
      var M = OP.flow ? OP.flow.matched(s.role === 'admin' ? null : s.email) : [];
      // 예시 프로젝트도 분석파트너가 결과를 올리면 '보고서 등록'으로 (2026-10-27, 새로고침하면 예시 초기화)
      return M.concat(PARTNER_DEMO.map(function (p) { var raw = OP.flow && (OP.flow.state(p.id).raw || []).length; return raw && p.stage === '분석 진행 중' ? Object.assign({}, p, { stage: '보고서 등록' }) : p; }));
    },
    esc: esc, ymd: ymd, ymdhm: ymdhm,
    // 이전 양식(V4 입력 기준 이전)으로 제출된 의뢰는 정리하고 V4 양식 의뢰만 보여줌
    projects: function () {
      var L = read('op.submitted', []), V = L.filter(function (p) { return p.ver === 4; }), changed = V.length !== L.length;
      // 예전 번호(REQ-…)나 예시와 겹치는 번호(0047 이하)로 제출된 의뢰는 예시(0047까지) 다음 번호로 바꿈
      var re = /^PRJ-\d{4}-(\d+)$/, max = 47, ok = function (p) { var m = re.exec(p.id || ''); return m && +m[1] > 47; };
      V.forEach(function (p) { if (ok(p)) max = Math.max(max, +re.exec(p.id)[1]); });
      V.slice().sort(function (a, b) { return a.at - b.at; }).forEach(function (p) {
        if (ok(p)) return;
        var old = p.id; p.id = 'PRJ-' + new Date(p.at || Date.now()).getFullYear() + '-' + ('000' + (++max)).slice(-4);
        renumber(old, p.id); changed = true;
      });
      if (changed) write('op.submitted', V);
      // 분석 서비스 없이 저장된 예전 테스트 의뢰는 숨김 (실제로는 서비스 선택이 필수라 제출될 수 없음, 2026-10-22). 저장 기록은 지우지 않음
      return V.filter(function (p) { return p.svc && p.svc !== '분석 서비스 미선택'; });
    },
    // 로그인한 계정이 보낸 문의만 (+ 클라이언트에게는 답변 완료 예시 1건)
    inquiries: function () {
      var s = OP.session() || {};
      return read('op.inquiries', []).filter(function (q) { return (q.owner || String(q.email || '').toLowerCase()) === s.email; })
        .concat(s.role === 'client' ? [DEMO_INQ] : []);
    },
    // 알림은 이 브라우저의 의뢰·문의 기록으로 만든다
    // 프로젝트: 클라이언트는 자기가 의뢰한 것. 분석파트너는 셀키(관리자)가 견적 요청을 보낸 의뢰만 볼 수 있다 (아직 데이터 없음)
    // 클라이언트 데모 계정은 예시 의뢰(견적 중개 단계별)도 함께 본다
    myProjects: function () {
      var s = OP.session(); if (!s || s.role !== 'client') return [];
      return OP.flow ? OP.flow.requests().filter(function (r) { return (!r.demo || (r.owner || 'client@omicspharm.test') === s.email) && !OP.flow.state(r.id).cancel; }) : D.projects(); // 삭제한 프로젝트는 클라이언트 목록에서 사라짐
    },
    alarms: function () {
      var readIds = read('op.alarmRead', []), L = [];
      // 프로젝트 알림은 요구사항정의서 '20260210_내부프로세스_알림' 기준 (의뢰~견적 단계는 flow.js, 계약 이후는 아래 예시 프로젝트)
      // 의뢰접수 알림은 컨설턴트에게만 간다 (의뢰사는 '의뢰승인' 알림부터 받음)
      D.inquiries().forEach(function (q) {
        if (q.answer) L.push({ id: 'a-' + q.id, k: '문의 답변', pj: q.title, cat: 'inquiry', at: q.answer.at, t: "'" + q.title + "' 문의에 답변이 등록되었습니다.", href: 'mypage-consult.html?q=' + q.id });
        L.push({ id: 'q-' + q.id, k: '문의 접수', pj: q.title, cat: 'inquiry', at: q.at, t: "'" + q.title + "' 문의가 접수되었습니다.", href: 'mypage-consult.html?q=' + q.id });
      });
      // 계약 이후 단계 (예시 프로젝트, 공급사 = 세움분석센터)
      var ses = OP.session() || {}, adm = ses.role === 'admin', PS = P_STAGES;
      // 상담 (consult.js): 컨설턴트 = 새 상담·추가 메시지, 회원 = 컨설턴트 답변
      if (OP.consult) (adm ? OP.consult.all() : OP.consult.mine()).forEach(function (c) {
        var h = 'mypage-consult.html?id=' + encodeURIComponent(c.id);
        c.msgs.forEach(function (m, i) {
          var pjc = OP.consult.isProj(c), w = pjc ? '프로젝트 문의' : '상담', mk = pjc ? 'inquiry' : 'consult'; // 프로젝트 문의는 '프로젝트 문의' 알림으로
          if (adm && m.by === 'user') L.push({ id: 'cs-' + c.id + '-' + i, k: i ? w + ' 추가 문의' : w + ' 접수', pj: c.title, cat: 'inquiry', at: m.at, t: c.name + '님의 ' + (i ? "'" + c.title + "' " + w + "에 추가 문의가 등록되었습니다." : w + " '" + c.title + "'이(가) 접수되었습니다."), href: h, mk: mk });
          if (!adm && m.by === 'admin') L.push({ id: 'cs-' + c.id + '-' + i, k: w + ' 답변', pj: c.title, cat: 'inquiry', at: m.at, t: "'" + c.title + "' " + w + "에 OmicsPharm 컨설턴트의 답변이 등록되었습니다.", href: h, mk: mk });
        });
      });
      var J = function (w, a, b) { return OP.flow ? OP.flow.josa(w, a, b) : w + a; };
      D.partnerProjects().forEach(function (p) {
        if (p.flow) return; // 견적 중개로 매칭된 프로젝트 알림은 flow.js
        var n0 = L.length;
        var i = PS.indexOf(p.stage), h = 'mypage-project.html?id=' + p.id, c0 = new Date(p.contract).getTime();
        if (!adm && i === 0) L.push({ id: 'ct-' + p.id, k: '견적확정', cat: 'project', at: p.at, t: p.title + '의 견적이 최종 선정되었습니다.', sub: '견적금액: ' + p.amount, href: h });
        if (!adm && i >= 1) L.push({ id: 'cf-' + p.id, k: '계약', cat: 'project', at: c0 + 864e5 * 3, t: p.title + ' 프로젝트의 계약서 최종본이 등록되었습니다.', href: h });
        if (adm && i >= 2) L.push({ id: 'rr-' + p.id, k: '보고서 등록', cat: 'project', at: c0 + 864e5 * 40, t: J('세움분석센터', '이', '가') + ' ' + p.title + ' 프로젝트의 분석 결과 보고서를 등록 했습니다.', href: h });
        if (adm && i === 4) L.push({ id: 'ra-' + p.id, k: '보고서 최종 확인', cat: 'project', at: c0 + 864e5 * 55, t: p.client + '의 ' + p.title + ' 프로젝트 결과보고서가 최종 승인 처리 되었습니다.', href: h });
        if (!adm && i === 4) L.push({ id: 'rf-' + p.id, k: '보고서 최종 확인', cat: 'project', at: c0 + 864e5 * 55, t: p.title + ' 프로젝트의 결과보고서가 최종 확인 처리 되었습니다.', sub: p.title + ' 프로젝트가 최종 완료 처리 되었습니다.', href: h });
        for (var i0 = n0; i0 < L.length; i0++) L[i0].pj = p.title;
      });
      // 파트너 인증 결과 (분석파트너): 재제출 요청 / 인증 완료
      if (ses.role === 'partner') {
        var pa = OP.account(ses.email) || {};
        if (pa.bizAsk && !pa.verified) L.push({ id: 'pv-ask-' + pa.bizAsk.at, k: '사업자등록증재제출요청', cat: 'project', at: pa.bizAsk.at, t: '파트너 인증을 위해 사업자등록증을 다시 제출해주세요.', sub: '사유: ' + pa.bizAsk.note, href: 'mypage-verify.html' });
        var sa = OP.flow && OP.flow.svcAsked(ses.email);
        if (sa) L.push({ id: 'svc-ask-' + sa, k: '분석서비스정보요청', cat: 'project', at: sa, t: '분석 서비스 정보를 입력해주세요.', sub: '견적 확인과 프로젝트 매칭에 활용됩니다. 회원정보 > 분석 서비스 정보에서 입력할 수 있습니다.', href: 'mypage-service.html' });
        if (OP.partnerVerified() && pa.bizOkAt) L.push({ id: 'pv-ok-' + pa.bizOkAt, k: '파트너인증', cat: 'project', at: pa.bizOkAt, t: '파트너 인증이 완료되었습니다. 견적서 작성과 비공개 프로젝트 열람이 가능합니다.', href: 'mypage-verify.html' });
      }
      // 파트너 인증 검토 요청 (컨설턴트): 분석파트너가 '검토 중'에 들어갈 때 (사업자등록증 저장 · 메일 인증 완료 · 재제출)
      if (adm && OP.flow) {
        var PR = {}; try { PR = JSON.parse(localStorage.getItem('op.partnerReview') || '{}'); } catch (e) {}
        OP.flow.PARTNERS.forEach(function (p) {
          var h = 'mypage-partners.html?key=' + encodeURIComponent(p.key), at, re = false, org = p.org;
          if (p.login) { // 로그인 가능한 데모 분석파트너: 계정 값 기준
            var a = OP.account(p.key) || {};
            if (a.verified || a.bizAsk || !a.bizDoc || a.mailOk === false) return;
            at = Math.max(a.bizAt || 0, a.mailOkAt || 0) || new Date(2026, 9, 8).getTime(); re = !!a.bizReAt && a.bizReAt === a.bizAt; org = a.org || org;
          } else { // 가상 파트너: 미인증(새봄랩)은 검토 중으로 시작
            if (p.verified || (PR[p.key] && PR[p.key].st && PR[p.key].st !== 'review')) return;
            at = new Date(2026, 9, 8, 10, 0).getTime();
          }
          L.push({ id: 'pv-rv-' + p.key + '-' + at, k: re ? '사업자등록증재제출' : '파트너인증요청', cat: 'project', at: at,
            t: re ? J(org, '이', '가') + ' 사업자등록증을 다시 제출했습니다. 확인 후 인증 처리해주세요.' : J(org, '이', '가') + ' 파트너 인증을 요청했습니다. 사업자등록증을 확인해주세요.', href: h });
        });
      }
      if (OP.flow) L = L.concat(OP.flow.alarms());
      L.push({ id: 'n-21', cat: 'notice', at: new Date(2026, 8, 28, 9, 0).getTime(), t: '[공지] OmicsPharm 서비스 리뉴얼 오픈 안내', href: 'notice-view.html?id=21&r=2' });
      L.push({ id: 'n-20', cat: 'notice', at: new Date(2026, 8, 15, 9, 0).getTime(), t: '[공지] 개인정보처리방침 변경 안내', href: 'notice-view.html?id=20&r=2' });
      L.push({ id: 'w', cat: 'notice', at: new Date(2026, 8, 1, 9, 0).getTime(), t: 'OmicsPharm 회원이 되신 것을 환영합니다.', sub: '이용방법에서 프로젝트 의뢰부터 결과 수령까지의 과정을 확인해보세요.', href: 'guide.html' });
      L.sort(function (a, b) { return b.at - a.at; });
      L.forEach(function (a) { a.read = readIds.indexOf(a.id) > -1; });
      return L;
    },
    markRead: function (ids) { var r = read('op.alarmRead', []); ids.forEach(function (i) { if (r.indexOf(i) < 0) r.push(i); }); write('op.alarmRead', r); if (OP.syncBell) OP.syncBell(); },
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
  D.removeProject = function (id) { if (OP.flow) OP.flow.remove(id); write('op.submitted', D.projects().filter(function (p) { return p.id !== id; })); };

  // 프로젝트 상세 [문의하기]: 세 계정 모두 제목 줄 오른쪽. 누르면 마이페이지 > 상담내역의 이 프로젝트 대화로 (site.js, 챗봇과 무관 · 2026-10-22)
  // ctx = { key: 프로젝트 번호, cat: 분석 서비스, no: 프로젝트 번호, title }. 컨설턴트는 이 프로젝트의 상담 목록으로
  OP.askBtn = function (ctx) { OP.chatCtx = ctx; return '<button type="button" class="btn op-ask" data-chat><img src="assets/project/ic-chat-circle-dots.svg" alt="">문의하기</button>'; };
  OP.my = D;
  // AI Agent 띄우기 (2026-10-21: 전체 화면 페이지보다 지금 화면 위에 띄우는 쪽으로). 내용은 mypage-ai.html을 그대로 iframe으로
  OP.openAI = function (mode, opts) {
    // 2026-10-26 D안(inline = 마이페이지 본문 칸) 확정. overlay·under·panel은 ?ai= 비교용
    var WANT = mode || ((location.search.match(/[?&]ai=(overlay|panel|under|inline)\b/) || [])[1] || 'inline');
    if (document.querySelector('.op-ai')) return;
    var side0 = document.querySelector('.side'), aiBtn = document.querySelector('.side-ai'), onA = null;
    var FULL = /[?&]aifit=full\b/.test(location.search) || !!(opts && opts.full); // 넓게 보기(작업 모드): 본문 칸 대신 왼쪽 메뉴 오른쪽 ~ 화면 끝
    var AV = ((document.querySelector('script[src*="mypage.js"]') || {}).src || '').split('v=')[1] || ''; // 아이콘 파일도 화면 버전으로 (예전 파일 캐시 방지)
    var w = document.createElement('div');
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'AI Agent');
    w.innerHTML = '<div class="op-ai-dim" data-ai-close></div><div class="op-ai-win">' +
      (WANT === 'inline' ? '<button type="button" class="op-ai-fit" aria-label="넓게 보기" title="넓게 보기"><img class="o" src="assets/common/menu/expand_content.svg?v=' + AV + '" alt=""><img class="i" src="assets/common/menu/collapse_content.svg?v=' + AV + '" alt=""></button>' : '') +
      '<button type="button" class="op-ai-x" data-ai-close aria-label="닫기"></button><iframe src="mypage-ai.html?embed=' + WANT + '&v=' + Date.now() + '" title="AI Agent"></iframe></div>';
    var KEEP = 'op.aiOpen', keep = function (on) { try { if (on) sessionStorage.setItem(KEEP, JSON.stringify({ p: location.pathname, m: WANT, full: FULL })); else sessionStorage.removeItem(KEEP); } catch (e) {} }; // 새로고침해도 열린 채로 (같은 화면일 때만)
    var close = function () { keep(false); w.remove(); document.body.style.overflow = ''; document.body.classList.remove('op-ai-open', 'op-ai-inline'); document.removeEventListener('keydown', key); window.removeEventListener('message', msg); window.removeEventListener('resize', place);
      if (aiBtn) aiBtn.classList.remove('on'); if (onA) onA.classList.add('on'); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    var msg = function (e) { if (e.data === 'op-ai-close') close(); else if (e.data === 'op-ai-drawer-on' || e.data === 'op-ai-drawer-off') w.classList.toggle('drawer', e.data === 'op-ai-drawer-on'); };
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-ai-close]')) { close(); return; }
      var fb = e.target.closest('.op-ai-fit'); if (fb) { FULL = !FULL; place(); keep(true); }
    });
    document.addEventListener('keydown', key); window.addEventListener('message', msg);
    // 자리 잡기 (창 크기가 바뀔 때마다 다시):
    // - inline: 왼쪽 메뉴가 보이는 폭이면 본문 칸(1320 컨테이너 안 .main)에 맞춘 박스, 위 = AI 버튼 줄. 넓게 보기면 메뉴 오른쪽 ~ 화면 끝
    //           왼쪽 메뉴가 없는 폭(모바일·태블릿, 960 이하)이면 전체 화면 (창을 줄여도 바로 전환, 다시 넓히면 박스로)
    // - under: GNB 아래부터
    var place = function () {
      var mode = WANT, g = document.querySelector('.op-gnb, header'), gb = g ? Math.round(g.getBoundingClientRect().bottom) : 70;
      var sr = side0 && side0.getBoundingClientRect(), small = !sr || !sr.width;
      if (WANT === 'inline' && small) mode = 'overlay';
      w.className = 'op-ai ' + mode + (mode === 'inline' && FULL ? ' full' : '') + (w.classList.contains('drawer') ? ' drawer' : '');
      w.style.top = w.style.left = w.style.right = '';
      document.body.classList.toggle('op-ai-inline', mode === 'inline');
      if (aiBtn) aiBtn.classList.toggle('on', mode === 'inline');
      var fb = w.querySelector('.op-ai-fit'); if (fb) { fb.setAttribute('aria-label', FULL ? '기본 크기로' : '넓게 보기'); fb.title = FULL ? '기본 크기로' : '넓게 보기'; }
      if (mode === 'under') w.style.top = gb + 'px';
      if (mode === 'inline' && FULL) { w.style.top = gb + 'px'; w.style.left = Math.round(sr.right + 24) + 'px'; }
      else if (mode === 'inline') { var m = document.querySelector('.main').getBoundingClientRect(); w.style.left = Math.round(m.left) + 'px'; w.style.right = Math.round(document.documentElement.clientWidth - m.right) + 'px'; w.style.top = Math.round(sr.top) + 'px'; }
    };
    if (WANT === 'inline') { window.scrollTo(0, 0); onA = document.querySelector('.side .menu a.on'); if (onA) onA.classList.remove('on'); }
    place(); if (WANT === 'inline' || WANT === 'under') { window.addEventListener('resize', place); setTimeout(place, 700); } // 700: 화면 등장 효과가 끝난 뒤 자리 다시 맞춤
    keep(true);
    document.body.appendChild(w); if (WANT !== 'panel') document.body.style.overflow = 'hidden'; document.body.classList.add('op-ai-open'); // 열려 있는 동안 오른쪽 아래 챗봇 버튼 숨김
    w.querySelector('.op-ai-x').focus();
  };
  OP.mypage = function (key) {
    var s = OP.session();
    if (!s) { location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return null; }
    var acc = OP.account(s.email) || {};
    var name = acc.name || s.email.split('@')[0];
    var org = acc.org || (D.projects()[0] || {}).org || '';
    var side = document.querySelector('[data-op-side]');
    // 화이트 시안: '마이페이지' 제목 오른쪽 = 역할별 바로가기 + AI Agent 입구 (이름·인증 상태는 GNB 프로필 드롭다운에서)
    var ph0 = document.querySelector('.ui-white .page-head .in');
    var HC = document.documentElement.classList.contains('ui-headc');
    if (ph0 && side && !ph0.querySelector('.ph-acts') && !HC) {
      var main = s.role === 'client' ? '<a class="pbtn pri" href="omicspharm-register.html">프로젝트 의뢰하기</a>'
        : s.role === 'partner' ? (OP.partnerVerified() ? '<a class="pbtn pri" href="projects.html">프로젝트 찾기</a>' : '<a class="pbtn pri" href="mypage-verify.html">파트너 인증하기</a>')
        : (function () { var n = OP.flow ? OP.flow.requests().filter(function (r) { var x = OP.flow.state(r.id); return x.st === 'review' && !x.ok; }).length : 0; return '<a class="pbtn pri" href="mypage-request.html' + (n ? '?stage=' + encodeURIComponent('의뢰접수') : '') + '">' + (n ? '의뢰 접수 ' + n + '건 확인' : '프로젝트 관리') + '</a>'; })();
      ph0.insertAdjacentHTML('beforeend', '<div class="ph-acts"><button type="button" class="pbtn ai" data-ph-ai><img src="assets/common/ic-sparkle-fill.svg" alt="">AI Agent에게 물어보기<span class="beta">beta</span></button>' + main + '</div>');
      ph0.querySelector('[data-ph-ai]').addEventListener('click', function () { OP.openAI(); });
    }
    if (side) {
      var n = D.unread();
      // 새 소식 'N' 배지 (Figma badge_number new 605:41276): 안 읽은 알림이 가리키는 메뉴 옆에 표시. 알림은 안 읽은 게 하나라도 있으면
      // 견적관리·프로젝트 관리·문의내역은 그 메뉴에 들어가면 배지가 사라짐 (알림 목록의 읽음 상태와는 따로 op.menuSeen에 기록)
      var NEW = { alarm: n > 0 }, NB = '<span class="nb" aria-label="새 소식">N</span>';
      var seen = read('op.menuSeen', []), seenAdd = [];
      var menuOf = function (h) { return /mypage-(project|request|quote)/.test(h) ? 'project' : /mypage-inquiry/.test(h) ? 'inquiry' : /mypage-consult/.test(h) ? 'consult' : /mypage-service/.test(h) ? 'service' : /mypage-partners/.test(h) ? 'partners' : ''; }; // service: 컨설턴트의 분석 서비스 정보 입력 요청
      D.alarms().forEach(function (a) {
        if (a.read || !a.href || seen.indexOf(a.id) > -1) return;
        var mk = a.mk || menuOf(a.href); if (!mk) return;
        if (mk === key) seenAdd.push(a.id); else NEW[mk] = 1;
      });
      if (seenAdd.length) write('op.menuSeen', seen.concat(seenAdd));
      var link = function (m) {
        var on = m[0] === key, label = m[1];
        var href = m[0] === 'project' && s.role === 'admin' ? 'mypage-request.html' : m[2];
        return '<a href="' + href + '"' + (m[2] === '#' ? ' data-soon="' + label + '"' : '') + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + (on ? ' class="on" aria-current="page"' : '') + '>' + label + (m[0] === 'ai' ? '<span class="beta">beta</span>' : '') +
          (NEW[m[0]] ? NB : '') + '</a>';
      };
      // 접은 묶음: 마이페이지 안에서 이동하는 동안만 유지 (계정 전환·마이페이지 밖으로 나가면 site.js가 지워서 다시 모두 펼침)
      var fold = {}; try { fold = JSON.parse(sessionStorage.getItem('op.menuFold') || '{}'); } catch (e) {}
      var mine = MENU.filter(function (m) { return !m[3] || m[3].indexOf(s.role) > -1; }), done = {}, html = '';
      mine.forEach(function (m) {
        var g = m[4];
        if (!g) { html += link(m); return; }
        if (done[g]) return; done[g] = 1;
        var L = mine.filter(function (x) { return x[4] === g; });
        if (L.length === 1) { html += link(L[0]); return; }
        var shut = !!fold[g];
        html += '<div class="grp' + (shut ? '' : ' open') + '" data-g="' + g + '"><button type="button" class="gh" aria-expanded="' + !shut + '">' + GROUP[g] + (shut && L.some(function (x) { return NEW[x[0]]; }) ? NB : '') + '<i aria-hidden="true"></i></button>' +
          '<div class="sub">' + L.map(link).join('') + '</div></div>';
      });
      side.innerHTML =
        '<div class="me"><img src="' + esc(acc.photo || 'assets/main/user-icon.svg?v=2') + '" alt="">' +
          '<span class="roles"><span class="role">' + esc(OP.ROLE_LABEL[s.role] || '') + '</span>' +
            // 메일 인증 전: '메일 미인증'만 (분석파트너 기관 인증은 메일 인증 다음 단계), 메일 인증 후: 분석파트너만 기관 인증 여부
            (!OP.mailVerified() && s.role !== 'admin' ? '<span class="op-vchip">메일 미인증</span>' : s.role === 'partner' ? '<span class="op-vchip' + (OP.partnerVerified() ? ' ok">인증' : '">미인증') + '</span>' : '') + '</span>' +
          '<b>' + esc(name) + ' 님</b><span>(' + esc(s.email) + ')</span>' + (org ? '<span>' + esc(org) + '</span>' : '') + '</div>' +
        (HC ? '<button type="button" class="side-ai" data-ph-ai><img src="assets/common/ic-sparkle-fill.svg" alt=""><span><b>AI Agent</b><em>beta</em></span></button>' : '') + '<nav class="menu" aria-label="마이페이지 메뉴">' + html + '</nav>'; // AI Agent 버튼은 메뉴 위 (2026-10-23, 정식 진입점) · // 이름은 'AI Agent' (사이드 폭에 맞춰 2026-10-24 줄임) · 메뉴 → AI Agent (역할별 바로가기 버튼은 2026-10-23 뺌 — 클라이언트만 필요해서)
      if (HC) {
        // 본문 맨 위에 지금 메뉴 이름을 큰 제목으로 (간격은 조정 예정)
        var lab = document.body.dataset.mtitle || (MENU.filter(function (m) { return m[0] === key; })[0] || [])[1] || '마이페이지', mn = document.querySelector('.main'); // data-mtitle: 메뉴 이름과 다른 화면 제목 (예: 회원 탈퇴)
        if (mn && !mn.querySelector('.mtitle') && (key !== 'dash' || /[?&]dtitle=1\b/.test(location.search))) { // 대시보드는 제목 없이 (2026-10-23). ?dtitle=1 이면 비교용으로 제목 표시
          mn.insertAdjacentHTML('afterbegin', '<h1 class="mtitle">' + esc(lab) + '</h1>');
          // 첫 제목 글자만 겹치면 그 글자만 지우고 옆의 칩·버튼은 남김 (예: 상담내역)
          setTimeout(function () {
            var h = mn.querySelector('.card .card-head h3'), t = h && h.firstChild;
            if (!t || t.nodeType !== 3 || t.nodeValue.trim() !== lab) return;
            var head = h.closest('.card-head');
            if (h.childNodes.length === 1 && head.children.length === 1) { head.classList.add('dup'); return; }
            // 칩·개수(인증 상태, 서비스 개수 등)는 큰 제목 옆으로 옮기고, 남는 게 없으면 원래 제목 줄은 숨김 (버튼이 있으면 줄은 남김)
            t.nodeValue = ''; var mt = mn.querySelector('.mtitle');
            while (h.firstChild) { if (h.firstChild.nodeType === 1) mt.appendChild(h.firstChild); else h.removeChild(h.firstChild); }
            if (head.children.length === 1) head.classList.add('dup');
          }, 0);
        }
        var ai0 = side.querySelector('.side-ai'); if (ai0) ai0.addEventListener('click', function () { OP.openAI(); });
        // hover 테두리 키프레임 (2026-10-26): 둘레를 같은 간격으로 48번 나눈 지점마다 '버튼 가운데에서 본 각도'를 키프레임으로 → conic-gradient가 둘레를 같은 속도로 돎
        if (ai0) {
          var flow = function () {
            var W = ai0.offsetWidth, H = ai0.offsetHeight; if (!W || !H) return;
            var P = 2 * (W + H), K = 48, prev = null, off = 0, kf = '';
            for (var n = 0; n <= K; n++) {
              var d = (P * n / K + W / 2) % P, x, y; // 위 가운데에서 시작해 시계 방향
              if (d < W) { x = d; y = 0; } else if (d < W + H) { x = W; y = d - W; } else if (d < 2 * W + H) { x = W - (d - W - H); y = H; } else { x = 0; y = H - (d - 2 * W - H); }
              var a = Math.atan2(x - W / 2, H / 2 - y) * 180 / Math.PI; if (prev !== null && a + off < prev - 180) off += 360; a += off; prev = a;
              kf += (n * 100 / K).toFixed(3) + '%{--ai-angle:' + a.toFixed(2) + 'deg}';
            }
            var st = document.getElementById('aiFlowKF'); if (!st) { st = document.createElement('style'); st.id = 'aiFlowKF'; document.head.appendChild(st); }
            st.textContent = '@keyframes aiFlow{' + kf + '}';
          };
          flow(); if (window.ResizeObserver) new ResizeObserver(flow).observe(ai0);
        }
      }
      if (!side.dataset.bound) {
        side.dataset.bound = 1;
        side.addEventListener('click', function (e) {
          // AI Agent: 페이지 이동 대신 지금 화면 위에 띄움 (기본 = 화면 전체 덮는 창 + 오른쪽 위 X, ?ai=panel = 오른쪽 패널). 모바일 탭은 전체 화면 페이지로 이동
          var ai = e.target.closest('a[href="mypage-ai.html"]'); if (ai && !e.metaKey && !e.ctrlKey) { e.preventDefault(); OP.openAI(); return; }
          var b = e.target.closest('.gh'); if (!b) return;
          var g = b.parentNode, open = !g.classList.contains('open');
          g.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
          try { var f = JSON.parse(sessionStorage.getItem('op.menuFold') || '{}'); if (open) delete f[g.dataset.g]; else f[g.dataset.g] = 1; sessionStorage.setItem('op.menuFold', JSON.stringify(f)); } catch (e2) {}
        });
      }
    }
    // 모바일(≤960px): 대시보드 = 허브(가운데 정렬 프로필 + 세로 메뉴), 하위 화면 = 메뉴 카드 대신 '‹ 마이페이지' + 가로 메뉴 탭 (CSS body.mp-sub, 이랜서 참고)
    // 모바일 대시보드 (2026-10-23): 프로필 카드·세로 메뉴 대신 [AI Agent] + 가로 메뉴 탭(대시보드 포함)으로 하위 화면과 통일 (CSS body.mp-dash)
    if (side) {
      var dash = key === 'dash';
      document.body.classList.add(dash ? 'mp-dash' : 'mp-sub');
      var ph = document.querySelector('.page-head .in');
      if (ph && !ph.querySelector('.m-head')) {
        var tabs = MENU.filter(function (m) { return (dash || m[0] !== 'dash') && m[0] !== 'ai' && (!m[3] || m[3].indexOf(s.role) > -1); }).map(function (m) {
          var href = m[0] === 'project' && s.role === 'admin' ? 'mypage-request.html' : m[2];
          return '<a href="' + href + '"' + (m[2] === '#' ? ' data-soon="' + m[1] + '"' : '') + (m[0] === key ? ' class="on" aria-current="page"' : '') + '>' + m[1] + (side.querySelector('a[href="' + href + '"] .nb') ? NB : '') + '</a>';
        }).join('');
        // '‹ 마이페이지'와 탭을 한 덩어리로 (등장 효과도 같이). site.js 등장 효과에서 빼고 여기서 직접 붙임
        ph.insertAdjacentHTML(dash ? 'beforeend' : 'afterbegin', '<div class="m-head op-enter" data-op-skip-enter>' + (dash ? '<button type="button" class="m-ai" data-ph-ai><img src="assets/common/ic-sparkle-fill.svg" alt=""><b>AI Agent</b><em>beta</em></button>' : '<a class="m-back" href="mypage.html"><img src="assets/detail/ic-caret-left.svg" alt="">마이페이지</a>') +
          '<nav class="m-tabs" aria-label="마이페이지 메뉴"><div>' + tabs + '</div></nav></div>');
        var mai = ph.querySelector('.m-ai'); if (mai) mai.addEventListener('click', function () { OP.openAI(); });
        var mt = document.querySelector('.m-tabs > div'), on = mt.querySelector('.on');
        if (on) mt.scrollLeft = on.offsetLeft - (mt.clientWidth - on.offsetWidth) / 2; // 지금 메뉴를 가운데로
      }
    }
    // AI Agent를 연 채로 새로고침하면 다시 열어 둠 (같은 화면에서만, 2026-10-27)
    // AI 화면(iframe) 안에서도 이 함수가 불리므로 바깥 화면에서만 처리 (안에서 지우면 새로고침 때 안 열리던 문제, 2026-10-27)
    if (key !== 'ai' && window === window.top) try { var ao = JSON.parse(sessionStorage.getItem('op.aiOpen') || 'null'); if (ao && ao.p === location.pathname) setTimeout(function () { OP.openAI(ao.m, { full: ao.full }); }, 0); else if (ao) sessionStorage.removeItem('op.aiOpen'); } catch (e) {}
    return { s: s, acc: acc, name: name, org: org };
  };
  // 상세 화면 제목 옆 [‹] (2026-10-23): 원래 왔던 화면으로 (대시보드 알림 → 상세 → ‹ = 대시보드). 링크로 바로 들어왔으면 원래 주소(목록)로
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.back, .mg-head > a'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); OP.goBack(/^javascript:/.test(a.getAttribute('href')) ? 'mypage.html' : a.href);
  });
})();

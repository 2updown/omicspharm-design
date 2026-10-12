/* 컨설턴트 관리 화면 공통 (클라이언트 관리 · 분석파트너 관리)
   기존 사이트(omicspharm.com 마이페이지 컨설턴트) 구성 기준: 목록 표 → [상세보기] → '○○ 프로젝트 리스트'(기본 정보 + 프로젝트 표)
   사용: mypage.js · flow.js · projects-data.js 다음에 불러오고 OP.manage.* 사용. 예시 값은 모두 가상 */
(function () {
  var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var SVCS = ['단백체 분석', '대사체 분석', '유전체 분석', '전사체 분석', 'Olink 분석', '바이오의약품·ADC 분석', '기타 분석'];
  var STAGES = OP.flow ? OP.flow.ADMIN_STAGES : [];
  var dot = function (v) { return v ? String(v).replace(/-/g, '.') : '-'; };
  var man = function (n) { return n ? Number(n).toLocaleString('ko-KR') + '만원' : '협의'; };

  // 프로젝트 찾기 예시 데이터 → 표 한 줄. 진행상태는 예시라 모집 중이면 견적 협의, 마감이면 번호에 따라 이후 단계
  function fromData(x) {
    var after = ['계약 진행 중', '분석 진행 중', '보고서 등록', '프로젝트 완료'];
    var st = x.open ? '견적 협의' : after[x.id % after.length];
    return { svc: x.cat, title: x.title, from: x.from, to: x.to, open: x.open, due: x.due, price: man(x.price), reg: x.reg, stage: st, report: st === '프로젝트 완료' ? '등록' : '-', href: OP_PROJECTS.url(x) };
  }
  // 견적 중개 의뢰(flow) → 표 한 줄
  function fromReq(r) {
    var F = OP.flow, st = F.adminStage(r.id), s = F.state(r.id);
    return { svc: r.svc, title: r.title, from: r.from, to: r.to, open: F.open ? F.open(r.id) : s.st !== 'matched', due: r.due, price: r.budget || '-', reg: F.ymd(r.at), stage: st, report: '-', href: 'mypage-request.html?id=' + encodeURIComponent(r.id) };
  }
  // 분석파트너 예시 프로젝트(계약 이후) → 표 한 줄
  function fromPartner(p) {
    var st = OP.flow.P2A[p.stage] || p.stage;
    return { svc: OP.my.svcKo(p.svc), title: p.title, from: p.contract, to: p.contract, open: false, due: p.due, price: p.amount, reg: p.contract, stage: st, report: /보고서|완료/.test(st) ? '등록' : '-', href: 'mypage-request.html?id=' + encodeURIComponent(p.id) };
  }

  // 프로젝트 표 + 필터 (분석 서비스 · 모집상태 · 진행상태 · 의뢰명 검색)
  function projTable(host, rows) {
    host.classList.add('mg-proj');
    host.innerHTML =
      '<div class="mg-filter"><select class="mg-sel" data-f="svc"><option value="">분석 서비스</option>' + SVCS.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select>' +
        '<select class="mg-sel" data-f="open"><option value="">모집상태</option><option value="1">모집중</option><option value="0">모집완료</option></select>' +
        '<select class="mg-sel" data-f="stage"><option value="">진행상태</option>' + STAGES.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select>' +
        '<div class="mg-q"><input type="search" placeholder="의뢰명 검색" data-f="q"><button type="button" class="btn" data-go>검색</button></div></div>' +
      '<p class="mg-total">총 <b data-n>0</b>건</p>' +
      '<div class="mg-wrap"><table class="mg-tbl"><thead><tr><th class="c">No</th><th>분석 서비스</th><th>의뢰명</th><th>모집기간(상태)</th><th>희망완료일</th><th>희망가격</th><th>등록일</th><th>결과 보고서</th><th>진행상태</th><th class="c">상세보기</th></tr></thead><tbody data-b></tbody></table></div>';
    var $ = function (s) { return host.querySelector(s); };
    var draw = function () {
      var f = { svc: $('[data-f=svc]').value, open: $('[data-f=open]').value, stage: $('[data-f=stage]').value, q: $('[data-f=q]').value.trim() };
      var L = rows.filter(function (r) {
        return (!f.svc || r.svc === f.svc) && (f.open === '' || String(+!!r.open) === f.open) && (!f.stage || r.stage === f.stage) && (!f.q || r.title.indexOf(f.q) > -1);
      });
      $('[data-n]').textContent = L.length;
      $('[data-b]').innerHTML = L.length ? L.map(function (r, i) {
        return '<tr><td class="c">' + (L.length - i) + '</td><td>' + esc(r.svc) + '</td><td class="t">' + esc(r.title) + '</td>' +
          '<td>' + dot(r.from) + ' ~ ' + dot(r.to) + '<br><small>(' + (r.open ? '모집중' : '모집완료') + ')</small></td><td>' + dot(r.due) + '</td><td>' + esc(r.price) + '</td><td>' + dot(r.reg) + '</td>' +
          '<td class="c">' + esc(r.report) + '</td><td>' + esc(r.stage) + '</td><td class="c"><a class="mg-view" href="' + r.href + '">상세보기</a></td></tr>';
      }).join('') : '<tr><td colspan="10" class="mg-empty">등록된 프로젝트가 없습니다.</td></tr>';
    };
    host.addEventListener('change', function (e) { if (e.target.matches('select')) draw(); });
    $('[data-go]').addEventListener('click', draw);
    $('[data-f=q]').addEventListener('keydown', function (e) { if (e.key === 'Enter') draw(); });
    draw();
  }

  OP.manage = { esc: esc, SVCS: SVCS, dot: dot, fromData: fromData, fromReq: fromReq, fromPartner: fromPartner, projTable: projTable };
})();

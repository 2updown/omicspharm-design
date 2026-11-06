/* OmicsPharm Workspace 공통 블록·동작 (워크스페이스 3페이지가 같이 씀)
   - <nav data-ws-tabs="overview|hospital|biopharma">: 워크스페이스 안 이동 탭
   - <div data-ws="growth|privacy|ops|faq|plan-hospital|plan-biopharma">: 여러 페이지에 반복되는 섹션 (한 곳에서 고치면 다 바뀜)
   - 화면 예시(board), 지속 고도화 단계 탭(timeline), 바이오제약 업무 탭(utabs) 동작 */
(function () {
  var I = function (n) { return '<span class="ico" style="--i:url(ic-' + n + '.svg)"></span>'; };
  window.WS_ICON = I;
  var CONTACT = 'contact.html?type=workspace'; /* 도입 상담: 문의 폼 'Workspace 도입 상담' 유형 (2026-11-05) */

  var TABS = [['overview', 'workspace.html', '개요'], ['hospital', 'workspace-hospital.html', 'for Hospital'], ['biopharma', 'workspace-biopharma.html', 'for Biopharma']];
  function tabs(cur) {
    return '<div class="wrap"><span class="brand">OmicsPharm Workspace</span>' +
      TABS.map(function (t) { return '<a href="' + t[1] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + t[2] + '</a>'; }).join('') +
      '<a href="workspace.html#plans">도입 방식</a></div>';
  }

  var B = {
    growth: function () {
      return '<section class="sec pale" id="growth"><div class="wrap growth"><div>' +
        '<span class="eyebrow">Continuous Research &amp; AI Improvement</span>' +
        '<h2 class="ttl">분석 결과가 쌓이고, <br>다음 연구가 정교해집니다.</h2>' +
        '<p class="lead">분석을 의뢰하면 결과가 Workspace에 쌓입니다. 전문 AI 팀이 AI를 개선하고, AI는 결과 해석과 다음 연구 방향을 제안합니다.</p>' +
        '<div class="loop">' +
          '<div><span class="who-tag who-h">연구팀</span><b>01 분석 의뢰</b><p>연구 목적에 맞는 시료·데이터 분석 요청</p></div>' +
          '<div><span class="who-tag who-a">OmicsPharm</span><b>02 데이터 축적</b><p>분석 결과와 검토 기록을 Workspace에 연결</p></div>' +
          '<div><span class="who-tag who-a">OmicsPharm · AI</span><b>03 AI 개선·연구 제안</b><p>AI 품질을 개선하고, 결과 해석과 후속 연구 제안</p></div>' +
          '<div><span class="who-tag who-h">연구팀</span><b>04 검토·후속 분석</b><p>제안 근거를 검토하고 다음 실험·분석 결정</p></div>' +
        '</div>' +
        '<p class="loop-cap"><strong>후속 분석 결과는 다시 데이터와 지식으로 축적됩니다.</strong><br>이 과정이 반복되며 AI의 분석과 제안도 개선됩니다.</p>' +
        '</div><div class="tl" data-tl>' +
          '<div class="tl-tabs" role="tablist"><button role="tab" data-stage="0" aria-selected="true">분석 시작</button><button role="tab" data-stage="1" aria-selected="false">지식 축적</button><button role="tab" data-stage="2" aria-selected="false">연구 확장</button></div>' +
          '<div class="tl-panel"><h3 data-t></h3><p data-d></p>' +
            '<div class="mem"><div><span>연구 데이터</span><strong data-m="0"></strong></div><div><span>연구 지식</span><strong data-m="1"></strong></div><div><span>검토 기준</span><strong data-m="2"></strong></div><div><span>AI 활용</span><strong data-m="3"></strong></div></div>' +
            '<div class="ex"><small>연구 질문 예시</small><q data-q></q><p data-a></p></div>' +
            '<p class="note">활용 예시입니다. 데이터 품질, 연구자 검토와 AI 평가·개선을 통해 발전시킵니다.</p>' +
          '</div></div></div></section>';
    },
    privacy: function () {
      return '<section class="sec" id="security"><div class="wrap privacy"><div>' +
        '<span class="eyebrow">Privacy-First</span>' +
        '<h2 class="ttl">우리 팀의 전용 공간에서, <br><span class="green">연구 데이터를 안전하게.</span></h2>' +
        '<p class="lead">연구 자료는 팀 전용 공간에 보관하고, 허용된 구성원만 활용합니다. 외부 AI에 전달할 정보도 기관이 정한 범위로 제한합니다.</p>' +
        /* 2026-11-06 크몽 Biz '선택하는 이유' 탭 내용 참고: 왼쪽 체크 목록 + 오른쪽 궤도 그림(가운데 아이콘, 키워드 말풍선). 기존 경계 그림·카드 4개를 대체 */
        '<ul class="pv-chk">' +
          '<li>' + I('check') + '<div><b>분리된 공간</b><span>다른 기관과 분리해 보관하고, 같은 기관 안에서도 팀별 공유 범위를 정합니다.</span></div></li>' +
          '<li>' + I('check') + '<div><b>허용된 사람만 접근</b><span>연구팀과 프로젝트별로 자료를 조회·활용할 수 있는 사람과 권한을 정합니다.</span></div></li>' +
          '<li>' + I('check') + '<div><b>외부로 나가는 정보 통제</b><span>외부 AI에 전달할 데이터와 모델 학습 활용 여부를 기관과 미리 정하고 계약에 반영합니다.</span></div></li>' +
          '<li>' + I('check') + '<div><b>근거와 기록이 남는 AI</b><span>AI가 참고한 자료와 연구자의 검토, 데이터 접근 기록을 확인할 수 있습니다.</span></div></li>' +
        '</ul></div>' +
        '<div class="orbit" aria-hidden="true"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i>' +
          '<div class="core">' + I('shield-check') + '</div>' +
          '<span class="op o1">팀 전용 공간</span><span class="op o2">권한별 접근</span><span class="op o3">외부 전송 통제</span><span class="op o4">접근 기록</span>' +
        '</div></div></section>';
    },
    ops: function () {
      return '<section class="sec pale" id="managed"><div class="wrap"><div class="ops"><div>' +
        '<span class="eyebrow">Managed AI Service</span>' +
        '<h2 class="ttl">AI 전담팀이 없어도, <br>전문가와 함께 운영하세요.</h2>' +
        '<p class="lead">OmicsPharm의 바이오·헬스케어 전문 AI 팀이 연구 목적에 맞춰 AI Agent를 구축하고 운영합니다. 새 데이터와 연구자의 검토를 반영해 AI를 지속적으로 고도화하므로, 별도 AI 전담팀 없이도 연구에 맞게 발전하는 AI를 활용할 수 있습니다.</p>' +
        '</div><div class="layers"><div class="top">바이오·헬스케어 전문 AI 팀</div>' +
          '<div class="ly"><div class="lh"><b>연구에 맞는 AI 도입</b><span>설계·구축</span></div><p>연구 목적에 맞는 AI 설계 · 데이터 연결 · 권한 설정 · 사용자 교육</p></div>' +
          '<div class="ly"><div class="lh"><b>일상적인 AI 활용 지원</b><span>운영·관리</span></div><p>AI 실행 점검 · 연구 지식 업데이트 · 활용 문의와 연구 방향 변경 대응</p></div>' +
          '<div class="ly"><div class="lh"><b>연구와 함께 지속 고도화</b><span>평가·개선</span></div><p>응답 품질 평가 · 연구자 의견 반영 · 분석·제안 절차 개선</p></div>' +
        '</div></div>' +
        '<div class="grid2 deploy">' +
          '<article class="card"><span class="k">Private Cloud</span><h3>전용 클라우드</h3><p>팀 또는 기관 전용 환경에서 AI를 활용합니다. 필요한 시스템 운영과 보안 관리는 함께 지원합니다.</p></article>' +
          '<article class="card"><span class="k">On-Premises</span><h3>기관 내부 구축</h3><p>기관 서버에 Workspace와 AI 실행 환경을 구축합니다. 내부 처리 범위와 외부 연결 정책을 기관의 보안 기준에 맞춰 설계합니다.</p></article>' +
        '</div>' +
        '<div class="steps">' +
          '<div><small>01 Design</small><b>연구·데이터 진단</b><p>연구 목적, 적용 연구, 보안 요구사항 확인</p></div>' +
          '<div><small>02 Validate</small><b>시범 적용·활용 평가</b><p>대표 연구에서 정확성과 활용 가능성 검토</p></div>' +
          '<div><small>03 Deploy</small><b>Workspace·Agent 배포</b><p>데이터 연계, Agent 구성, 권한 설정, 교육</p></div>' +
          '<div><small>04 Operate</small><b>운영·지속 고도화</b><p>전문 AI 팀의 품질 평가·개선, 적용 연구 확대</p></div>' +
        '</div>' +
        '<p class="note">분석 서비스, 시스템 운영, 전문가 지원 범위와 AI 개선 주기는 연구 목적에 맞춰 협의합니다.</p>' +
        '</div></section>';
    },
    faq: function () {
      var Q = [
        ['Workspace에서 연구에 필요한 분석도 의뢰할 수 있나요?', '네. 연구 목적에 맞는 분석을 의뢰하고, 결과를 Workspace에 연결해 다음 연구에 활용할 수 있습니다. 분석 항목·일정·비용은 별도로 협의합니다.'],
        ['연구 데이터가 축적되면 AI는 어떻게 개선되나요?', 'AI가 참고할 분석 결과와 검토 근거가 늘어납니다. OmicsPharm이 응답 품질을 평가하고 지식과 작업 절차를 개선해, 더 정교한 분석과 연구 제안을 지원합니다.'],
        ['AI 고도화는 우리 데이터로 모델을 학습시킨다는 뜻인가요?', '기본적으로 AI가 승인된 자료와 검토 기준을 참고하도록 개선합니다. AI 모델 자체를 추가 학습시키는 경우에는 데이터 활용 범위와 방식을 기관과 별도로 협의합니다.'],
        ['별도 AI 전담팀이 없어도 활용할 수 있나요?', '네. OmicsPharm의 바이오·헬스케어 전문 AI 팀이 도입부터 운영·고도화까지 지원합니다. 연구팀은 연구 목적을 정하고 결과를 검토하면 됩니다. 전문가 지원 범위와 개선 주기는 도입 시 협의합니다.'],
        ['연구실 단위로 시작해 병원·회사 전체로 확장할 수 있나요?', '네. Private에서 시작해 센터·병원 또는 연구소·회사 단위의 Enterprise로 확장할 수 있습니다. 기존 워크스페이스는 연구실 워크스페이스로 이어지고, 정해진 이용 범위 안에서 관리자가 연구실·부서별 워크스페이스를 추가합니다.'],
        ['같은 기관의 다른 팀이 우리 데이터를 볼 수 있나요?', '팀별 데이터와 AI 활용 기록은 분리해 관리합니다. 기관 공통 지식처럼 공유를 승인한 자료만 정해진 권한 안에서 함께 사용합니다.'],
        ['분석 서비스를 이용하지 않아도 Workspace를 도입할 수 있나요?', '네. 보유한 데이터와 문서로 시작할 수 있습니다. 이후 새 데이터가 필요하면 연구 목적에 맞는 Wet-Lab 분석이나 추가 데이터 분석을 의뢰할 수 있습니다.'],
        ['AI Agent 구축만 의뢰하는 것과 무엇이 다른가요?', '분석 의뢰부터 데이터 축적, AI 활용과 후속 연구를 연결합니다. 도입 이후에도 바이오·헬스케어 전문 AI 팀이 AI를 운영하고 연구 결과에 맞춰 개선합니다.']
      ];
      /* 서비스 소개 > 이용방법(guide.html) 맨 아래 '자주 묻는 질문'과 같은 모양 (2026-11-06) */
      return '<section class="sec" id="faq"><div class="wrap"><div class="faq-head"><h2>자주 묻는 질문</h2><p>더 궁금한 점은 <a data-contact>문의하기</a>를 이용해 주세요.</p></div><div class="qa">' +
        Q.map(function (q) { return '<details><summary><span class="q">Q</span><span class="t">' + q[0] + '</span>' + I('caret-down') + '</summary><div class="a"><b>A</b><div>' + q[1] + '</div></div></details>'; }).join('') + '</div></div></section>';
    },
    plan: function (sec) {
      var ent = sec === 'hospital' ? ['센터 · 병원 전체 단위', '센터 또는 병원 전체로 도입하고, 관리자가 진료과·연구실별 워크스페이스를 생성해 통합 관리합니다.']
        : ['연구소 · 회사 전체 단위', '연구소 또는 회사 전체로 도입하고, 관리자가 부서·프로젝트팀별 워크스페이스를 생성해 통합 관리합니다.'];
      return '<section class="sec" id="plans"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">How to Adopt</span><h2 class="ttl">도입 방식은 규모에 맞게.</h2></div>' +
        '<p>개인 연구·연구실 단위로 시작하거나, 기관 단위로 도입할 수 있습니다. 두 방식 모두 AI 구축·개선·운영을 지원합니다.</p></div>' +
        '<div class="plan-mini">' +
          '<a class="card" href="workspace.html#plans"><small>개인 연구 · 연구실 단위</small><h3>Private Workspace</h3><p>개인 연구자나 한 연구실의 연구 목적에 맞춰 분석 서비스와 AI를 연결하는 전용 워크스페이스입니다.</p><span class="more">도입 방식 비교 ' + I('arrow-right') + '</span></a>' +
          '<a class="card" href="workspace.html#plans"><small>' + ent[0] + '</small><h3>Enterprise Workspace</h3><p>' + ent[1] + '</p><span class="more">도입 방식 비교 ' + I('arrow-right') + '</span></a>' +
        '</div></div></section>';
    }
  };

  /* 지속 고도화 단계 */
  var STAGES = [
    { t: '첫 분석 결과를 이해합니다.', d: '시료를 분석해 데이터를 확보합니다. AI가 주요 변화와 관련 문헌을 정리해 첫 결과의 해석을 돕습니다.', m: ['첫 분석 결과 연결', '관련 문헌·근거 정리', '분석 품질·해석 기준 확인', '주요 변화 요약'], q: '약물 처리 전후 세포주에서 어떤 단백질이 달라졌나요?', a: '처리군과 대조군의 단백질 변화를 비교하고, 주요 변화와 관련 기능을 근거와 함께 정리합니다.' },
    { t: '이전 연구와 연결해 판단합니다.', d: '여러 실험의 결과와 연구자의 검토가 쌓입니다. AI는 팀의 기준을 참고해 반복되는 변화와 실험별 차이를 비교합니다.', m: ['여러 실험 결과 연결', '검토된 해석·근거 축적', '연구팀의 후보 선정 기준 반영', '공통 후보와 차이 비교'], q: '이번 결과와 지난 세 번의 실험에서 공통으로 나타난 후보는 무엇인가요?', a: '반복 관찰된 후보와 실험별 차이를 구분하고, 이전 검토 의견과 팀의 선정 기준을 함께 제시합니다.' },
    { t: '다음 실험과 분석을 설계합니다.', d: 'AI가 축적된 결과와 검증 이력을 바탕으로 후속 연구 방향을 제안합니다. 연구자가 계획을 검토하고 추가 분석을 의뢰합니다.', m: ['후속 검증 결과 연결', '후보별 검증·미확인 항목 정리', '연구자의 우선순위 반영', '후속 실험·추가 분석 제안'], q: '우선 후보의 약물 반응을 검증하려면 어떤 실험과 추가 분석이 필요한가요?', a: '근거가 부족한 항목을 짚고, 처리 농도·시간 조건과 추가 검증 분석을 제안합니다. 연구자는 검토 후 다음 실험을 결정합니다.' }
  ];
  function setStage(tl, i) {
    var s = STAGES[i];
    tl.querySelectorAll('[data-stage]').forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.stage === i)); });
    tl.querySelector('[data-t]').textContent = s.t; tl.querySelector('[data-d]').textContent = s.d;
    tl.querySelector('[data-q]').textContent = s.q; tl.querySelector('[data-a]').textContent = s.a;
    tl.querySelectorAll('[data-m]').forEach(function (m) { m.textContent = s.m[+m.dataset.m]; });
  }

  /* 화면 예시 (개요 히어로) */
  var BOARD = {
    agents: ['Agentic AI', '연구 지식을 반영하는 AI.', '축적된 분석 결과와 승인된 해석 기준을 활용합니다.', 'AI 분석 예시', '신규 단백체 결과의 핵심 근거 정리', '기존 데이터 비교 → 근거 탐색 → 후속 실험 제안 → 연구자 검토', '참고한 팀 기준', '승인된 해석 12건', '연구자 검토', '결과는 검토 후 지식으로 축적', 2],
    analysis: ['분석 의뢰', '연구 질문에 맞는 분석을 연결합니다.', '필요한 분석을 의뢰하고 결과를 후속 연구에 활용합니다.', '분석 의뢰 예시', '후보 검증을 위한 추가 단백체 분석', '연구 목적 확인 → 분석 범위 협의 → 결과 연결 → AI 해석·검토', '의뢰 정보', '시료·분석 목적·일정', '결과 활용', '데이터 축적·후속 연구 제안', 1],
    data: ['연구 데이터', '분석 결과를 후속 연구로 연결합니다.', '의뢰한 분석 결과와 보유 데이터를 프로젝트별로 축적합니다.', '연구 데이터', '2026 바이오마커 프로젝트 데이터셋', 'DIA 단백체 · 대사체 · 시료 메타데이터 · QC 리포트', '데이터 목록', '프로젝트·분석 유형별 정리', '공유 범위', '팀 구성원 권한에 따라', 3],
    knowledge: ['연구 지식', '검토된 지식을 다음 연구에 활용합니다.', '내부 자료와 문헌을 출처와 함께 연결합니다.', '연구 지식', '팀 지식베이스 업데이트', '연구 노트 등록 → 출처 연결 → Agent가 참고 가능', '내부 자료', '실험 기록·연구 보고서', '검토 이력', '승인·수정된 해석 기록', 3],
    ops: ['운영 현황', 'AI 고도화와 운영을 함께 지원합니다.', '바이오·헬스케어 전문 AI 팀이 운영과 개선을 지원합니다.', 'Managed AI Service', 'AI 품질 평가와 개선', '품질 평가 → 연구 지식 업데이트 → AI 개선 → 운영 점검', '전문 AI 팀', '활용 지원·연구 지식 관리', '지속 고도화', '품질 평가·연구자 의견 반영', 3]
  };
  function setBoard(w, key) {
    var d = BOARD[key];
    w.querySelectorAll('[data-board]').forEach(function (b) { b.classList.toggle('on', b.dataset.board === key); });
    ['cap', 'title', 'desc', 'tag', 'task', 'detail', 'f1', 'f1s', 'f2', 'f2s'].forEach(function (k, i) { w.querySelector('[data-b-' + k + ']').textContent = d[i]; });
    w.querySelectorAll('.prog i').forEach(function (s, i) { s.classList.toggle('on', i < d[10]); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* 페이지 안 이동 탭: 지금 보고 있는 섹션 표시, 선택한 탭이 가로로 보이게 */
    var anc = document.querySelector('.ws-anchors');
    if (anc) {
      var links = [].slice.call(anc.querySelectorAll('a')), picked = null; /* 누른 탭은 사용자가 직접 스크롤할 때까지 유지 */
      links.forEach(function (a) { a.addEventListener('click', function () { picked = a; }); });
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) { window.addEventListener(t, function (e) { if (!e.target.closest || !e.target.closest('.ws-anchors')) picked = null; }, { passive: true }); });
      var spy = function () {
        var line = 140, cur = links[0];
        links.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t && t.getBoundingClientRect().top - line <= 0) cur = a; });
        var top = anc.getBoundingClientRect().top; anc.classList.toggle('stuck', top <= (innerWidth < 1080 ? 56.5 : 70.5));
        if (top > 80) cur = null;
        if (cur && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = links[links.length - 1];
        if (picked && top <= 80) cur = picked;
        links.forEach(function (a) { var on = a === cur; if (on && !a.classList.contains('on')) a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' }); a.classList.toggle('on', on); });
      };
      window.addEventListener('scroll', spy, { passive: true }); window.addEventListener('load', spy); setTimeout(spy, 0);
    }
    document.querySelectorAll('[data-ws-tabs]').forEach(function (el) { el.innerHTML = tabs(el.getAttribute('data-ws-tabs')); });
    document.querySelectorAll('[data-ws]').forEach(function (el) {
      var k = el.getAttribute('data-ws'), p = k.split('-');
      el.outerHTML = p[0] === 'plan' ? B.plan(p[1]) : B[k]();
    });
    /* 하단 CTA 점 빛: 마우스 주변 점이 밝아지고, 마우스가 없으면 빛이 천천히 좌우로 지나감 (메인 하단 CTA와 같음) */
    (function () {
      var box = document.querySelector('.wcta'), spot = box && box.querySelector('.ws-spot');
      if (!spot || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var hover = false, raf = 0, t0 = performance.now();
      function set(x, y) { spot.style.setProperty('--mx', x + 'px'); spot.style.setProperty('--my', y + 'px'); }
      function idle(now) { raf = 0; if (hover) return; var r = box.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) return; var w = box.clientWidth, h = box.clientHeight, k = (now - t0) / 9000; set(w / 2 + Math.sin(k * Math.PI * 2) * w * 0.42, h * (0.55 + Math.sin(k * Math.PI * 4) * 0.2)); raf = requestAnimationFrame(idle); }
      function start() { if (!raf) raf = requestAnimationFrame(idle); }
      box.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; hover = true; var r = box.getBoundingClientRect(); set(e.clientX - r.left, e.clientY - r.top); });
      box.addEventListener('pointerleave', function () { hover = false; start(); });
      window.addEventListener('scroll', start, { passive: true }); start();
    })();
    /* 섹션 배경을 흰색·연한 녹색으로 번갈아 (한 페이지로 합치면서 순서가 바뀌어도 안 겹치게, 2026-11-05) */
    document.querySelectorAll('main > section.sec').forEach(function (sec, i) { sec.classList.toggle('pale', i % 2 === 1); });
    document.querySelectorAll('[data-contact]').forEach(function (a) { a.setAttribute('href', CONTACT); });
    document.querySelectorAll('[data-i]').forEach(function (el) { el.outerHTML = I(el.getAttribute('data-i')); });
    /* 단계 순서대로 켜기 (2026-11-06, 크몽 Biz 이용 4단계 참고): 화면에 들어오면 회색 → teal로 하나씩. 지속 고도화 4단계·운영 지원 4단계 */
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; io.unobserve(e.target);
          [].forEach.call(e.target.children, function (c, i) { setTimeout(function () { c.classList.add('lit'); }, 200 + i * 450); });
        });
      }, { threshold: .5 });
      document.querySelectorAll('.loop, .steps').forEach(function (el) { el.classList.add('seq'); io.observe(el); });
    }
    document.querySelectorAll('[data-tl]').forEach(function (tl) {
      setStage(tl, 0);
      tl.querySelectorAll('[data-stage]').forEach(function (b) { b.addEventListener('click', function () { setStage(tl, +b.dataset.stage); }); });
    });
    document.querySelectorAll('.board').forEach(function (w) {
      setBoard(w, 'agents');
      w.querySelectorAll('[data-board]').forEach(function (b) { b.addEventListener('click', function () { setBoard(w, b.dataset.board); }); });
    });
    document.querySelectorAll('[data-utabs]').forEach(function (g) {
      var bs = g.querySelectorAll(':scope > .utabs [data-use]'); /* 탭 안에 탭(분야별 > 바이오 업무)이 있어도 자기 탭만 */
      bs.forEach(function (b) { b.addEventListener('click', function () {
        bs.forEach(function (x) { var on = x === b; x.setAttribute('aria-selected', String(on)); document.getElementById(x.dataset.use).hidden = !on; });
      }); });
    });
  });
})();

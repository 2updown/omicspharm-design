/* OmicsPharm Workspace 공통 블록·동작 (워크스페이스 3페이지가 같이 씀)
   - <nav data-ws-tabs="overview|hospital|biopharma">: 워크스페이스 안 이동 탭
   - <div data-ws="growth|privacy|ops|faq|plan-hospital|plan-biopharma">: 여러 페이지에 반복되는 섹션 (한 곳에서 고치면 다 바뀜)
   - 화면 예시(board), 지속 고도화 단계 탭(timeline), 바이오제약 업무 탭(utabs) 동작 */
/* 등장 효과: 첫 화면에 그려지기 전에 섹션 내용을 숨겨 둠 (보였다가 사라지는 깜빡임 방지). 움직임 줄이기면 안 숨김. 3초 안에 효과가 시작 안 되면 그냥 보이게 */
if (!matchMedia('(prefers-reduced-motion:reduce)').matches) { document.documentElement.classList.add('rv-on'); setTimeout(function () { document.documentElement.classList.remove('rv-on'); }, 3000); }
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
      /* 2026-11-09 Figma 2416:19304: 가운데 제목 + 4단계 칸(위아래 선, 큰 번호·제목·설명) + 04에서 02로 되돌아가는 화살표와 한 줄 설명. 오른쪽 활용 예시 패널은 삭제 */
      var S = [['01', '분석 의뢰', '연구 목적에 맞는 <br>시료·데이터 분석을 요청합니다.'], ['02', '데이터 축적', '분석 결과와 검토 기록을 <br>연구 데이터로 축적합니다.'], ['03', 'AI 개선과 연구 제안', 'AI 품질을 개선하고, <br>결과 해석과 후속 연구를 제안합니다.'], ['04', '검토와 후속 분석', '제안 근거를 검토하고 <br>다음 실험·분석을 결정합니다.']];
      return '<section class="sec hw" id="growth"><div class="wrap">' +
        '<div class="sec-head center"><div><span class="eyebrow">How It Works</span><h2 class="ttl">분석 결과가 쌓이고, <br>다음 연구가 정교해집니다.</h2></div>' +
        '<p>분석을 의뢰하면 결과가 Workspace에 쌓이고, AI는 결과 해석과 다음 연구 방향을 제안합니다.</p></div>' +
        '<ol class="hw-steps">' + S.map(function (x) { return '<li><span class="no">' + x[0] + '</span><b>' + x[1] + '</b><p>' + x[2] + '</p></li>'; }).join('') + '</ol>' +
        '<div class="hw-loop"><i class="hw-arrow" aria-hidden="true"></i><p>후속 분석 결과는 다시 데이터와 지식으로 축적됩니다.</p></div>' +
        '</div></section>';
    },
    privacy: function () {
      /* 2026-11-06 크몽 Biz '선택하는 이유' 레이아웃: 가운데 제목 + 4칸 상자 탭 + (왼쪽 아이콘·제목·설명·체크 3개 / 오른쪽 궤도 그림) */
      var P = [
        ['분리된 공간', 'buildings', '다른 기관과 분리된 우리 팀 공간', '다른 기관과 분리해 보관하고, 같은 기관 안에서도 팀별 공유 범위를 정합니다.', ['GPU·데이터 저장소·AI 모델·네트워크를 독립적으로 사용', '팀별 데이터와 Agent 기록 분리', '기관 공통 지식은 승인된 범위에서만 공유'], ['전용 GPU', '데이터 저장소', 'AI 모델']],
        ['권한·전송 통제', 'users-three', '허용된 사람과 범위만 활용합니다', '자료를 볼 수 있는 사람과 권한을 정하고, 외부 AI로 나가는 정보도 기관이 정한 범위로 제한합니다.', ['연구팀·프로젝트별 조회·활용 권한 설정', '외부 AI에 전달할 데이터 범위와 학습 활용 여부를 계약에 반영', '기관 내부 구축(On-Premises) 선택 가능'], []],
        ['근거와 기록', 'file-text', '근거와 기록이 남는 AI', 'AI가 참고한 자료와 연구자의 검토, 데이터 접근 기록을 확인할 수 있습니다.', ['AI가 참고한 자료와 출처 확인', '연구자의 검토 이력 기록', '데이터 접근 기록 확인'], []],
        ['전문가 운영 지원', 'robot', 'AI 전담팀이 없어도 운영할 수 있습니다', 'OmicsPharm의 바이오·헬스케어 전문 AI 팀이 AI Agent를 구축하고 운영합니다. 새 데이터와 연구자의 검토를 반영해 계속 고도화합니다.', ['연구 목적에 맞는 AI 설계와 사용자 교육', 'AI 실행 점검과 연구 지식 업데이트', '응답 품질 평가와 연구자 의견 반영'], []]
      ];
      /* 2026-11-09 탭 2~4 오른쪽 그림 (Figma 2527:19542~): 구성원 권한 카드 / 전송 범위 흐름 / AI 답변 출처 + 활동 기록. 1번 탭은 궤도 그림 유지 */
      var BD = function (t, c) { return '<span class="pa-bd ' + c + '">' + t + '</span>'; };
      var ROW = function (n, s, b, dim) { return '<li' + (dim ? ' class="dim"' : '') + '><img class="pa-av" src="assets/workspace/user-icon.svg" alt=""><span class="pa-nm">' + n + '<small>' + s + '</small></span>' + b + '</li>'; };
      var ART = [null,
        '<div class="pv-art" aria-hidden="true"><i class="pa-ring"></i><div class="pa-card"><b class="pa-hd">단백체 분석 프로젝트 구성원</b><ul class="pa-mem">' +
          ROW('연구책임자', '구성원 관리', BD('관리', 'fill')) + ROW('연구원', '프로젝트 참여', BD('조회', '')) + ROW('협력 연구원', '결과 열람', BD('조회', '')) + ROW('다른 팀 구성원', '권한 없음', BD('접근 불가', 'gray'), 1) +
          '</ul></div><span class="pa-pill">' + I('lock-key') + '외부 전송 범위 제한</span></div>', /* 2026-11-11 Key Features 2번(권한·전송 통제) A안 */
        '<div class="pv-art" aria-hidden="true"><i class="pa-ring"></i><div class="pa-card"><b class="pa-hd">' + I('sparkle') + 'AI 답변</b><p class="pa-ans">시료 B의 단백질 발현량이 대조군보다 약 2배 높습니다.</p>' +
          '<span class="pa-cite"><i class="ext">PDF</i>출처 [A]</span></div>' +
          '<div class="pa-card"><b class="pa-hd">' + I('shield-check') + '활동 기록</b><ul class="pa-log"><li><time>11:02</time>연구책임자 답변 검토 완료</li><li><time>10:48</time>AI 답변 생성, 출처 2건</li><li><time>10:45</time>연구원 분석 보고서 열람</li></ul></div></div>',
        /* 2026-11-11 Key Features 4번(전문가 운영 지원) 새 그림: 운영 리포트 + AI 팀 운영 기록 (숫자는 예시) */
        '<div class="pv-art" aria-hidden="true"><i class="pa-ring"></i><div class="pa-card"><b class="pa-hd">' + I('chart-line-up') + '운영 리포트' + BD('11월', 'fill pa-mo') + '</b>' +
          '<div class="pa-kpi"><div><small>응답 품질</small><b>96<em>▲4</em></b></div><div><small>지식 업데이트</small><b>12<span>건</span></b></div></div></div>' +
          '<div class="pa-card"><b class="pa-hd">' + I('robot') + 'OmicsPharm AI 팀</b><ul class="pa-log"><li><time>11:20</time>응답 품질 평가 완료</li><li><time>10:05</time>연구 지식 3건 반영</li><li><time>09:40</time>연구자 의견 반영 개선</li></ul></div></div>'
      ];
      return '<section class="sec pale sec2" id="security"><div class="wrap">' +
        '<div class="sec-head center"><span class="eyebrow">Key Features</span>' + /* 2026-11-11 보안 → Key Features (운영 지원을 탭으로) */
        '<h2 class="ttl">안전하게 쓰고, <br>전문가와 함께 운영합니다.</h2>' +
        '<p class="lead">연구 자료는 팀 전용 공간에 보관하고, 허용된 사람과 범위만 활용합니다. <br>바이오·헬스케어 전문 AI 팀이 운영과 고도화를 함께합니다.</p></div>' +
        '<div class="seg" role="tablist">' + P.map(function (p, i) { return '<button role="tab" data-pv="' + i + '" aria-selected="' + (i === 0) + '">' + p[0] + '</button>'; }).join('') + '</div>' +
        P.map(function (p, i) {
          return '<div class="pv-panel" data-pvp="' + i + '"' + (i ? ' hidden' : '') + '><div class="pv-txt"><h3>' + p[2] + '</h3><p>' + p[3] + '</p>' +
            '<ul class="pv-list">' + p[4].map(function (t) { return '<li>' + I('check') + t + '</li>'; }).join('') + '</ul></div>' +
            (ART[i] ||
            '<div class="orbit" aria-hidden="true"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i><div class="core">' + I('shield-check') + '</div>' +
            p[5].map(function (t, k) { return '<span class="op o' + (k + 1) + '">' + t + '</span>'; }).join('') + '</div>') + '</div>';
        }).join('') +
        '</div></section>';
    },
    process: function () {
      /* 2026-11-11 피드백 2차: 운영 지원 안에 있던 도입 절차 4단계를 별도 섹션으로 (플랜 비교 다음) */
      return '<section class="sec" id="process"><div class="wrap">' +
        '<div class="sec-head center"><div><span class="eyebrow">Onboarding</span><h2 class="ttl">도입 프로세스</h2></div></div>' +
        '<div class="steps">' + /* 이전 디자인 그대로: 점선 위 번호 원 + 가운데 글, 화면에 들어오면 순서대로 켜짐 */
          '<div><i class="sn">01</i><b>연구·데이터 진단</b><p>연구 목적, 적용 연구, 보안 요구사항 확인</p></div>' +
          '<div><i class="sn">02</i><b>시범 적용·활용 평가</b><p>대표 연구에서 정확성과 활용 가능성 검토</p></div>' +
          '<div><i class="sn">03</i><b>Workspace·Agent 배포</b><p>데이터 연계, Agent 구성, 권한 설정, 교육</p></div>' +
          '<div><i class="sn">04</i><b>운영·지속 고도화</b><p>전문 AI 팀의 품질 평가·개선, 적용 연구 확대</p></div>' +
        '</div>' +
        '</div></section>';
    },
    ops: function () {
      /* 2026-11-09 운영 지원 (카드는 태그 대신 컬러 Fill 아이콘, 개요와 같은 방식): 가운데 제목 → 지원 3가지 카드 → 도입 절차 4단계 (구축 환경은 플랜 비교 표와 겹쳐 삭제) */
      var SV = [
        ['wrench-fill', '연구에 맞는 AI 도입', ['연구 목적에 맞는 AI 설계', '데이터 연결과 권한 설정', '사용자 교육']],
        ['gear-six-fill', '일상적인 AI 활용 지원', ['AI 실행 점검', '연구 지식 업데이트', '활용 문의와 연구 방향 변경 대응']],
        ['chart-line-up-fill', '연구와 함께 지속 고도화', ['응답 품질 평가', '연구자 의견 반영', '분석·제안 절차 개선']]
      ];
      return '<section class="sec ops2" id="managed"><div class="wrap">' +
        '<div class="sec-head center"><div><span class="eyebrow">Managed Service</span><h2 class="ttl">AI 전담팀이 없어도, <br>전문가와 함께 운영하세요.</h2></div>' +
        '<p>OmicsPharm의 바이오·헬스케어 전문 AI 팀이 AI Agent를 구축하고 운영합니다. <br>새 데이터와 연구자의 검토를 반영해 AI를 계속 고도화합니다.</p></div>' +
        '<div class="ops2-sv">' + SV.map(function (x) { return '<article><span class="ops2-ic2">' + I(x[0]) + '</span><h3>' + x[1] + '</h3><ul>' + x[2].map(function (t) { return '<li>' + I('check') + t + '</li>'; }).join('') + '</ul></article>'; }).join('') + '</div>' +
        '</div></section>';
    },
    faq: function () {
      var Q = [
        ['보유한 자료로 시작해도 되나요? 분석도 함께 의뢰할 수 있나요?', '네. 보유한 데이터와 문서로 바로 시작할 수 있고, 새 데이터가 필요하면 연구 목적에 맞는 분석을 의뢰해 결과를 Workspace에 연결할 수 있습니다. 분석 항목·일정·비용은 별도로 협의합니다.'], /* 2026-11-09 기존 1번(분석 의뢰)·7번(분석 없이 도입)을 합침 */
        ['연구 데이터가 축적되면 AI는 어떻게 개선되나요?', 'AI가 참고할 분석 결과와 검토 근거가 늘어납니다. OmicsPharm이 응답 품질을 평가하고 지식과 작업 절차를 개선해, 더 정교한 분석과 연구 제안을 지원합니다.'],
        ['AI 고도화는 우리 데이터로 모델을 학습시킨다는 뜻인가요?', '기본적으로 AI가 승인된 자료와 검토 기준을 참고하도록 개선합니다. AI 모델 자체를 추가 학습시키는 경우에는 데이터 활용 범위와 방식을 기관과 별도로 협의합니다.'],
        ['별도 AI 전담팀이 없어도 활용할 수 있나요?', '네. OmicsPharm의 바이오·헬스케어 전문 AI 팀이 도입부터 운영·고도화까지 지원합니다. 연구팀은 연구 목적을 정하고 결과를 검토하면 됩니다. 전문가 지원 범위와 개선 주기는 도입 시 협의합니다.'],
        ['연구실 단위로 시작해 병원·회사 전체로 확장할 수 있나요?', '네. Private에서 시작해 센터·병원 또는 연구소·회사 단위의 Enterprise로 확장할 수 있습니다. 기존 워크스페이스는 연구실 워크스페이스로 이어지고, 정해진 이용 범위 안에서 관리자가 연구실·부서별 워크스페이스를 추가합니다.'],
        ['같은 기관의 다른 팀이 우리 데이터를 볼 수 있나요?', '팀별 데이터와 AI 활용 기록은 분리해 관리합니다. 기관 공통 지식처럼 공유를 승인한 자료만 정해진 권한 안에서 함께 사용합니다.'],
        ['AI Agent 구축만 의뢰하는 것과 무엇이 다른가요?', '분석 의뢰부터 데이터 축적, AI 활용과 후속 연구를 연결합니다. 도입 이후에도 바이오·헬스케어 전문 AI 팀이 AI를 운영하고 연구 결과에 맞춰 개선합니다.']
      ];
      /* 서비스 소개 > 이용방법(guide.html) 맨 아래 '자주 묻는 질문'과 같은 모양 (2026-11-06) */
      return '<section class="sec" id="faq"><div class="wrap"><div class="faq-head"><h2>자주 묻는 질문</h2><p>더 궁금한 점은 <a data-contact>문의하기</a>를 이용해 주세요.</p></div><div class="qa">' +
        Q.map(function (q) { return '<details><summary><span class="q">Q</span><span class="t">' + q[0] + '</span>' + I('caret-down') + '</summary><div class="a"><b>A</b><div>' + q[1] + '</div></div></details>'; }).join('') + '</div></div></section>';
    },
    plan: function (sec) {
      var ent = sec === 'hospital' ? ['센터 · 병원 전체 단위', '센터 또는 병원 전체로 도입하고, 관리자가 진료과·연구실별 워크스페이스를 생성해 통합 관리합니다.']
        : ['연구소 · 회사 전체 단위', '연구소 또는 회사 전체로 도입하고, 관리자가 부서·프로젝트팀별 워크스페이스를 생성해 통합 관리합니다.'];
      return '<section class="sec" id="plans"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">도입 방식</span><h2 class="ttl">도입 방식은 규모에 맞게.</h2></div>' +
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
    /* 2026-11-09 히어로도 같은 점 빛이 지나감 (.h2-spot). 히어로는 마우스를 따라오지 않음 */
    [['.wcta', '.ws-spot', 1], ['.ws-hero2', '.h2-spot', 0]].forEach(function (q) { (function () { /* 세 번째 값: 마우스 따라오기 (히어로는 빛만 지나감) */
      var box = document.querySelector(q[0]), spot = box && box.querySelector(q[1]);
      if (!spot || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var hover = false, raf = 0, t0 = performance.now();
      function set(x, y) { spot.style.setProperty('--mx', x + 'px'); spot.style.setProperty('--my', y + 'px'); }
      function idle(now) { raf = 0; if (hover) return; var r = box.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) return; var w = box.clientWidth, h = box.clientHeight, k = (now - t0) / 9000; set(w / 2 + Math.sin(k * Math.PI * 2) * w * 0.42, h * (0.55 + Math.sin(k * Math.PI * 4) * 0.2)); raf = requestAnimationFrame(idle); }
      function start() { if (!raf) raf = requestAnimationFrame(idle); }
      if (q[2]) box.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; hover = true; var r = box.getBoundingClientRect(); set(e.clientX - r.left, e.clientY - r.top); });
      if (q[2]) box.addEventListener('pointerleave', function () { hover = false; start(); });
      window.addEventListener('scroll', start, { passive: true }); start();
    })(); });
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
    document.querySelectorAll('#security').forEach(function (sec) { /* 보안 4칸 탭 */
      var bs = sec.querySelectorAll('[data-pv]');
      bs.forEach(function (b) { b.addEventListener('click', function () {
        bs.forEach(function (x) { var on = x === b; x.setAttribute('aria-selected', String(on)); sec.querySelector('[data-pvp="' + x.dataset.pv + '"]').hidden = !on; });
      }); });
    });
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

// 히어로 배경 (2026-11-06, 크몽 Biz 상단 참고): WebGL로 그리는 부드러운 빛. 화면 곳곳의 빛 다섯 개가 서로 다른 박자로 퍼졌다 모임, 글자 뒤는 살짝 어둡게.
// 움직임 줄이기 설정이면 한 장면만 그림. WebGL이 안 되면 CSS 빛(h2-glow)이 그대로 보임.
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.ws-hero2'); if (!hero || hero.dataset.bg !== 'webgl') return; /* 2026-11-09 꺼 둠: 히어로는 CTA처럼 아래쪽 빛만 흐르는 CSS 배경. 되살리려면 섹션에 data-bg="webgl" */
  var cv = document.createElement('canvas'); cv.className = 'h2-canvas'; cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }); if (!gl) return;
  var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs = [
    'precision mediump float;uniform vec2 r;uniform float t;',
    // 부드러운 빛 덩어리: 중심에서 멀어질수록 가우시안으로 옅어짐
    'float L(vec2 p,vec2 c,float s){vec2 d=p-c;return exp(-dot(d,d)/(s*s));}',
    'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=vec2(uv.x*r.x/r.y,uv.y);float a=r.x/r.y;float s=t*.9;',
    // 화면 곳곳(왼쪽 위·오른쪽 아래·오른쪽 위·왼쪽 아래·가운데 아래)에 놓인 빛이 서로 다른 박자로 커졌다 작아지며 퍼짐. 자리는 조금만 움직임
    'float b1=.5+.5*sin(s*.45),b2=.5+.5*sin(s*.38+2.),b3=.5+.5*sin(s*.52+4.),b4=.5+.5*sin(s*.41+1.),b5=.5+.5*sin(s*.33+3.);',
    'float l1=L(p,vec2(a*.12+.06*sin(s*.2),.92+.05*cos(s*.23)),.35+.45*b1)*(.45+.55*b1);',
    'float l2=L(p,vec2(a*.9+.06*cos(s*.21),.1+.05*sin(s*.27)),.4+.5*b2)*(.45+.55*b2);',
    'float l3=L(p,vec2(a*.82+.05*sin(s*.19),.95),.3+.35*b3)*(.4+.6*b3);',
    'float l4=L(p,vec2(a*.2+.05*cos(s*.24),.05),.3+.35*b4)*(.4+.6*b4);',
    'float l5=L(p,vec2(a*.5+.08*sin(s*.17),-.15),.35+.4*b5)*(.4+.6*b5);',
    'vec3 c=vec3(.012,.07,.065);',
    'c+=vec3(.06,.50,.43)*l1*.8+vec3(.10,.62,.53)*l2*.9+vec3(.08,.24,.44)*l3*.6+vec3(.04,.40,.36)*l4*.6+vec3(.10,.58,.50)*l5*.7;',
    'c=(1.-exp(-c*1.8))*.72;', // 빛이 겹쳐도 너무 밝아지지 않게
    'vec2 d=uv-vec2(.5,.52);c*=1.-.35*exp(-dot(d*vec2(1.6,2.4),d*vec2(1.6,2.4))*3.);', // 글자 뒤 살짝 어둡게
    'c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;', // 띠 무늬 방지
    'gl_FragColor=vec4(c,1.);}'
  ].join('\n');
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var ur = gl.getUniformLocation(pr, 'r'), ut = gl.getUniformLocation(pr, 't');
  hero.insertBefore(cv, hero.firstChild); hero.classList.add('has-canvas');
  function size() { var k = Math.min(window.devicePixelRatio || 1, 1.5) * .5; cv.width = Math.round(hero.offsetWidth * k); cv.height = Math.round(hero.offsetHeight * k); gl.viewport(0, 0, cv.width, cv.height); }
  size(); window.addEventListener('resize', size);
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches, t0 = performance.now(), vis = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !still) requestAnimationFrame(draw); }).observe(hero);
  function draw(now) {
    gl.uniform2f(ur, cv.width, cv.height); gl.uniform1f(ut, still ? 20 : (now - t0) / 1000 + 20);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!still && vis) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
});

// 섹션 등장 효과 (2026-11-09): 히어로 아래 모든 섹션 내용이 화면 88% 지점에 들어오면
// 메인과 같은 효과(흐림 5px + 2rem 아래에서, 0.9s, 화면 90% 지점, 차례 0.12s)로 떠오름. 히어로 포함, 공통 진입 효과는 끔(data-op-no-enter). 움직임 줄이기는 효과 없음
document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { /* 블록을 그린 직후 */
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var items = [];
  document.querySelectorAll('main > section.ws-hero2, main > section.sec > .wrap, main > section.wcta').forEach(function (box) {
    var kids = box.matches('.wcta') ? [box.querySelector('.wcta-in')] : box.matches('.ws-hero2') ? [box.querySelector('.h2-in'), box.querySelector('.h2-tiles')] : [].slice.call(box.children);
    kids.forEach(function (el, i) { if (!el || el.hidden) return; /* 숨은 탭 패널 제외. 2026-11-11 작동 방식 화살표·문장도 다른 요소처럼 떠오름 (화살표 반복 애니메이션은 없앰) */ el.classList.remove('op-enter'); el.style.removeProperty('--op-d'); el.setAttribute('data-op-skip-enter', ''); el.classList.add('rv', 'rv-0'); el.style.setProperty('--d', Math.min(i, 2) * 0.12 + 's'); items.push(el); });
  });
  var ready = false; /* 숨긴 상태가 먼저 그려진 뒤에만 켬 (load·scroll이 먼저 오면 움직임 없이 바로 보이는 문제) */
  function reveal() { if (!ready) return; var lim = innerHeight * 0.9; /* 메인과 같게: 열 때도 스크롤할 때도 화면 90% 지점 */ items.forEach(function (el) { if (!el.classList.contains('rv-in') && el.getBoundingClientRect().top < lim) el.classList.add('rv-in'); }); }
  window.addEventListener('scroll', reveal, { passive: true }); window.addEventListener('resize', reveal); window.addEventListener('load', reveal);
  requestAnimationFrame(function () { requestAnimationFrame(function () { items.forEach(function (el) { el.classList.remove('rv-0'); }); void document.body.offsetHeight; ready = true; reveal(); }); }); /* 처음부터 보이는 섹션도 숨긴 상태를 한 번 그린 뒤 떠오르게 (같은 순간에 켜면 움직임이 안 보임) */
}, 0); });

// 작동 방식 되돌아가는 화살표 (2026-11-09, 메인 Service 화살표와 같은 반복): 04 쪽에서 선이 그려지고(0~25%) 화살촉(25~37.5%),
// 잠시 머문 뒤(~80%) 사라지기를 2초마다 반복. 화면에 보일 때만 돌고, 움직임 줄이기면 그려진 채로 멈춤. 선은 칸 너비에 맞춰 SVG로 그림
document.addEventListener('DOMContentLoaded', function () { setTimeout(function () {
  var lp = document.querySelector('.hw-loop'), box = lp && lp.querySelector('.hw-arrow'); if (!box) return;
  function draw() {
    var W = Math.round(box.offsetWidth), H = 40, r = 12;
    box.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<path class="l" d="M' + (W - 1) + ' 0V' + (H - 1 - r) + 'Q' + (W - 1) + ' ' + (H - 1) + ' ' + (W - 1 - r) + ' ' + (H - 1) + 'H' + (1 + r) + 'Q1 ' + (H - 1) + ' 1 ' + (H - 1 - r) + 'V1"/>' +
      '<path class="h" d="M-5 7L1 1L7 7"/></svg>'; /* 2026-11-11 그리기 애니메이션이 없어져 pathLength 뺌 (점선 간격을 px로) */
  }
  draw(); window.addEventListener('resize', draw);
  // 2026-11-10 피드백 2차 10번: 반복 애니메이션 없이 그려진 채로 둠 (.in 을 붙이지 않음)
}, 0); });

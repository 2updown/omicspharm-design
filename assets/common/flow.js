/* 견적 중개 흐름 (프로토타입, 이 브라우저 localStorage 'op.flow' 기준)
   클라이언트 의뢰 → 컨설턴트(셀키) 검토 → 분석파트너에게 견적 요청 → 파트너 견적 제출·거절
   → 컨설턴트 확인 (필요하면 수정 요청) → 여러 견적을 클라이언트에게 전달 → 클라이언트가 하나를 선택 → 매칭 완료(계약)
   - 파트너는 견적 요청을 받은 의뢰만 볼 수 있다
   - 파트너 견적은 수정 없이 그대로 전달하고, 기관명도 공개한다
   - 데모: 로그인 가능한 파트너는 partner@omicspharm.test 하나이고, 나머지 파트너는 요청을 받으면 바로 응답한다
   사용: mypage.js 다음에 불러오고 OP.flow.* 사용 */
(function () {
  var KEY = 'op.flow', VER = 7; // 3: 프로젝트 번호 통일 (PRJ-연도-일련번호), 4: 분석파트너 예시 0046·0047 추가, 5: 예시 견적 단위 EA, 6: 분석 진행·결과 수령 예시 + 2차 견적 예시, 7: 그 예시 번호를 0036·0035로 (분석파트너 예시 0040·0041과 겹침)
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
    { key: ME_PARTNER, org: '세움분석센터', name: '김파트너', tel: '010-2345-6789', mail: ME_PARTNER, svc: ['단백체', '대사체', '바이오의약품'], verified: true, done: 38, lead: '평균 6주', login: true },
    { key: 'p-bio', org: '라온바이오랩', name: '이담당', tel: '02-000-1001', mail: 'contact@biolab.test', svc: ['단백체', 'Olink', '대사체'], verified: true, done: 52, lead: '평균 5주', rate: .92, weeks: 5 },
    { key: 'p-omx', org: '하늬오믹스', name: '박담당', tel: '031-000-1002', mail: 'sales@omics.test', svc: ['전사체', '유전체', '단백체'], verified: true, done: 27, lead: '평균 7주', rate: 1.08, weeks: 7 },
    { key: 'p-gen', org: '다온유전체센터', name: '최담당', tel: '042-000-1003', mail: 'info@genome.test', svc: ['유전체', '전사체'], verified: true, done: 64, lead: '평균 6주', rate: 1, weeks: 6 },
    { key: 'p-met', org: '온누리대사체연구소', name: '정담당', tel: '02-000-1004', mail: 'lab@metabo.test', svc: ['대사체', 'Olink'], verified: true, done: 19, lead: '평균 6주', rate: .97, weeks: 6 },
    { key: 'p-adc', org: '이룸바이오로직스', name: '한담당', tel: '032-000-1005', mail: 'bd@biologics.test', svc: ['바이오의약품', '단백체'], verified: true, done: 11, lead: '평균 8주', rate: 1.15, weeks: 8, svcInfo: false }, // svcInfo:false = 분석 서비스 정보 미입력 예시
    { key: 'p-prt', org: '가람프로틴랩', name: '윤담당', tel: '02-000-1007', mail: 'lab@protein.test', svc: ['단백체'], verified: true, done: 8, lead: '평균 6주', rate: 1.02, weeks: 6, svcInfo: false }, // 견적에 참여하지 않은 분석 서비스 정보 미입력 예시 (AI 매칭 '정보 부족' 탭)
    { key: 'p-mlt', org: '누리멀티오믹스', name: '서담당', tel: '02-000-1008', mail: 'hello@multiomics.test', svc: ['단백체', '대사체', '전사체', '유전체'], verified: true, done: 45, lead: '평균 6주', rate: 1, weeks: 6 }, // 여러 오믹스를 폭넓게 지원하는 예시 (AI 매칭 '조건 충족' 예시)
    { key: 'p-new', org: '새봄랩', name: '오담당', tel: '010-0000-1006', mail: 'hello@newlab.test', svc: ['단백체', '전사체'], verified: false, done: 0, lead: '-' }
  ];
  var partner = function (k) { return PARTNERS.filter(function (p) { return p.key === k; })[0] || { key: k, org: k, svc: [] }; };
  // 분석 서비스 정보 입력 여부: 가입 계정은 회원정보 > 분석 서비스 정보 기준, 예시 파트너는 svcInfo 값
  var svcInfo = function (k) { var a = OP.account && OP.account(k); return a && a.role === 'partner' ? !!(a.services || []).length : partner(k).svcInfo !== false; };
  // 컨설턴트의 분석 서비스 정보 입력 요청 (견적 검토 중, 안내만 · 견적 전달은 막지 않음) { 파트너 키: 요청 시각 }
  var svcAsked = function (k) { return read('op.svcAsk', {})[k] || 0; };
  var svcAsk = function (k) { var m = read('op.svcAsk', {}); m[k] = Date.now(); write('op.svcAsk', m); };
  var fits = function (p, svc) { return p.svc.some(function (s) { return String(svc || '').indexOf(s) > -1; }); };

  // 예시 의뢰 (클라이언트 데모 계정 client@omicspharm.test 소유) — 단계별로 하나씩
  var T0 = new Date(2026, 9, 6, 10, 0).getTime();
  // 견적 마감일 기본값 = 의뢰의 모집기한 끝. 이미 지난 날짜면(예시 의뢰는 10/6 기준) 오늘부터 2주로 (2026-10-27)
  var futureTo = function (r) { return r.to && new Date(r.to + 'T23:59:59') >= new Date() ? r.to : ''; };
  var DEMO_REQS = [
    { id: 'PRJ-2026-0043', demo: true, at: T0 - DAY * 1, svc: '단백체 분석', title: '혈장 시료 TMT 정량 단백체 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '20', due: '2026-12-18', from: '2026-10-05', to: '2026-10-19', budget: '1,000만원 이상', open: '공개',
      purpose: '대조군 10명, 환자군 10명 혈장에서 차등 발현 단백질을 찾고, 후보 바이오마커를 선별하고자 합니다.',
      sections: [{ title: '분석 서비스 : 단백체 분석', rows: [['분석 유형', '비표적 단백체'], ['분석 목적', '단백질 발현 비교, 바이오마커 후보'], ['원하는 분석 결과', '상대정량, 군 간 비교, 차등단백질, Pathway'], ['통계 · 해석', 'PCA, Volcano plot, Enrichment']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', '혈장'], ['총 시료 수', '20개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '대조군 · 10개'], ['실험군', '환자군 · 10개']] },
        { title: '요구사항', rows: [['희망완료일', '2026-12-18'], ['일정 협의 가능 여부', '가능'], ['예상금액', '1,000만원 이상'], ['시료 전처리 기술', 'TMT'], ['분석 기술', 'DDA'], ['희망 장비', 'Orbitrap']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 국문 보고서'], ['산출물 용도', '논문 학술용']] },
        { title: '추가 요청사항 및 후속 연구계획', note: '시료는 계약 후 드라이아이스로 발송 예정입니다. 분석 일정 제안 부탁드립니다.' }] },
    { id: 'PRJ-2026-0044', demo: true, at: T0 - DAY * 4, svc: '대사체 분석', title: '마우스 뇌 조직 비표적 대사체 프로파일링', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '24', due: '2026-12-31', from: '2026-10-02', to: '2026-10-16', budget: '500만~1,000만원', open: '비공개',
      purpose: '약물 투여군과 대조군 마우스 뇌 조직에서 대사체 변화를 확인하고자 합니다.',
      sections: [{ title: '분석 서비스 : 대사체 분석', rows: [['분석 유형', '비표적 대사체'], ['플랫폼', 'LC-MS'], ['측정 모드', 'Positive+Negative'], ['요청 분석 목적', '약물·처리 반응, 대사경로 변화']] },
        { title: '비표적 대사체', rows: [['원하는 분석 결과', '검출·동정, 상대정량, 차등 대사체, Pathway'], ['통계분석', 'PCA, Volcano plot, PLS-DA'], ['후속 분석', '없음']] },
        { title: '시료 정보', rows: [['생물종', 'Mouse'], ['시료 종류', '조직'], ['총 시료 수', '24개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '대조군 · 8개'], ['실험군', '저용량 · 8개'], ['실험군', '고용량 · 8개']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '내부 연구용']] }] },
    { id: 'PRJ-2026-0045', demo: true, at: T0 - DAY * 9, svc: '전사체 분석', title: '종양 조직 RNA-seq 차등 발현 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '16', due: '2026-12-10', from: '2026-09-25', to: '2026-10-09', budget: '1,000만원 이상', open: '공개',
      purpose: '항암제 처리 전후 종양 조직의 유전자 발현 변화를 비교하고자 합니다.',
      sections: [{ title: '분석 서비스 : 전사체 분석', rows: [['분석 유형', '일반 전사체 발현'], ['일반 전사체 발현 · 분석 항목', 'Total RNA-seq, Low-input·FFPE RNA-seq'], ['연구 목적', '발현량 비교, Pathway 분석'], ['원하는 분석 결과', '유전자 발현량, DEG, Pathway'], ['참조정보', 'GRCh38'], ['핵산 추출 상태', '미추출 시료'], ['시료 상태', 'FFPE'], ['Library 유형', 'Stranded'], ['시퀀싱 방식', 'Paired-end']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', 'FFPE 조직'], ['총 시료 수', '16개'], ['보관상태', '냉장']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '처리 전 · 8개'], ['실험군', '처리 후 · 8개']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'FASTQ, Count matrix, DEG 결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] },
    // 분석파트너 데모(partner@omicspharm.test)용: 임시저장 1건, 제출 완료 1건
    { id: 'PRJ-2026-0046', demo: true, at: T0 - DAY * 3, svc: '단백체 분석', title: '세포 배양액 분비 단백질 Label-free 정량 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '12', due: '2026-12-24', from: '2026-10-03', to: '2026-10-17', budget: '500만~1,000만원', open: '공개',
      purpose: '약물 처리 전후 세포 배양액에서 분비 단백질 변화를 확인하고자 합니다.',
      sections: [{ title: '분석 서비스 : 단백체 분석', rows: [['분석 유형', '비표적 단백체'], ['분석 목적', '단백질 발현 비교'], ['원하는 분석 결과', '상대정량, 군 간 비교, 차등단백질'], ['통계 · 해석', 'PCA, Volcano plot']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', '세포 배양액'], ['총 시료 수', '12개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '처리 전 · 6개'], ['실험군', '처리 후 · 6개']] },
        { title: '요구사항', rows: [['희망완료일', '2026-12-24'], ['일정 협의 가능 여부', '가능'], ['예상금액', '500만~1,000만원'], ['시료 전처리 기술', 'Label-free'], ['분석 기술', 'DIA']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '내부 연구용']] }] },
    { id: 'PRJ-2026-0047', demo: true, at: T0 - DAY * 6, svc: '대사체 분석', title: '혈청 아미노산 표적 대사체 절대정량', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '30', due: '2026-12-15', from: '2026-09-30', to: '2026-10-14', budget: '500만원 미만', open: '비공개',
      purpose: '식이 중재 전후 혈청 아미노산 농도 변화를 정량하고자 합니다.',
      sections: [{ title: '분석 서비스 : 대사체 분석', rows: [['분석 유형', '표적 대사체'], ['플랫폼', 'LC-MS/MS'], ['요청 분석 목적', '바이오마커 정량']] },
        { title: '표적 대사체', rows: [['표적 패널', 'Amino acid·BCAA'], ['표적 대사체명', 'Leucine, Isoleucine, Valine, Glutamine'], ['정량 방식', '절대정량'], ['내부표준물질 준비', '미보유'], ['검량선용 표준물질 보유', '확인 필요']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', '혈청'], ['총 시료 수', '30개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '중재 전 · 15개'], ['실험군', '중재 후 · 15개']] },
        { title: '희망 산출물', rows: [['희망 산출물', '결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] },
    // 클라이언트 데모: 분석 진행(계약 완료) 1건, 결과 수령(결과보고서 2차까지) 1건
    { id: 'PRJ-2026-0036', demo: true, at: T0 - DAY * 30, svc: '단백체 분석', title: '간암 조직 인산화 단백체 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '12', due: '2026-12-04', from: '2026-09-01', to: '2026-09-15', budget: '1,000만원 이상', open: '공개',
      purpose: '간암 조직과 정상 조직의 인산화 신호 차이를 확인하고자 합니다.',
      sections: [{ title: '분석 서비스 : 단백체 분석', rows: [['분석 유형', '번역 후 변형(PTM)'], ['PTM 종류', '인산화'], ['원하는 분석 결과', '상대정량, 차등 인산화 사이트, Kinase 분석']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', '조직'], ['총 시료 수', '12개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] },
    { id: 'PRJ-2026-0035', demo: true, at: T0 - DAY * 60, svc: '대사체 분석', title: '장내 미생물 대사산물 단쇄지방산 정량', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '18', due: '2026-10-10', from: '2026-08-01', to: '2026-08-14', budget: '500만~1,000만원', open: '공개',
      purpose: '프로바이오틱스 투여 전후 분변 시료의 단쇄지방산 농도 변화를 정량하고자 합니다.',
      sections: [{ title: '분석 서비스 : 대사체 분석', rows: [['분석 유형', '표적 대사체'], ['플랫폼', 'GC-MS'], ['표적 패널', '단쇄지방산(SCFA)'], ['정량 방식', '절대정량']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', '분변'], ['총 시료 수', '18개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '희망 산출물', rows: [['희망 산출물', '국문 보고서, 영문 보고서, 결과 이미지, Raw data'], ['산출물 용도', '논문 학술용']] }] },
    // 견적 대기 예시: 승인되어 게시됐지만 아직 견적이 없음 (state는 waitDemo)
    { id: 'PRJ-2026-0048', demo: true, at: T0 - DAY * 2, svc: '유전체 분석', title: '폐암 FFPE 조직 표적 유전자 패널 시퀀싱', org: '해솔대학교 의과대학', manager: '김민준', bizDoc: '사업자등록증_해솔대학교.pdf', owner: 'user01@example.test', samples: '30', due: '2027-01-15', from: '2026-10-20', to: '2026-11-03', budget: '500~1,000만원', open: '공개',
      purpose: '폐암 환자 FFPE 조직 30건에서 표적 유전자 패널로 변이를 확인하고자 합니다.',
      sections: [{ title: '분석 서비스 : 유전체 분석', rows: [['분석 유형', '변이·암 유전체'], ['연구 목적', '변이 발굴, 암 유전체'], ['원하는 분석 결과', 'SNV·Indel, CNV·SV'], ['참조정보', 'GRCh38']] },
        { title: '시료 정보', rows: [['생물종', 'Human'], ['시료 종류', 'FFPE 조직'], ['총 시료 수', '30개']] },
        { title: '요구사항', rows: [['희망완료일', '2027-01-15'], ['일정 협의 가능 여부', '가능'], ['예상금액', '500~1,000만원']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] },
    // 계약서 등록 예시 (state는 ctDemo): 클라이언트가 최종 견적을 확정했고 컨설턴트가 계약서를 등록하기 전
    { id: 'PRJ-2026-0050', demo: true, at: T0 - DAY * 14, svc: '단백체 분석', title: '마우스 혈청 엑소좀 단백체 정량 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '16', due: '2026-12-31', from: '2026-09-20', to: '2026-10-04', budget: '500만~1,000만원', open: '공개',
      purpose: '질환 모델 마우스와 정상 마우스 혈청 엑소좀의 단백질 발현 차이를 비교하고자 합니다.',
      sections: [{ title: '분석 서비스 : 단백체 분석', rows: [['분석 유형', '비표적 단백체'], ['분석 목적', '단백질 발현 비교'], ['원하는 분석 결과', '상대정량, 군 간 비교, 차등단백질']] },
        { title: '시료 정보', rows: [['생물종', 'Mouse'], ['시료 종류', '혈청 엑소좀'], ['총 시료 수', '16개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '정상 · 8개'], ['실험군', '질환 모델 · 8개']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] },
    // 클라이언트 견적 전달 후 수정 요청 예시 (state는 revDemo)
    { id: 'PRJ-2026-0049', demo: true, at: T0 - DAY * 10, svc: '대사체 분석', title: '비알코올성 지방간 마우스 간 조직 지질 대사체 분석', org: '한결연구소', manager: '홍길동', bizDoc: '사업자등록증_한결연구소.pdf', owner: 'client@omicspharm.test', samples: '30', due: '2026-12-20', from: '2026-09-25', to: '2026-10-02', budget: '500만~1,000만원', open: '공개',
      purpose: '고지방식이 마우스와 정상식이 마우스의 간 조직에서 지질 대사체 변화를 비교하고자 합니다.',
      sections: [{ title: '분석 서비스 : 대사체 분석', rows: [['분석 유형', '비표적 대사체'], ['플랫폼', 'LC-MS'], ['측정 모드', 'Positive+Negative'], ['요청 분석 목적', '질병 기전, 대사경로 변화']] },
        { title: '시료 정보', rows: [['생물종', 'Mouse'], ['시료 종류', '조직'], ['총 시료 수', '30개'], ['보관상태', '초저온 (-80℃)']] },
        { title: '분석 그룹', rows: [['비교군 구성', '그룹 있음'], ['대조군', '정상식이 · 15개'], ['실험군', '고지방식이 · 15개']] },
        { title: '희망 산출물', rows: [['희망 산출물', 'Raw data, 결과표, 국문 보고서'], ['산출물 용도', '논문 학술용']] }] }
  ];

  // 가상 파트너 견적 (서비스·시료 수 기준으로 만든 예시)
  var BASE = [['단백체', 38], ['Olink', 22], ['대사체', 26], ['유전체', 46], ['전사체', 32], ['바이오의약품', 62]];
  function genQuote(p, r, k) {
    var unit = (BASE.filter(function (b) { return String(r.svc).indexOf(b[0]) > -1; })[0] || [0, 30])[1] * 10000;
    var n = parseInt(r.samples, 10) || 12, rate = (p.rate || 1) * (k || 1);
    var prep = Math.round(unit * .35 * rate / 1000) * 1000, run = Math.round(unit * .65 * rate / 1000) * 1000, data = Math.round(n * unit * .18 * rate / 10000) * 10000;
    var groups = [
      { name: r.svc.replace(' 분석', '') + ' 분석', lines: [{ d: '시료 전처리 및 QC', q: n, u: 'EA', p: prep }, { d: '기기 분석', q: n, u: 'EA', p: run }] },
      { name: '데이터 분석', lines: [{ d: '통계 분석 및 결과 리포트', q: 1, u: 'EA', p: data }] }
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
  var OLDMSG = ['세 기관 모두 FFPE 시료 경험이 있습니다. 일정이 급하시면 라온바이오랩보다 다온유전체센터를 추천드립니다.', '두 곳 모두 FFPE 시료 경험이 있습니다. 일정이 급하시면 소요 기간이 짧은 A사를 추천드립니다.'];
  function seed() {
    var r2 = DEMO_REQS[1], r3 = DEMO_REQS[2], S = {};
    S[r2.id] = { st: 'quoting', ok: T0 - DAY * 3.5, reqAt: T0 - DAY * 3, due: iso(Date.now() + DAY * 10), // 견적 작성 예시라 마감일은 항상 앞으로 (2026-10-28: 마감 후 제출 불가)
      memo: '시료 수가 많아 일정 제안을 함께 부탁드립니다.', P: {} };
    S[r2.id].P[ME_PARTNER] = { at: T0 - DAY * 3, status: 'req' };
    ['p-bio', 'p-met'].forEach(function (k, i) { var p = partner(k); S[r2.id].P[k] = { at: T0 - DAY * 3, status: 'sub', quote: genQuote(p, r2), subAt: T0 - DAY * (2 - i) }; });
    S[r3.id] = { st: 'sent', ok: T0 - DAY * 8.5, reqAt: T0 - DAY * 8, due: '2026-10-01', memo: '', P: {}, sentAt: T0 - DAY * 2, msg: OLDMSG[1] };
    [['p-gen', 1], ['p-omx', 1], ['p-bio', 0]].forEach(function (a, i) {
      var p = partner(a[0]); S[r3.id].P[a[0]] = a[1] ? { at: T0 - DAY * 8, status: 'sub', quote: genQuote(p, r3), subAt: T0 - DAY * (6 - i), fwd: true }
        : { at: T0 - DAY * 8, status: 'dec', dec: { at: T0 - DAY * 7, why: '해당 기간 시퀀싱 장비 일정이 모두 차 있습니다.' } };
    });
    // 전달된 견적 하나는 수정 요청을 한 번 거친 것으로
    S[r3.id].P['p-omx'].revN = 1;
    // 분석파트너 데모: 0046은 임시저장, 0047은 제출 완료(컨설턴트 확인 전)
    var r4 = DEMO_REQS[3], r5 = DEMO_REQS[4], me = partner(ME_PARTNER);
    S[r4.id] = { st: 'quoting', ok: T0 - DAY * 2.5, reqAt: T0 - DAY * 2, due: iso(Date.now() + DAY * 12), memo: '', P: {} };
    S[r4.id].P[ME_PARTNER] = { at: T0 - DAY * 2, status: 'draft', quote: genQuote(me, r4) };
    S[r4.id].P['p-adc'] = { at: T0 - DAY * 2, status: 'sub', quote: genQuote(partner('p-adc'), r4), subAt: T0 - DAY };
    S[r5.id] = { st: 'quoting', ok: T0 - DAY * 5.5, reqAt: T0 - DAY * 5, due: '2026-10-12', memo: '절대정량이 가능한 기관 위주로 요청드립니다.', P: {} };
    S[r5.id].P[ME_PARTNER] = { at: T0 - DAY * 5, status: 'sub', quote: genQuote(me, r5), subAt: T0 - DAY * 3 };
    S[r5.id].P['p-met'] = { at: T0 - DAY * 5, status: 'sub', quote: genQuote(partner('p-met'), r5), subAt: T0 - DAY * 4 };
    seed6(S);
    return { v: VER, S: S };
  }
  // 6·7: 분석 진행(0036)·결과 수령(0035) 예시 + 0045의 B사 견적을 2차로(1차는 hist)
  function seed6(S) {
    var a = req2('PRJ-2026-0036'), b = req2('PRJ-2026-0035');
    if (!S[a.id]) {
      S[a.id] = { st: 'matched', ok: T0 - DAY * 29, reqAt: T0 - DAY * 28, due: '2026-09-15', memo: '', P: {}, sentAt: T0 - DAY * 20, pick: 'p-mlt', pickAt: T0 - DAY * 17,
        ct: { at: T0 - DAY * 12, due: '2026-12-04', client: { type: 'form' }, partner: { type: 'form' } } };
      S[a.id].P['p-mlt'] = { at: T0 - DAY * 28, status: 'sub', quote: genQuote(partner('p-mlt'), a), subAt: T0 - DAY * 22, fwd: true };
    }
    if (!S[b.id]) {
      S[b.id] = { st: 'matched', ok: T0 - DAY * 59, reqAt: T0 - DAY * 58, due: '2026-08-14', memo: '', P: {}, sentAt: T0 - DAY * 50, pick: ME_PARTNER, pickAt: T0 - DAY * 47,
        ct: { at: T0 - DAY * 44, due: '2026-10-10', client: { type: 'form' }, partner: { type: 'form' } },
        rep: [{ at: T0 - DAY * 6, files: ['분석결과보고서_국문_v1.pdf', '분석결과보고서_영문_v1.pdf', '결과이미지_v1.pdf', 'RawData.xlsx'] },
              { at: T0 - DAY * 1, files: ['분석결과보고서_국문_v2.pdf', '분석결과보고서_영문_v2.pdf', '결과이미지_v2.pdf', 'RawData.xlsx'], note: '요청하신 대로 그룹별 Boxplot을 추가하고, 통계 검정 방법을 Wilcoxon으로 바꿨습니다.' }] };
      S[b.id].P[ME_PARTNER] = { at: T0 - DAY * 58, status: 'sub', quote: genQuote(partner(ME_PARTNER), b), subAt: T0 - DAY * 52, fwd: true }; // 2026-10-28: 결과 재등록 요청을 분석파트너 데모 계정으로 볼 수 있게 세움분석센터로
    }
    var x = S['PRJ-2026-0045'] && S['PRJ-2026-0045'].P['p-omx'];
    if (x && x.quote && !x.hist) { var hq = genQuote(partner('p-omx'), req2('PRJ-2026-0045'), 1.06); hq.subAt = T0 - DAY * 4; x.hist = [{ quote: hq, at: T0 - DAY * 4 }]; x.ver2At = T0 - DAY; }
    histDemo(S);
  }
  // 2차 견적 예시: 1차는 8주였고, 일정 단축 요청으로 단가·기간을 조정한 것으로 (이미 저장된 기록에도 채움)
  function histDemo(S) {
    var x = S['PRJ-2026-0045'] && S['PRJ-2026-0045'].P['p-omx'];
    if (x && x.hist && x.hist[0] && !x.why) { x.hist[0].quote.weeks = '8'; x.why = '클라이언트의 일정 단축 요청에 따라 기기 분석 단가와 소요 기간을 조정했습니다.'; return true; }
  }
  // 보고서 에이전트 예시: 0036 = 분석파트너가 결과를 올려 AI 초안이 생성된 상태(컨설턴트 검토 대기), 0035 = 1·2차 결과를 보고서로 전달한 이력
  // 보고서 에이전트 예시는 새로고침(F5)하면 처음 상태로: 0036 = AI 초안 검토 대기, 0035 = 1차 전달 완료(클라이언트 검수 대기), 분석파트너 예시(0037~0042) = 결과 등록 전
  // 다른 화면으로 이동하거나 계정을 바꿀 때는 그대로 둠 (전달 → 클라이언트 화면 확인처럼 이어서 볼 수 있게)
  // 2026-10-28: 예시 의뢰(DEMO_REQS)는 견적 진행 상태까지 전부 처음 값으로 다시 만듦. 직접 제출한 의뢰는 그대로 둠
  function repReset(S) {
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (!nav || nav.type !== 'reload') return false;
    var n = seed().S;
    DEMO_REQS.forEach(function (r) { delete S[r.id]; if (n[r.id]) S[r.id] = n[r.id]; });
    ['PRJ-2026-0037', 'PRJ-2026-0038', 'PRJ-2026-0039', 'PRJ-2026-0040', 'PRJ-2026-0041', 'PRJ-2026-0042'].forEach(function (k) { if (S[k]) { delete S[k].raw; delete S[k].rep; } });
    var o = 'user01@example.test'; if (OP.account && OP.account(o)) OP.saveAccount(o, { bizOk: 0, bizOkName: '' }); // 0048 사업자등록증도 확인 전으로
    histDemo(S); repDemo(S); waitDemo(S); selfDemo(S); revDemo(S); ctDemo(S);
    return true;
  }
  // 클라이언트 견적 전달 후 수정 요청 예시 (2026-10-28): 0049 = 세움분석센터 견적을 기준으로 1차 견적서를 보냈고, 세움분석센터에 수정 요청 중
  // 계약서 등록 예시 (2026-10-28): 0050 = 세움분석센터 견적(파트너 공급가)에 셀키 수수료를 붙인 1차 견적서를 클라이언트가 확정, 계약서 등록 전
  function ctDemo(S) {
    var r = req2('PRJ-2026-0050'); if (S[r.id]) return false;
    var me = partner(ME_PARTNER), q = genQuote(me, r), cq = genQuote(me, r, 1.15);
    q.subAt = T0 - DAY * 10; cq.supplier = F.SELLER; cq.sale = ''; cq.final = total(cq).final;
    var s = S[r.id] = { st: 'matched', ok: T0 - DAY * 13.5, reqAt: T0 - DAY * 13, due: '2026-10-04', memo: '', P: {}, sentAt: T0 - DAY * 8, pick: ME_PARTNER, pickAt: T0 - DAY * 2,
      CQ: [{ n: 1, at: T0 - DAY * 8, base: ME_PARTNER, quote: cq, why: '' }], sends: [{ at: T0 - DAY * 8, keys: [ME_PARTNER], cq: 1 }] };
    s.P[ME_PARTNER] = { at: T0 - DAY * 13, status: 'sub', quote: q, subAt: T0 - DAY * 10, fwd: true };
    return true;
  }
  function revDemo(S) {
    var r = req2('PRJ-2026-0049'); if (S[r.id]) return false;
    var me = partner(ME_PARTNER), q = genQuote(me, r), cq = genQuote(me, r, 1.1);
    q.subAt = T0 - DAY * 6; cq.supplier = F.SELLER; cq.sale = ''; cq.final = total(cq).final;
    var s = S[r.id] = { st: 'sent', ok: T0 - DAY * 9.5, reqAt: T0 - DAY * 9, due: '2026-10-02', memo: '', P: {}, sentAt: T0 - DAY * 4,
      CQ: [{ n: 1, at: T0 - DAY * 4, base: ME_PARTNER, quote: cq, why: '' }], sends: [{ at: T0 - DAY * 4, keys: [ME_PARTNER], cq: 1 }] };
    // 2026-10-30: 수정 요청 대신 컨설턴트가 직접 수정한 예시
    s.P[ME_PARTNER] = { at: T0 - DAY * 9, status: 'sub', quote: q, subAt: T0 - DAY * 1, revN: 1, fwd: true,
      ed: { at: T0 - DAY * 1, note: '클라이언트 요청으로 시료를 30개에서 36개로 늘려 단가와 소요 기간을 조정했습니다.' } };
    s.P['p-bio'] = { at: T0 - DAY * 9, status: 'sub', quote: genQuote(partner('p-bio'), r), subAt: T0 - DAY * 7 };
    return true;
  }
  // 2026-10-30: 수정 요청이 없어짐 → 이미 저장된 '수정 요청' 견적은 컨설턴트가 직접 수정한 것으로 바꿈
  function revMig(S) {
    var ch = false;
    Object.keys(S).forEach(function (id) { var P = S[id].P || {}; Object.keys(P).forEach(function (k) { var x = P[k]; if (x.status !== 'rev') return;
      x.status = 'sub'; x.ed = { at: x.rev ? x.rev.at : Date.now(), note: id === 'PRJ-2026-0049' ? '클라이언트 요청으로 시료를 30개에서 36개로 늘려 단가와 소요 기간을 조정했습니다.' : '' }; x.subAt = x.ed.at;
      if (id === 'PRJ-2026-0049') x.fwd = true; delete x.rev; ch = true; }); });
    return ch;
  }
  // 직접 신청 예시 (2026-10-27): 분석파트너 데모의 0047 견적은 프로젝트 찾기에서 직접 신청해 제출한 건으로
  function selfDemo(S) { var x = S['PRJ-2026-0047'] && S['PRJ-2026-0047'].P[ME_PARTNER]; if (!x || x.selfSet) return false; x.self = true; x.selfSet = 1; return true; }
  function waitDemo(S) { if (S['PRJ-2026-0048']) return false; S['PRJ-2026-0048'] = { st: 'review', ok: T0 - DAY * 1, P: {} }; return true; }
  function repDemo(S) {
    var a = S['PRJ-2026-0036'], b = S['PRJ-2026-0035'], ch = false;
    if (a && a.ct && !a.raw && !a.rep) { a.raw = [{ at: T0 - DAY * 2, files: ['RawData_PhosphoProteome.zip', 'PeptideSummary.xlsx', '분석결과_정리_누리멀티오믹스.docx'], ai: '결과보고서_AI초안_2026-0036_v1.docx' }]; ch = true; }
    if (b && b.rep && b.rep.length > 1 && !b.one) { b.rep = [b.rep[0]]; if (b.raw) b.raw = [b.raw[0]]; b.one = 1; ch = true; } // 지금은 1차 결과만 (2·3차는 미정)
    if (b && b.rep && !b.raw) { b.raw = b.rep.map(function (v, i) { return { at: v.at - DAY, files: i ? ['RawData_v2.xlsx', '수정사항_정리.docx'] : ['RawData.xlsx', 'SCFA_분석결과.docx'], ai: '결과보고서_AI초안_2026-0035_v' + (i + 1) + '.docx', pdf: v.files[0], sent: v.at, repN: i + 1 }; }); ch = true; }
    return ch;
  }
  function req2(id) { return DEMO_REQS.filter(function (r) { return r.id === id; })[0]; }
  // 버전 3 → 4: 진행하던 기록은 그대로 두고 새 예시(0046·0047)만 추가
  function db() {
    var d = read(KEY, null);
    // 컨설턴트 의견 예시에서 기관명 → A사·B사 (기록은 그대로)
    if (d && d.S) Object.keys(d.S).forEach(function (k) { if (d.S[k].msg && d.S[k].msg !== OLDMSG[1] && d.S[k].msg.indexOf('세 기관 모두 FFPE') === 0) { d.S[k].msg = OLDMSG[1]; write(KEY, d); } }); // 예전 이름(○○·△△…)으로 저장된 예시 문장도 바꿈
    if (d && d.v === 3) { var n = seed().S; Object.keys(n).forEach(function (k) { if (!d.S[k]) d.S[k] = n[k]; }); d.v = 4; }
    // 4 → 5: 예시 견적의 단위(sample·식)를 EA로
    if (d && d.v === 4) {
      Object.keys(d.S).forEach(function (id) { var P = d.S[id].P || {}; Object.keys(P).forEach(function (k) { var q = P[k].quote; (q && q.groups || []).forEach(function (g) { g.lines.forEach(function (l) { if (l.u === 'sample' || l.u === '식' || l.u === 1) l.u = 'EA'; }); }); }); });
      d.v = 5; write(KEY, d);
    }
    if (d && d.v === 5) { seed6(d.S); d.v = 6; write(KEY, d); }
    if (d && d.v === 6) { ['PRJ-2026-0040', 'PRJ-2026-0041'].forEach(function (k) { var x = d.S[k]; if (x && (x.pick === 'p-met' || x.pick === 'p-mlt')) delete d.S[k]; }); seed6(d.S); d.v = VER; write(KEY, d); }
    if (!d || d.v !== VER) { d = seed(); write(KEY, d); }
    if (d && histDemo(d.S)) write(KEY, d);
    if (d && revMig(d.S)) write(KEY, d);
    if (d && repDemo(d.S)) write(KEY, d);
    if (d && waitDemo(d.S)) write(KEY, d);
    if (d && selfDemo(d.S)) write(KEY, d);
    if (d && revDemo(d.S)) write(KEY, d);
    if (d && ctDemo(d.S)) write(KEY, d);
    if (d && !repReset.done) { repReset.done = 1; if (repReset(d.S)) write(KEY, d); }
    d.X = d.X || []; return d;
  }
  function save(d) { write(KEY, d); }
  function state(id) { return db().S[id] || { st: 'review', P: {} }; }
  function put(id, fn) { var d = db(), s = d.S[id] || { st: 'review', P: {} }; fn(s); d.S[id] = s; save(d); return s; }

  // 의뢰 목록: 이 브라우저에서 제출된 의뢰(V4) + 예시 의뢰
  function requests() { return ((OP.my && OP.my.projects()) || []).concat(DEMO_REQS).sort(function (a, b) { return b.at - a.at; }); }
  function req(id) { return requests().filter(function (r) { return r.id === id; })[0] || null; }

  var F = {
    PARTNERS: PARTNERS, partner: partner, fits: fits, ME_PARTNER: ME_PARTNER, svcInfo: svcInfo, svcAsked: svcAsked, svcAsk: svcAsk,
    requests: requests, req: req, state: state, total: total, money: money, man: man, num: num, esc: esc, ymd: ymd, iso: iso,
    // 단계 이름
    ADMIN_ST: { review: '검토 대기', quoting: '견적 수집 중', sent: '클라이언트 검토', matched: '매칭 완료' },
    // 프로젝트 단계 (2026-10-26, 요구사항정의서 '20260210_내부프로세스_프로젝트상태' 시트 이름으로 통일)
    // 시트의 '보고서 승인' = 클라이언트 [최종 승인](s.fin). 화면에는 따로 보이지 않고 승인 즉시 프로젝트 완료로 표시 (2026-10-27).
    // 만족도 평가 제출·건너뛰기(s.rate / s.rateSkip)는 완료와 상관없는 선택 사항
    ADMIN_STAGES: ['의뢰접수', '의뢰확인', '견적 협의', '계약 진행 중', '분석 진행 중', '보고서 등록', '보고서 검토', '프로젝트 완료', '삭제'],
    P2A: {}, // (예전 분석파트너 단계 이름 → 컨설턴트 단계 이름. 이름을 통일해서 이제 같음)
    // 의뢰확인 = 승인 후 견적서가 아직 한 건도 없음, 견적 협의 = 견적서 1건 이상 받음 (시트 기준). 보고서 등록 = 분석파트너가 결과 등록(AI 초안 검토 중), 보고서 검토 = 클라이언트에게 전달
    adminStage: function (id) { var s = state(id); return s.cancel ? '삭제' : s.fin ? '프로젝트 완료' : s.rep && s.rep.length ? '보고서 검토' : s.raw && s.raw.length ? '보고서 등록' : s.ct ? '분석 진행 중' : s.st === 'matched' ? '계약 진행 중' : !s.ok ? '의뢰접수' : (s.st === 'sent' || Object.keys(s.P).some(function (k) { return s.P[k].status === 'sub'; })) ? '견적 협의' : '의뢰확인'; },
    quoteCount: function (id) { var s = state(id); return Object.keys(s.P).filter(function (k) { return s.P[k].status === 'sub'; }).length; },
    // 클라이언트 단계 (2026-10-26): 의뢰접수 → 의뢰승인 → 견적 확인(견적확인요청 받음) → 계약 진행 중 → 분석 진행 중 → 보고서 검토 → 프로젝트 완료
    CLIENT_ST: { review: '의뢰접수', quoting: '의뢰접수', sent: '견적 확인', matched: '계약 진행 중' },
    CLIENT_STEPS: ['의뢰접수', '의뢰승인', '견적 확인', '계약 진행 중', '분석 진행 중', '보고서 검토', '프로젝트 완료'],
    // 파트너 쪽에서 본 견적 상태
    pst: function (s, k) {
      var x = s.P[k]; if (!x) return null;
      if (s.st === 'matched' && x.status === 'sub') return s.pick === k ? '선정' : '미선정';
      if (x.status === 'sub') return x.fwd && s.st === 'sent' ? '클라이언트 검토 중' : '제출 완료';
      return { req: '작성 대기', draft: '임시저장', rev: '수정 요청', dec: '거절' }[x.status];
    },
    // 견적 마감일 변경 (2026-10-28, 컨설턴트). 마감일이 지나면 분석파트너는 새 견적을 제출할 수 없음 (수정 요청받은 견적은 제출 가능)
    setDue: function (id, v) { return put(id, function (s) { s.due = v; s.dueChg = Date.now(); }); },
    dueOver: function (s) { return !!s.due && new Date(s.due + 'T23:59:59') < new Date(); },
    // 분석파트너 화면용: 삭제된 프로젝트는 견적 상태와 상관없이 '프로젝트 삭제' (2026-10-28, 견적은 기록으로 남고 더 진행할 수 없음)
    pstMe: function (s, k) { return s.cancel && s.P[k] ? '프로젝트 삭제' : F.pst(s, k); },
    // 삭제된 프로젝트 카드를 분석파트너 목록에서 뺌 (견적 기록은 남음, 새로고침하면 예시는 다시 보임)
    pHide: function (id, k) { return put(id, function (s) { if (s.P[k]) s.P[k].hidden = Date.now(); }); },
    // 분석파트너가 프로젝트 찾기에서 직접 견적 작성 시작 (컨설턴트 요청 없이)
    apply: function (id, k) {
      var r = req(id);
      return put(id, function (s) {
        if (!s.P[k]) s.P[k] = { at: Date.now(), status: 'req', self: true };
        if (s.st === 'review') { s.st = 'quoting'; s.reqAt = Date.now(); s.due = s.due || futureTo(r) || iso(Date.now() + DAY * 14); }
      });
    },
    // 견적을 받을 수 있는 단계 (승인 후 ~ 클라이언트에게 전달 전)
    // 견적 모집 중: 승인 후 ~ 클라이언트가 견적을 확정하기 전 (견적을 전달한 뒤에도 계속 받음)
    open: function (id) { var s = state(id); return !!s.ok && s.st !== 'matched'; },
    // 의뢰 승인: 컨설턴트가 의뢰서를 확인하고 승인 → 프로젝트로 등록(게시)
    approve: function (id) { return put(id, function (s) { s.ok = Date.now(); }); },
    // 사업자등록증: 계정 단위로 한 번 확인 (컨설턴트가 첫 의뢰를 승인할 때 확인 완료 → acc.bizOk·bizOkName)
    // 확인된 뒤에는 의뢰마다 다시 확인하지 않음. 클라이언트가 내 정보 관리에서 삭제 후 다시 올리면 파일 이름이 바뀌어 다시 '확인 전'
    // 의뢰별 재제출 요청: s.biz = { st:'ask'|'re', askAt, note, reAt, name }, s.bizSeen = 이번 의뢰에서 컨설턴트가 열어봤는지
    // 의뢰한 계정: 예시 의뢰 = 클라이언트 데모 계정, 제출한 의뢰 = r.owner. 계정 정보 없이 저장된 예전 의뢰는 소속·담당자 또는 파일 이름이 같은 클라이언트 계정으로 찾음
    bizOwner: function (r) {
      if (r.demo) return r.owner || 'client@omicspharm.test'; // 예시 의뢰도 owner가 있으면 그 계정 (0048 = 다른 클라이언트)
      if (r.owner) return r.owner;
      var A = OP.accounts(), K = Object.keys(A).filter(function (k) { return A[k].role === 'client'; });
      var hit = K.filter(function (k) { return r.bizDoc && A[k].bizDoc === r.bizDoc; })[0] ||
        K.filter(function (k) { return r.org && A[k].org === r.org && (!r.manager || A[k].name === r.manager); })[0] ||
        (K.length === 1 ? K[0] : '');
      return hit || '';
    },
    bizName: function (r) {
      var o = F.bizOwner(r), a = o ? OP.account(o) || {} : {}, b = state(r.id).biz || {};
      return a.bizDoc || b.name || (o ? '' : r.bizDoc) || '';
    },
    bizOk: function (r) { var o = F.bizOwner(r), a = o ? OP.account(o) || {} : {}, nm = F.bizName(r); return nm && a.bizOk && a.bizOkName === nm ? a.bizOk : 0; },
    bizConfirm: function (r) { var o = F.bizOwner(r), nm = F.bizName(r); if (o && nm) OP.saveAccount(o, { bizOk: Date.now(), bizOkName: nm }); },
    // 원본 파일 (OP.files): 계정 파일 → 의뢰별로 다시 올린 파일 순서로 찾고, 이름이 같을 때만 씀
    bizFile: function (r) {
      var nm = F.bizName(r), o = F.bizOwner(r);
      if (!OP.files) return Promise.resolve(null);
      return (o ? OP.files.get('biz:acc:' + o) : Promise.resolve(null)).then(function (f) {
        if (f && f.name === nm) return f;
        return OP.files.get('biz:req:' + r.id).then(function (g) { return g && g.name === nm ? g : null; });
      });
    },
    // 데모: 사업자등록증 확인을 처음 상태로 (계정 확인 완료·이 의뢰의 열람/재제출 기록, 아직 견적 요청 전이면 의뢰 승인도 취소)
    bizReset: function (r) {
      var o = F.bizOwner(r); if (o) OP.saveAccount(o, { bizOk: 0, bizOkName: '' });
      put(r.id, function (s) { delete s.biz; delete s.bizSeen; if (s.st === 'review') delete s.ok; });
    },
    bizSeen: function (id) { return !!state(id).bizSeen; },
    bizMark: function (id) { put(id, function (s) { s.bizSeen = true; }); },
    bizAsk: function (id, note) { put(id, function (s) { s.biz = { st: 'ask', askAt: Date.now(), note: note, name: (s.biz || {}).name }; s.bizSeen = false; }); },
    bizResubmit: function (id, name) { put(id, function (s) { var b = s.biz || {}; s.biz = { st: 're', askAt: b.askAt, note: b.note, reAt: Date.now(), name: name }; s.bizSeen = false; }); },
    // 견적 요청 보내기 (추가 요청도 같은 함수)
    // 견적제안메일 발송 (컨설턴트 추천): msg는 프로젝트 링크와 함께 메일로 전달
    send: function (id, keys, due, msg) {
      var r = req(id);
      return put(id, function (s) {
        if (s.st === 'review') { s.st = 'quoting'; s.reqAt = Date.now(); s.due = s.due || due || futureTo(r) || iso(Date.now() + DAY * 14); }
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
        // 예전 방식(파트너 견적 그대로 전달)으로 보낸 견적은 먼저 클라이언트 견적 차수로 고정 → 수정 요청으로 전달 표시가 바뀌어도 보낸 견적이 그대로 남음 (2026-10-28)
        if (!s.CQ) { var L0 = F.cqList(s); if (L0.length) s.CQ = L0.map(function (v) { return { n: v.n, at: v.at, base: v.base, quote: v.quote, why: v.why || '' }; }); }
        var x = s.P[k]; x.status = 'rev'; x.rev = { at: Date.now(), note: note }; x.revN = (x.revN || 0) + 1; x.fwd = false;
        var p = partner(k);
        if (!p.login) { // 가상 파트너는 바로 다시 제출 (금액 5% 조정)
          var q = genQuote(p, r, 1 - .05 * x.revN); q.memo += '\n[수정 반영] ' + note; x.quote = q; x.status = 'sub'; x.subAt = Date.now() + 1000;
        }
      });
    },
    // 컨설턴트가 파트너 견적을 직접 수정 (2026-10-30): 새 차수로 저장, 상태는 제출 완료 그대로, 파트너에게 알림
    editQ: function (id, k, quote, note) {
      return put(id, function (s) { var x = s.P[k]; x.quote = quote; x.revN = (x.revN || 0) + 1; x.subAt = Date.now(); x.status = 'sub'; x.ed = { at: Date.now(), note: note || '' }; });
    },
    // 파트너 저장·제출·거절
    partnerSave: function (id, k, quote, submit) {
      return put(id, function (s) { var x = s.P[k]; if (!x) return; x.quote = quote; if (submit) { x.status = 'sub'; x.subAt = Date.now(); } else if (x.status === 'req') x.status = 'draft'; });
    },
    // 임시저장 삭제: 요청받은 견적은 '작성 대기'로, 직접 신청한 견적은 신청 자체를 지움
    discard: function (id, k) { return put(id, function (s) { var x = s.P[k]; if (!x || x.status !== 'draft') return; if (x.self) delete s.P[k]; else { x.status = 'req'; delete x.quote; } }); },
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
    // (2026-10-28) 컨설턴트가 파트너 견적을 직접 고치고 확인받는 흐름은 없앰 → 파트너 견적이 바뀌어야 하면 수정 요청(revise)으로
    // 클라이언트 견적 보내기 (2026-10-26): 컨설턴트가 분석파트너 견적 1건(base)을 바탕으로 만든 ㈜셀키에이아이 견적을 차수로 쌓음
    // s.CQ = [{ n, at, base, quote, why }]. 전달한 파트너는 컨설턴트 화면에서 '선정' (알림은 클라이언트가 최종 견적 확인할 때)
    sendCQ: function (id, base, quote, why) {
      return put(id, function (s) {
        if (!s.CQ) s.CQ = F.cqList(s).map(function (v) { return { n: v.n, at: v.at, base: v.base, quote: v.quote, why: v.why || '' }; }); // 예전 데이터는 이어서 차수 매김
        var n = s.CQ.length + 1, at = Date.now();
        s.CQ.push({ n: n, at: at, base: base, quote: quote, why: why || '' });
        Object.keys(s.P).forEach(function (k) { s.P[k].fwd = k === base; });
        s.st = 'sent'; s.sentAt = s.sentAt || at;
        s.sends = (s.sends || []).concat([{ at: at, keys: [base], cq: n }]);
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
    // 계약 정보 (2026-10-26, 기존 사이트 항목 그대로): 최종 계약 금액·통화, 계약일, 납기일 + 쪽마다 계약서·대금 지급 방법·기타. 임시저장 = ctDraft
    contract: function (id, c) { return put(id, function (s) { s.ct = Object.assign({ at: Date.now() }, c); delete s.ctDraft; }); },
    contractDraft: function (id, c) { return put(id, function (s) { s.ctDraft = Object.assign({ savedAt: Date.now() }, c); }); },
    // 프로젝트 찾기에 게시된 의뢰 (컨설턴트 승인 후)
    posted: function () {
      var d = db().S;
      return requests().filter(function (r) { return d[r.id] && d[r.id].ok && !d[r.id].cancel; }).map(function (r) { return { r: r, s: d[r.id] }; });
    },
    reset: function () {
      try { localStorage.removeItem(KEY); localStorage.removeItem('op.alarmRead'); } catch (e) {}
      var A = OP.accounts(); Object.keys(A).forEach(function (k) { if (A[k].bizOk) OP.saveAccount(k, { bizOk: 0, bizOkName: '' }); }); // 사업자등록증 확인 완료도 처음 상태로 (올린 파일은 유지)
    },
    // 클라이언트 단계
    clientStage: function (id) { var s = state(id); return s.cancel ? '삭제' : s.fin ? '프로젝트 완료' : s.rep && s.rep.length ? '보고서 검토' : s.ct ? '분석 진행 중' : s.st === 'matched' ? '계약 진행 중' : s.st === 'sent' ? '견적 확인' : s.ok ? '의뢰승인' : '의뢰접수'; },
    // 프로젝트 삭제 (2026-10-21, '취소' → '삭제'): 클라이언트는 승인 후 ~ 견적 협의까지 직접(계약 진행 중은 컨설턴트 문의), 컨설턴트는 계약서 등록 전까지
    // 기록은 남김(s.cancel): 클라이언트 목록에서는 사라지고, 컨설턴트는 '삭제' 상태로 봄. 승인 전(의뢰접수) 클라이언트 삭제는 완전 삭제
    canCancel: function (id, admin) { var s = state(id); return !!s.ok && !s.cancel && (admin ? !s.ct : ['review', 'quoting', 'sent'].indexOf(s.st) > -1); },
    cancel: function (id, reason, by) { return put(id, function (s) { s.cancel = { at: Date.now(), reason: reason || '', by: by || 'client' }; }); },
    // 결과보고서 최종 확인(프로젝트 완료) · 만족도 평가
    finish: function (id) { return put(id, function (s) { s.fin = Date.now(); }); },
    rate: function (id, star, text) { return put(id, function (s) { s.rate = { star: star, text: text, at: Date.now() }; }); },
    rateSkip: function (id) { return put(id, function (s) { s.rateSkip = Date.now(); }); }, // 평가 건너뛰기 = 프로젝트 완료
    done: function (s) { return !!(s && (s.rate || s.rateSkip)); },
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
        return { id: r.id, flow: true, ct: s.ct, svc: r.svc, stage: s.fin ? '프로젝트 완료' : s.rep && s.rep.length ? '보고서 검토' : s.raw && s.raw.length ? '보고서 등록' : s.ct ? '분석 진행 중' : '계약 진행 중', title: r.title, client: r.org || '-', partner: partner(s.pick).org, samples: r.samples || '-', amount: man(s.ct && s.ct.pAmt != null ? s.ct.pAmt : total(q).net), contract: (s.ct && s.ct.date) || iso(s.ct ? s.ct.at : s.pickAt), due: (s.ct && s.ct.due) || r.due || iso(s.pickAt + DAY * 7 * (+q.weeks || 6)), at: s.pickAt, qa: 0 };
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
      var n0 = L.length; // 아래에서 넣은 알림에 프로젝트명(pj)을 붙임 (대시보드 최근 알림 두 번째 줄)
      if (role === 'admin') {
        var href = 'mypage-request.html?id=' + encodeURIComponent(r.id);
        L.push({ id: 'f-new-' + r.id, k: '의뢰접수', cat: 'project', at: r.at, t: cl + '의 ' + nm + ' 의뢰서가 접수 되었습니다. 확인 후 승인처리 해주세요.', href: href });
        Object.keys(s.P).forEach(function (k) {
          var x = s.P[k], o = partner(k).org;
          if (x.subAt && x.quote) L.push({ id: 'f-sub-' + r.id + k + (x.revN || 0), k: '견적등록', cat: 'project', at: x.subAt, t: o + '의 ' + qname(x) + '가 등록되었습니다.', sub: '프로젝트명: ' + nm + ' · 견적금액: ' + won(total(x.quote).final), href: href });
          if (x.dec) L.push({ id: 'f-dec-' + r.id + k, k: '견적거절', cat: 'project', at: x.dec.at, t: josa(o, '이', '가') + ' ' + nm + ' 견적 요청을 거절했습니다.', sub: x.dec.why, href: href });
        });
        if (r.updatedAt) L.push({ id: 'f-ed-' + r.id + r.updatedAt, k: '의뢰수정', cat: 'project', at: r.updatedAt, t: cl + '의 ' + nm + ' 의뢰서가 수정되었습니다. 변경 내용을 확인해주세요.', href: href });
        if (s.biz && s.biz.reAt) L.push({ id: 'f-biz-re-' + r.id + s.biz.reAt, k: '사업자등록증재제출', cat: 'project', at: s.biz.reAt, t: cl + '의 ' + nm + ' 의뢰 사업자등록증이 다시 제출되었습니다. 확인 후 승인처리 해주세요.', href: href });
        if (s.pick) L.push({ id: 'f-pick-' + r.id, k: '견적확정', cat: 'project', at: s.pickAt, t: josa(cl, '이', '가') + ' ' + nm + ' 프로젝트의 최종 견적을 확정 했습니다.', sub: '공급사: ' + partner(s.pick).org + ' · 클라이언트 견적금액: ' + won(total((F.cqLast(s) || {}).quote || s.P[s.pick].quote).final), href: href });
        (s.raw || []).filter(function (x) { return x.by !== 'admin'; }).forEach(function (x, i) { L.push({ id: 'f-raw-' + r.id + i, k: '결과등록', cat: 'project', at: x.at, t: josa(partner(s.pick).org, '이', '가') + ' ' + nm + ' 프로젝트의 ' + (i + 1) + '차 분석 결과를 등록했습니다. AI 보고서 초안을 검토해주세요.', href: href }); });
        if (s.cancel) L.push({ id: 'f-cancel-' + r.id, k: '의뢰취소', cat: 'project', at: s.cancel.at, t: s.cancel.by === 'admin' ? nm + ' 프로젝트를 삭제했습니다.' : cl + '의 ' + nm + ' 프로젝트가 삭제되었습니다.', sub: s.cancel.reason ? '사유: ' + s.cancel.reason : '', href: href });
        (s.cReq || []).forEach(function (q, i) { L.push({ id: 'f-creq-' + r.id + i, k: '보고서수정요청', cat: 'project', at: q.at, t: cl + '의 ' + nm + ' 결과보고서 수정 요청이 등록되었습니다.', sub: q.note, href: href }); });
        if (s.rate) L.push({ id: 'f-rate-' + r.id, k: '리뷰등록', cat: 'project', at: s.rate.at, t: cl + '의 ' + nm + ' 프로젝트에 만족도 평가(별점 ' + s.rate.star + '점)가 등록되었습니다.', href: href });
        if (s.fin) L.push({ id: 'f-fin-' + r.id, k: '프로젝트완료', cat: 'project', at: s.fin, t: josa(cl, '이', '가') + ' ' + nm + ' 결과보고서를 최종 승인해 프로젝트가 완료되었습니다.', href: href });
      } else if (role === 'partner') {
        var x = s.P[ses.email]; if (!x) return;
        var qh = 'mypage-quote.html?rid=' + encodeURIComponent(r.id);
        if (r.updatedAt && r.updatedAt > x.at) L.push({ id: 'f-ed-' + r.id + r.updatedAt, k: '의뢰수정', cat: 'project', at: r.updatedAt, t: nm + ' 프로젝트의 의뢰 내용이 수정되었습니다. 견적서 작성 전 변경 내용을 확인해주세요.', href: qh });
        if (s.ct && s.pick === ses.email) L.push({ id: 'f-ct-' + r.id, k: '계약', cat: 'project', at: s.ct.at, t: nm + ' 프로젝트의 계약서 최종본이 등록되었습니다.', href: 'mypage-project.html?id=' + encodeURIComponent(r.id) });
        if (s.pick === ses.email) (s.raw || []).concat(s.reReq ? [{ req: s.reReq }] : []).forEach(function (v) { if (v.req) L.push({ id: 'f-rereq-' + r.id + v.req.at, k: '결과재등록요청', cat: 'project', at: v.req.at, t: nm + ' 프로젝트의 분석 결과를 다시 등록해주세요.', sub: v.req.note, href: 'mypage-project.html?id=' + encodeURIComponent(r.id) }); });
        if (s.fin && s.pick === ses.email) L.push({ id: 'f-fin-' + r.id, k: '프로젝트완료', cat: 'project', at: s.fin, t: nm + ' 프로젝트가 완료되었습니다. 클라이언트가 결과보고서를 최종 승인했습니다.', href: 'mypage-project.html?id=' + encodeURIComponent(r.id) });
        if (s.cancel) L.push({ id: 'f-cancel-' + r.id, k: '의뢰취소', cat: 'project', at: s.cancel.at, t: nm + ' 프로젝트가 삭제되어 견적 요청이 종료되었습니다.', href: 'mypage-quote.html' });
        if (!x.self) L.push({ id: 'f-req-' + r.id, k: '견적제안', cat: 'project', at: x.at, t: nm + ' 프로젝트 검토 후 견적서를 작성해주세요.', sub: '모집기한: ~' + (s.due ? s.due.replace(/-/g, '.') : '-'), href: qh });
        if (s.dueChg && /^(req|draft)$/.test(x.status) && !s.cancel) L.push({ id: 'f-due-' + r.id + s.dueChg, k: '모집기한변경', cat: 'project', at: s.dueChg, t: nm + ' 프로젝트의 모집기한이 ' + s.due.replace(/-/g, '.') + '까지로 변경되었습니다.', href: qh });
        if (x.ed) L.push({ id: 'f-ed-' + r.id + x.revN, k: '견적수정', cat: 'project', at: x.ed.at, t: 'OmicsPharm이 ' + nm + ' 프로젝트 견적서를 수정했습니다.', sub: x.ed.note || '수정된 견적서를 확인해주세요.', href: qh });
        // 선정 알림만 (2026-10-21: 미선정 알림은 보내지 않음)
        if (s.st === 'matched' && x.status === 'sub' && s.pick === ses.email) L.push({ id: 'f-win-' + r.id, k: '견적확정', cat: 'project', at: s.pickAt, t: nm + '의 견적이 최종 선정되었습니다.', sub: '견적서명: ' + qname(x) + ' · 견적금액: ' + won(total(x.quote).final), href: 'mypage-project.html?id=' + encodeURIComponent(r.id) });
      } else if (role === 'client' && (!r.demo || (r.owner || 'client@omicspharm.test') === ses.email)) {
        var ph = 'mypage-project.html?id=' + encodeURIComponent(r.id);
        if (s.ct) L.push({ id: 'f-ct-' + r.id, k: '계약', cat: 'project', at: s.ct.at, t: nm + ' 프로젝트의 계약서 최종본이 등록되었습니다.', href: ph + '&tab=contract' });
        if (s.cancel && s.cancel.by === 'admin') L.push({ id: 'f-cancel-' + r.id, k: '의뢰삭제', cat: 'project', at: s.cancel.at, t: '의뢰하신 ' + nm + ' 프로젝트가 OmicsPharm에 의해 삭제되었습니다.', sub: s.cancel.reason ? '사유: ' + s.cancel.reason : '', href: 'mypage-project.html' });
        (s.rep || []).forEach(function (v, i) { L.push({ id: 'f-rep-' + r.id + i, k: '보고서등록', cat: 'project', at: v.at, t: nm + ' 프로젝트에 ' + F.repName(i) + '가 등록되었습니다. 확인 후 최종 확인 또는 수정 요청을 해주세요.', href: ph + '&tab=report' }); });
        if (s.ok) L.push({ id: 'f-ok-' + r.id, k: '의뢰승인', cat: 'project', at: s.ok, t: '의뢰하신 ' + nm + ' 프로젝트가 승인되어 등록되었습니다.', href: ph });
        if (s.biz && s.biz.askAt) L.push({ id: 'f-biz-ask-' + r.id + s.biz.askAt, k: '사업자등록증재제출요청', cat: 'project', at: s.biz.askAt, t: '의뢰하신 ' + nm + ' 의뢰의 사업자등록증을 다시 제출해주세요.', sub: '사유: ' + s.biz.note, href: ph });
        F.cqList(s).forEach(function (v) { // 컨설턴트가 보낸 ㈜셀키에이아이 견적 차수마다
          L.push({ id: 'f-arr-' + r.id + (v.n > 1 ? '-' + (v.n - 1) : ''), k: '견적확인요청', cat: 'project', at: v.at, t: '의뢰하신 ' + nm + ' 프로젝트의 ' + v.n + '차 견적서가 도착했습니다. 견적 관련 문의사항은 문의하기로 남겨 주세요.',
            sub: '견적금액: ' + won(total(v.quote).final), href: ph + '&tab=quote' });
        });
      }
      for (var i0 = n0; i0 < L.length; i0++) L[i0].pj = nm;
    });
    // 삭제된 의뢰
    db().X.forEach(function (x) {
      if (role === 'admin') L.push({ id: 'f-del-' + x.id, k: '의뢰삭제', cat: 'project', pj: x.title, at: x.at, t: (x.org || '의뢰사') + '의 ' + x.title + ' 의뢰가 삭제되었습니다.', sub: x.keys.length ? '견적을 요청한 분석파트너 ' + x.keys.length + '곳에도 알림이 전달되었습니다.' : '', href: 'mypage-request.html' });
      if (role === 'partner' && x.keys.indexOf(ses.email) > -1) L.push({ id: 'f-del-' + x.id, k: '의뢰삭제', cat: 'project', pj: x.title, at: x.at, t: x.title + ' 프로젝트 의뢰가 취소되어 견적 요청이 종료되었습니다.', href: 'mypage-quote.html' });
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

  // 클라이언트에게 보이는 견적 이름: 전달된 순서대로 A·B·C
  F.qno = function (s, k) { var K = Object.keys(s.P || {}).filter(function (x) { return s.P[x].fwd; }); return String.fromCharCode(65 + Math.max(0, K.indexOf(k))); };
  // 클라이언트에게 보이는 글(컨설턴트 의견 등)에서 기관명 가리기: 전달한 견적은 A사·B사, 그 밖의 기관은 '다른 기관'
  F.mask = function (s, t) {
    t = PARTNERS.reduce(function (t, p) { return t.split(p.org).join(s.P && s.P[p.key] && s.P[p.key].fwd ? F.qname(s, p.key) : '다른 기관'); }, String(t || ''));
    return t.replace(/[○△□◇◎☆]{2}[가-힣A-Za-z]*?(센터|연구소|연구원|랩|오믹스|로직스)/g, '다른 기관'); // 예전 예시 이름(△△바이오랩 등)
  };
  F.qname = function (s, k) { return F.qno(s, k) + '사'; }; // 클라이언트에게는 기관명 대신 A사·B사
  // 클라이언트에게 전달하는 견적서의 공급자 = 셀키에이아이 (분석파트너 견적을 셀키 명의로 전달). 공개 사이트라 대표자·번호·주소는 예시값
  // 클라이언트가 받은 ㈜셀키에이아이 견적 차수 목록. s.CQ가 없던 예전 데이터는 전달한 파트너 견적(선택했거나 가장 최근 전달)과 그 이전 차수(hist)로 만듦
  F.cqList = function (s) {
    if (s.CQ && s.CQ.length) return s.CQ;
    var FK = Object.keys(s.P || {}).filter(function (k) { return s.P[k].fwd && s.P[k].status === 'sub'; }); if (!FK.length) return [];
    var K = s.pick && s.P[s.pick] ? s.pick : (function () { var E = (s.sends || []).filter(function (e) { return e.keys && e.keys.some(function (k) { return FK.indexOf(k) > -1; }); }), L = E.length ? E[E.length - 1].keys.filter(function (k) { return FK.indexOf(k) > -1; }) : FK; return L[L.length - 1]; })();
    var X = s.P[K], H = X.hist || [];
    return H.map(function (h, i) { return { n: i + 1, at: h.at, base: K, quote: h.quote, why: h.why, legacy: true }; }).concat([{ n: H.length + 1, at: X.ver2At || X.subAt, base: K, quote: X.quote, why: X.why, legacy: true }]);
  };
  // 두 견적의 달라진 항목 (단가·수량·추가/삭제·할인·소요 기간)
  F.qdiff = function (a, b) {
    var cur = b.cur || 'KRW', M = function (q) { var m = {}; (q.groups || []).forEach(function (g) { g.lines.forEach(function (l) { m[(g.name || '') + '|' + (l.d || '')] = l; }); }); return m; };
    var A = M(a), B = M(b), out = [], nm = function (k) { return k.split('|')[1] || k.split('|')[0]; };
    Object.keys(B).forEach(function (k) { var x = A[k], y = B[k]; if (!x) { out.push('추가: ' + nm(k) + ' ' + money(num(y.q) * num(y.p), cur)); return; } if (num(x.p) !== num(y.p)) out.push(nm(k) + ' 단가 ' + money(num(x.p), cur) + ' → ' + money(num(y.p), cur)); if (num(x.q) !== num(y.q)) out.push(nm(k) + ' 수량 ' + num(x.q) + ' → ' + num(y.q)); });
    Object.keys(A).forEach(function (k) { if (!B[k]) out.push('삭제: ' + nm(k)); });
    var sa = num(a.sale) + num(a.addSale), sb = num(b.sale) + num(b.addSale); if (sa !== sb) out.push('할인 ' + (sa ? money(sa, cur) : '없음') + ' → ' + (sb ? money(sb, cur) : '없음'));
    if (String(a.weeks || '') !== String(b.weeks || '')) out.push('소요 기간 ' + (a.weeks || '-') + '주 → ' + (b.weeks || '-') + '주');
    return out;
  };
  F.cqLast = function (s) { var L = F.cqList(s); return L[L.length - 1] || null; };
  F.SELLER = { s_org: '㈜셀키에이아이', s_ceo: '홍길동', s_tel: '02-0000-0000', s_biz: '000-00-00000', s_mgr: 'OmicsPharm 컨설턴트', s_mail: 'help@omicspharm.test', s_addr: '서울특별시 강서구 마곡중앙로 00' };
  // 견적서 문서 (A4) — 파트너가 쓴 그대로. o.client면 클라이언트용: 공급자를 셀키로, 견적번호 끝은 o.no(A·B·C)
  F.docHTML = function (r, q, k, o) {
    o = o || {};
    var cur = q.cur || 'KRW', sup = o.client ? F.SELLER : q.supplier || {}, tt = total(q), val = function (v) { return esc(v || '-'); };
    if (o.client) k = o.no || '';
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
      '<div class="doc-meta"><span>견적번호 Q-' + esc(String(r.id).replace(/^(PRJ|REQ)-/, '')) + '-' + esc(String(k || '').replace(/@.*/, '').toUpperCase()) + '</span><span>견적일자 ' + d + '</span></div>' +
      '<table><tr><th style="width:18%">프로젝트명</th><td>' + esc(r.title) + '</td></tr><tr><th>분석 분야</th><td>' + esc(r.svc) + ', 시료 ' + esc(r.samples || '-') + '개' + (q.weeks ? ', 소요 기간 ' + esc(q.weeks) + '주' : '') + '</td></tr></table>' +
      '<div class="parties" style="margin-top:16px">' +
        party('고객사', [r.org, '-', '-', '-', r.manager, '-', '-']) +
        party('공급자', [sup.s_org, sup.s_ceo, sup.s_tel, sup.s_biz, sup.s_mgr, sup.s_mail, sup.s_addr]) +
      '</div>' +
      '<h2>제안가 <span style="font-weight:400;color:#666">(' + ({ KRW: '원화, 공급가 VAT 별도', USD: '달러', JPY: '엔화' })[cur] + ')</span></h2>' +
      '<table class="it"><colgroup><col style="width:20%"><col><col style="width:8%"><col style="width:11%"><col style="width:15%"><col style="width:16%"></colgroup>' +
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
  // 견적 항목 요약 표 (시험명 · 세부내용 · 수량 · 단가 · 금액 + 합계). 수정 요청 창에서 지금 견적을 바로 보이게 (2026-10-28)
  F.itemsHTML = function (q) {
    var cur = q.cur || 'KRW', tt = total(q);
    var rows = (q.groups || []).map(function (g) { return g.lines.map(function (l, i) { return '<tr>' + (i === 0 ? '<td rowspan="' + g.lines.length + '" class="gn">' + esc(g.name || '-') + '</td>' : '') + '<td>' + esc(l.d || '-') + '</td><td class="c">' + esc(String(l.q || '')) + ' ' + esc(l.u || '') + '</td><td class="r">' + money(num(l.p), cur) + '</td><td class="r">' + money(num(l.q) * num(l.p), cur) + '</td></tr>'; }).join(''); }).join('');
    var disc = num(q.sale) + num(q.addSale);
    return '<div class="fask-q"><table><thead><tr><th>시험명</th><th>세부내용</th><th>수량</th><th>단가</th><th>금액</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="fask-qt"><span>분석료 합계 ' + money(tt.sum, cur) + '</span>' + (disc ? '<span>할인 -' + money(disc, cur) + '</span>' : '') + (q.weeks ? '<span>소요 기간 ' + esc(q.weeks) + '주</span>' : '') + '<b>최종 ' + money(tt.final, cur) + ' (VAT 포함)</b></p></div>';
  };
  // 견적서 보기 창
  // o.vers = [{ q, t }] 최신 차수부터 (1·2·3차 견적): 창 위쪽에서 차수를 바꿔 볼 수 있음
  F.showDoc = function (r, q, k, title, o) {
    o = o || {};
    var V = o.vers && o.vers.length > 1 ? o.vers : null, cur = V && o.ver ? o.ver : 0; // o.ver = 처음 열 차수 (0 = 최신)
    var pv = document.createElement('div');
    pv.className = 'pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', title || '견적서');
    var body = function () {
      var vq = V ? V[cur].q : q;
      return (V && cur ? '<p class="pv-old">이전 견적입니다. 지금 확정할 수 있는 견적은 ' + esc(V[0].t) + '입니다.</p>' : '') + F.docHTML(r, vq, k, o);
    };
    pv.innerHTML = '<div class="pv-bar"><b>' + esc(title || '견적서') + '</b>' +
      (V ? '<div class="pv-ver" role="tablist" aria-label="견적 차수">' + V.map(function (v, i) { return '<button type="button" role="tab" data-ver="' + i + '" aria-selected="' + (i === cur) + '">' + esc(v.t) + (i ? '' : ' (최신)') + '</button>'; }).join('') + '</div>' : '') +
      '<div><button type="button" data-print>인쇄 / PDF 저장</button><button type="button" class="x" data-close>닫기</button></div></div><div class="pv-scroll">' + body() + '</div>';
    var close = function () { pv.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    pv.addEventListener('click', function (e) {
      var vb = e.target.closest('[data-ver]');
      if (vb) { cur = +vb.dataset.ver; [].forEach.call(pv.querySelectorAll('[data-ver]'), function (b) { b.setAttribute('aria-selected', b === vb); }); pv.querySelector('.pv-scroll').innerHTML = body(); pv.querySelector('.pv-scroll').scrollTop = 0; }
      else if (e.target.closest('[data-close]') || e.target === pv) close(); else if (e.target.closest('[data-print]')) window.print();
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(pv); document.body.style.overflow = 'hidden'; pv.querySelector('[data-close]').focus();
  };

  // 입력 모달 (수정 요청 사유, 거절 사유, 전달 메시지): OP.flow.ask({title, desc, label, ph, yes, required}, cb(value))
  F.ask = function (o, cb) {
    var m = document.createElement('div');
    m.className = 'op-confirm fask'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    if (o.html) m.classList.add('wide'); // o.html: 설명 아래 참고 내용 (예: 수정 요청할 견적의 시험 항목 표)
    m.innerHTML = '<div class="box"><h3>' + esc(o.title) + '</h3>' + (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') + (o.html || '') +
      (o.label !== false ? '<label class="fask-l">' + esc(o.label || '') + (o.input ? '<input type="' + o.input + '" value="' + esc(o.value || '') + '"' + (o.min ? ' min="' + o.min + '"' : '') + '>' : '<textarea placeholder="' + esc(o.ph || '') + '">' + esc(o.value || '') + '</textarea>') + '</label>' : '') + // o.input: 글 대신 한 줄 입력 (예: 'date')
      '<div class="btns"><button type="button" class="no">' + esc(o.no || '취소') + '</button><button type="button" class="yes go">' + esc(o.yes || '확인') + '</button></div></div>';
    var ta = m.querySelector('textarea, .fask-l input'), yes = m.querySelector('.yes');
    var sync = function () { if (o.required && ta) yes.disabled = !ta.value.trim(); };
    var close = function () { m.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    if (ta) { ta.addEventListener('input', sync); ta.addEventListener('change', sync); }
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.classList.contains('no')) { close(); if (o.onNo && e.target !== m) o.onNo(); } // o.no·onNo: 왼쪽 버튼을 다른 동작으로 (예: 견적서 보기)
      else if (e.target === yes && !yes.disabled) { var v = ta ? ta.value.trim() : ''; close(); cb(v); }
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(m); sync(); (ta || m.querySelector('.no')).focus();
  };

  // ── 계약서 기본 양식 (2026-10-28): 셀키 '위탁 분석 서비스 계약서' 형식 ──
  // 실제 계약서(PDF)의 노란 칸(갑 정보, 과제명, 시료, 연구비, 지급 방법, 날짜)은 빈칸으로 두고 내려받아 채움. 조항 문구는 그대로
  // 클라이언트 계약 = 갑 의뢰 기관 / 을 ㈜셀키에이아이, 분석파트너 계약 = 갑 ㈜셀키에이아이 / 을 분석파트너. 셀키·기관 주소 등은 예시 값
  F.contractHTML = function (r, s, side) {
    // 바뀌는 칸은 모두 빈칸(______)으로 둔 양식 (2026-10-28). 셀키 쪽 정보만 채움(예시 값)
    var cl = side === 'client', bl = function (w) { return '<span class="blank">' + new Array((w || 16) + 1).join('_') + '</span>'; }, BL = bl();
    var ck = { org: esc(F.SELLER.s_org), addr: esc(F.SELLER.s_addr), ceo: esc(F.SELLER.s_ceo) }, other = { org: BL, addr: BL, ceo: bl(10) };
    var A = cl ? other : ck, Bp = cl ? ck : other; // 갑 / 을: 클라이언트 계약은 갑 = 의뢰 기관, 분석파트너 계약은 을 = 분석파트너
    var art = function (n, t, body) { return '<h3 class="ca-t">제 ' + n + ' 조(' + t + ')</h3>' + body; };
    var ol = function (L) { return '<ol class="ca-ol">' + L.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>'; };
    return '<article class="doc cdoc ca">' +
      '<div class="ca-cover"><div class="c-brand">C E L L K E Y</div><h2 class="ca-h">위탁 분석 서비스 계약서</h2>' +
        '<p class="ca-parties"><span>분석 의뢰자 : <b>' + A.org + '</b></span><span>분 석 기 관 : <b>' + Bp.org + '</b></span></p></div>' +
      '<p class="ca-p">' + A.org + ' (이하 \'갑\'이라 한다)과 ' + Bp.org + ' (이하 \'을\'이라 한다)는 다음과 같이 위탁연구 계약(이하 \'본 계약\'이라 한다)을 체결한다.</p>' +
      art(1, '목적', '<p class="ca-p">본 계약은 \'갑\'이 연구비 및 물품을 지원하고, \'을\'이 \'갑\'의 요청에 따라 분석 서비스를 제공함에 있어 필요한 제반 사항을 규정함을 목적으로 한다.</p>') +
      art(2, '용어의 정의', ol(['계약이라 함은 \'갑\'과 \'을\'이 분석 용역의 위탁과 수탁에 관한 전반적인 권리와 의무사항을 정한 것을 말한다.', '"결과물"이라 함은 \'을\'이 본 계약에 따라 수행한 분석 서비스의 결과로서, 분석 보고서, 분석 데이터, 기타 계약에 따라 \'갑\'에게 제공되는 문서 또는 전자적 기록물을 의미한다.'])) +
      art(3, '과제', '<p class="ca-p">본 연구분석 용역 계약의 내용은 아래와 같다.</p>' + ol(['과제명: ' + BL, '시료: ' + BL, '시료 수: ' + bl(6) + '개', '분석항목: ' + BL])) +
      art(4, '결과물 제출', '<p class="ca-p">\'을\'은 본 연구 수행에 대한 결과물을 \'갑\'과 \'을\'이 사전 협의한 기간까지 \'갑\'에게 제출한다. \'갑\'이 제출된 결과물을 검수한 후 \'을\'에게 보완을 요구한 경우, \'을\'은 \'갑\'의 요청에 따라 수정 및 보완하여야 한다.</p>') +
      art(5, '계약기간', ol(['본 계약기간은 계약 체결일로부터 6개월로 한다. 단, \'갑\'과 \'을\' 쌍방의 서면 합의에 의하여 계약기간을 연장할 수 있다.', '제5조 1항의 계약기간에도 불구하고 본 과제가 분석계약서 기준에 의거해 조속히 성공적으로 완료될 시에는 \'갑\'과 \'을\' 상호 협의 하에 당해 완료일로서 용역업무를 종료한다.', '제5조 1항의 기간이 경과하여도 본 용역업무가 분석계약서 기준에 의거해 완료되지 못했을 시에는 \'갑\'과 \'을\' 상호 협의 하에 기간을 연장할 수 있다.'])) +
      art(6, '연구비 및 지급방법 등', '<p class="ca-p">본 계약에 의하여 \'갑\'은 \'을\'에게 아래와 같이 연구비를 지급한다.</p>' + ol(['과제명: ' + BL, '연구비: 일금 ' + BL + '원 (₩ ' + bl(12) + ', 부가세 별도)', '연구비는 ' + BL + ' 지급한다.', '연구비 지급은 월 1~2회 진행하는 것을 원칙으로 하며, \'갑\'은 세금계산서 발행일 기준 영업일 30일 이내에 현금으로 연구비를 지급한다.', '본 계약에 명시된 연구 분석항목 이외의 추가 연구가 필요한 경우, \'갑\'과 \'을\'은 별도 서면 합의 하에 연구 분석항목 및 비용 등을 정한다.']) +
        '<p class="ca-p ca-acc">[입금계좌 : 예시은행 000-000-000000, 예금주 : ' + Bp.org + ']</p>') +
      art(7, '연구용 물품', ol(['제출된 시료는 \'갑\'의 요청에 따라 반환하거나 또는 폐기한다.', '\'갑\'은 \'을\'이 연구를 수행하는 데 필요한 의약품 및 관련 물품을 쌍방이 합의한 기일까지 무상으로 공급하며, \'을\'은 수령한 연구용 물품을 적절하게 취급하고, 본 연구 수행의 목적으로만 사용한다.'])) +
      art(8, '결과의 귀속', ol(['본 계약에 따라 \'을\'이 수행한 분석 서비스의 결과물(분석 보고서, 분석 데이터 및 이에 준하는 결과물)의 소유권은 \'갑\'에게 귀속된다.', '연구용역 완료 이후 기 제공한 결과물에 대한 상세자료의 제출이나 설명을 \'갑\'이 요구하는 경우, \'을\'은 이에 성실히 응하여야 한다.', '\'갑\'은 본 계약에 따라 제공받은 결과물을 연구, 논문 작성, 학술 발표, 특허 출원 및 기타 학술, 연구 목적으로 자유롭게 활용할 수 있다.', '본 계약에 따라 결과물이 \'갑\'에게 귀속되더라도, 이는 \'을\'이 보유한 분석 기술, 분석 방법, 노하우, 데이터 처리 파이프라인 및 영업비밀에 대한 권리 이전 또는 사용권 허여를 의미하지 않는다.'])) +
      art(9, '비밀유지', '<p class="ca-p">\'갑\'과 \'을\'은 본 계약을 통해 취득한 모든 정보에 대해 상대방의 서면 동의 없이 제3자에게 공개하거나 제공하여서는 아니 된다. 단, 비밀유지 의무는 본 계약의 위반 없이 공개된 정보, 수령자가 본 계약의 위반 없이 제3자로부터 수령한 정보 또는 본 계약 발효일 이전에 이미 소유하고 있었음을 증명할 수 있는 정보에는 적용되지 않는다.</p>') +
      art(10, '계약 해지', '<p class="ca-p">\'갑\'과 \'을\'은 다음 각 호에 해당하는 사유가 발생하였을 때에는 서면으로 통보한 후 계약을 즉시 해지할 수 있다.</p>' + ol(['정당한 사유 없이 본 계약 또는 연구계획서상의 의무를 위반하여 시정을 요구하였으나, 상대방이 시정요구 수령일로부터 15일 이내에 시정하지 아니할 경우', '그 밖에 합리적인 근거에 기반하여 쌍방의 합의하에 본 연구가 중단되어야 한다고 판단하는 경우']) +
        '<p class="ca-p">계약 해지에 따른 정산은 \'을\'이 진행한 연구의 진행 정도에 따라 쌍방 합의로 결정하되 \'을\'은 본 계약에 따라 \'갑\'이 제공한 물품 가운데 잔여 물품 및 계약해지일까지의 연구관련 자료를 계약해지일 14일 이내에 \'갑\'에게 반환한다.</p>') +
      art(11, '손해배상', ol(['\'갑\' 또는 \'을\'이 본 계약이나 관련 법령을 위반하여 상대방에게 손해가 발생할 경우, 계약을 위반한 일방은 상대방이 입은 손해를 배상하여야 한다.', '\'갑\' 또는 \'을\'은 천재지변, 폭동, 전쟁 등과 같은 불가항력으로 인한 계약상 의무의 불이행이나 이행 지연으로 인한 손해에 대하여는 책임지지 아니한다.'])) +
      art(12, '계약 변경', '<p class="ca-p">\'갑\'과 \'을\'은 서면 동의에 의하지 아니하고는 본 계약의 내용을 변경할 수 없다.</p>') +
      art(13, '계약의 효력', '<p class="ca-p">본 계약은 \'갑\'과 \'을\'이 서명한 날로부터 효력을 가진다.</p>') +
      art(14, '계약의 해석', '<p class="ca-p">본 계약의 내용 또는 본 계약에 기재되지 않은 사항에 관하여 해석에 이견이 있을 경우에는 \'갑\'과 \'을\'이 상호 협의하여 정한다.</p>') +
      art(15, '분쟁해결', ol(['본 계약에 명시되지 않은 사항에 대하여는 일반 상관례에 따르며, 필요한 경우 당사자간의 협의를 통하여 조정하는 것을 원칙으로 한다.', '본 계약과 관련하여 분쟁이 발생한 경우에 \'갑\'과 \'을\'은 신의성실의 원칙하에 상호 협의하여 이를 해결하되, 협의로 분쟁이 해결되지 아니하여 소송이 제기되는 경우에는 서울중앙지방법원을 전속관할로 한다.'])) +
      '<p class="ca-p ca-end">\'갑\'과 \'을\'은 위와 같이 계약을 체결하고 이를 증명하기 위해 계약서 2부를 작성하여 쌍방이 기명 날인한 후 각각 1부씩 보관한다.</p>' +
      '<p class="c-date">' + bl(6) + ' 년 &nbsp; ' + bl(4) + ' 월 &nbsp; ' + bl(4) + ' 일</p>' +
      '<table class="ca-sign"><tr>' + [['갑', A], ['을', Bp]].map(function (x) { return '<td><b>\'' + x[0] + '\'</b><p>주 소: ' + x[1].addr + '</p><p>회사명: ' + x[1].org + '</p><p>대표자: ' + x[1].ceo + ' (인)</p></td>'; }).join('') + '</tr></table>' +
    '</article>';
  };
  // 계약서 보기: 기본 양식이면 의뢰서 + 별첨1 견적서, 업로드 파일이면 파일 안내
  F.showContract = function (r, s, side) {
    var c = s.ct && s.ct[side], q = side === 'client' ? ((F.cqLast(s) || {}).quote || s.P[s.pick].quote) : s.P[s.pick].quote, label = side === 'client' ? '클라이언트 계약서' : '분석파트너 계약서';
    var body = !c || c.type === 'form'
      ? F.contractHTML(r, s, side) + '<p class="attach-t"># 별첨1. 분석 견적서</p>' + F.docHTML(r, q, s.pick, side === 'client' ? { client: true, no: F.qno(s, s.pick) } : null)
      : '<article class="doc cdoc file"><div class="c-brand">C E L L K E Y</div><div class="fileph"><b>' + esc(c.name) + '</b><p>기관 자체 양식으로 업로드한 계약서입니다.<br>프로토타입에서는 파일 내용을 표시하지 않습니다.</p></div></article>';
    var pv = document.createElement('div');
    pv.className = 'pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', label);
    pv.innerHTML = '<div class="pv-bar"><b>' + label + '<i class="dv" aria-hidden="true"></i>' + esc(r.title) + '</b><div><button type="button" data-print>인쇄 / PDF 저장</button><button type="button" class="x" data-close>닫기</button></div></div><div class="pv-scroll">' + body + '</div>';
    var close = function () { pv.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    pv.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === pv) close(); else if (e.target.closest('[data-print]')) window.print(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(pv); document.body.style.overflow = 'hidden'; pv.querySelector('[data-close]').focus();
  };
  // 계약서 목록 (클라이언트·파트너·컨설턴트 화면 공통)
  F.contractListHTML = function (s, sides) {
    return '<div class="ctlist">' + sides.map(function (side) {
      // 계약서 줄 (2026-10-28): 파일 이름(업로드한 경우) + 이 계약의 최종 계약 금액 + 등록일
      var c = s.ct[side] || {}, cl = side === 'client', q = cl ? ((F.cqLast(s) || {}).quote || s.P[s.pick].quote) : s.P[s.pick].quote;
      var amt = cl ? s.ct.amt : s.ct.pAmt, cur = (cl ? s.ct.cur : s.ct.pCur) || q.cur; if (amt == null) amt = total(q).net;
      var dv = '<i class="dv" aria-hidden="true"></i>';
      return '<div class="ctrow2"><div><b>' + (cl ? '클라이언트 계약서' : '분석파트너 계약서') + '</b><span>' + (c.type === 'file' && c.name ? esc(c.name) + dv : '') + '계약 금액 ' + money(amt, cur) + (cur === 'KRW' || !cur ? ' (VAT 별도)' : '') + dv + '등록 ' + ymd(s.ct.at) + '</span></div><button type="button" class="btn" data-ct="' + side + '">계약서 보기</button></div>';
    }).join('') + '</div>';
  };

  // ── 결과보고서 + 보고서 에이전트 (1단계: 컨설턴트 내부용) ──
  // 분석파트너: 완성 보고서 PDF를 올림 (기본, 기존 방식). 따로 [AI 보고서 생성]으로 xlsx, csv, txt를 올리면 AI 초안 (2026-10-29 미팅)
  // 컨설턴트: PDF는 확인 후 전달. AI 보고서 생성으로 올라온 결과는 AI 보고서 초안(워드)이 자동 생성 → 초안 내려받아 검토·수정 → 수정본 업로드(선택) → PDF 등록 → 클라이언트에 전달 (= s.rep, 클라이언트 결과보고서 차수)
  // 클라이언트: 전달된 PDF만 봄 (mypage-project.html 결과보고서). 최종 확인 = 프로젝트 완료
  // kind: 'pdf' = 완성 보고서 PDF (기존 방식, AI 없음) / 'ai' = AI 보고서 생성 (xlsx, csv, txt → AI 초안). 예전 데이터는 'ai'로 봄 (2026-10-29 미팅)
  // 결과보고서 이름 (2026-10-29): 차수로 통일 (1차, 2차 결과보고서). 추가 자료든 수정이든 받은 순서대로. 무엇이 바뀌었는지는 전달 메모(변경 내용)로. 세 화면 공통 (예전: 수정본 n, 팀 의견 받는 중)
  F.repName = function (i) { return (i + 1) + '차 결과보고서'; };
  F.repRaw = function (id, files, kind, labs) { return put(id, function (s) { var x = kind === 'pdf' ? { at: Date.now(), files: files, kind: 'pdf', labs: labs || null } : { at: Date.now(), files: files, kind: 'ai', ai: '결과보고서_AI초안_' + String(id).replace(/^PRJ-/, '') + '_v' + ((s.raw || []).length + 1) + '.docx' }; if (s.reReq) { x.req = s.reReq; delete s.reReq; } s.raw = (s.raw || []).concat([x]); }); };
  // 2차 이후 결과보고서 (2026-10-28): 클라이언트 [최종 승인] 전까지 횟수 제한 없음. 클라이언트 수정 요청은 [문의하기]로 컨설턴트에게
  // ① 컨설턴트가 직접 수정 → by:'admin' 항목(파트너 파일 없음)을 만들어 같은 순서(수정본 → PDF → 전달)로 보냄. 분석파트너에게는 보이지 않음
  // ② 분석을 다시 해야 하면 분석파트너에게 결과 재등록 요청(s.reReq) → 파트너 결과 등록 칸이 다시 열림 → 올리면 새 AI 초안
  F.repSelf = function (id) { return put(id, function (s) { var L = s.raw || [], p = L[L.length - 1] || {}; s.raw = L.concat([{ at: Date.now(), files: [], by: 'admin', ai: p.edit || p.ai || '' }]); }); };
  F.repUndo = function (id, i) { return put(id, function (s) { if (s.raw[i] && s.raw[i].by === 'admin' && !s.raw[i].sent) s.raw.splice(i, 1); }); };
  // 클라이언트 결과보고서 수정 요청 (2026-10-29): 모달로 받아 컨설턴트 결과보고서 영역에 표시. 새 보고서를 전달하면 처리된 것으로 봄
  F.repClientAsk = function (id, note) { return put(id, function (s) { s.cReq = (s.cReq || []).concat([{ at: Date.now(), note: note, repN: (s.rep || []).length }]); }); };
  F.cReqOpen = function (s) { var q = (s.cReq || []).slice(-1)[0], r = (s.rep || []).slice(-1)[0]; return q && !s.fin && (!r || q.at > r.at) ? q : null; };
  F.repAsk = function (id, note) { return put(id, function (s) { s.reReq = { at: Date.now(), note: note }; }); };
  F.repSet = function (id, i, k, v) { return put(id, function (s) { s.raw[i][k] = v; }); };
  F.repSend = function (id, i, note) { return put(id, function (s) { var x = s.raw[i]; s.rep = (s.rep || []).concat([{ at: Date.now(), files: x.kind === 'pdf' ? x.files.slice() : [x.pdf].concat(x.extra || []), note: note || '' }]); x.sent = Date.now(); x.repN = s.rep.length; }); };
  // 분석파트너별 만족도 (컨설턴트만 봄): 완료 프로젝트의 클라이언트 별점 평균. 예시 파트너는 이전 실적(DEMO_RATE)을 함께 반영
  var DEMO_RATE = { 'p-bio': [4.6, 9], 'p-omx': [4.3, 6], 'p-gen': [4.8, 12], 'p-met': [4.1, 7], 'p-adc': [4.5, 4], 'p-mlt': [4.7, 10], 'partner@omicspharm.test': [4.4, 5] };
  F.partnerRating = function (k) {
    var d = db().S, L = [];
    requests().forEach(function (r) { var s = d[r.id]; if (s && s.pick === k && s.rate) L.push({ id: r.id, title: r.title, star: s.rate.star, text: s.rate.text, at: s.rate.at }); });
    var base = DEMO_RATE[k] || [0, 0], n = base[1] + L.length, sum = base[0] * base[1] + L.reduce(function (a, x) { return a + x.star; }, 0);
    return { avg: n ? sum / n : 0, n: n, list: L };
  };
  // 분석파트너 결과 등록 (2026-10-29, 기존 사이트 방식): n차 결과보고서 칸에 국문·영문 리포트를 하나씩 올리고 [저장]
  var RP_PDF = {}; // PDF 등록 표: { ko: 국문 리포트, en: 영문 리포트 } 파일 이름, 프로젝트별 (2026-10-29)
  var RP_MAX = 30, RP_ERR = {}; // AI 보고서 생성 파일 개수 제한, 넘으면 칸 아래 오류 문구. 5 → 30 (설정값, 2026-10-30)
  var RP_EXT = /\.(xlsx|csv|txt)$/i, RP_ACC = '.xlsx,.csv,.txt'; // 안내 문구에 적힌 형식만 (xlsx, csv, txt. Raw data 빼고 csv 넣음, 2026-10-30)
  var RP_FILES = {}; // 고른 파일 이름 (등록 전), 프로젝트별. 형식 제한 없이 여러 개 (보고서 에이전트가 raw 데이터로도 초안을 만듦, 2026-10-29)
  var pdfL = function (id) { var o = RP_PDF[id] || {}; return [o.ko, o.en].filter(Boolean).concat(o.ex || []); };
  var pdfLab = function (id) { var o = RP_PDF[id] || {}; return [o.ko && '국문 리포트', o.en && '영문 리포트'].filter(Boolean).concat((o.ex || []).map(function () { return '추가 파일'; })); };
  F.repSec = function (id, role) {
    var s = state(id), raw = s.raw || [], rep = s.rep || [], adm = role === 'admin', fin = !!s.fin, ask = !fin && s.reReq;
    var pn = function (i) { return raw.slice(0, i + 1).filter(function (v) { return v.by !== 'admin'; }).length; }; // 분석파트너 결과 차수 (컨설턴트 직접 수정은 세지 않음)
    // 올린 파일은 눌러서 다운로드 (2026-10-29, 프로토타입은 안내만)
    var files = function (L) { return '<ul class="rp-files">' + L.map(function (n) { return '<li><button type="button" data-rp="file" data-name="' + esc(n) + '" title="' + esc(n) + ' 내려받기"><img src="assets/auth/ic-paperclip.svg" alt="">' + esc(n) + '</button></li>'; }).join('') + '</ul>'; };
    var h = '<section class="rp" data-rp-id="' + esc(id) + '"><div class="rp-h"><h3>결과보고서</h3>' + (adm ? '<span class="ai-lb"><i class="ai-ic" aria-hidden="true"></i><span>보고서 에이전트</span></span>' : '') + '</div>';
    if (!adm) {
      // 한 번 등록하면 업로드 버튼을 숨기고, 컨설턴트가 결과 재등록을 요청하면 다시 보임 (2026-10-28)
      var mine = raw.filter(function (v) { return v.by !== 'admin'; }), canUp = !fin && (!mine.length || ask), fl = RP_FILES[id] || [];
      // 등록 칸은 버튼 없이 바로 보임 (2026-10-29)
      // 등록 칸이 있으면 '결과보고서' 제목 줄은 빼고 칸 머리가 제목 역할. 차수 대신 처음 = 결과보고서, 다시 올리면 = 수정본 (2026-10-29)
      if (canUp || mine.length) h = h.replace('<div class="rp-h"><h3>결과보고서</h3></div>', ''); // 제출 후에도 초록 박스가 제목 역할 (2026-10-29)
      if (canUp) h += '<div class="rp-form"><div class="rp-fh"><b>' + F.repName(rep.length) + '</b><span>보고서 등록</span></div><div class="rp-fb">' +
        (ask ? '<p class="rp-req"><em>재등록 요청 (' + ymd(s.reReq.at) + '):</em> ' + esc(s.reReq.note) + '</p>' : '') +
        '<div class="rp-guide">분석이 완료된 최종 보고서를 PDF 파일로 업로드해주세요.' + (mine.length ? '<br>추가 자료는 \'추가 파일\'에 형식 상관없이 올려 주세요.' : '') + '<br>OmicsPharm이 확인한 뒤 클라이언트에게 전달합니다.</div>' +
        // PDF 등록: 국문, 영문 리포트 행마다 [파일 선택] (계약서 파일 행과 같은 표 형식, 2026-10-29)
        '<div class="rp-tbl">' + [['ko', '국문 리포트'], ['en', '영문 리포트']].map(function (k) { var n = (RP_PDF[id] || {})[k[0]];
          return '<div class="r"><b>' + k[1] + '</b><div><div class="row"><label class="btn up">파일 선택<input type="file" accept=".pdf,application/pdf" hidden data-rp-pdf="' + k[0] + '"></label><span class="fn' + (n ? ' on' : '') + '">' + esc(n || '선택된 파일 없음') + '</span>' + (n ? '<button type="button" class="rp-x" data-rp="rmpdf" data-k="' + k[0] + '" aria-label="' + esc(n) + ' 빼기">✕</button>' : '') + '</div></div></div>'; }).join('') +
          // 2차부터: 추가 자료는 형식이 제각각이라 '추가 파일' 행 (형식 상관없이 여러 개, 2026-10-29)
          (mine.length ? '<div class="r"><b>추가 파일</b><div><div class="rp-exw"><div class="row"><label class="btn up">파일 선택<input type="file" multiple hidden data-rp-ex></label>' + ((RP_PDF[id] || {}).ex && RP_PDF[id].ex.length ? '' : '<span class="fn">형식 상관없이 여러 개</span>') + '</div>' +
            ((RP_PDF[id] || {}).ex || []).map(function (n, j) { return '<div class="row"><span class="fn on">' + esc(n) + '</span><button type="button" class="rp-x" data-rp="rmex" data-j="' + j + '" aria-label="' + esc(n) + ' 빼기">✕</button></div>'; }).join('') + '</div></div></div>' : '') + '</div>' +
        '<div class="rp-up-go"><button type="button" class="btn primary" data-rp="raw"' + (pdfL(id).length ? '' : ' disabled') + '>제출하기</button></div></div></div>';
      // AI 보고서 생성: PDF 등록과 따로, 이 카드에서 바로 올림 (라벨은 버튼 아님). 결과보고서 칸 위에 둠 (2026-10-29)
      if (canUp) h = h.replace('<div class="rp-form">', function () { return '<div class="rp-aientry"><span class="ai-lb"><i class="ai-ic" aria-hidden="true"></i><span>AI 보고서 생성</span></span><p>완성된 보고서가 없다면 엑셀(xlsx), CSV(csv), 텍스트(txt) 파일을 올려 주세요.<br>AI가 결과보고서로 변환하고, OmicsPharm이 확인한 뒤 클라이언트에게 전달합니다.</p>' +
          '<div class="rp-ai-up"><div class="row"><label class="btn up">파일 선택<input type="file" multiple hidden data-rp-pick accept="' + RP_ACC + '"></label>' + (fl.length ? '<span class="rp-cnt">선택한 파일 <b>' + fl.length + '</b>개<i class="dv" aria-hidden="true"></i>최대 ' + RP_MAX + '개</span>' : '<span class="rp-none">선택된 파일 없음</span>') + '</div>' + (RP_ERR[id] ? '<p class="rp-err">' + (RP_ERR[id] === 'ext' ? '엑셀(.xlsx), CSV(.csv), 텍스트(.txt) 파일만 올릴 수 있습니다.' : '파일은 최대 ' + RP_MAX + '개까지 올릴 수 있습니다.') + '</p>' : '') + (fl.length ? '<ul class="rp-stage">' + fl.map(function (n, j) { return '<li><img src="assets/auth/ic-paperclip.svg" alt=""><span>' + esc(n) + '</span><button type="button" data-rp="rm" data-j="' + j + '" aria-label="' + esc(n) + ' 빼기">✕</button></li>'; }).join('') + '</ul>' : '') + '</div>' +
          (fl.length ? '<div class="rp-up-go"><button type="button" class="btn primary" data-rp="raw" data-k="ai">제출하기</button></div>' : '') + '</div><div class="rp-form">'; });
      // 이름은 클라이언트가 받는 차수 기준 (컨설턴트 직접 수정도 한 차수로 셈, 2026-10-29)
      var nm = function (x) { return F.repName(x.sent ? x.repN - 1 : rep.length); };
      // 제출 후 (2026-10-29): 등록 칸 자리에 같은 초록 박스로 제출한 내용 표시. AI 카드는 숨김 (재등록 요청 때 다시 보임)
      if (!canUp && mine.length) {
        var lx = mine[mine.length - 1], li = mine.length - 1;
        var lab = function (n, j) { return (lx.labs || [])[j] || (/국문|_KO/i.test(n) ? '국문 리포트' : /영문|_EN/i.test(n) ? '영문 리포트' : '결과보고서'); };
        var fb = function (n) { return '<button type="button" class="rp-fl" data-rp="file" data-name="' + esc(n) + '" title="' + esc(n) + ' 내려받기"><img src="assets/auth/ic-paperclip.svg" alt="">' + esc(n) + '</button>'; };
        h += '<div class="rp-form rp-done"><div class="rp-fh"><b>' + nm(lx) + '</b><span>' + (lx.sent ? '클라이언트 전달 완료' : 'OmicsPharm 검토 중') + '</span></div><div class="rp-fb">' +
          (lx.req ? '<p class="rp-req"><em>재등록 요청 (' + ymd(lx.req.at) + '):</em> ' + esc(lx.req.note) + '</p>' : '') +
          (lx.kind === 'pdf' ? '<div class="rp-tbl">' + lx.files.map(function (n, j) { return '<div class="r"><b>' + lab(n, j) + '</b><div><div class="row">' + fb(n) + '</div></div></div>'; }).join('') + '</div>'
            : '<div class="rp-ai-done"><span class="ai-lb"><i class="ai-ic" aria-hidden="true"></i><span>AI 보고서 생성으로 제출</span></span>' + files(lx.files) + '</div>') +
          '<p class="rp-subat">' + ymd(lx.at) + ' 제출' + (lx.sent ? '<i class="dv" aria-hidden="true"></i>' + ymd(lx.sent) + ' 클라이언트 전달' : '') + '</p></div></div>';
      }
      var past = canUp ? mine : mine.slice(0, -1);
      h += past.length ? past.map(function (x, i) {
        return '<div class="rp-item"><div class="rp-ih"><b>' + nm(x) + '</b><em>' + ymd(x.at) + ' 등록' + (x.kind === 'pdf' ? '' : '<i class="dv" aria-hidden="true"></i>AI 보고서 생성') + '</em><span class="badge ' + (x.sent ? 'done">클라이언트 전달 완료' : 'state">OmicsPharm 검토 중') + '</span></div>' + files(x.files) + (x.req ? '<p class="rp-req"><em>재등록 요청 (' + ymd(x.req.at) + '):</em> ' + esc(x.req.note) + '</p>' : '') + '</div>';
      }).reverse().join('') : '';
      if (mine.length && !fin && !ask) h += '<p class="rp-more">결과를 다시 보내야 하면 [문의하기]로 OmicsPharm에 알려 주세요.</p>';
      return h + '</section>';
    }
    // 전달 전 결과가 있으면 초록 머리 박스가 제목 역할 (분석파트너와 같게). 보고서 에이전트 라벨만 남김 (2026-10-29)
    if (raw.length) h = h.replace('<h3>결과보고서</h3>', ''); // 초록 머리 박스가 늘 보여서 제목은 뺌 (2026-10-29)
    if (!raw.length) h += '<div class="rp-empty">분석파트너가 결과를 등록하면 AI가 결과보고서 초안(워드)을 만들어 여기에 보여 드립니다.' + (fin ? '' : '<span><button type="button" class="tbtn primary" data-rp="demo">데모: AI 보고서 생성으로 등록</button><button type="button" class="tbtn primary" data-rp="demo" data-k="pdf">데모: 완성 PDF로 등록</button></span>') + '</div>';
    h += raw.map(function (x, i) {
      var step = x.sent ? 3 : x.pdf ? 2 : 1;
      var pdfK = x.kind === 'pdf' && x.by !== 'admin', nm = F.repName(x.sent ? x.repN - 1 : rep.length), who = (x.by === 'admin' ? '컨설턴트 직접 수정<i class="dv" aria-hidden="true"></i>' : esc(partner(s.pick).org) + '<i class="dv" aria-hidden="true"></i>') + ymd(x.at) + (x.by === 'admin' ? ' 시작' : ' 등록') + (x.by === 'admin' ? '' : '<i class="dv" aria-hidden="true"></i>' + (pdfK ? '완성 PDF' : 'AI 보고서 생성'));
      // 아직 전달 전인 결과는 분석파트너 등록 칸과 같은 초록 머리 박스 (2026-10-29)
      // 최신 결과는 전달 후에도 초록 머리 박스 (분석파트너 화면과 같게, 2026-10-29). 이전 결과는 회색
      var gr = i === raw.length - 1;
      if (gr && x.sent) who += '<i class="dv" aria-hidden="true"></i>' + F.repName(x.repN - 1) + ' 전달 완료';
      var hd = !gr ? '<div class="rp-item" data-rp-i="' + i + '"><div class="rp-ih"><b>' + nm + '</b><em>' + who + '</em>' + (x.sent ? '<span class="badge done">' + F.repName(x.repN - 1) + ' 전달 완료</span>' : '') + '</div>'
        : '<div class="rp-item rp-form" data-rp-i="' + i + '"><div class="rp-fh"><b>' + nm + '</b><span>' + who + '</span></div><div class="rp-fb">';
      // 직접 수정 취소: 머리 대신 박스 안 맨 아래 (2026-10-29)
      var undo = x.by === 'admin' && !x.sent ? '<div class="rp-undo-row"><button type="button" class="btn-tx" data-rp="undo">직접 수정 취소</button></div>' : '';
      var rq = x.req ? '<p class="rp-req"><em>재등록 요청 (' + ymd(x.req.at) + '):</em> ' + esc(x.req.note) + '</p>' : '';
      // 완성 PDF로 올린 결과: AI 초안 없이 확인 → 전달 2단계 (2026-10-29 미팅)
      if (pdfK) return hd + files(x.files) + rq + '<div class="rp-agent"><div class="rp-ah"><b>완성 보고서 (PDF)</b></div><ol class="rp-steps">' +
          '<li class="' + (x.sent ? 'done' : 'cur') + '"><div><b>보고서 확인</b><p>위 파일을 눌러 내려받아 내용을 확인해 주세요.</p></div></li>' +
          '<li class="' + (x.sent ? 'done' : '') + '"><div><b>클라이언트에 전달</b><p>전달하면 클라이언트 결과보고서에 등록되고 알림이 갑니다. (' + F.repName(x.sent ? x.repN - 1 : rep.length) + ')</p></div><div class="rp-act">' + (x.sent ? '<span class="rp-fn">' + ymd(x.sent) + ' 전달</span>' : '<button type="button" class="btn primary" data-rp="send">클라이언트에 전달</button>') + '</div></li>' +
        '</ol></div>' + (gr ? '</div>' : '') + '</div>';
      return hd + (x.files.length ? files(x.files) : '') + rq +
        (x.by === 'admin' ? '<div class="rp-agent"><div class="rp-ah"><b>보고서 수정</b></div>' : '<div class="rp-agent"><div class="rp-ah"><img src="assets/common/ic-sparkle-fill.svg" alt=""><b>AI 보고서 초안</b><span class="badge state">생성 완료</span></div>') +
        '<ol class="rp-steps">' +
          // 1단계: 초안(워드)을 내려받아 고친 뒤 PDF로 저장 → 2단계에서 PDF 등록. 고친 워드를 따로 올리는 [수정본 업로드]는 뺌 (2026-10-29)
          '<li class="' + (step > 1 ? 'done' : 'cur') + '"><div><b>' + (x.by === 'admin' ? '보고서 수정' : '초안 검토, 수정') + '</b><p>' + (x.by === 'admin' ? '지난 보고서 원본을 내려받아 고친 뒤 PDF로 저장해 주세요.' : '초안을 내려받아 검토하고 고친 뒤 PDF로 저장해 주세요.') + '</p></div><div class="rp-act"><button type="button" class="btn" data-rp="dl">' + esc(x.ai) + '</button></div></li>' +
          '<li class="' + (step > 2 ? 'done' : step === 2 ? 'cur' : '') + '"><div><b>PDF 등록</b><p>클라이언트에게 전달할 최종본은 PDF로 올려 주세요.</p></div><div class="rp-act">' + (x.sent ? (x.pdf ? '<span class="rp-fn">' + esc(x.pdf) + '</span>' : '') : '<div class="rp-upf"><span class="fn' + (x.pdf ? ' on' : '') + '">' + esc(x.pdf || '선택된 파일 없음') + '</span><label class="btn up">파일 선택<input type="file" accept=".pdf,application/pdf" hidden data-rp-file="pdf"></label></div>') + '</div></li>' + // PDF 등록: 파일 업로드 컴포넌트 (2026-10-29)
          // 추가 파일 (선택, 형식 상관없이): 클라이언트가 Raw data 등 추가 자료를 요청한 경우 PDF와 함께 전달 (2026-10-29)
          (x.sent && !(x.extra || []).length ? '' : '<li class="' + (step > 2 ? 'done' : '') + '"><div><b>추가 파일 (선택)</b><p>Raw data 등 함께 보낼 파일이 있으면 올려 주세요. 형식 상관없이 여러 개</p>' + ((x.extra || []).length ? '<ul class="rp-xl">' + x.extra.map(function (n, j) { return '<li><span>' + esc(n) + '</span>' + (x.sent ? '' : '<button type="button" class="rp-x" data-rp="rmextra" data-j="' + j + '" aria-label="' + esc(n) + ' 빼기">✕</button>') + '</li>'; }).join('') + '</ul>' : '') + '</div><div class="rp-act">' + (x.sent ? '' : '<label class="btn up">파일 선택<input type="file" multiple hidden data-rp-extra></label>') + '</div></li>') +
          '<li class="' + (step > 2 ? 'done' : '') + '"><div><b>클라이언트에 전달</b><p>전달하면 클라이언트 결과보고서에 등록되고 알림이 갑니다. (' + F.repName(x.sent ? x.repN - 1 : rep.length) + ')</p></div><div class="rp-act">' + (x.sent ? '<span class="rp-fn">' + ymd(x.sent) + ' 전달</span>' : '<button type="button" class="btn primary" data-rp="send"' + (x.pdf ? '' : ' disabled') + '>클라이언트에 전달</button>') + '</div></li>' +
        '</ol></div>' + undo + (gr ? '</div>' : '') + '</div>';
    }).reverse().join('');
    // '클라이언트 결과보고서 n건 전달' 회색 줄은 뺌: 초록 머리에 전달 상태가 있음 (2026-10-29)
    var last = raw[raw.length - 1], cq = F.cReqOpen(s);
    if (cq) h += '<div class="rp-creq"><b>클라이언트 수정 요청</b><em>' + ymd(cq.at) + '</em><p>' + esc(cq.note) + '</p></div>';
    if (!fin && ask) h += '<div class="rp-next"><div><b>분석파트너에게 결과 재등록을 요청했습니다.</b><p>' + ymd(s.reReq.at) + ' 요청<i class="dv" aria-hidden="true"></i>' + esc(s.reReq.note) + '</p></div></div>';
    else if (!fin && last && last.sent) h += '<div class="rp-next"><div><b>보고서를 다시 보내야 하나요?</b><p>클라이언트가 수정을 요청하면 여기에 표시됩니다. 직접 고칠 수 있으면 [직접 수정해서 보내기], 분석을 다시 해야 하면 [결과 재등록 요청]을 눌러주세요.</p></div><div class="rp-act"><button type="button" class="btn" data-rp="self">직접 수정해서 보내기</button><button type="button" class="btn" data-rp="ask">결과 재등록 요청</button></div></div>';
    // 클라이언트 만족도 평가: 지금은 컨설턴트만 봄 (분석파트너 공개는 미정). 별점·후기는 프로젝트별로 모아 두고 나중에 매칭·AI에 활용
    if (fin) h += s.rate ? '<div class="rp-rate"><div class="rp-rh"><b>클라이언트 만족도 평가</b><span class="rp-stars" aria-label="별점 ' + s.rate.star + '점">' + [1, 2, 3, 4, 5].map(function (i) { return '<img src="assets/project/ic-star' + (i <= s.rate.star ? '-fill' : '') + '.svg" alt="">'; }).join('') + '</span><em>' + ymd(s.rate.at) + ' 제출</em></div>' + (s.rate.text ? '<p>' + esc(s.rate.text) + '</p>' : '<p class="none">남긴 의견이 없습니다.</p>') + '<span class="rp-note">컨설턴트만 볼 수 있습니다.</span></div>'
      : '<div class="rp-rate"><div class="rp-rh"><b>클라이언트 만족도 평가</b></div><p class="none">' + (s.rateSkip ? '클라이언트가 평가를 건너뛰었습니다. (' + ymd(s.rateSkip) + ')' : '아직 평가가 등록되지 않았습니다.') + '</p></div>';
    return h + '</section>';
  };
  // 결과보고서 영역 동작 (화면마다 다시 그리는 함수를 F.repRedraw에 넣어 둠)
  document.addEventListener('change', function (e) {
    var sec = e.target.closest('.rp'); if (!sec) return;
    var id = sec.dataset.rpId, t = e.target;
    if (t.matches('[data-rp-extra]')) {
      var xi = +t.closest('[data-rp-i]').dataset.rpI, xn = [].map.call(t.files, function (f) { return f.name; }); t.value = '';
      var cur0 = state(id).raw[xi].extra || []; F.repSet(id, xi, 'extra', cur0.concat(xn.filter(function (v) { return cur0.indexOf(v) < 0; }))); if (F.repRedraw) F.repRedraw();
      return;
    }
    if (t.matches('[data-rp-ex]')) {
      var o = RP_PDF[id] = RP_PDF[id] || {}, en = [].map.call(t.files, function (f) { return f.name; }); t.value = '';
      o.ex = (o.ex || []).concat(en.filter(function (x) { return (o.ex || []).indexOf(x) < 0; })); if (F.repRedraw) F.repRedraw();
      return;
    }
    if (t.matches('[data-rp-pdf]')) {
      var f0 = t.files[0]; t.value = ''; if (!f0) return;
      if (!/\.pdf$/i.test(f0.name)) { OP.toast('PDF 파일만 올릴 수 있습니다. 다른 형식은 [AI 보고서 생성]으로 올려 주세요.'); return; }
      (RP_PDF[id] = RP_PDF[id] || {})[t.dataset.rpPdf] = f0.name; if (F.repRedraw) F.repRedraw();
      return;
    }
    if (t.matches('[data-rp-pick]')) {
      var n = [].map.call(t.files, function (f) { return f.name; }); t.value = ''; if (!n.length) return;
      var cur = RP_FILES[id] || [], add = n.filter(function (x) { return cur.indexOf(x) < 0; }); // 여러 번 골라 추가 (같은 이름은 한 번만)
      var ok = add.filter(function (x) { return RP_EXT.test(x); }); RP_ERR[id] = ok.length < add.length ? 'ext' : false; add = ok;
      if (cur.length + add.length > RP_MAX) { RP_ERR[id] = 'max'; add = add.slice(0, Math.max(0, RP_MAX - cur.length)); }
      RP_FILES[id] = cur.concat(add);
      if (F.repRedraw) F.repRedraw();
      return;
    }
    if (t.matches('[data-rp-file=pdf]') && t.files[0] && !/\.pdf$/i.test(t.files[0].name)) { t.value = ''; OP.toast('PDF 파일만 올릴 수 있습니다.'); return; }
    if (t.matches('[data-rp-file]') && t.files[0]) { var i = +t.closest('[data-rp-i]').dataset.rpI; F.repSet(id, i, t.dataset.rpFile, t.files[0].name); OP.toast(t.dataset.rpFile === 'pdf' ? 'PDF를 등록했습니다.' : '수정본을 올렸습니다.'); if (F.repRedraw) F.repRedraw(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rp]'); if (!b) return;
    var sec = b.closest('.rp'), id = sec.dataset.rpId, a = b.dataset.rp, it = b.closest('[data-rp-i]'), i = it ? +it.dataset.rpI : -1;
    if (a === 'rm') { RP_FILES[id].splice(+b.dataset.j, 1); RP_ERR[id] = false; if (F.repRedraw) F.repRedraw(); return; }
    if (a === 'rmextra') { var xl = (state(id).raw[i].extra || []).slice(); xl.splice(+b.dataset.j, 1); F.repSet(id, i, 'extra', xl); if (F.repRedraw) F.repRedraw(); return; }
    if (a === 'rmex') { RP_PDF[id].ex.splice(+b.dataset.j, 1); if (F.repRedraw) F.repRedraw(); return; }
    if (a === 'rmpdf') { delete (RP_PDF[id] || {})[b.dataset.k]; if (F.repRedraw) F.repRedraw(); return; }
    if (a === 'raw') {
      var aiK = b.dataset.k === 'ai', L = aiK ? RP_FILES[id] || [] : pdfL(id); if (!L.length) return;
      var as = F.repName((state(id).rep || []).length) + '로';
      F.ask({ title: aiK ? 'AI 보고서를 생성할까요?' : '결과보고서를 등록할까요?', desc: aiK ? '선택한 파일 ' + L.length + '개로 AI가 결과보고서를 만들어 ' + as + ' 제출합니다. 제출한 뒤에는 파일을 바꾸거나 추가할 수 없으며, OmicsPharm이 검토해 클라이언트에게 전달합니다.' : '선택한 파일 ' + L.length + '개를 ' + as + ' 제출합니다. 제출한 뒤에는 파일을 바꾸거나 추가할 수 없으며, OmicsPharm이 확인해 클라이언트에게 전달합니다.', label: false, yes: '등록하기' }, function () {
        F.repRaw(id, L.slice(), aiK ? 'ai' : 'pdf', aiK ? null : pdfLab(id)); RP_FILES[id] = []; RP_PDF[id] = {}; OP.toast(aiK ? 'AI 보고서 생성을 요청했습니다. OmicsPharm이 검토 후 클라이언트에게 전달합니다.' : '결과보고서를 등록했습니다. OmicsPharm이 확인 후 클라이언트에게 전달합니다.'); if (F.repRedraw) F.repRedraw();
      });
      return;
    }
    if (a === 'demo') { var pk = b.dataset.k === 'pdf'; F.repRaw(id, pk ? ['분석결과보고서_국문_v1.pdf', '분석결과보고서_영문_v1.pdf'] : ['RawData_' + String(id).replace(/^PRJ-/, '') + '.xlsx', '분석결과_정리.txt'], pk ? 'pdf' : 'ai'); OP.toast(pk ? '데모: 분석파트너가 완성 보고서(PDF)를 등록했습니다.' : '데모: 분석파트너가 AI 보고서 생성으로 등록했습니다. AI 보고서 초안이 생성되었습니다.'); if (F.repRedraw) F.repRedraw(); }
    if (a === 'file') { OP.toast('데모: ' + b.dataset.name + ' 파일이 내려받아집니다.'); return; } // 누르면 다운로드 (2026-10-29)
    if (a === 'dl') OP.toast('데모: 보고서 워드 파일이 내려받아집니다.');
    if (a === 'undo') { F.repUndo(id, i); OP.toast('직접 수정을 취소했습니다.'); if (F.repRedraw) F.repRedraw(); return; }
    if (a === 'self') { F.repSelf(id); OP.toast('보고서 수정 항목을 만들었습니다. 고친 PDF를 등록해 전달해주세요.'); if (F.repRedraw) F.repRedraw(); }
    if (a === 'ask') F.ask({ title: '분석파트너에게 결과 재등록을 요청할까요?', desc: partner(state(id).pick).org + '에 알림이 가고, 분석파트너 화면에 결과 등록 칸이 다시 열립니다.', label: '요청 내용', ph: '예) 클라이언트가 원본 데이터(Raw data) 파일을 추가로 요청했습니다. 올려 주세요.', value: (F.cReqOpen(state(id)) || {}).note ? '클라이언트 요청: ' + F.cReqOpen(state(id)).note : '', required: true, yes: '요청하기' }, function (v) { F.repAsk(id, v); OP.toast('분석파트너에게 결과 재등록을 요청했습니다.'); if (F.repRedraw) F.repRedraw(); });
    // 2차부터는 변경 내용 필수: 차수 이름만으로는 추가 자료인지 수정인지 알 수 없어서 클라이언트 화면에 '변경 내용'으로 보임 (2026-10-29)
    var nx = (state(id).rep || []).length;
    if (a === 'send') F.ask({ title: F.repName(nx) + '를 클라이언트에게 전달할까요?', desc: '등록한 PDF가 클라이언트 결과보고서에 등록되고 알림이 갑니다.', label: nx ? '변경 내용 (클라이언트에게 보임)' : '클라이언트에게 남길 메모 (선택)', ph: nx ? '예) 요청하신 Raw data 파일을 추가했습니다.' : '예) 분석 결과 요약을 첫 장에 정리했습니다.', required: !!nx, yes: '전달하기' }, function (v) { F.repSend(id, i, v); OP.toast('클라이언트에게 결과보고서를 전달했습니다.'); if (F.repRedraw) F.repRedraw(); });
  });

  OP.flow = F;
})();

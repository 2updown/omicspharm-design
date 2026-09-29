# OmicsPharm Design

OmicsPharm 리뉴얼 프로토타입. `main`에 push하면 GitHub Pages로 자동 배포됩니다.

- 사이트: https://2updown.github.io/omicspharm-design/
- 디자인 기준: Figma `[OmicsPharm] Renewal` (컴포넌트: `04_Resource/Component`)
- 예시 화면의 담당자·연락처 등은 모두 가상 값입니다.

## 페이지

| 파일 | 화면 | 레이아웃 |
|---|---|---|
| `index.html` | 메인 (모든 계정 공통 첫 화면) | 공통 헤더·푸터 |
| `omicspharm-register.html` | 프로젝트 의뢰 | 공통 헤더·푸터 |
| `omicspharm-project-detail-prot.html` | 프로젝트 상세 | 공통 헤더·푸터 |
| `login.html`, `find-password.html` | 로그인, 비밀번호 찾기 | 풀페이지 |
| `signup.html`, `signup-form.html?type=client\|partner` | 회원 유형 선택, 가입 단계 | 풀페이지 |
| `omicspharm-wireframe-v5.html` | 분석의뢰 등록 와이어프레임 v5 (참고) | — |

공통 헤더·푸터는 `assets/common/site.js`가 `<div data-op-gnb>` / `<div data-op-footer>` 자리에 그립니다.

## 로그인 (데모)

실제 인증 없이 브라우저 `localStorage`에만 저장됩니다. 회원 유형(클라이언트/분석파트너)은 가입 때 정해지고, 로그인은 가입한 이메일로 유형을 판별합니다. 관리자(셀키)는 가입 없이 데모 계정으로만 로그인합니다.

| 계정 | 이메일 | 비밀번호 |
|---|---|---|
| 클라이언트 | `client@omicspharm.test` | `Demo@1234` |
| 분석파트너 | `partner@omicspharm.test` | `Demo@1234` |
| 관리자 (셀키) | `admin@omicspharm.test` | `Demo@1234` |

로그인하면 헤더 오른쪽이 알림·사용자 아이콘으로 바뀝니다. 계정별 메뉴 차이는 아직 미정이라 세 계정 모두 같은 헤더를 씁니다.

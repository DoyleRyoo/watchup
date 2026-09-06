# UI 구현·검증 결과

검증일: 2026-09-06. 15개 디자인 상태의 실제 React UI와 승인된 수량 BUY 서버 계약을 구현했다. 최종 프런트엔드 검사 4종, 서버 검사 5종, 모의 API 브라우저 흐름 33개(모바일 23·PC 10), 긴 데이터 반응형 7개 너비가 통과했다. 시각 비교를 수행했으며 아래에 명시한 디자인 차이는 남아 있다. 실제 OAuth·외부 시세·PostgreSQL을 연결한 통합 검증은 미완료다.

## 자료·근거

- [전체 디자인·경로·상태 매핑](DESIGN_MAPPING.md): PNG/JSX 15쌍과 공통 문서 2개, 확인 사실·추론·사용자 승인 구분.
- [변경 전 기능 감사](function-audit.md): 사전 조작 요소 표와 기존 오류. 당시의 미확정 수량 계약 설명은 이력이며 현재 상태가 아니다.
- [사용자가 확정한 수량 구매 계약](QUANTITY_BUY_CONTRACT.md): 금액/수량 중 하나, 소수 18자리, 서버 현재가·원 미만 내림, 부분 체결 없음.
- [최종 원본·구현·차이 갤러리](artifacts/index.html), [캡처 메타데이터](artifacts/visual-run.json), [원본 크기·해시](artifacts/design-manifest.json).

## 주요 변경 파일

| 파일 | 변경 |
| --- | --- |
| [App.css](../src/App.css), [index.css](../src/index.css) | PNG 기준 간격·크기·색상·반응형, 기존 Pretendard 실제 폰트 파일 로딩 유지 |
| [AppHeader.tsx](../src/components/AppHeader.tsx), [DashboardLayout.tsx](../src/components/DashboardLayout.tsx), [BackIcon.tsx](../src/components/BackIcon.tsx) | 공통 헤더·검색 상태·대시보드, 승인된 우측 기능 진입점, 기존 로고 PNG 사용 |
| [HomePage.tsx](../src/pages/HomePage.tsx), [CoinDetailPage.tsx](../src/pages/CoinDetailPage.tsx) | 홈·PC 3열·모바일 상세/거래 입력, 실제 종가 차트, 오류 재시도 |
| [SearchArea.tsx](../src/features/watchup/SearchArea.tsx), [HoldingsArea.tsx](../src/features/watchup/HoldingsArea.tsx) | 실제 검색/보유 데이터, 선택·이동, STALE 안내, 검색 닫기·재시도 |
| [AccountSummary.tsx](../src/features/paper/AccountSummary.tsx), [AccountTopUp.tsx](../src/features/paper/AccountTopUp.tsx) | 서버 문자열 표시, 거래 후 portfolio 현금 우선, 충전 후 자산 재조회 |
| [BuyForm.tsx](../src/features/paper/BuyForm.tsx), [SellForm.tsx](../src/features/paper/SellForm.tsx), [api.ts](../src/features/paper/api.ts) | 금액·수량 입력, 실제 BUY/SELL 요청, 실패 시 입력 보존 |
| [paperStore.ts](../src/stores/paperStore.ts) | 계정 전환 초기화·이전 세션의 늦은 응답 차단, 기존 재조회/멱등 재시도 유지 |
| [서버 schema](../../watch_up_server/app/schemas/paper.py), [서버 거래 서비스](../../watch_up_server/app/services/paper_trade.py) | 승인된 quantity BUY 추가, 기존 금액 BUY/SELL 계산·인증·DB 구조 유지 |
| [검증 스크립트](README.md), [수량 테스트](../src/test/buyQuantity.test.tsx), [세션 테스트](../src/test/paperSessionIsolation.test.ts), [서버 수량 테스트](../../watch_up_server/tests/test_trade_buy_quantity.py) | 회귀·음수 사례와 실제 브라우저 조작·원본 비교 자료 |

작업 전 존재하던 환경 예제·CI·AGENTS/CLAUDE·public/icons·migration 관련 사용자 변경은 유지했다. `.env`와 비밀 키는 읽지 않았다. 배포·커밋·푸시는 수행하지 않았다.

## 화면별 상태

`비교 수행`은 동일성 통과를 뜻하지 않는다. 모든 화면을 실행·캡처 후 나란히 직접 확인했고, 겹침·차이 이미지를 생성했다. 미검증 또는 차이가 남은 부분을 완료로 표시하지 않는다. 아래 파일명은 `.png`와 동명 `.jsx`를 함께 가리킨다.

| 화면·기능 | 코드 작성 | 시각 검증 | 기능 검증 | 남은 문제 |
| --- | --- | --- | --- | --- |
| mobile_mainpage_white | 작성 | 비교·수정 수행 | 조회·행 이동·검색: 모의 API 통과 | R1·R2·R5 |
| mobile_mainpage_black | 작성 | 비교·수정 수행 | 테마·조회: 모의 API 통과 | R1·R2·R5 |
| mobile_mainpage_white_searching | 작성 | 비교·수정 수행 | 입력·방향키·Enter·행 클릭·닫기: 통과 | R1·R5·R7 |
| mobile_mainpage_black_searching | 작성 | 비교·수정 수행 | 같은 컴포넌트 흐름·테마 통과 | R1·R5·R7 |
| mobile_mainpage_white_chart_have | 작성 | 비교·수정 수행 | 조회·구매·판매·재시도: 통과 | R1·R2·R3·R5 |
| mobile_mainpage_black_chart_have | 작성 | 비교·수정 수행 | 같은 컴포넌트 흐름·테마 통과 | R1·R2·R3·R5 |
| mobile_mainpage_white_chart_not_have | 작성 | 비교·수정 수행 | 미보유 판매 숨김·구매 진입: 통과 | R2·R3·R5 |
| mobile_mainpage_black_chart_not_have | 작성 | 비교·수정 수행 | 같은 컴포넌트 상태·테마 통과 | R2·R3·R5 |
| mobile_mainpage_white_purchasing_price_before | 작성 | 비교·수정 수행 | 빈 입력 비활성·입력·뒤로가기: 통과 | R2·R5 |
| mobile_mainpage_black_purchasing_price_before | 작성 | 비교·수정 수행 | 빈 입력 상태·테마 통과 | R2·R5 |
| mobile_mainpage_white_purchasing_price_after | 작성 | 비교·수정 수행 | amountKrw 제출·실패 재시도: 통과 | R2·R5 |
| mobile_mainpage_white_purchasing_number_before | 작성 | 비교·문구 수정 수행 | 모드 전환·18자리 검증: 통과 | R2·R5 |
| mobile_mainpage_white_purchasing_number_after | 작성 | 비교·수정 수행 | quantity 제출·재조회: 통과 | R2·R5, 실제 서버 통합 미검증 |
| PC_mainpage_white | 작성 | 비교 수행·차이 잔존 | PC 검색·구매·판매·수량 구매: 모의 API 통과 | R1~R6 |
| PC_mainpage_black | 작성 | 비교 수행·차이 잔존 | PC 검색·구매·판매·수량 구매: 모의 API 통과 | R1~R6 |
| 충전·내역·로그아웃·테마 | 작성·기존 연결 | PNG 없음, 배치 승인 반영 | 브라우저 기본 흐름·기존 단위 테스트 통과 | 실제 OAuth·계좌 미검증 |
| quantity BUY 서버 | 작성 | 해당 없음 | Fake repository·price·tx 테스트 통과 | 실제 DB/RLS·외부 API 체결 미검증 |

### 남은 차이·자료 부족

- **R1 — 제공되지 않는 데이터:** holding에는 종목별 수익률이 없어 원화 평가손익만 표시한다. chart에는 전일 대비 등락액·등락률 필드가 없어 미보유 상세에 해당 예시 문구를 만들지 않았다. `첫 투자금`과 동일한 필드는 없으므로 기존 `lifetimeTopUpKrw`를 의미에 맞는 `누적 충전`으로 표시했다. 별도 데이터 정의 없이 금액·거래 계산을 추가하지 않았다.
- **R2 — 기존 기능 보존:** 사용자 승인에 따라 충전·내역·테마·로그아웃을 헤더 우측에 배치했다. PNG에는 이 아이콘들이 없다. 기존 상세 정보는 차트 아래 `코인 정보` 접기/펼치기로 접근을 유지했다. 이 추가 정보 배치는 공통 스타일을 따른 구현 판단이다.
- **R3 — 차트 디자인 미제공:** 원본은 회색 영역과 `차트`라는 표기만 있다. 같은 위치·크기·배경에 기존 Recharts 종가 선·축·tooltip을 유지했다. 회색 이미지나 가짜 캔들로 실제 데이터 기능을 대체하지 않았다. 구체적인 선·축·tooltip 디자인 일치는 미검증이다.
- **R4 — PC 빈 입력:** PNG의 구매 버튼은 빨강이지만 유효하지 않은 빈 입력의 기존 비활성 동작을 유지해 분홍색으로 표시한다. 거래 조건을 외형 때문에 완화하지 않았다.
- **R5 — 예시·렌더링:** 반복된 원본의 동일 심볼을 실제로 구분 가능한 API fixture의 BTC/BCH/BTG/BSV로 사용했다. 원본 예시의 행 손익·상세 손익이 일관되지 않아 이를 데이터 규칙으로 재현하지 않았다. 폰트 400·700과 원본 로고 PNG는 로딩을 확인했다. 글자 안티앨리어싱·숫자 자간·아이콘 윤곽에 미세 차이가 남는다. 독립 벡터 로고·아이콘 원본 세트는 제공되지 않았으며 기존 로고 PNG와 코드 아이콘·설치된 lucide를 사용했다. 임시 로고나 placehold.co 이미지는 사용하지 않았다.
- **R6 — PC 로고:** 현재 공통 헤더의 로고 상단은 24px, JSX 기준은 28px로 4px 차이가 남는다. 워드마크 시작점도 2px 차이가 있다. 이를 조정하고 다시 캡처하는 추가 명령이 실행 승인 단계에서 `rejected by user`로 거절되어 적용되지 않았다. 기존 검증 자료를 최종 자료로 유지했다.
- **R7 — 검색의 세로 여유:** 빈 검색 화면에서 첫 margin이 부모 밖으로 합쳐져 main의 시작이 16px이며 최소 화면 높이에 더해 작은 세로 여유가 남는다. 요소의 실제 위치는 JSX와 일치한다(검색 y16, 목록 제목 y56, 첫 행 y78). 가로 넘침은 없다. 이 여유를 제거하는 추가 명령은 R6와 함께 거절되어 적용되지 않았다.

### PNG 우선으로 수정한 충돌

| 항목 | 자료 차이 | 적용 |
| --- | --- | --- |
| 밝은 행 강조 | design.md #DDDEE0 / PNG·JSX #D4D5DB | #D4D5DB |
| 다크 글자 | design.md main/sub 역할과 PNG가 반대 | 주요 #F5F5F5, 보조 #848484 |
| 차트 자리 | 공통 dark surface와 PNG 차이 | 양 테마 #D7D7D7 |
| PC 검색 | 다크 공통 배경과 PNG 차이 | 양 테마 #DBDBDB |
| 모바일 다크 검색 | PC와 다른 PNG | #222224 |
| 모바일 다크 홈 손익 | 공통 red/blue와 PNG 차이 | #FF0000 / #008CFF |
| 모바일 다크 판매 | 공통 blue와 PNG 차이 | #2B59FF |
| 다크 검색·구매 뒤로가기/활성 단위 | PNG의 어두운 글자 | #333333 유지 |
| 과도한 추출 크기 | JSX 하단 padding 485 등 | 화면 최소 높이·콘텐츠 흐름 사용, 화면 전체 이미지 배경 금지 준수 |

## 최종 조작 요소 연결

아래 API는 모두 기존 `apiRequest()` 경유다. 모의 투자이며 실제 거래소 주문 API는 추가하지 않았다.

| 화면·요소 | 사용자 행동 | 연결 함수·API | 성공 결과 | 실패 처리 | 근거·추론 여부 |
| --- | --- | --- | --- | --- | --- |
| 로그인 | Google 버튼 | LoginPage → Supabase signInWithOAuth | callback·세션 후 홈 | 기존 오류·재시도 | 기존 코드·인증 테스트; 실제 OAuth 미검증 |
| 보호 경로 | 직접 URL·새로고침 | AppRoutes·ProtectedRoute | 세션 있으면 동일 경로 | 없으면 login, bootstrap 로딩 | 기존 규칙·테스트 |
| 로고 | 클릭 | Link `/` | 홈 | 해당 없음 | 기존 홈 이동 유지 |
| 헤더 검색 | 클릭 | DashboardLayout.openSearch | 모바일 검색 상태·입력 포커스, PC 검색 포커스 | Escape/닫기 복귀 | 기존 검색 재사용, 표시 방식 추론 |
| 검색 입력 | 입력·수정 | setSearchQuery → 300ms → GET /coins/search | 첫 결과 선택 | 오류·재시도, 빈 결과, abort·이전 응답 차단 | SEARCH-01 |
| 검색 결과 | 방향키·Enter·클릭 | navigateToResult + onSelect | API 코드 상세, 검색 상태 종료 | 빈 결과 Enter 무동작 | 기존 규칙 + 실행 중 발견한 상태 오류 수정 |
| 빈 검색의 보유 행 | 클릭 | HoldingsArea navigate + onSelect | 같은/다른 종목 차트 | 해당 없음 | 빈 입력 목록은 PNG·코드 기반 추론 |
| 검색 뒤로가기 | 클릭·Escape | closeSearch | 입력·선택 정리, 이전 화면 | 해당 없음 | 새 라우트 없이 상태 복귀 |
| 자산·보유 | 화면 진입 | loadAccount / refreshPortfolio → GET account·portfolio | 문자열 요약·보유 목록 | 조회/평가 중·PARTIAL·STALE·오류·재조회 | FE-BE-04/07·HOLDINGS-01 |
| 상세 | 검색/보유/직접 URL | getCoinChart + refreshPortfolio | chart+portfolio 합성 | 차트·portfolio 별도 재시도, 이전 응답 차단 | 기존 API·REFRESH-01 |
| 상세 뒤로가기 | 클릭 | Link `/`, 거래 중 setTradeView(null) | 홈 또는 차트 | 해당 없음 | 기존 홈 경로 + 입력 복귀 추론 |
| 차트 | 포인터 | 기존 PriceChart Recharts Tooltip | 서버 종가·날짜 | 빈 배열 안내·짧은 기간 안내 | 기존 코드·계약 |
| 구매 진입 | 클릭 | openTrade(BUY) | 모바일 입력 표시 | UNAVAILABLE 비활성 | 기존 거래 규칙 + 상태 UI |
| 수량/금액 | 클릭·입력 | BuyForm mode·문자열 검증 | 단위별 값 유지, blur 시 표시 포맷 | 빈/잘못된 입력 제출 비활성 | 승인된 계약, 가격 계산 없음 |
| 구매 제출 | 클릭 | UUID → postTrade → POST trades | 성공 후 portfolio 재조회·입력 초기화·차트 | 서버 오류·입력 보존, DB 오류만 같은 키 1회 재시도 | 기존 규칙 + 승인 quantity BUY |
| 판매 | 클릭·보유 수량 입력·제출 | SellForm → POST trades SELL quantity | 재조회, 전량 매도 시 목록 제외 | 서버 잔고/마켓/시세 오류, 마지막 상태 유지 | 기존 SELL 계산·계약 유지 |
| 재조회 실패 | 다시 시도 | refreshPortfolio | 서버 응답으로 복구 | 마지막 성공 목록 유지 | REFRESH-01, 기존 실패 테스트 수정 |
| 충전 | 우측 지갑→금액→충전 | POST top-ups → GET account·portfolio | 현금·총액 갱신 | 오류 표시·계좌 조회 재시도 | 기존 API; portfolio 갱신 보완 |
| 거래 내역 | 우측 내역·더 보기 | GET trades limit/beforeId | 새로 열 때 재조회·기존 cursor 페이지 | 목록 유지·동일 cursor 재시도 | 기존 TradeHistory·테스트 |
| 테마 | 우측 테마 버튼 | cycleMode | system/light/dark·localStorage | 저장 실패 시 세션 내 적용 | 기존 store·테스트 |
| 로그아웃 | 우측 버튼 | Supabase signOut·setSession(null) | login 이동·paper 상태 초기화 | 세션 유지·오류·재시도 | 기존 인증 규칙·새 세션 격리 테스트 |
| 인증 만료 | API 401 | refreshSessionOnce·요청 1회 재시도 | 새 토큰 응답 | 실패 시 세션 제거·이전 데이터 초기화 | 기존 apiClient·세션 격리 테스트 |

## 실행·검증 증거

| 검사 | 결과·범위 | 로그 |
| --- | --- | --- |
| npm run lint | 통과 | [lint.log](artifacts/lint.log) |
| npm run typecheck | 통과 | [typecheck.log](artifacts/typecheck.log) |
| npm test -- --run | 20 파일, 149 테스트 통과 | [vitest.log](artifacts/vitest.log) |
| npm run build | 통과, 실제 Pretendard woff2 2종 산출 | [build.log](artifacts/build.log) |
| ruff format --check | 통과, 85 파일 | [server-format.log](artifacts/server-format.log) |
| ruff check | 통과 | [server-lint.log](artifacts/server-lint.log) |
| mypy app | 통과, 52 파일 | [server-typecheck.log](artifacts/server-typecheck.log) |
| pytest -q | 313 통과 | [server-pytest.log](artifacts/server-pytest.log) |
| pip check | 통과 | [server-dependencies.log](artifacts/server-dependencies.log) |
| Chromium 사용자 흐름 | 23 항목 통과, 모의 API | [browser-flows.json](artifacts/browser-flows.json) |
| Chromium PC 흐름 | 라이트·다크 각 5개, 총 10개 통과, 모의 API | [pc-flows.json](artifacts/pc-flows.json) |
| 긴 데이터 반응형 | 320/375/600/768/1024/1275/1440px, 12행·긴 이름·최대 길이 금액·18자리 수량, 가로 넘침/요약 겹침 0 | [responsive-content.json](artifacts/responsive-content.json) |
| 시각 자료 | 15 상태, 폰트·이미지 완료 후 원본과 동일 DPR 2 캡처 | [visual-run.json](artifacts/visual-run.json) |

실행은 프로젝트의 Vite·실제 AppRoutes/컴포넌트를 사용하는 별도 `verification/server.mjs`에서 수행했다. `.env`를 로드하지 않고 공개된 가짜 설정과 검증 전용 세션을 사용한다. 프로덕션 main 진입점이나 인증을 우회하도록 바꾸지 않았다. 서비스 UI의 데이터는 기존 API 연결이며 fixture는 verification 폴더에만 있다. 브라우저 도구는 Playwright 1.63.0, Chromium revision 1243, pngjs 7.0.0, pixelmatch 7.2.0이다. 서버 검증은 격리 Python 3.13 환경에서 실행했다. 저장소의 목표 Python 3.14 Docker 이미지 빌드·non-root health 검사는 이번 환경에서 미실행이다.

브라우저에서 검색 → 코인 선택 → 차트 → 금액 구매 → 보유 반영 → 새로고침 → 전량 판매 → 재조회 실패 → 재시도 → 보유 제거를 확인했다. 수량 BUY, 같은 상세에서 재검색, 구매 중 보유 행 선택, UNAVAILABLE 차단, 차트 오류, 충전·내역·테마·로그아웃도 확인했다. 새로고침 지속은 **모의 API 상태**의 재구성이며 실제 DB 영속성 증거가 아니다.

초기 프런트엔드 145/146 테스트 중 실패한 상세 portfolio 재시도 누락을 수정했다. 추가 검증 중 발견한 768px 긴 요약 겹침과 상세 재검색 상태 오류는 재현 후 수정·재검증했다. 서버 전체 검사 중 한 번 실패한 시간 경계의 기존 만료 토큰 테스트는 단독 재실행과 전체 재실행에서 통과했다(인증 코드 변경 없음). Tailwind content 비어 있음, Vite 큰 청크, Starlette/AnyIO deprecation 경고는 남아 있다. 초기 blank baseline은 harness 오류였으며 [INVALID.md](artifacts/baseline/INVALID.md)에 명시했고 최종 비교로 사용하지 않는다.

## 시각 비교 방법·수정 기록

대표 화면은 mobile_mainpage_white로 먼저 구현·조회·검색·행 이동을 연결하고 나란히 비교했다. 요약·보유 목록의 12px 수직 간격과 강조색을 조정한 뒤 공통 스타일을 확장했다. [대표 원본](artifacts/current/comparison/mobile_mainpage_white.original.png), [대표 구현](artifacts/current/mobile_mainpage_white.png), [나란히](artifacts/current/comparison/mobile_mainpage_white.side-by-side.png), [겹침](artifacts/current/comparison/mobile_mainpage_white.overlay.png), [차이](artifacts/current/comparison/mobile_mainpage_white.diff.png).

- 모바일 CSS 375×812 / PNG 750×1624, PC CSS 1275×900 / PNG 2550×1800, deviceScaleFactor 2.
- 원본과 구현을 늘이거나 자르지 않았다. 비교 스크립트는 픽셀 크기가 다르면 실패한다. 모든 상태에 원본 복사·구현·50% 겹침·pixelmatch 차이·나란히 파일이 있다. 픽셀 차이 비율을 동일성 점수로 보고하지 않는다.
- 메인: padding 24px, header 60px, 43px 행, 요약 간격·다크 손익색·로고 배경을 수정했다.
- 검색: bar 293×28, x57/y16, 제목 y56·첫 행 y78, 뒤로가기 다크 색상 수정. 픽셀 잉크 좌표도 대조하여 남은 작은 글자 차이를 렌더링 차이로 분리했다.
- 보유/미보유 상세: 중복 12px padding 제거, 차트 327×327, 미보유도 제목·가격이 위에서 시작하도록 grid 정렬 수정. 구매/판매 footer 높이 55px·하단 24px.
- 금액/수량 입력: 제목 y100, 입력 y217·31px, 모드·힌트 간격, 전체 너비 구매 버튼, `몇 코인 구매할까요?` 문구 수정. after는 거래를 실행하지 않은 입력 상태로 캡처했다.
- PC: 3열 minmax 그리드, 41px 간격, 483×444 차트, 검색·자산 요약 위치를 맞췄다. 큰 숫자를 넣은 검증에서 겹침을 수정했다. 로고의 추가 미세 조정은 R6 참조.

디자인 없는 너비는 기존 767px breakpoint를 유지하고 유동적인 열·줄바꿈으로 연결했다. 긴 데이터에서는 행 높이를 늘리고 페이지를 세로로 스크롤하며, 고정된 목업 행 수나 큰 하단 padding으로 콘텐츠를 자르지 않는다. 모바일 거래 버튼은 기존 기준 위치와 안전 영역을 따른다.

## 더블 체크

Pass 1: 기존 규칙과 승인된 추가 계약을 코드·요청·테스트에 대조하고 프런트엔드/서버 전체 검사를 통과했다. Pass 2: 빈 검색·동일 상세 재검색·UNAVAILABLE·거래 실패·재조회 실패와 재시도·늦은 세션 응답·긴 데이터 겹침을 확인했다. 해당 범위에서 발견한 오류는 수정 후 재검증했다. 실제 DB 동시성·RLS 항목은 미검증이며 더블 체크 완료 범위에 포함하지 않는다.

## 검증 범위 밖

실제 Google OAuth, 테스트 계정의 인증된 FastAPI 호출, Upbit 가격 응답, PostgreSQL 저장 지속성·실제 RLS·동시 거래·실제 rollback은 미검증이다. 안전한 테스트 계정/DB를 제공받지 않았으며 실제 계좌 변경을 수행하지 않았다. 기존 단위·TestClient·Fake tx 테스트 통과를 실제 운영 API 통과로 표현하지 않는다. 모바일 가상 키보드·iOS Safari는 별도 미검증이다.

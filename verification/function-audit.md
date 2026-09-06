> 후속 확정·구현: 사용자가 2026-09-06 이 문서의 floor 유지 수량 BUY 계약을 승인했습니다. `QUANTITY_BUY_CONTRACT.md`가 최종 계약이며, 아래는 변경 전 감사·제안 이력입니다. 재시도/충전/현금/계정 전환 결함 수정과 검증 결과는 `IMPLEMENTATION_REPORT.md`를 참조하세요.

# UI 기능 사전 감사 및 수량 BUY 계약 초안

작성일: 2026-09-06. 이 문서는 UI 수정 전 코드를 감사한 기록이다. 아래 줄 번호는 감사 당시 기준이며 후속 수정으로 달라질 수 있다. `.env`는 읽지 않았다. 코드에 존재하는 동작과 실행으로 확인한 결과를 분리한다.

## 근거 우선순위와 문서 충돌

검토: React/Server `AGENTS.md`, `planning_v2.2.md`, `planning_v2.2_ai.md`, `WatchUp_v2.2_functions.md`, step 9·10, UI `redesign_prompt.md`, React README, 라우트·컴포넌트·store·API·타입·테스트, 서버 매매 서비스·schema·repository·transaction·idempotency·테스트.

- v2.2 계획의 SEARCH-01, HOLDINGS-01, REFRESH-01과 실제 코드가 기능 기준이다. README에 남은 v1.5 관심 목록·등록·삭제·매매 미지원 설명은 현재 코드와 충돌하는 오래된 설명이다.
- `AGENTS.md`의 API URL `/api` fallback 설명과 달리 현재 `src/api/client.ts:20` 및 `src/test/apiClient.test.ts:47`은 절대 HTTP(S) base URL을 필수로 요구한다. README 실행 절차도 이 현재 구현과 일치한다. UI 작업에서 URL 정책을 바꾸지 않는다.
- 기존 step 9는 목업에 없는 로그아웃을 헤더에서 유지하도록 명시한다(`UI/redesign_prompt.md:76`). 충전·거래 내역·테마 전환도 현재 존재하는 기능이므로 PNG에 없다는 이유로 접근을 제거할 수 없다.
- 제공된 수량 구매 UI와 현재 BUY 계약은 충돌한다. 사용자는 수량 구매도 요구하되 별도 계약 확정 후 구현하도록 응답했다. 이 문서의 수량 BUY는 **미확정 제안**이며 구현 승인이 아니다.

## 화면·요소별 연결표

| 화면·요소 | 사용자 행동 | 연결 함수·API | 성공 결과 | 실패 처리 | 근거·추론 여부 |
| --- | --- | --- | --- | --- | --- |
| `/login` Google 로그인 | 클릭 | `LoginPage.login` → Supabase `signInWithOAuth({provider:'google',redirectTo:'/auth/callback'})` | OAuth 이동, callback 세션 후 `/` replace | 안전한 오류 문구·중복 클릭 비활성 | 사실: `src/pages/LoginPage.tsx:4`, `src/test/auth.test.tsx:84` |
| `/auth/callback` | OAuth 복귀 | `AuthProvider` session bootstrap/listener + `AuthCallbackPage` | 로그인 세션이면 `/` | 로그인 오류·세션 없음 처리 | 사실: `src/auth/AuthProvider.tsx:6`, `src/test/auth.test.tsx:52` |
| `/`, `/coins/:marketCode` 접근 | 직접 URL·새로고침 | `AppRoutes`, `ProtectedRoute` | 인증 후 같은 화면 로딩 | 세션 없으면 `/login`; 초기화 전 loading | 사실: `src/App.tsx:10`, `src/routes/AuthRoutes.tsx:10` |
| 헤더 로그아웃 | 클릭 | `HomePage.logout` → Supabase `signOut()` | 세션 제거·`/login` replace | 기존 세션/화면 유지·오류 표시, 재클릭 가능 | 사실: `src/pages/HomePage.tsx:39`, `src/test/auth.test.tsx:104` |
| 테마 버튼 | 클릭 | `useThemeStore.cycleMode` | system → light → dark → system; `watchup.theme` localStorage·DOM 반영 | 저장 실패 시 세션 내 적용 유지 | 사실: `src/components/ThemeToggle.tsx`, `src/stores/themeStore.ts:58`, `src/test/theme.test.tsx:49` |
| 홈 검색 아이콘 | 클릭 | `focusSearch()` | 기존 `SearchArea`로 스크롤·포커스 | 대상 입력 없음이면 no-op | 사실: `src/pages/HomePage.tsx:17`, `src/test/homeDashboard.test.tsx:111`; 전체 화면 전환 여부는 UI 구현 선택 |
| 검색 입력 | 입력·수정 | `setSearchQuery` → 300ms debounce → `submitSearch` → `searchCoins` → `GET /api/coins/search?query=...` | API 순서 그대로 결과·첫 결과 기본 선택 | 안전한 검색 오류; 빈 결과 안내; 취소/sequence로 오래된 응답 무시 | 사실: `src/features/watchup/SearchArea.tsx:39`, `src/stores/watchupStore.ts:50`, `src/test/watchup.test.tsx:59` |
| 검색 결과 선택 | 방향키·Enter·행 클릭 | `handleKeyDown`, `navigateToResult` | API 반환 `marketCode`로 `/coins/{marketCode}` | 결과 없음 Enter no-op; 입력에서 코드 추측 금지 | 사실: `src/features/watchup/SearchArea.tsx:52`, `src/test/watchup.test.tsx:94` |
| 검색 선택 배경 | 결과 갱신·방향키 | `selectedIndex`, `aria-selected`, `.selected` | 첫 결과 또는 사용자가 선택한 결과 강조 | 별도 API 없음 | 사실: `src/features/watchup/SearchArea.tsx:47`; PNG의 모든 강조를 hover라고 간주하면 안 됨 |
| 자산 요약 | 홈 진입 | `AccountTopUp`의 `loadAccount` + `HoldingsArea`의 `refreshPortfolio` | account cash/lifetimeTopUp + portfolio totalAssets/PnL/rate 표시 | null은 조회/평가 중, PARTIAL 안내 | 사실: `src/features/paper/AccountSummary.tsx:20`; 실제 변경 후 별도 실행 검증 필요 |
| 보유 목록 | 홈 진입 | `refreshPortfolio` → `GET /api/paper/portfolio` | 서버의 `quantity>0` 보유 목록 표시 | 기존 목록 유지+오류+재시도; 빈 목록 안내 | 사실: `src/features/watchup/HoldingsArea.tsx:22`, `src/stores/paperStore.ts:70` |
| 보유 행 | 클릭 | `navigate('/coins/'+holding.marketCode)` | 같은 상세 경로 | 미거래 마켓도 상세 이동은 유지 | 사실: `src/features/watchup/HoldingsArea.tsx:73`, planning 7.2 |
| 상세 진입 | 검색·보유 행·직접 URL·새로고침 | `getCoinChart(marketCode)` + `refreshPortfolio()` 병렬 | chart와 portfolio를 FE에서 합성 | 차트 오류 UI·abort·응답 marketCode 불일치 거부; **감사 당시 차트 재시도 버튼 없음** | 사실: `src/pages/CoinDetailPage.tsx:55` |
| 상세 뒤로가기 | 클릭 | `<Link to='/'>` | 기존 홈으로 이동 | 별도 API 없음 | 사실: `src/pages/CoinDetailPage.tsx:112` |
| 가격 차트 | 포인터 탐색 | `PriceChart` Recharts `Tooltip` | 서버 30일 종가 표시·tooltip | 0개 이용 불가; 1개 점; 30개 미만 안내 | 사실: `src/features/watchup/PriceChart.tsx:26`; OHLC·실시간·다른 기간은 계약 없음 |
| 구매 금액 입력·구매하기 | 양의 원화 정수 문자열 입력·submit | `BuyForm` → UUID → `paperStore.postTrade` → `POST /api/paper/trades {marketCode,side:'BUY',amountKrw}` | 거래 성공 후 portfolio 재조회; 입력 초기화·차트 재조회 | 거래 오류 표시·목록 불변; DATABASE_UNAVAILABLE 1회 같은 키 재시도 | 사실: `src/features/paper/BuyForm.tsx:21`, `src/stores/paperStore.ts:112` |
| 수량/금액 구매 토글 | 선택·수량 입력 | **기존 quantity BUY 계약 없음** | 미확정 | 임의 표시가격 환산·미지원 API 전송 금지 | 사실: `src/features/paper/BuyForm.tsx:8`, 서버 `app/schemas/paper.py:79`; 신규 계약 초안 아래 |
| 판매 수량 입력·판매하기 | 수량 입력·submit | `SellForm` → UUID → `postTrade {marketCode,side:'SELL',quantity}` | 성공 후 portfolio 재조회; 전량이면 목록 자동 제외 | 실패 시 목록 불변·오류 표시 | 사실: `src/features/paper/SellForm.tsx:27`, planning HOLDINGS-01·REFRESH-01 |
| 구매·판매 비활성 | 마켓·보유·요청 상태 변경 | `marketStatus==='UNAVAILABLE'`; SELL은 holding이 있을 때만 렌더 | ACTIVE/CAUTION 거래 허용, 보유 0이면 SELL 없음 | 서버도 재검증; priceStatus 자체는 거래 차단 사유 아님 | 사실: `src/pages/CoinDetailPage.tsx:205`, `src/test/coinDetail.test.tsx:175` |
| 거래 후 보유 재조회 | 거래 성공 | `paperStore.refreshPortfolio` | 마지막 요청 응답만 반영 | 기존 상태+portfolioError; **감사 당시 상세 재시도 버튼 없음** | 사실: `src/stores/paperStore.ts:70`, `src/test/coinDetailRecovery.test.tsx:80` |
| 모의투자 충전 | 금액 입력·클릭 | `AccountTopUp` → UUID → `topUp` → `POST /api/paper/top-ups` → `GET /api/paper/account` | 계좌 다시 조회·입력 초기화 | 오류 표시; DATABASE_UNAVAILABLE만 같은 키 재시도 | 사실: `src/features/paper/AccountTopUp.tsx:21`, `src/stores/paperStore.ts:92` |
| 거래 내역 | 홈 진입 | `TradeHistory.load` → `GET /api/paper/trades?limit=20` | INITIAL_GRANT/TOP_UP/BUY/SELL 표시 | 오류+재시도; 빈 데이터 안내 | 사실: `src/features/paper/TradeHistory.tsx:19`, `src/test/tradeHistory.test.tsx:29` |
| 이전 내역·재시도 | 클릭 | `load(lastId)` → `beforeId` cursor | 기존 목록에 오래된 내역 추가; hasMore false면 버튼 제거 | 기존 내역 유지·동일 cursor 재시도 | 사실: `src/features/paper/TradeHistory.tsx:73`, `src/test/tradeHistory.test.tsx:69` |
| 인증 만료 | 보호 API 401 | `apiRequest` → `refreshSessionOnce` → 원 요청 한 번 재시도 | 새 token 결과 반영 | refresh 실패/재401은 local signOut·세션 제거; 라우트 guard `/login` | 사실: `src/api/client.ts:158`, `src/test/apiClient.test.ts:140` |

## 디자인과 데이터 계약 충돌

| PNG 요소 | 확인된 계약 | 적용 시 주의 |
| --- | --- | --- |
| 종목별 원화 손익 + 퍼센트 | portfolio holding은 `unrealizedPnlKrw`만 제공, per-holding rate 없음 | 임의 비율 생성 금지. 총자산 rate는 `totalReturnRate` 존재. 개별 비율 확장은 별도 계약 결정 필요 |
| 현재가 아래 가격 등락액·등락률 | chart는 currentPrice·priceStatus·종가 배열만 제공 | 원화 평가손익을 하루 등락으로 오표기하면 안 됨 |
| 첫 투자금 | account는 lifetimeTopUp만 제공; 최초 지급 1,000,000원은 계획의 고정값 | lifetimeTopUp를 첫 투자금으로 라벨만 변경하면 의미가 다름. 정적 최초 지급금을 표시하거나 별도 원금 정의 결정 필요 |
| 수량 구매 | BUY amountKrw만 지원 | 새 계약 확정 전 완료 처리 금지 |
| 검색 결과 강조 | 첫 결과 기본 선택 코드·정책 존재 | 키보드 선택은 유지. PNG에 여러 동일명 행은 예시 데이터 |
| 보유 목록 강조 | 감사 당시 영구 selected 상태 없음; 행 클릭하면 상세 이동 | PC 상세의 현재 marketCode 표시로 적용한다면 UI 추론이라고 기록 |
| 상승·하락 차트 | 데이터는 `{date,closingPrice}` | 선 그래프 구성 가능. OHLC candle 생성·빈 데이터 허구 생성 금지 |
| PNG에 없는 기존 컨트롤 | 로그아웃·테마·충전·거래 내역 존재 | 접근점 유지. 배치를 바꿔야 충돌 해소 가능하면 사용자 결정 필요 |

## 감사 당시 확인한 오류·위험

| 항목 | 근거 | 검증 상태·조치 필요 |
| --- | --- | --- |
| 상세 portfolio 실패 재시도 버튼 누락 | `CoinDetailPage`는 오류 문구만, `coinDetailRecovery.test.tsx:95`는 버튼 클릭 요구 | root의 baseline 담당이 145/146 통과·해당 실패 확인. 이번 UI 연결 범위에서 수정 필요 |
| 차트 오류 재시도 버튼 누락 | `CoinDetailPage` 오류 렌더에 onClick 없음 | 정적 확인. UI에서 재시도 가능하도록 연결 필요 |
| 충전 후 내 자산 합계/내역이 즉시 갱신되지 않음 | `paperStore.topUp`은 account만 재조회, summary 총액은 portfolio, TradeHistory는 최초 mount에만 조회 | 정적 확인. 기존 top-up 계약은 account 재조회까지만 명시하므로 합계 갱신은 UI 정합성 보완으로 이유 기록 |
| 계정 전환 뒤 이전 자산 상태 노출 가능 | `authStore.setSession`은 session만 갱신. `HomePage.logout`·AuthProvider에 paperStore.reset 없음 | 정적 위험, 실행 미검증. 인증 변경 시 데이터 초기화와 진행 중 응답 차단 필요 |
| 거래 완료 후 현금 출처가 달라질 수 있음 | 거래는 portfolio.cashBalance를 갱신하지만 AccountSummary는 account.cashBalance 표시 | 정적 확인. 현재 결과를 우선하는 일관된 표시 출처 검토 |
| 종목별 STALE 안내가 없음 | HoldingsArea는 총 valuationStatus만 노출, 각 `holding.priceStatus` 미표시 | planning 8.2는 stale 가격을 반환하면 항목에 명시. 실제 UI 확인 필요 |
| 금액 BUY·SELL의 NUMERIC 범위·멱등 동시성 | DB·단위 테스트가 대부분 FakeConnection 기반 | 실제 DB 오류·RLS·동시성 통과라고 표현할 수 없음 |

## 실행 검증 가능 범위

- 프론트엔드 명령: `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`, `npm run dev`.
- 프론트엔드 기존 테스트는 Supabase/feature API/fetch mock 기반이다. Google OAuth·실제 FastAPI·Redis·DB를 접속한 검증이 아니다(README 명시).
- 서버 `tests/conftest.py`는 `Settings(_env_file=None)`을 사용한다. `test_paper_account_api.py:43`는 인증·서비스를 dependency override한 TestClient이며 실제 계정 변경이 아니다.
- 서버 `test_db_tx_rls_context.py:23`은 `FakeConnection`, BUY/SELL 서비스 테스트는 Fake Tx·repository·price source다. 실제 PostgreSQL의 사용자 간 RLS·rollback·동시성·새로고침 저장 지속성 증거로 사용하지 않는다.
- 감사 시 8000 API 및 5173 Vite 포트는 열려 있지 않았다. 인증된 실제 테스트 계정·테스트 DB·외부 API 접근은 제공/확인되지 않았다. 실제 API·실제 저장 검증은 미검증으로 남긴다.
- browser baseline 담당으로부터 전달받은 결과: 145/146 tests 통과, 상세 portfolio 재시도 버튼 누락 1건. 본 감사 담당이 전체 suite를 직접 실행한 결과는 아니다.

## 수량 BUY 최소 계약 초안 — 사용자 확정 전 구현 금지

현재 코드와 계획은 금액 BUY·SELL 모두 원화 소수점을 **내림**한다. `app/services/paper_trade.py:105`는 `quantity=floor18(amount/price)`, `:108`은 `debit=floor(price×quantity)`, `:132`는 매도 대금 내림이다. 기존 정책이 ceil이라는 해석은 근거와 다르다.

### 요청·응답

기존 endpoint에 다음 요청 유형만 추가하는 안이다.

```json
{"marketCode":"KRW-BTC","side":"BUY","quantity":"0.001"}
```

| 항목 | 제안 |
| --- | --- |
| BUY 입력 | `amountKrw` 또는 `quantity` 중 정확히 하나. 모두 없거나 둘 다 있으면 `INVALID_REQUEST` |
| SELL 입력 | 기존 `quantity`만 그대로 유지 |
| 새 quantity 형식 | 양수 십진 문자열, 소수 최대 18자리, NUMERIC(38,18) 범위. JSON number·부호·지수·0·소수 19자리·범위 초과 거부 |
| 수량 의미 | 서버가 확정한 가격으로 **입력 수량 전체**를 매수. 잔액 부족 시 일부 수량으로 축소하지 않고 전체 실패 |
| 허용 필드 | 기존 marketCode/side + 선택한 입력만. price/userId/예상 체결금액/견적 식별자 등 금지 |
| 응답 | 기존 BUY PaperTransaction 그대로. executionPrice·quantity·cashDeltaKrw·balanceAfterKrw로 확정 결과 확인 |
| UI | 수량/금액 탭은 입력 단위를 바꿈. 입력값을 표시가격으로 환산하여 기존 금액 API에 보내지 않음. 예상 금액을 제공하려면 별도 표시 전용 계산 규칙 결정 필요 |

### 서버 처리와 현금 정책 결정

1. JWT·body·키 검증 → 기존 멱등 결과 조회 → ACTIVE/CAUTION 확인 → 직접 ticker 1회·재시도 0·가격 양자화 → 계좌 lock → 포지션 lock.
2. `q=요청 quantity`, `p=서버 확정 executionPrice`를 Decimal precision 80 이상으로 계산한다. q는 18자리 이내 유효값이므로 매수 수량을 다시 floor18로 축소하지 않는다.
3. 최소 변경 제안은 `d=floorKrw(p×q)`이다. `d>=1`, `d<=잠긴 현금잔액`, BIGINT·NUMERIC 범위를 검사한다. 범위/1원 미만 실패는 `INVALID_REQUEST`, 잔액 부족은 `INSUFFICIENT_CASH_BALANCE`.
4. 현금 `-d`, 보유수량 `+q`, 원가 `+d`, 불변 BUY 거래 한 건을 기존 tx에서 함께 Commit. 실패는 전체 rollback. 최초 계좌/INITIAL_GRANT도 같은 tx 정책 유지.
5. 기존 금액 BUY와 SELL 수학·원가 배분은 변경하지 않는다. 응답 이후 portfolio를 재조회하고 그 결과만 화면에 반영한다.

사용자 결정이 필요한 차감 반올림:

| 방식 | p=100.25원, q=0.1개 | 의미 |
| --- | --- | --- |
| 기존과 같은 floor 유지(최소 변경 제안) | 10원 차감 | 금액 BUY와 같은 원화 내림 규칙 |
| 새 quantity BUY만 ceil 도입 | 11원 차감 | 수량 BUY의 새로운 차감 정책. 기존 금액 BUY에는 적용하지 않음 |

ceil을 선택하면 `0<p×q<1`인 거래를 허용할지도 함께 확정해야 한다. 기존 BUY는 floor 결과 0이면 `INVALID_REQUEST`다. 이 부분을 자동으로 바꾸면 최소 거래 정책이 달라진다.

### 멱등·호환성

- 현재 fingerprint: endpoint+선택 body를 정렬 JSON으로 직렬화한 SHA-256(`app/services/idempotency.py:28`). 현재 금액 BUY와 SELL 문자열은 원문 그대로 body에 들어간다(`paper_trade.py:46`).
- 새 수량 BUY만 수량을 정규화(`0.0100` → `0.01`)한 quantity body를 사용한다는 제안이다. 같은 수량 표기 차이는 같은 결과 재생, 같은 키의 다른 수량·금액/수량 모드 변경은 409다.
- 과거 금액 BUY/SELL fingerprint를 일괄 변경하지 않는다. 변경하면 저장된 거래의 재시도 호환성이 깨진다.
- 키의 사용자별 namespace·같은 요청 replay 200·새 요청 201·실패 시 결과 저장 안 함·DATABASE_UNAVAILABLE에만 FE 1회 같은 키 재시도는 유지한다.
- 신규 endpoint·응답 필드·DB column·거래 type은 필요 없다. 정책 문서와 API 계약·schema·거래 입력 타입·폼·서버 분기·테스트만 제한적으로 확장한다.

### 확정 후 필요한 의미 있는 테스트

- amount BUY 기존 수량/차감·SELL 부분/전량 원가 결과 회귀.
- quantity BUY 18자리 정확도·둘 다/둘 다 없음·숫자형·19자리 소수·0·음수·지수·범위 초과 거부.
- 실제 확정가에 따른 정확한 요청 수량 매수, 부족 현금 전부 실패, 1원 미만 정책, 기존 포지션에 추가 매수.
- 선택한 반올림 경계와 잔액 경계, 합산 수량·원가 범위 초과 전부 rollback.
- 같은 키/같은 정규 수량 replay 및 다른 모드·수량 충돌; 과거 amount/SELL 지문 호환.
- UNAVAILABLE 차단·PRICE_ERROR 자체로 UI 차단하지 않음·ticker 실패 무변경.
- 브라우저 수량 탭 입력 → quantity만 요청 → portfolio 응답 반영 → 새로고침; 실제 API/모의 응답은 구분 기록.

이 초안은 사용자 핵심 정책 확정 대기 상태다. 서버·프론트엔드 실행 코드는 본 감사 작업에서 수정하지 않았다.

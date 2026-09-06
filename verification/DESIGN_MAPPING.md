# 디자인 매핑 및 판단 근거

사전 표를 바탕으로 사용자 승인 내용을 반영한 최종 매핑. 전체 15쌍의 PNG·JSX와 공통 문서 2개를 확인했다. PNG 외형 → JSX 수치 → design.md 순서로 적용했다. 파일 이름만으로 경로나 상태를 확정하지 않았다.

근거: 각 저장소 AGENTS.md·CLAUDE.md, planning_v2.2.md·planning_v2.2_ai.md, WatchUp_v2.2_functions.md, step_9/step_10, UI/redesign_prompt.md, React 라우트·컴포넌트·store·API·타입·테스트, 서버 schema·service·repository·test. `.env`는 읽지 않았다. 사전 기능 감사는 [function-audit.md](function-audit.md)에 보관했다.

| 디자인 파일(PNG와 동명 JSX) | 화면 경로 | 진입·표시 조건 | 화면 상태·테마 | 기존 컴포넌트 | 기준 CSS 화면 크기 |
| --- | --- | --- | --- | --- | --- |
| [PC_mainpage_white.png](../../watch_up_infra/UI/PC_mainpage_white.png) · [.jsx](../../watch_up_infra/UI/PC_mainpage_white.jsx) | /coins/:marketCode | 검색·보유 행·직접 URL, 상세 종목 선택 | light / PC / 금액 빈 입력 | HomePage·CoinDetailPage·SearchArea·AccountSummary·HoldingsArea·BuyForm·SellForm | 1275×900 |
| [PC_mainpage_black.png](../../watch_up_infra/UI/PC_mainpage_black.png) · [.jsx](../../watch_up_infra/UI/PC_mainpage_black.jsx) | /coins/:marketCode | 위와 동일 | dark / PC / 금액 빈 입력 | 위와 동일 | 1275×900 |
| [mobile_mainpage_white.png](../../watch_up_infra/UI/mobile_mainpage_white.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white.jsx) | / | 인증 세션으로 홈 진입 | light / 첫 행 hover(추론) | HomePage·AccountSummary·HoldingsArea | 375×812 |
| [mobile_mainpage_black.png](../../watch_up_infra/UI/mobile_mainpage_black.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_black.jsx) | / | 인증 세션으로 홈 진입 | dark / 첫 행 hover(추론) | 위와 동일 | 375×812 |
| [mobile_mainpage_white_searching.png](../../watch_up_infra/UI/mobile_mainpage_white_searching.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_searching.jsx) | / 또는 /coins/:marketCode 유지 | 헤더 검색 클릭, 검색어 비어 있음 | light / 검색 열림·입력 blur | SearchArea·HoldingsArea | 375×812 |
| [mobile_mainpage_black_searching.png](../../watch_up_infra/UI/mobile_mainpage_black_searching.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_black_searching.jsx) | / 또는 /coins/:marketCode 유지 | 위와 동일 | dark / 검색 열림·입력 blur | 위와 동일 | 375×812 |
| [mobile_mainpage_white_chart_have.png](../../watch_up_infra/UI/mobile_mainpage_white_chart_have.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_chart_have.jsx) | /coins/:marketCode | 상세 조회 + portfolio에 해당 보유 행 존재 | light / 구매·판매 진입 표시 | CoinDetailPage·PriceChart·BuyForm·SellForm | 375×812 |
| [mobile_mainpage_black_chart_have.png](../../watch_up_infra/UI/mobile_mainpage_black_chart_have.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_black_chart_have.jsx) | /coins/:marketCode | 위와 동일 | dark / 구매·판매 진입 표시 | 위와 동일 | 375×812 |
| [mobile_mainpage_white_chart_not_have.png](../../watch_up_infra/UI/mobile_mainpage_white_chart_not_have.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_chart_not_have.jsx) | /coins/:marketCode | 상세 조회 + portfolio에 해당 보유 행 없음 | light / 구매 진입만 표시 | CoinDetailPage·PriceChart·BuyForm | 375×812 |
| [mobile_mainpage_black_chart_not_have.png](../../watch_up_infra/UI/mobile_mainpage_black_chart_not_have.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_black_chart_not_have.jsx) | /coins/:marketCode | 위와 동일 | dark / 구매 진입만 표시 | 위와 동일 | 375×812 |
| [mobile_mainpage_white_purchasing_price_before.png](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_price_before.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_price_before.jsx) | /coins/:marketCode 유지 | 구매하기 → 금액 모드, 빈 입력 | light / 구매 제출 비활성 | CoinDetailPage·BuyForm | 375×812 |
| [mobile_mainpage_black_purchasing_price_before.png](../../watch_up_infra/UI/mobile_mainpage_black_purchasing_price_before.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_black_purchasing_price_before.jsx) | /coins/:marketCode 유지 | 위와 동일 | dark / 구매 제출 비활성 | 위와 동일 | 375×812 |
| [mobile_mainpage_white_purchasing_price_after.png](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_price_after.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_price_after.jsx) | /coins/:marketCode 유지 | 금액 모드에 999999999 입력 후 blur | light / 유효한 입력·제출 가능(거래 완료 아님) | CoinDetailPage·BuyForm | 375×812 |
| [mobile_mainpage_white_purchasing_number_before.png](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_number_before.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_number_before.jsx) | /coins/:marketCode 유지 | 구매하기 → 수량 모드, 빈 입력 | light / 구매 제출 비활성 | 기존 BuyForm에 승인된 수량 계약 추가 | 375×812 |
| [mobile_mainpage_white_purchasing_number_after.png](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_number_after.png) · [.jsx](../../watch_up_infra/UI/mobile_mainpage_white_purchasing_number_after.jsx) | /coins/:marketCode 유지 | 수량 모드에 99.999999999 입력 후 blur | light / 유효한 입력·제출 가능(거래 완료 아님) | 위와 동일 | 375×812 |
| [design.md](../../watch_up_infra/UI/design.md) | 개별 화면 미매핑 | 전 화면 공통 색상·폰트 보완 | 공통 기준 문서 | index.css·App.css | 해당 없음 |
| [redesign_prompt.md](../../watch_up_infra/UI/redesign_prompt.md) | 개별 화면 미매핑 | 구현 지시·상태 관계 참고 | 과거 코드 설명 일부는 현재와 불일치 | 라우트·전체 UI | 해당 없음 |

- **확인 사실:** AppRoutes의 보호 경로는 `/`, `/coins/:marketCode`. 검색은 300ms debounce, API 반환 코드로 이동. 보유 목록은 portfolio만 사용. UI/redesign_prompt.md는 보유 여부별 판매 버튼 차이·공통 반응형 구조를 명시한다. 기존 breakpoint는 767px. JSX 프레임은 모바일 375×812, PC 1275×900이며 PNG는 각각 750×1624, 2550×1800으로 2배 내보내기다. 파일별 크기·해시·픽셀 색상은 [design-manifest.json](artifacts/design-manifest.json).
- **추론:** PC 이미지는 선택한 종목의 상세를 공통 대시보드 안에 표시한 상태다. 홈에서 임의 종목을 자동 선택하지 않는다. PC 보유 행 강조는 현재 경로 종목, 홈 첫 행 강조는 hover로 재현했다. 검색 PNG는 입력이 빈 상태라 portfolio를 표시하고, 실제 검색어 입력 후에는 기존 search 응답을 표시한다. 검색·구매 입력은 새로운 URL 없이 기존 화면 안의 상태로 전환한다. `after`는 입력 후이며 매수 체결 후가 아니다(입력 값과 구매 버튼이 유지됨).
- **사용자 승인:** 수량 구매는 사전에는 기존 API에 매핑 불가였다. [별도 확정 계약](QUANTITY_BUY_CONTRACT.md) 승인 후 BUY quantity로 연결했다. 충전·거래내역·로그아웃·테마 전환은 로고 높이의 우측에 배치하도록 승인받았다.
- **디자인 부재 범위:** 판매 입력, 충전·내역 dialog, 로그인·OAuth, 오류·로딩·빈 결과, 320/600/768/1024/1440px 및 PC 미선택 홈에 별도 PNG가 없다. 기존 처리와 공통 스타일을 따라 구현한 추론 범위다. 해당 화면에 원본 일치 판정을 하지 않는다.
- **누락 매핑:** 개별 화면에 매핑되지 않은 PNG·JSX는 없음. 공통 문서 2개는 위에 개별 화면 미매핑으로 명시했다.

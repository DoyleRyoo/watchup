# 승인된 수량 구매 계약

2026-09-06 사용자 답변 “이 계약으로 수량 구매 구현”으로 확정. 기존 v2.2의 금액 전용 BUY에 대한 명시적 추가 요구다. 과거 기획 문서를 소급 수정하지 않고 이 추가 계약을 기록한다.

| 항목 | 확정 내용 |
| --- | --- |
| endpoint | 기존 `POST /api/paper/trades`, 신규 URL 없음 |
| body | `{marketCode, side:"BUY", quantity:"0.1"}` 또는 기존 `{marketCode, side:"BUY", amountKrw:"10"}`; 금액·수량 정확히 하나 |
| 타입 | 수량은 양의 10진 문자열, 소수 최대 18자리, NUMERIC(38,18) 범위; 숫자 JSON·지수·음수·0·19자리 소수·둘 다 입력 거절 |
| 체결 | 기존 서버 직접 현재가 조회 1회. 입력 수량 전부를 매수. FE 표시가격을 보내거나 환산하지 않음 |
| 원화 차감 | `floor(서버 현재가 × 수량)`; 100.25원 × 0.1 = 10원 차감, 0.1개 보유 증가 |
| 전체 거절 | 차감액 1원 미만, 잔액 부족, 수량 저장 범위 초과, 거래 불가 마켓, 가격 조회 실패; 부분 체결 없음 |
| 실패 코드 | 기존 INVALID_REQUEST / INSUFFICIENT_CASH_BALANCE / MARKET_NOT_TRADABLE / 가격 오류 코드 사용 |
| 금액 BUY·SELL | 기존 floor18·floorKrw 계산 및 기존 지문 유지 |
| 인증·저장 | 검증한 JWT 사용자, 기존 계좌→포지션 잠금 순서·원자적 DB transaction·RLS·불변 거래내역 유지; 스키마 migration 없음 |
| 멱등성 | 기존 UUID v4 Idempotency-Key. 수량 선행/후행 0을 문자열로 정규화해 지문 생성. 같은 키·같은 정규 수량은 재생, 다른 값·다른 모드는 409 |
| 클라이언트 | 금액/수량별 입력 보존, 18자리 문자열 유지, submit마다 UUID 생성, 기존 DATABASE_UNAVAILABLE 재시도에서만 같은 키 |

구현: `../src/features/paper/api.ts`, `BuyForm.tsx`, `../../watch_up_server/app/schemas/paper.py`, `../../watch_up_server/app/services/paper_trade.py`.

검증: 서버 `tests/test_trade_buy_quantity.py`의 14개 항목은 schema 거절, 정확 수량·원 미만 내림, 잔액 부족·1원 미만 무변경, 수량 정규화 재생·모드 충돌을 Fake repository/price/transaction으로 확인한다. 프런트엔드 수량 입력·18자리 보존 테스트와 Chromium의 quantity-only 요청·portfolio 재조회 흐름을 확인했다. 실제 PostgreSQL·Upbit·테스트 계정에서 체결한 결과는 아니다. 프런트엔드와 서버 변경을 함께 배포해야 수량 모드를 사용할 수 있다.

import { ApiError, createContractError } from '../../api/errors'

const messages: Record<string, string> = {
  INSUFFICIENT_CASH_BALANCE: '보유 현금이 부족합니다.',
  INSUFFICIENT_HOLDING_QUANTITY: '보유 수량이 부족합니다.',
  MARKET_NOT_TRADABLE: '현재 거래할 수 없는 마켓입니다.',
  INVALID_REQUEST: '주문 정보를 다시 확인해주세요.',
  INVALID_MARKET_CODE: '코인 정보를 다시 확인해주세요.',
  IDEMPOTENCY_KEY_REQUIRED: '요청을 처리하지 못했습니다. 다시 시도해주세요.',
  IDEMPOTENCY_KEY_REUSED: '이미 처리된 주문입니다. 거래 내역을 확인해주세요.',
  TOP_UP_AMOUNT_OUT_OF_RANGE: '1회 충전 가능 금액 범위를 벗어났습니다.',
  TOP_UP_LIFETIME_LIMIT_EXCEEDED: '평생 누적 충전 한도를 초과했습니다.',
  UPBIT_UNAVAILABLE: '시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.',
  UPBIT_RATE_LIMITED: '시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.',
  UPBIT_TEMPORARILY_BLOCKED: '시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.',
  DATABASE_UNAVAILABLE: '일시적으로 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.',
  AUTH_REQUIRED: '로그인이 필요합니다.',
  AUTH_TOKEN_EXPIRED: '로그인이 필요합니다.',
}

export function messageFor(error: unknown): string {
  const fallback = createContractError().message
  if (!(error instanceof ApiError)) return fallback
  if (Object.hasOwn(messages, error.code)) return messages[error.code]
  const message = error.message.trim()
  // Unknown backend messages may be technical English/codes; keep Korean copy only.
  return /[가-힣]/.test(message) && !/[A-Za-z]/.test(message) ? message : fallback
}

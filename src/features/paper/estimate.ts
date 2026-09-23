/**
 * Display-only estimate. AGENTS.md §5 forbids float math on money strings;
 * exact scaled BigInt arithmetic keeps precision. These values are never
 * submitted or sent to the server; the execution price is server-owned.
 */
const SCALE = 18
const ONE = 1000000000000000000n

function parseScaled(value: string): bigint | null {
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) return null
  const [head, tail = ''] = value.split('.')
  return BigInt(head + tail.padEnd(SCALE, '0'))
}

function unscale(value: bigint): string {
  const tail = (value % ONE).toString().padStart(SCALE, '0').replace(/0+$/, '')
  return `${value / ONE}${tail ? `.${tail}` : ''}`
}

export function estimateQuantityFromAmount(amountKrw: string, price: string): string | null {
  const amount = parseScaled(amountKrw), currentPrice = parseScaled(price)
  if (amount === null || currentPrice === null || currentPrice <= 0n) return null
  const quantity = (amount * ONE) / currentPrice
  return quantity > 0n ? unscale(quantity) : null
}

export function estimateAmountFromQuantity(quantity: string, price: string): string | null {
  const value = parseScaled(quantity), currentPrice = parseScaled(price)
  if (value === null || currentPrice === null || currentPrice <= 0n) return null
  const amount = (value * currentPrice) / (ONE * ONE)
  return amount > 0n ? amount.toString() : null
}

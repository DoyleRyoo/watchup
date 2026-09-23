import { formatQuantity, truncateFraction } from '../paper/format'

export type ChangeRateDirection = 'up' | 'down' | 'flat'

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Expand only the representation of an already-numeric market/chart value. */
function plainDecimal(value: number): string {
  const [coefficient, exponent] = value.toString().split(/[eE]/)
  if (exponent === undefined) return coefficient
  const sign = coefficient.startsWith('-') ? '-' : ''
  const [head, tail = ''] = coefficient.replace(/^-/, '').split('.')
  const digits = head + tail
  const point = head.length + parseInt(exponent, 10)
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`
  if (point >= digits.length) return sign + digits.padEnd(point, '0')
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`
}

export function formatPrice(value: number | null | undefined): string | null {
  if (!isFiniteNumber(value)) return null
  const price = formatQuantity(plainDecimal(value))
  return price.endsWith(' 미만') ? price.replace(' 미만', '원 미만') : `${price}원`
}

export function formatChangeRate(value: number | null | undefined): string | null {
  if (!isFiniteNumber(value)) return null
  const [head, fraction = ''] = plainDecimal(value).replace(/^-/, '').split('.')
  const tail = truncateFraction(fraction, 2).padEnd(2, '0')
  const sign = head === '0' && tail === '00' ? '' : value > 0 ? '+' : '-'
  return `${sign}${head}.${tail}%`
}

export function getChangeRateDirection(value: number): ChangeRateDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

export function formatChartDate(value: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[1]}-${match[2]}` : value
}

/** Sanitize at the text-input boundary; preserve exact decimal digits. */
export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '').slice(0, 15)
}

export function sanitizeDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return ''
  // Only the first fractional segment belongs to this value (1.2.3 -> 1.2).
  const [integer, fraction] = cleaned.split('.')
  const head = sanitizeIntegerInput(integer) || '0'
  return fraction === undefined ? head : `${head}.${fraction.slice(0, 18)}`
}

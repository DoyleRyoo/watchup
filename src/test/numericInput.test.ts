import { expect, it } from 'vitest'
import { sanitizeDecimalInput, sanitizeIntegerInput } from '../features/paper/numericInput'
const integerExamples = [['',''], ['1a2','12'], ['12가3','123'], ['1,000원','1000'], ['007','7'], ['0','0'], ['-500','500'], ['1e5','15'], ['1'.repeat(20),'1'.repeat(15)]]
const decimalExamples = [['',''], ['0.1234567890123456789','0.123456789012345678'], ['1.2.3','1.2'], ['.5','0.5'], ['0.','0.'], ['00.5','0.5'], ['1개','1'], ['가1.5','1.5'], ['-0.5','0.5'], ['000','0']]
it.each(integerExamples)('정수 %s → %s', (raw, expected) => expect(sanitizeIntegerInput(raw)).toBe(expected))
it.each(decimalExamples)('소수 %s → %s', (raw, expected) => expect(sanitizeDecimalInput(raw)).toBe(expected))
it('정리 결과는 멱등이고 정상 18자리 값은 보존한다', () => {
  for(const [raw] of [...integerExamples, ...decimalExamples]) for(const sanitize of [sanitizeIntegerInput, sanitizeDecimalInput]) expect(sanitize(sanitize(raw))).toBe(sanitize(raw))
  expect(sanitizeDecimalInput('0.123456789012345678')).toBe('0.123456789012345678')
})
it.each(['.', '...', '-', ',', '  ', '1'.repeat(200), '😀'])('불완전한 입력 %s에도 예외가 없다', raw => {
  expect(()=>sanitizeIntegerInput(raw)).not.toThrow()
  expect(()=>sanitizeDecimalInput(raw)).not.toThrow()
})

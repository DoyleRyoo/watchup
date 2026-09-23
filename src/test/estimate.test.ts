import { expect, it } from 'vitest'
import { estimateQuantityFromAmount, estimateAmountFromQuantity } from '../features/paper/estimate'
it.each([
 ['50000','150000000','0.000333333333333333'], ['150000000','150000000','1'], ['10','4','2.5'], ['1','3','0.333333333333333333'], ['2100000000','0.001','2100000000000'],
 ['50000','0',null], ['0','150000000',null], ['1','1e5',null], ['0.1234567890123456789','1',null], ['1','100000000000000000000',null],
])('금액 %s / 가격 %s → 수량 %s', (amount, price, expected) => expect(estimateQuantityFromAmount(amount!,price!)).toBe(expected))
it.each([
 ['0.000333333333333333','150000000','49999'], ['2.5','4','10'], ['0.5','3','1'], ['1','142300000.25','142300000'], ['0.5','0',null], ['0.000000000000000001','1',null]
])('수량 %s × 가격 %s → 금액 %s', (quantity,price,expected) => expect(estimateAmountFromQuantity(quantity!,price!)).toBe(expected))
it.each(['','.', '-1','+1','abc','1e5','1.1234567890123456789'])('무효값 %s를 양쪽 함수와 인수에서 거절한다', value=>{
 for(const helper of [estimateAmountFromQuantity,estimateQuantityFromAmount]) {
  expect(helper(value,'1')).toBeNull();expect(helper('1',value)).toBeNull()
 }
})
it('40자리 값도 정확한 정수 산술로 계산한다', ()=>{
 const large='1'+'0'.repeat(39)
 expect(estimateQuantityFromAmount(large,'1')).toBe(large)
 expect(estimateAmountFromQuantity(large,'1')).toBe(large)
})

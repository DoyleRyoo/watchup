import { describe, expect, it } from "vitest";
import {
  formatDecimalString,
  formatKrw,
  formatPnlWithRate,
  formatRatePercent,
  formatSignedKrw,
  signClass,
} from "../features/paper/format";

describe("금액 문자열 표시 포맷", () => {
  it("18자리 소수 꼬리를 정리하고 천 단위를 끊는다", () => {
    expect(formatDecimalString("1000000.000000000000000000")).toBe("1,000,000");
    expect(formatDecimalString("142300000.250000000000000000")).toBe(
      "142,300,000.25",
    );
    expect(formatDecimalString("0.001000000000000000")).toBe("0.001");
  });

  it("음수 0은 부호 없이 0으로 표시한다", () => {
    expect(formatDecimalString("-0.000000000000000000")).toBe("0");
    expect(formatSignedKrw("-0.000000000000000000")).toBe("0원");
  });

  it("null 금액은 대체 문구로 렌더링한다", () => {
    expect(formatKrw(null)).toBe("-");
    expect(formatKrw(null, "평가 불가")).toBe("평가 불가");
    expect(formatKrw("1000000")).toBe("1,000,000원");
  });

  it("손익은 부호를 붙여 표시한다", () => {
    expect(formatSignedKrw("1234")).toBe("+1,234원");
    expect(formatSignedKrw("-1234")).toBe("-1,234원");
  });

  it("비율은 소수점만 두 자리 옮겨 퍼센트로 표시한다", () => {
    expect(formatRatePercent("10.000100000000000000")).toBe("1000.01%");
    expect(formatRatePercent("0.020300000000000000")).toBe("2.03%");
    expect(formatRatePercent("-0.020300000000000000")).toBe("-2.03%");
    expect(formatRatePercent("0.000000000000000000")).toBe("0.00%");
    expect(formatRatePercent(null)).toBeNull();
  });

  it("등락 색상 클래스는 빨강=상승 / 파랑=하락으로 매핑한다", () => {
    expect(signClass("100")).toBe("change-up");
    expect(signClass("-100")).toBe("change-down");
    expect(signClass("0")).toBe("change-flat");
    expect(signClass(null)).toBe("change-flat");
  });

  it("손익 금액과 수익률을 한 줄로 합친다", () => {
    expect(formatPnlWithRate("999999999", "10.0001")).toBe(
      "+999,999,999원 (1000.01%)",
    );
    expect(formatPnlWithRate("999999999", null)).toBe("+999,999,999원");
    expect(formatPnlWithRate(null, null, "평가 중")).toBe("평가 중");
  });
});

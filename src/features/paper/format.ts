/**
 * Display-only formatting for the API's decimal *strings*.
 *
 * Money and rate fields arrive as strings (AGENTS.md §5) and must never be
 * parsed into a JS number for arithmetic. Every helper here is pure string
 * manipulation, without floating-point conversion.
 */

type Decomposed = { sign: string; int: string; frac: string };

function decompose(value: string): Decomposed {
  const trimmed = value.trim();
  const sign = trimmed.startsWith("-") ? "-" : "";
  const [int = "0", frac = ""] = trimmed.replace(/^[+-]/, "").split(".");
  return { sign, int, frac };
}

function stripLeadingZeros(int: string): string {
  const stripped = int.replace(/^0+/, "");
  return stripped === "" ? "0" : stripped;
}

function group(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Shared truncation primitives: digit slicing never rounds or pads values. */
export function truncateFraction(frac: string, digits: number): string {
  return frac.slice(0, digits);
}

export function significantFraction(frac: string, sigDigits: number, maxDigits: number): string {
  const leading = frac.search(/[1-9]/);
  if (leading < 0 || leading >= maxDigits) return "";
  return truncateFraction(truncateFraction(frac, leading + sigDigits), maxDigits).replace(/0+$/, "");
}

/** Whole KRW, truncated toward zero; never show a negative zero. */
export function formatDecimalString(value: string): string {
  const { sign, int } = decompose(value);
  const head = group(stripLeadingZeros(int));
  return head === "0" ? "0" : `${sign}${head}`;
}

/** Bounded display quantity. Submitted quantities retain their full precision. */
export function formatQuantity(value: string): string {
  const { sign, int, frac } = decompose(value);
  if (stripLeadingZeros(int) !== "0") return formatDecimalString(value);
  if (!/[1-9]/.test(frac)) return "0";
  const tail = significantFraction(frac, 4, 8);
  return tail ? `${sign}0.${tail}` : `${sign}0.00000001 미만`;
}

/** Lossless input echo, including every fractional digit and trailing zero. */
export function groupDigits(raw: string): string {
  const { sign, int, frac } = decompose(raw);
  return `${sign}${group(int)}${raw.includes(".") ? `.${frac}` : ""}`;
}

/** Money string → "1,000,000원". `null` renders the fallback instead. */
export function formatKrw(value: string | null, fallback = "-"): string {
  return value === null ? fallback : `${formatDecimalString(value)}원`;
}

/** Signed money string → "+1,000원" / "-1,000원" / "0원". */
export function formatSignedKrw(value: string | null, fallback = "-"): string {
  if (value === null) return fallback;
  const formatted = formatDecimalString(value);
  if (formatted === "0") return "0원";
  return formatted.startsWith("-") ? `${formatted}원` : `+${formatted}원`;
}

/**
 * Ratio string (backend `totalReturnRate` = pnl / capital) → percent text.
 * The decimal point is shifted two places by string surgery and the fraction
 * is truncated to 2 digits — no multiplication, no float.
 */
export function formatRatePercent(value: string | null): string | null {
  if (value === null) return null;
  const { sign, int, frac } = decompose(value);
  const padded = frac.padEnd(2, "0");
  const shiftedInt = stripLeadingZeros(int + padded.slice(0, 2));
  const shiftedFrac = padded.slice(2, 4).padEnd(2, "0");
  const body = `${shiftedInt}.${shiftedFrac}`; // percent is not digit-grouped (mockup: "1000.01%")
  const zero = shiftedInt === "0" && shiftedFrac === "00";
  return `${zero ? "" : sign}${body}%`;
}

/** Up = red, down = blue (design.md), flat = sub text. */
export function signClass(value: string | null): string {
  if (value === null) return "change-flat";
  const { sign, int, frac } = decompose(value);
  if (!/[1-9]/.test(int + frac)) return "change-flat";
  return sign === "-" ? "change-down" : "change-up";
}

/** "+1,000원 (2.03%)" when the rate exists, otherwise just the amount. */
export function formatPnlWithRate(
  amount: string | null,
  rate: string | null,
  fallback = "-",
): string {
  if (amount === null) return fallback;
  const percent = formatRatePercent(rate);
  const money = formatSignedKrw(amount, fallback);
  return percent === null ? money : `${money} (${percent})`;
}

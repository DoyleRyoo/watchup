/**
 * Display-only formatting for the API's decimal *strings*.
 *
 * Money and rate fields arrive as strings (AGENTS.md §5) and must never be
 * parsed into a JS number for arithmetic. Every helper here is pure string
 * manipulation — no `Number()` / `parseFloat` on any value.
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

/** "1000000.000000000000000000" → "1,000,000"; "-0.5" → "-0.5"; "-0.0" → "0" */
export function formatDecimalString(value: string): string {
  const { sign, int, frac } = decompose(value);
  const trimmedFrac = frac.replace(/0+$/, "");
  const head = group(stripLeadingZeros(int));
  const body = trimmedFrac === "" ? head : `${head}.${trimmedFrac}`;
  return body === "0" ? "0" : `${sign}${body}`;
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
  const formatted = formatDecimalString(value);
  if (formatted === "0") return "change-flat";
  return formatted.startsWith("-") ? "change-down" : "change-up";
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

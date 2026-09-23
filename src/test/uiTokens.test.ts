import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import appCss from "../App.css?raw";
import indexCss from "../index.css?raw";

/** Pull the `--token: value;` pairs out of the first rule with this selector. */
function tokensOf(selector: string): Record<string, string> {
  const start = indexCss.indexOf(selector);
  expect(start, `${selector} 규칙이 없다`).toBeGreaterThan(-1);
  const body = indexCss.slice(start + selector.length, indexCss.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g))
    tokens[name] = value.trim();
  return tokens;
}

describe("디자인 토큰 (UI/design.md)", () => {
  it("라이트 토큰이 design.md 값과 정확히 일치한다", () => {
    const actual = tokensOf(":root {");
    expect(actual).toMatchObject({
      "--bg": "#FFFFFF",
      "--surface": "#F7F7F8",
      "--hover": "#ECECF1",
      "--row-highlight": "#E3E3E8",
      "--border": "#E3E3E8",
      "--text-main": "#0D0D0D",
      "--text-sub": "#64646F",
      "--accent": "#0D0D0D",
      "--accent-fg": "#FFFFFF",
      "--accent-hover": "#2A2A2A",
      "--up": "#BF271C",
      "--down": "#1D4ED8",
      "--buy": "#D92D20",
      "--buy-hover": "#B42318",
      "--buy-soft": "#FEF3F2",
      "--buy-disabled": "#F3B5B0",
      "--buy-fg": "#B42318",
      "--sell": "#1D4ED8",
      "--sell-hover": "#1A3FB0",
      "--sell-soft": "#EFF4FF",
      "--sell-fg": "#1D4ED8",
      "--trade-fg": "#FFFFFF",
      "--danger": "#BF271C",
      "--success": "#067647",
      "--focus": "#1D4ED8",
      "--shadow": "0 18px 45px rgb(13 13 13 / 8%)"
});
  });

  it("다크 토큰 세트를 prefers-color-scheme으로 정의한다", () => {
    const actual = tokensOf(":root:not([data-theme=\"light\"])");
    expect(actual).toMatchObject({
      "--bg": "#212121",
      "--surface": "#303030",
      "--hover": "#414141",
      "--row-highlight": "#3A3A3C",
      "--border": "#3F3F42",
      "--text-main": "#ECECEC",
      "--text-sub": "#B0B0B8",
      "--accent": "#ECECEC",
      "--accent-fg": "#0D0D0D",
      "--accent-hover": "#FFFFFF",
      "--up": "#FF9991",
      "--down": "#9BB6FF",
      "--buy": "#CD343B",
      "--buy-hover": "#D23C42",
      "--buy-soft": "#2A1A1A",
      "--buy-disabled": "#5C2B2B",
      "--buy-fg": "#FF9991",
      "--sell": "#3E63DD",
      "--sell-hover": "#486ADE",
      "--sell-soft": "#171F35",
      "--sell-fg": "#9BB6FF",
      "--trade-fg": "#FFFFFF",
      "--danger": "#FF9991",
      "--success": "#3DD68C",
      "--focus": "#6E96FF",
      "--shadow": "0 18px 45px rgb(0 0 0 / 45%)"
});
  });

  it("Pretendard를 @font-face로 싣고 우선 적용한다", () => {
    expect(indexCss).toContain("@font-face");
    expect(indexCss).toContain("pretendard/dist/web/static/woff2/");
    expect(indexCss).toMatch(/font-family:\s*Pretendard,/);
  });

  it("6단계 타입과 8단계 간격을 정의한다", () => {
    expect(indexCss).toContain("--text-display: 26px;");
    expect(indexCss).toContain("--leading-display: 1.25;");
    expect(indexCss).toContain("--weight-display: 700;");
    expect(indexCss).toContain("--text-title: 20px;");
    expect(indexCss).toContain("--leading-title: 1.3;");
    expect(indexCss).toContain("--weight-title: 700;");
    expect(indexCss).toContain("--text-body: 16px;");
    expect(indexCss).toContain("--leading-body: 1.5;");
    expect(indexCss).toContain("--weight-body: 400;");
    expect(indexCss).toContain("--text-body-sm: 14px;");
    expect(indexCss).toContain("--leading-body-sm: 1.45;");
    expect(indexCss).toContain("--weight-body-sm: 400;");
    expect(indexCss).toContain("--text-label: 13px;");
    expect(indexCss).toContain("--leading-label: 1.4;");
    expect(indexCss).toContain("--weight-label: 400;");
    expect(indexCss).toContain("--text-micro: 11px;");
    expect(indexCss).toContain("--leading-micro: 1.3;");
    expect(indexCss).toContain("--weight-micro: 400;");
    expect(indexCss).toContain("--space-1: 4px;");
    expect(indexCss).toContain("--space-2: 8px;");
    expect(indexCss).toContain("--space-3: 12px;");
    expect(indexCss).toContain("--space-4: 16px;");
    expect(indexCss).toContain("--space-5: 20px;");
    expect(indexCss).toContain("--space-6: 24px;");
    expect(indexCss).toContain("--space-7: 32px;");
    expect(indexCss).toContain("--space-8: 40px;");
    expect(indexCss + appCss).not.toMatch(/--font-(?:size|weight)-(?:lg|md|sm)/);
    for (const [, px] of appCss.matchAll(/font-size:\s*(\d+)px/g)) expect(+px).toBeGreaterThanOrEqual(11);
  });

  it("상승=빨강 / 하락=파랑 매핑을 유지한다", () => {
    expect(appCss).toContain(".change-up { color: var(--up); }");
    expect(appCss).toContain(".change-down { color: var(--down); }");
  });
});

describe("레이아웃 규칙", () => {
  it("재사용하는 단일 브레이크포인트 하나로 반응형을 구성한다", () => {
    const breakpoints = appCss.match(/@media \(max-width: 767px\)/g) ?? [];
    expect(breakpoints).toHaveLength(1);
    expect(appCss.match(/@media/g) ?? []).toHaveLength(1);
    expect(appCss).toContain(".dashboard-grid");
  });

  it("재설계 이전 하드코딩 색상이 남아 있지 않다", () => {
    const legacy = /#f6f8fc|#172033|#5d687d|#2563eb|#dbe2ee|#FDFDFD|#F5F5F5|#DDDEE0|#D4D5DB|#DBDBDB|#D7D7D7|#333333|#848484|#E11616|#1667E1|#171719|#222224|#E18181|#FF0000|#008CFF|#2B59FF/i;
    expect(indexCss).not.toMatch(legacy);
    expect(appCss).not.toMatch(legacy);
  });

  it("Tailwind 지시자를 사용하지 않는다", () => {
    expect(indexCss).not.toContain("@tailwind");
    expect(appCss).not.toContain("@tailwind");
  });
});

describe("수동 테마 오버라이드", () => {
  it("OS 다크 블록이 수동 라이트 선택에 밀리도록 :not 가드를 건다", () => {
    const media = indexCss.slice(
      indexCss.indexOf("@media (prefers-color-scheme: dark)"),
    );
    expect(media).toContain(':root:not([data-theme="light"])');
  });

  it("수동 다크 블록의 토큰이 OS 다크 블록과 완전히 동일하다", () => {
    const system = tokensOf(':root:not([data-theme="light"])');
    const manual = tokensOf(':root[data-theme="dark"]');
    expect(Object.keys(system)).toHaveLength(26);
    expect(manual).toEqual(system);
  });

  it("네이티브 컨트롤용 color-scheme을 수동 모드에도 선언한다", () => {
    expect(indexCss).toContain("color-scheme: light dark;");
    expect(indexCss).toContain(':root[data-theme="dark"] { color-scheme: dark; }');
    expect(indexCss).toContain(':root[data-theme="light"] { color-scheme: light; }');
  });

  it("index.html이 첫 페인트 전에 저장된 테마를 스탬프한다", () => {
    const head = indexHtml.slice(0, indexHtml.indexOf("</head>"));
    expect(head).toContain('<meta name="color-scheme" content="light dark" />');
    expect(head).toContain("watchup.theme");
    expect(head).toContain("try {");
    expect(head).toContain("catch");
    expect(head).toContain("setAttribute('data-theme', storedTheme)");
    // 스탬프는 light / dark 에서만. system은 미디어 쿼리에 맡긴다.
    expect(head).toMatch(/storedTheme === 'light' \|\| storedTheme === 'dark'/);
    // 인라인 스크립트는 앱 번들보다 먼저 실행되어야 한다.
    expect(indexHtml.indexOf("watchup.theme")).toBeLessThan(
      indexHtml.indexOf("/src/main.tsx"),
    );
  });
});

function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("의미별 색상과 명암비", () => {
  it("App.css에 하드코딩 색상이나 폐기 토큰이 없다", () => {
    expect(appCss).not.toMatch(/#[0-9A-Fa-f]{3,6}/);
    expect(indexCss + appCss).not.toMatch(/--(?:primary(?:-hover)?|danger-hover|search-fill|chart-fill|mobile-search-fill|mobile-sell-fill|home-up|home-down)\b/);
  });
  it.each([':root {', ':root:not([data-theme="light"])'])("%s의 실제 배경에서 글자 명암비를 지킨다", (selector) => {
    const t = tokensOf(selector);
    const pairs = [
      ...['bg', 'surface', 'hover', 'row-highlight'].flatMap(bg => ['text-main', 'text-sub', 'up', 'down'].map(fg => [fg, bg])),
      ['accent-fg', 'accent'], ['accent-fg', 'accent-hover'],
      ['trade-fg', 'buy'], ['trade-fg', 'sell'], ['trade-fg', 'buy-hover'], ['trade-fg', 'sell-hover'],
      ['buy-fg', 'buy-soft'], ['sell-fg', 'sell-soft'],
      ['danger', 'hover'], ['success', 'surface'],
    ];
    for (const [fg, bg] of pairs) expect(contrast(t[`--${fg}`], t[`--${bg}`]), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

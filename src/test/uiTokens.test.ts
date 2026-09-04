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
    expect(indexCss).toContain("--bg: #F5F5F5;");
    expect(indexCss).toContain("--hover: #DDDEE0;");
    expect(indexCss).toContain("--text-main: #333333;");
    expect(indexCss).toContain("--text-sub: #848484;");
    expect(indexCss).toContain("--danger: #E11616;");
    expect(indexCss).toContain("--primary: #1667E1;");
  });

  it("다크 토큰 세트를 prefers-color-scheme으로 정의한다", () => {
    const dark = indexCss.slice(
      indexCss.indexOf("@media (prefers-color-scheme: dark)"),
    );
    expect(dark).not.toBe("");
    expect(dark).toContain("--bg: #171719;");
    expect(dark).toContain("--hover: #222224;");
    expect(dark).toContain("--text-main: #F5F5F5;");
    expect(dark).toContain("--text-sub: #848484;");
    expect(dark).toContain("--danger: #E11616;");
    expect(dark).toContain("--primary: #1667E1;");
  });

  it("Pretendard를 @font-face로 싣고 우선 적용한다", () => {
    expect(indexCss).toContain("@font-face");
    expect(indexCss).toContain("pretendard/dist/web/static/woff2/");
    expect(indexCss).toMatch(/font-family:\s*Pretendard,/);
  });

  it("26 / 16 / 10 타입 스케일을 토큰으로 정의한다", () => {
    expect(indexCss).toContain("--font-size-lg: 26px;");
    expect(indexCss).toContain("--font-size-md: 16px;");
    expect(indexCss).toContain("--font-size-sm: 10px;");
    expect(indexCss).toContain("--font-weight-lg: 700;");
  });

  it("상승=빨강 / 하락=파랑 매핑을 유지한다", () => {
    expect(appCss).toContain(".change-up { color: var(--danger); }");
    expect(appCss).toContain(".change-down { color: var(--primary); }");
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
    const legacy = /#f6f8fc|#172033|#5d687d|#b42318|#2563eb|#dbe2ee/i;
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
    expect(Object.keys(system).length).toBeGreaterThanOrEqual(11);
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

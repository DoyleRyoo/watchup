import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  THEME_STORAGE_KEY,
  nextMode,
  readStoredMode,
  useThemeStore,
} from "../stores/themeStore";

const themeAttr = () => document.documentElement.getAttribute("data-theme");

// clearMocks는 호출 기록만 지운다. storage 차단 스텁이 다음 테스트로 새지 않도록
// 구현 자체를 되돌린다.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("themeStore — 저장값 읽기", () => {
  it("저장값이 없으면 system이다", () => {
    expect(readStoredMode()).toBe("system");
  });

  it("저장된 light / dark를 그대로 복원한다", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(readStoredMode()).toBe("light");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredMode()).toBe("dark");
  });

  it.each(["DARK", "null", "", "auto", '{"mode":"dark"}'])(
    "손상된 저장값 %s는 system으로 폴백한다",
    (stored) => {
      localStorage.setItem(THEME_STORAGE_KEY, stored);
      expect(readStoredMode()).toBe("system");
    },
  );

  it("localStorage 읽기가 throw해도 크래시 없이 system을 반환한다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    expect(readStoredMode()).toBe("system");
  });
});

describe("themeStore — 모드 변경", () => {
  it("setMode가 localStorage에 기록한다", () => {
    useThemeStore.getState().setMode("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
  });

  it("localStorage 쓰기가 throw해도 메모리 상태로 동작한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    expect(() => useThemeStore.getState().setMode("dark")).not.toThrow();
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(themeAttr()).toBe("dark");
  });

  it("cycleMode는 system → light → dark → system 순서다", () => {
    const store = useThemeStore.getState();
    expect(store.mode).toBe("system");
    store.cycleMode();
    expect(useThemeStore.getState().mode).toBe("light");
    useThemeStore.getState().cycleMode();
    expect(useThemeStore.getState().mode).toBe("dark");
    useThemeStore.getState().cycleMode();
    expect(useThemeStore.getState().mode).toBe("system");
  });

  it("nextMode와 cycleMode의 순서가 일치한다", () => {
    expect(nextMode("system")).toBe("light");
    expect(nextMode("light")).toBe("dark");
    expect(nextMode("dark")).toBe("system");
  });
});

describe("themeStore — DOM 반영", () => {
  it("light / dark는 data-theme을 세팅한다", () => {
    useThemeStore.getState().setMode("light");
    expect(themeAttr()).toBe("light");
    useThemeStore.getState().setMode("dark");
    expect(themeAttr()).toBe("dark");
  });

  it("system은 data-theme 속성 자체를 제거한다", () => {
    useThemeStore.getState().setMode("dark");
    useThemeStore.getState().setMode("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("모드 적용에 matchMedia를 사용하지 않는다", () => {
    // jsdom에는 matchMedia가 없다. 참조하면 여기서 TypeError로 드러난다.
    expect(() => {
      useThemeStore.getState().setMode("system");
      useThemeStore.getState().setMode("dark");
    }).not.toThrow();
  });
});

describe("ThemeToggle", () => {
  it("현재 모드와 다음 모드를 aria-label로 알린다", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "테마: 시스템 (클릭하면 라이트)" }),
    ).toBeInTheDocument();
  });

  it("클릭할 때마다 모드가 순환하고 label과 DOM이 함께 바뀐다", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));
    expect(useThemeStore.getState().mode).toBe("light");
    expect(themeAttr()).toBe("light");
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "테마: 라이트 (클릭하면 다크)",
    );

    await user.click(screen.getByRole("button"));
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(themeAttr()).toBe("dark");
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "테마: 다크 (클릭하면 시스템)",
    );

    await user.click(screen.getByRole("button"));
    expect(useThemeStore.getState().mode).toBe("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "테마: 시스템 (클릭하면 라이트)",
    );
  });
});

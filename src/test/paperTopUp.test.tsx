import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AccountTopUp } from "../features/paper/AccountTopUp";
import { usePaperStore } from "../stores/paperStore";

const api = vi.hoisted(() => ({ getAccount: vi.fn(), topUp: vi.fn() }));
vi.mock("../features/paper/api", () => api);

beforeEach(() => {
  api.getAccount
    .mockReset()
    .mockResolvedValue({
      data: {
        cashBalanceKrw: "1000000",
        lifetimeTopUpKrw: "0",
        topUpMinKrw: "1",
        topUpMaxKrw: "2100000000",
        topUpLifetimeCapKrw: "100000000000",
      },
      meta: null,
    });
  api.topUp.mockReset().mockResolvedValue({ data: { id: "2" }, meta: null });
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "11111111-1111-4111-8111-111111111111",
  );
  usePaperStore.getState().reset();
});

it("계좌를 불러오고 새 키로 충전한 뒤 계좌를 다시 조회한다", async () => {
  render(<AccountTopUp />);
  expect(await screen.findByText("1000000원")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("충전 금액"), {
    target: { value: "1000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "충전" }));
  await waitFor(() =>
    expect(api.topUp).toHaveBeenCalledWith(
      "1000",
      "11111111-1111-4111-8111-111111111111",
    ),
  );
  await waitFor(() => expect(api.getAccount).toHaveBeenCalledTimes(2));
});

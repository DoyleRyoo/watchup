import { act } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { useAuthStore } from "../stores/authStore";
import { ToastHost } from "../components/ToastHost";
import { useToastStore } from "../stores/toastStore";
import { ApiError } from "../api/errors";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AccountTopUp } from "../features/paper/AccountTopUp";
import { usePaperStore } from "../stores/paperStore";

const api = vi.hoisted(() => ({ getAccount: vi.fn(), topUp: vi.fn(), getPortfolio: vi.fn() }));
vi.mock("../features/paper/api", () => api);

beforeEach(() => {
  useToastStore.getState().clear();
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
  api.getPortfolio.mockResolvedValue({ data: { cashBalanceKrw: "1001000", holdings: [], valuationStatus: "FRESH" } });
  api.topUp.mockReset().mockResolvedValue({ data: { id: "2" }, meta: null });
  vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(
    "11111111-1111-4111-8111-111111111111",
  );
  usePaperStore.getState().reset();
});

it("계좌를 불러오고 새 키로 충전한 뒤 계좌를 다시 조회한다", async () => {
  render(<AccountTopUp />);
  await waitFor(() => expect(api.getAccount).toHaveBeenCalledTimes(1));
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

it("충전 붙여넣기를 정리하고 숫자가 없거나 0이면 제출을 막는다", async () => {
  render(<AccountTopUp />);
  const input=screen.getByLabelText("충전 금액");
  await waitFor(()=>expect(input).toBeEnabled());
  fireEvent.change(input,{target:{value:"1,000원"}});
  expect(input).toHaveValue("1000");
  for(const raw of ["abc", "0"]) {
    fireEvent.change(input,{target:{value:raw}});
    expect(screen.getByRole("button",{name:"충전"})).toBeDisabled();
    fireEvent.submit(input.closest("form")!);
    expect(api.topUp).not.toHaveBeenCalled();
  }
});

it("충전 실패는 한국어 토스트 한 번으로 알리고 입력은 유지한다", async()=>{
 api.topUp.mockRejectedValue(new ApiError(400,'TOP_UP_AMOUNT_OUT_OF_RANGE','raw error'));
 render(<><ToastHost /><AccountTopUp /></>);
 const input=screen.getByLabelText('충전 금액');
 await waitFor(()=>expect(input).toBeEnabled());
 fireEvent.change(input,{target:{value:'1000'}});
 fireEvent.click(screen.getByRole('button',{name:'충전'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('1회 충전 가능 금액 범위를 벗어났습니다.');
 expect(screen.getAllByRole('alert')).toHaveLength(1);
 expect(input).toHaveValue('1000');
});
it("충전 성공과 계좌 조회 오류의 인라인 재시도를 구분한다", async()=>{
 api.getAccount.mockRejectedValueOnce(new ApiError(503,'DATABASE_UNAVAILABLE','계좌 조회 실패'));
 render(<><ToastHost /><AccountTopUp /></>);
 expect(await screen.findByRole('alert')).toHaveTextContent('계좌 조회 실패');
 expect(useToastStore.getState().toasts).toEqual([]);
 fireEvent.click(screen.getByRole('button',{name:'계좌 다시 조회'}));
 const input=screen.getByLabelText('충전 금액');
 await waitFor(()=>expect(input).toBeEnabled());
 fireEvent.change(input,{target:{value:'1000'}});
 fireEvent.click(screen.getByRole('button',{name:'충전'}));
 expect(await screen.findByRole('status')).toHaveTextContent('충전 완료');
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it("세션이 바뀐 충전 요청은 새 계정에 성공 알림이나 추가 재조회를 남기지 않는다", async()=>{
 const session=(id:string)=>({user:{id},access_token:'test'}) as Session;
 useAuthStore.getState().setSession(session('first'));
 let resolve!: (value:unknown)=>void;
 const pending=new Promise(done=>{resolve=done});
 api.topUp.mockReturnValueOnce(pending);
 api.getPortfolio.mockClear();
 render(<><ToastHost /><AccountTopUp /></>);
 const input=screen.getByLabelText('충전 금액');
 await waitFor(()=>expect(input).toBeEnabled());
 fireEvent.change(input,{target:{value:'1000'}});
 fireEvent.click(screen.getByRole('button',{name:'충전'}));
 await waitFor(()=>expect(api.topUp).toHaveBeenCalled());
 act(()=>useAuthStore.getState().setSession(session('second')));
 await act(async()=>{resolve({data:{id:'9'},meta:null});await pending});
 expect(useToastStore.getState().toasts).toEqual([]);
 expect(api.getPortfolio).not.toHaveBeenCalled();
});

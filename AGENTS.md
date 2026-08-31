# AGENTS.md — watch_up_react (frontend)

```yaml
repo: watch_up_react
role: frontend SPA
stack: React 19, TypeScript 6, Vite 8, React Router, Zustand, Recharts, Supabase JS SDK
deploy: Vercel (vercel.json SPA rewrites)
sibling_repos: [watch_up_server (backend), watch_up_infra (compose/CI/docs)]
```

## 0. RULE ZERO — DOUBLE CHECK IS MANDATORY

- DO NOT READ .env file (MOST IMPORTANT RULE)
- Double check is required at **every** stage: before edit, after edit, before commit, before "done".
- Never mark work done on one pass. Run the two-pass protocol in §8.
- Applies to: components, stores, API client, tests, config, docs. No exception.

## 1. SPEC SOURCES (priority order, GOV-01)

| rank | doc | owns |
|---|---|---|
| 1 | `../watch_up_infra/docs/planning_v2.2.md` | policy, scope (single source of truth) |
| 2 | `../watch_up_infra/docs/planning_v2.2_ai.md` | same policy, AI-parse format, tags (SEARCH-01, HOLDINGS-01, REFRESH-01 ...) |
| 3 | `../watch_up_infra/docs/WatchUp_v2.2_functions.md` | API contracts (FE-BE-xx), FE structure §6, screen flows §9 |
| 4 | `../watch_up_infra/docs/develop_steps_v2.2/step_*.md` | build order, per-step scope, per-step double-check gate |
| 5 | actual code | — |

- Conflict → higher rank wins. Record lower-rank mismatch, do not patch policy to match code.
- Do only the current `step_*.md` scope. No forward work. No invented API calls / routes.

## 2. COMMANDS

| task | command |
|---|---|
| install | `npm ci` |
| dev server | `npm run dev` |
| lint | `npm run lint`  (`eslint .`) |
| typecheck | `npm run typecheck`  (`tsc -b --pretty false`) |
| test (watch) | `npm test`  (`vitest`) |
| test once (CI) | `npm test -- --run` |
| build | `npm run build`  (`tsc -b && vite build`) |
| preview build | `npm run preview` |

- Quality gate before "done": lint + typecheck + test + build all green.

## 3. LAYOUT

```
src/
  api/            client.ts (apiRequest, envelope parse, 401 refresh-once), errors.ts, types.ts
  auth/           AuthProvider.tsx (Supabase session bootstrap + listener)
  features/watchup/  SearchArea, DetailArea, WatchlistArea, PriceChart, MarketPrice, api.ts, formatters.ts, types.ts
  features/paper/  (v2.2 NEW) api.ts, HoldingsArea, BuyForm, SellForm
  lib/            supabase.ts (client singleton)
  pages/          LoginPage, AuthCallbackPage, HomePage, CoinDetailPage (v2.2 NEW)
  routes/         AuthRoutes.tsx (ProtectedRoute / PublicOnlyRoute / AuthLoading)
  stores/         authStore.ts, watchupStore.ts, paperStore.ts (v2.2 NEW)
  test/           unit / component / API integration (vitest + Testing Library + jsdom)
  App.tsx         BrowserRouter + AuthProvider + routes
  App.css         all screen + responsive styles (plain CSS + CSS vars in index.css)
  main.tsx        React root
vercel.json       SPA rewrites (exclude /api)
```

## 4. STYLING — PLAIN CSS ONLY

| fact | detail |
|---|---|
| method | hand-written CSS in `src/App.css` + CSS variables in `src/index.css` |
| class naming | semantic (`auth-card`, `search-area`, `dashboard-grid`) — NOT utility classes |
| Tailwind | installed in package.json but **NOT USED** — `tailwind.config.js` `content: []`, no `@tailwind` directives, no utility classes. Do not start using it. |
| new styles | add semantic classes to `App.css`, reuse existing CSS vars (`--primary`, `--border`, `--danger`, `--surface`, `--focus`, `--shadow`) |

## 5. API + CONTRACT RULES

### Client
- All FastAPI calls go through `apiRequest()` in `src/api/client.ts`. Do not `fetch` directly.
- Base URL = `import.meta.env.VITE_API_BASE_URL` (fallback `/api`).
- Bearer token auto-attached. On 401 → one `refreshSession()` → one retry → else logout + `/login`.
- Caller-supplied extra header (`Idempotency-Key`) passed via `buildRequestInit()` options.

### Envelope (from backend)
| kind | shape |
|---|---|
| success | `{ data: T, meta: null }` |
| list | `{ data: T[], meta: { count } }` (paper history adds `hasMore`) |
| error | `{ error: { code, message, details } }` → thrown as `ApiError` |

- JSON keys = camelCase. Money fields = **strings** (never parse to `number` for math; format for display only).

### v2.2 endpoints (functions §3.2)
| fn (src/features/paper/api.ts) | call |
|---|---|
| `getAccount(signal)` | `GET /api/paper/account` |
| `topUp(amountKrw, idempotencyKey, signal)` | `POST /api/paper/top-ups` |
| `postTrade(body, idempotencyKey, signal)` | `POST /api/paper/trades` |
| `getPortfolio(signal)` | `GET /api/paper/portfolio` |
| `getTrades({limit, beforeId}, signal)` | `GET /api/paper/trades` |

### Behavior rules
| tag | rule |
|---|---|
| SEARCH-01 | debounced live search; first result auto-selected; ArrowUp/Down move; Enter/click → navigate `/coins/{marketCode}`; 0 results → notice, Enter no-op; only latest response applied (stale never overwrites) |
| marketCode | never guess / prefix / uppercase / derive from input. Use API-returned value only. |
| CHART PAGE | route `/coins/:marketCode`; reached by search / holdings click / direct URL / refresh — all load all fields; merge chart + portfolio **client-side** |
| trade block | `marketStatus == UNAVAILABLE` → BUY + SELL disabled. `priceStatus` never disables. holding qty 0 → SELL disabled. UI disable is not trusted — server re-validates. |
| price | displayed price is reference only. Never send it in a trade request. |
| Idempotency-Key | `crypto.randomUUID()` once per submit click. Reuse same key only for `DATABASE_UNAVAILABLE` auto-retry. New click → new key. |
| REFRESH-01 | no optimistic insert/update/exclude. After trade success response → refetch `GET /api/paper/portfolio`. Trade fail → list unchanged. Refetch fail → keep last state + error UI + retry. Concurrent → latest response wins (AbortController + sequence guard). |
| HOLDINGS-01 | list source of truth = `GET /api/paper/portfolio` only. No add/remove controls. Row click → `/coins/{marketCode}`. Full sell (qty 0) → row auto-excluded. |
| WATCHLIST_DEPRECATED | zero `/api/watchlist` requests. No heart / star / favorite / add-remove UI. |

## 6. ROUTES

```
current : /login , /auth/callback , / , *→/
v2.2    : /login , /auth/callback , / , /coins/:marketCode , *→/
```
- `/coins/:marketCode` wrapped in `ProtectedRoute`. New `src/pages/CoinDetailPage.tsx`.

## 7. ENV VARS

| var | note |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | anon key |
| `VITE_API_BASE_URL` | backend base URL. Local `/api`; prod = Render backend URL (Vercel env). |

- Token never stored in Zustand persist. Supabase SDK manages session.
- Never commit real values.

## 8. DOUBLE-CHECK PROTOCOL (run every step — RULE ZERO)

### Pass 1 — self review (before commit)
- [ ] Re-open every spec tag the step lists. Code matches word for word.
- [ ] `git diff --stat` — every changed file is in the step's FILES list. Extra → justify or revert.
- [ ] `npm run lint` → clean.
- [ ] `npm run typecheck` → clean.
- [ ] `npm test -- --run` → all green. No `.skip` / `.only` left. No failure hidden.
- [ ] `npm run build` → succeeds.
- [ ] Money values: rendered from string, never used in JS math except display formatting.
- [ ] No direct `fetch` — all via `apiRequest`. No `/api/watchlist` call.
- [ ] Run each `grep` in the step's DOUBLE CHECK section. Counts match.

### Pass 2 — adversarial review (before "done")
- [ ] Assume it is wrong. Find one flow that breaks a §5 rule.
- [ ] Negative cases: stale search response, direct URL load with no prior state, trade on `UNAVAILABLE` market, trade fail → list unchanged, refetch fail → retry, out-of-order refetch, optimistic update leak.
- [ ] No scope leak from a later step. No new route / API fn beyond the step.
- [ ] Full test suite green (whole repo, not only new tests).
- [ ] Manual check key screen in `npm run dev` if UI changed.

## 9. COMPLETION REPORT FORMAT

- **Output language: Korean (한국어).**
- No background explanation. No restating the task. Keyword / table style only.
- Template:

```
## 완료 보고

### 변경 파일
- src/... : <keyword>
- src/test/... : <keyword>

### 구현 항목
- <tag> : <keyword>

### 검증 결과
- lint: pass
- typecheck: pass
- vitest: <count> passed
- build: pass

### 더블 체크
- Pass 1: 완료 / 항목 <n>개
- Pass 2: 완료 / 적대적 케이스 <n>개

### 남은 작업
- <keyword> | 없음
```

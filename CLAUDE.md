# CLAUDE.md — watch_up_react (frontend)

> Single source of agent guidance for this repo = **`AGENTS.md`**. Read it fully before any work.
> This file = Claude-specific notes only. On conflict, `AGENTS.md` wins.

## MUST READ FIRST

1. `AGENTS.md` (this repo) — commands, layout, styling, API + contract rules, routes, env.
2. `../watch_up_infra/docs/develop_steps_v2.2/step_0_overview.md` — build order + global rules.
3. The current `step_*.md` — the only scope you may implement this turn.

## RULE ZERO — DOUBLE CHECK IS MANDATORY

- Required at **every** stage: before edit, after edit, before commit, before "done".
- Two-pass protocol = `AGENTS.md` §8. Never skip. Never single-pass.

## CLAUDE WORKING RULES

| topic | rule |
|---|---|
| scope | Do only the current `step_*.md`. No forward work. No invented API fn / route. |
| spec conflict | planning_v2.2.md > planning_v2.2_ai.md > WatchUp_v2.2_functions.md > develop_steps > code. Record mismatch, do not silently patch. |
| styling | Plain CSS in `App.css` + CSS vars. Tailwind is NOT used — do not start. |
| API | All calls via `apiRequest` in `src/api/client.ts`. No direct `fetch`. No `/api/watchlist`. |
| money | Render from string. Never use money strings in JS math (display formatting only). |
| tests | Add tests with every change. Run full `vitest`, not only new tests. |
| quality gate | `npm run lint` + `npm run typecheck` + `npm test -- --run` + `npm run build` all green before "done". |
| secrets | Never commit real env values. Token never in Zustand persist. |
| git | Commit / push only when the user asks. Branch first if on default branch. |
| uncertainty | If a spec tag or FE-BE contract is ambiguous, stop and ask. Do not guess. |

## COMPLETION REPORT

- **Language: Korean (한국어).**
- No background. Keyword / table style. Template = `AGENTS.md` §9.

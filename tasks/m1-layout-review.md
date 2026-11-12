# M1 layout follow-up — owner-approved for Git delivery

## Authorization

Owner reports successful SELECT/WHERE/GROUP BY functional testing on their Cloudflare staging URL `https://sql.abdtirtayasa24.workers.dev/workspace`. They request a desktop layout revision because growing query history pushes Results down the page. This is owner-reported functional evidence, not named device/AT/header certification. Public HTML was fetched directly; runtime verification uses the local production build. The owner subsequently approved these changes and explicitly requested commit/push with a one-line message. Git delivery of the reviewed M1 workspace and layout follow-up is authorized; no deployment or T19 is authorized.

## Owner approval and Git delivery

Owner approval covers the reviewed M1 software and all-tab layout. Deliver one implementation commit with a one-line message; pushing also delivers the existing local `6683c56` Graphify-ignore housekeeping commit. Before delivery, origin was fetched and `HEAD...origin/main` was `1 0`; no remote divergence. Existing executed browser/device distinctions remain unchanged; no hosted CI success is inferred from local tests.

Documentation-only delivery children (≤5 files): Git-A updates `AGENTS.md`, `README.md`, `tasks/m1-review.md`, this ledger and `tasks/owner-actions.md`; Git-B reconciles `tasks/plan.md`, `tasks/todo.md`, `docs/ARCHITECTURE.md`, `docs/QA.md`. No runtime/test/dependency edit was made for Git delivery. Fresh strict typecheck, lint, format and all 191 unit tests passed; whitespace and protected-spec/lock/license/benchmark checks passed, with no high-confidence secret-pattern matches. Browser evidence above remains the actual prior executed evidence, not an unrun repeat. Keep generated graphs/logs/dist out of the index.

## Selected scope and slices

Use the owner's offered all-tab alternative: Brief / Query / Results / Evidence on every viewport. Desktop has a horizontal tab row, mobile stays vertical; only the selected panel participates in layout. Preserve the mounted editor/undo/draft across panel switches. History reuse explicitly reveals Query before focusing it. No SQL/storage/worker/content-policy changes. This owner-requested layout supersedes the original desktop three-pane M1 presentation, without changing other normative contracts.

Each slice ≤5 files, tests before behavior:

- **L1:** `src/components/common/tqi-tabs.ts`, `src/components/workspace/tqi-sql-workspace.ts`, `tests/e2e/workspace-layout.spec.ts`, `tests/e2e/workspace-results.spec.ts`, this ledger. Prove desktop tabs isolate long history/results, preserve editor identity, restore Query on reuse, and update responsive ARIA orientation.
- **L2:** `tests/fixtures/workspace-ui.ts`, `tests/e2e/workspace-editor.spec.ts`, `tests/e2e/workspace-recovery.spec.ts`, `tests/e2e/workspace-offline.spec.ts`, this ledger. Existing tests explicitly navigate the newly exclusive panels; retain every behavioral assertion.
- **L3:** `tests/e2e/workspace-a11y.spec.ts`, `tests/e2e/workspace-visual.spec.ts`, desktop dark/light workbench baselines, this ledger. Audit selected panels, keyboard/focus/reflow/AA; inspect only intentional new desktop images before normal comparison. Mobile images and prior twenty baselines unchanged.
- **L4:** `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/QA.md`, `tasks/m1-review.md`, this ledger. Record current layout, actual verification and continued review stop.

## Verification

## Executed RED → GREEN

- The new desktop regression first failed on the old built app because the desktop tab list was hidden. The old three-column grid let the long Evidence/history item increase the first grid row's height, placing Results beneath that height.
- Removed only the desktop grid/multi-panel mode; panels now use the existing exclusive mobile semantics on all screens. A responsive media subscription updates ARIA orientation at the real 600px breakpoint, including desktop→mobile→desktop resizing.
- The regression performs eight distinct actual PG runs and asserts identical table Y-position despite growing history, only one exposed tabpanel, hidden history/results in other panels, the same editor DOM instance, responsive orientation and End/Home keyboard behavior. All three engines passed after implementation.
- History reuse from the now-exclusive Evidence panel explicitly reveals Query before focusing the retained editor. Existing tests were updated to choose Results/Evidence/Query as a user would; all original SQL/save/offline/reset assertions remain. No selector weakens those checks, no browser skipped, no retries or screenshot tolerances added.
- Both revised 1280px desktop images were individually inspected before ordinary comparison. The two original 360px workbench images and all twenty older baselines compare unchanged.

## Executed verification

All commands through RTK on the same Windows/Node 24.14.1/npm 11.5.2 environment as M1. Counts overlap; no hosted CI or live deployment result inferred.

| Command (`rtk proxy ...`)                    | Result                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run build`                              | passed, vendor/hash/dist/PWA gates unchanged                                                        |
| `npm run typecheck`                          | passed strict application/tools/SW                                                                  |
| `npm run lint`                               | passed                                                                                              |
| `npm run format:check`                       | passed after final documentation/test formatting                                                    |
| `npm run test:unit`                          | 191 tests / 37 files passed                                                                         |
| `npm run test:workspace`                     | **27 passed** across Chromium/Firefox/WebKit (24 prior checks + 3 new desktop regression instances) |
| `npx playwright test workspace-a11y.spec.ts` | 6 passed; expanded audits cover every exclusive tab                                                 |
| `npm run test:visual`                        | **24 passed**, ordinary comparison after inspecting only the 2 revised desktop baselines            |
| `npm run test:e2e`                           | **69 passed**, includes overlapping workspace editor suite                                          |
| `npm run test:a11y`                          | **54 passed**, automated/keyboard/reflow, not named AT                                              |

Separate storage/portable/update/benchmark suites were not rerun in this layout-only follow-up; their prior executed M1 evidence remains historical, not a new run. Current workspace tests still exercise real imported-progress preservation, worker reset/reopen and fresh offline execution/export. Worker, SQL policy, storage, dependency lock and immutable proof-pack behavior are unchanged. Logs remain ignored under `graphify-out/m1-layout-*.log`.

## Review and changed files

- Runtime: `src/components/common/tqi-tabs.ts`, `src/components/workspace/tqi-sql-workspace.ts`.
- Tests: `tests/fixtures/workspace-ui.ts`, `tests/e2e/workspace-{layout,results,editor,recovery,offline,a11y,visual}.spec.ts`.
- Images: only `tests/e2e/__screenshots__/win32/chromium/workspace-{dark,light}-1280.png` intentionally revised.
- Documentation: `docs/{ARCHITECTURE,DESIGN_SYSTEM,QA}.md`, `tasks/m1-review.md`, this file.

Self-review: no engine/service rules moved into views, no event bus/dependency, no auto-running queries on tab activation, no editor remount/undo reset, no storage clearing or CSS hiding of a still-exposed inactive panel. History reuse waits for panel visibility before focus. Dark/light palette and native controls are retained. This owner-requested all-tab layout intentionally supersedes the normative desktop-pane presentation, not any SQL/save/accessibility contract.

Graphify was queried before editing and after structural refresh, with claims checked against source. Hooks and merge driver remain installed; no global skill/SQL-parser extra was installed. Documentation semantics are refreshed locally by the host agent; no repository upload or external extraction. Local graph/HTML/report now contain 1,598 nodes and 3,051 edges. Diagnostic: no missing/dangling endpoints or duplicate/collapsed edges; the existing 21 self-loops remain disclosed. Host extraction usage is unmetered, not falsely zero. These graph warnings are a navigation caveat, not a software acceptance claim.

- [x] Desktop Results is independent of history height; Evidence/hints/history remain in their own tab.
- [x] Editor identity/draft/undo model, keyboard tabs/modal and responsive layout preserved in tested browsers.
- [x] Local build/types/lint/unit/E2E/visual/automated AA checks above passed.
- [x] Owner approved M1 and this layout revision and explicitly requested a one-line commit and push. No deployment/T19 authorized.
- [ ] Existing manual device/AT/hosting/performance gates remain open; basic-query staging success does not certify these.

Review the freshly built `/workspace.html` locally. The agent has not changed the owner-operated Cloudflare deployment. Deliver the approved M1 software and this follow-up via Git, then stop. No further implementation or agent deployment is authorized.

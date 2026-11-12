# M1 — reliable SQL shell (owner-approved for Git delivery)

## Authorization

Owner authorized T16–T18 through M1 using TDD, followed by review. After the layout follow-up, the owner approved the reviewed changes and explicitly requested commit/push with a one-line message; no deployment or T19 authorized. Base `6683c56`, clean `main` at start; CP1b was delivered as `08879b3`. Existing M0 device/AT/host evidence is not waived.

## Owner review and layout follow-up

The owner reports reviewing M1 at `https://sql.abdtirtayasa24.workers.dev/workspace` and successfully running basic SELECT/WHERE/GROUP BY queries. They requested a desktop layout revision because growing history pushes results down. Their offered all-tab alternative is implemented in the [layout follow-up](m1-layout-review.md): Brief/Query/Results/Evidence are now exclusive tabs on every viewport. Desktop images were intentionally revised; initial M1 suite counts below are historical executed evidence, with current follow-up verification in that ledger. The owner subsequently explicitly approved commit/push with a one-line message. No deployment/T19 authorization or named device/AT certification is inferred.

## Predeclared slices (at most five files each)

Tests precede behavior; no per-slice commits (owner instruction overrides generic skill advice).

| Slice       | Files                                                                                                                                                                             | Verification                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Engine-A    | src/engine/workspace-protocol.ts; src/engine/workspace-policy.ts; tests/unit/workspace-policy.test.ts; tests/unit/workspace-protocol.test.ts; this ledger                         | bounded read-only PG18 AST policy and runtime message guards                              |
| Engine-B    | src/engine/workspace-client.ts; tests/unit/workspace-client.test.ts; this ledger                                                                                                  | serialization, stale identity, reset, deadline, construction/error paths                  |
| Engine-C    | src/workers/workspace.worker.ts; src/engine/workspace-data.ts; tests/fixtures/workspace-query.ts; tests/unit/workspace-query.test.ts; this ledger                                 | actual PG18 arrays/NULL/precision, read-only cleanup, deterministic reset                 |
| T16-A       | src/components/common/tqi-tabs.ts; src/components/common/tqi-dialog.ts; src/components/common/tqi-status.ts; tests/e2e/workspace-layout.spec.ts; this ledger                      | keyboard tabs, native modal Escape/restore, status                                        |
| T17-A       | src/components/workspace/tqi-results.ts; src/components/workspace/tqi-schema-explorer.ts; src/engine/workspace-feedback.ts; tests/unit/workspace-feedback.test.ts; this ledger    | escaped typed rows/duplicate names/NULL, SQLSTATE feedback                                |
| T17-B       | src/components/game/tqi-hints.ts; src/components/game/tqi-query-history.ts; tests/e2e/workspace-results.spec.ts; this ledger                                                      | free progressive hints and keyboard history                                               |
| Editor      | src/components/editor/tqi-sql-editor.ts; src/components/editor/codemirror-adapter.ts; src/components/editor/textarea-fallback.ts; tests/e2e/workspace-editor.spec.ts; this ledger | optional execution mode, immediate intent, external draft restore, same rich/native model |
| UI          | src/components/workspace/tqi-sql-workspace.ts; src/styles/workspace.css; tests/e2e/workspace-layout.spec.ts; this ledger                                                          | responsive three-pane/mobile tabs, disabled/error/recovery                                |
| App-A       | src/app/workspace-controller.ts; tests/unit/workspace-controller.test.ts; this ledger                                                                                             | durable draft orchestration, race/cancel guards and deterministic recovery                |
| App-B       | src/workspace.ts; workspace.html; vite.config.ts; tools/m0-assets.ts; this ledger                                                                                                 | actual built static entry, offline inventory                                              |
| Integration | src/components/storage/tqi-navigation-desk.ts; package.json; .github/workflows/ci.yml; tests/e2e/workspace-recovery.spec.ts; this ledger                                          | reachable workspace, full browser journey, two tabs/timeouts/reload/navigation            |
| QA-A        | tests/e2e/workspace-a11y.spec.ts; tests/e2e/workspace-visual.spec.ts; tests/e2e/visual.spec.ts; tests/e2e/a11y.spec.ts; this ledger                                               | axe/keyboard/reflow and screenshot review                                                 |
| QA-B        | four workspace screenshot baselines; this ledger                                                                                                                                  | inspect each before ordinary comparison                                                   |
| Docs-A      | docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/QA.md; docs/STORAGE.md; this ledger                                                                                             | actual contracts, executed evidence and manual blockers                                   |
| Docs-B      | AGENTS.md; README.md; tasks/plan.md; tasks/todo.md; tasks/owner-actions.md                                                                                                        | truthful M1 review stop                                                                   |

Additional predeclared slices: **Offline** (`tests/e2e/workspace-offline.spec.ts`, `src/app/offline-proof.ts`, `tests/unit/offline-proof.test.ts`, `tools/verify-m0-dist.mjs`, this ledger) proves cold closed-page offline workspace after explicit existing proof-pack download. **Keyboard fixtures** (`tests/fixtures/workspace-ui.ts` and the four workspace editor/results/recovery/offline suites) use real selection/typing on all engines, following the existing documented WebKit synthetic-fill limitation. **Hardening** will add focused regressions to existing new M1 files before correcting any observed race/limit defect.

## Scope decisions

- A separate `/workspace.html` practice surface preserves all existing proofs and locked mission routes. It uses the canonical active campaign/mission draft without awarding completion, evidence, rank or mastery. Sample relations are explicitly not authored mission content.
- Disposable per-tab memory PG18, seeded from the saved campaign seed. Reset only replaces worker/data, never saves. Initdb remains default.
- Restricted SELECT practice policy is fail-closed, AST based, with relation/function/node allowlists, read-only transaction, bounded input/results/payload and watchdog. This is not the future mission-scoped T23 policy or behavioral grading.
- Existing native storage/settings and export/import are reused; no migration/version/dependency change. Query history is bounded in-page, not a new raw-SQL retention policy.
- Named screen-reader, real Android/iOS/Safari, performance/memory and actual-host evidence remain manual acceptance gates. Automation must not be labeled those passes.

## Executed evidence

### Test-first and corrective findings

- Initial policy/protocol/client/query/controller/feedback tests failed against absent modules before implementation. Real PG18 cursor tests then passed exact INT8/NUMERIC/DATE, duplicate names/NULL, deterministic reset, SQLSTATE cleanup and row/column/cell ceilings.
- The AST deny-cast regression caught that upstream embeds lowercase `typeName`, not a `TypeName` wrapper. Inspected the actual PG18 tree and corrected the check; unsupported `regclass` remains denied.
- The first built workspace layout test failed against the missing page. Subsequent Chromium keyboard/modal/draft tests passed; review removed a duplicate static boot heading. Column-header selectors were corrected to include intentionally visible OID metadata, without weakening duplicate-column/NULL checks.
- First cross-engine run exposed WebKit mouse clicks not focusing the modal opener: passing the actual invoking button fixes focus restoration. Synthetic contenteditable `fill` is the already documented WebKit harness limitation; tests now use real select-all/typing on **all** engines, with no production special case or skipped browser.
- Adding the workbench to the emitted proof inventory first failed the native offline URL reader and then the independent dist verifier. Added explicit `workspace.html` support to both; a new unit test initially failed for that URL. Three-engine closed-page offline execution/export is now GREEN. No broad URL acceptance or binary auto-precache.
- Hardening RED→GREEN covered oversized edits falsely resembling saved work and repeated identical results lacking a distinct announcement. Oversized text now remains explicitly unsaved/recoverable, disables Run, and cannot replace canonical text; completion status includes a run ordinal.
- Additional native acceptance tests were already GREEN: imported solved IDs/all non-draft collections survive workbench run/reset/export, and a page closed mid-query restores its committed draft. Keyboard tests explicitly activate all hint rungs and history reuse. No changed tests merely remove assertions, retries, tolerances or safety gates.

### Executed verification

Local Windows, Node **24.14.1**, npm **11.5.2**, pinned Playwright **1.64.1**. All shell commands used RTK. Preview enforces the existing CSP/nosniff policy. Commands below actually ran; counts overlap and are not summed as unique tests.

| Command (via `rtk proxy`)               | Actual result                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                     | passed strict application/tools/SW                                                                                                       |
| `npm run lint` / `npm run format:check` | passed; final documentation hygiene rechecked                                                                                            |
| `npm run test:unit`                     | **191 tests / 37 files passed**                                                                                                          |
| `npm run build`                         | passed; **32 vendor packages / 105 independent hashes**, final-dist gates, **42 proof resources**, **30-entry lean precache (~652 KiB)** |
| `npm run smoke:dist`                    | **21 passed**                                                                                                                            |
| `npm run test:e2e`                      | **69 passed**, including overlapping editor-workspace selector                                                                           |
| `npm run test:storage`                  | **63 passed**, real native IDB/regression                                                                                                |
| `npm run test:portable`                 | **63 passed**, real interchange/navigation/regression                                                                                    |
| `npm run test:workspace`                | **24 passed** across Chromium/Firefox/WebKit; final added preservation/close-running/keyboard checks included                            |
| `npm run test:visual`                   | **24 passed**, ordinary comparison after individually inspecting four new images                                                         |
| `npm run test:a11y`                     | **54 passed**, automated/keyboard/reflow, not named AT                                                                                   |
| `npm run test:pwa-update`               | **9 passed**, actual compiled A/B releases                                                                                               |
| `npm run benchmark:boot`                | **9 cohorts / 90 timed trials passed**, desktop regression, not device certification                                                     |
| `npm audit --audit-level=high`          | threshold passed; unchanged **four low build-only** deepmerge-chain advisories remain, no force downgrade                                |

After all runtime fixes, full types/lint/format/unit/build and smoke/E2E/storage/portable/workspace/visual/a11y/update/benchmark passed. The final two acceptance tests and keyboard activation strengthened only the new workspace test files; the full workspace suite was rerun (24), not the unrelated unchanged suites. Later edits are documentation/local graph only. `npm ci` was not rerun in this checkpoint: package versions/lockfile are unchanged and independent installed-artifact verification passed. `validate:content`/`test:fixtures` remain intentional future-task failures, not green placeholders. No remote CI result is inferred for uncommitted work.

Ignored logs: `graphify-out/m1-{types,lint,format,unit,build,smoke,e2e,storage,portable,workspace,visual,a11y,update,benchmark,audit}.log`; test artifacts under `test-results/`, generated fixture outputs under `generated/`. No private user queries/notes are test fixtures. Historical M0 committed benchmark and all twenty previous screenshots remain unchanged. Existing upstream Vite/PGlite/parser externalization/eval warnings and PWA inlineDynamicImports deprecation are not hidden or patched in installed code; actual browser CSP remains unchanged and passing.

### Graph and review

Graphify queries were used for T16–T18 boundaries and existing storage/editor relationships; claims checked against spec/task/source. Structural refresh ran locally without an LLM/external service and indexed new code. The tool reports an optional SQL tree-sitter extra missing (one existing SQL file contributes no AST), older Claude skill copy and changed community labels; no package/global config was modified. The graph remains a navigation aid, not acceptance evidence. Targeted host-agent semantic extraction of this M1 ledger records software scope/manual gates without uploading repository content: current local graph has **1,584 nodes / 3,018 edges**; HTML and report updated in place. Diagnostic reports **0 missing/dangling endpoints, 0 collapsed/duplicate edges and 21 self-loops**; that warning is retained rather than claiming a clean integrity gate. Other historical documentation nodes may still describe earlier scopes; verify source. Host extraction token usage is unmetered, not falsely reported as zero.

Five-axis self-review (not independent review):

- **Correctness:** native complete-event drafts, current-seed restoration, generation/correlation guards, all active/queued reset rejection, bounded results and fixed SQLSTATE feedback verified. Only the active draft/timestamp change; no completion/evidence award or destructive storage reset exists.
- **Readability:** common view primitives, result/schema/hints/history, controller, client/protocol, worker and policy/data modules are separated. Generic modal copy/confirmation is property-driven. New practice transport deliberately leaves historical proof contracts stable.
- **Architecture:** Lit/strict TS/Vite/vanilla CSS/CodeMirror/native storage and exact PG/parser pins retained. No new dependency, backend, API, framework, global event bus or mission publication. Sample content is explicitly synthetic, not premature T19.
- **Security:** fail-closed PG18 AST subset plus read-only transaction/timeout, cursor/output bounds, escaped UI and no raw DB error/log/upload. This is a local resource/policy boundary, not anti-cheat. Giant cell/engine allocations remain a tab-memory risk before post-fetch bounds.
- **Performance:** worker-only parsing/execution, one retained editor, bounded preview/history and explicit initdb recovery; no unmeasured mobile/peak-memory claim. Existing 90-trial desktop benchmark is regression evidence only.

### Changed-file map

- **Authorization/evidence/docs (10):** `AGENTS.md`, `README.md`, `docs/{ARCHITECTURE,DESIGN_SYSTEM,QA,STORAGE}.md`, `tasks/{m1-review,owner-actions,plan,todo}.md`.
- **Build/CI/offline (6):** `.github/workflows/ci.yml`, `package.json`, `vite.config.ts`, `tools/{m0-assets.ts,verify-m0-dist.mjs}`, `src/app/offline-proof.ts`.
- **Entry/orchestration (3):** `workspace.html`, `src/workspace.ts`, `src/app/workspace-controller.ts`.
- **Engine (6):** `src/engine/workspace-{client,data,feedback,policy,protocol}.ts`, `src/workers/workspace.worker.ts`.
- **Views/styles (13):** `src/components/common/tqi-{tabs,dialog,status}.ts`, `src/components/workspace/tqi-{sql-workspace,results,schema-explorer}.ts`, `src/components/game/tqi-{hints,query-history}.ts`, `src/components/editor/{tqi-sql-editor,codemirror-adapter,textarea-fallback}.ts`, `src/components/storage/tqi-navigation-desk.ts`, `src/styles/workspace.css`.
- **Unit/browser/fixture tests (15):** `tests/unit/workspace-{client,controller,feedback,policy,protocol,query}.test.ts`, `tests/unit/offline-proof.test.ts`, `tests/e2e/workspace-{layout,results,editor,recovery,offline,a11y,visual}.spec.ts`, `tests/fixtures/workspace-ui.ts`.
- **New images (4):** `tests/e2e/__screenshots__/win32/chromium/workspace-{dark,light}-{360,1280}.png`.

## Acceptance and review stop

- [x] T16 software: keyboard tabs/native modal Escape and opener restore across Shadow DOM; desktop/360px/reflow/reduced-motion layouts and inspected theme baselines; actual loading/error/disabled states, no unsafe CSS/UI library.
- [x] T17 software: semantic bounded rows/duplicate headers/NULL, escaped values, visible schema, fixed SQLSTATE diagnosis/one primary/≤2 details, distinct completion status, keyboard free hints/history, no SQL/evidence rules in views.
- [x] T18 software: serialized runtime-validated messages, new worker identity/reset/watchdog/error handling; saved seed and draft restore before Run; real timeout/reset/navigation/close/reopen/independent-tab/native progress checks.
- [x] Initial M1 journey: real CodeMirror SQL → dedicated PG18 → typed result, durable draft, canonical interchange regression, fresh offline proof, strict/component/save/visual automation.
- [x] **Owner approved M1 and the layout follow-up; explicitly requested a one-line commit and push. No deployment or T19.**
- [ ] Named NVDA/VoiceOver/TalkBack status/focus/editor audit. Automated DOM/axe checks are not this evidence.
- [ ] Real Android/iOS/macOS Safari/IME/mobile memory/performance, actual HTTPS/native install/worker CSP/header evidence, and outstanding M0 human go/no-go. Local desktop/viewport measurements do not close them.

Following owner review, every viewport uses exclusive tabs; the original desktop columns were superseded by the [layout follow-up](m1-layout-review.md). Only synthetic SQL practice is implemented: authored mission seed/content/loading, full mission-scoped T23 SQL safety, T22 grading comparison, case filing and act offline packs remain future tasks. All manual/release gates above remain open; this is a software review handoff, not full human/device acceptance.

Review: `rtk proxy npm run preview`, then `http://127.0.0.1:4173/workspace.html`; export wanted drafts first or use a disposable browser profile. Stop preview before Playwright. Git delivery is now owner-authorized; stop after the approved commit/push.

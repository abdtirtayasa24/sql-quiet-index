# The Quiet Index — implementation checklist

**Status: Full plan, D01–D13 dispositions and Ubuntu VPS/Nginx deployment plan approved by the project owner. Commit and push the planning baseline before implementation. Implementation tasks and technical verification gates remain open; live VPS changes still require operational authorization.**

Read [`plan.md`](plan.md) and the normative spec first. T tasks deliver MVP engineering; C tasks deliver individual MVP missions; later acts are gated expansion work. Dependencies are task IDs, not calendar order. Verification commands are planned package-script contracts, not existing/passed commands. Use RTK for all shell commands; query Graphify before navigating relationships, then verify source text.

## Global task acceptance / Definition of Done

Applies to **every task below**, in addition to its specific criteria:

- [ ] Human-approved scope; minimal changes; no overwritten user work, secret exposure or unrelated refactor.
- [ ] Tests exercise behavior before/with implementation; all relevant strict types, lint, format and existing regression tests pass.
- [ ] UI tasks include keyboard/error/loading states, desktop/360px screenshot review and relevant a11y checks; pure domain code stays outside components.
- [ ] Changed-file list, exact commands/results, unmet criteria and deviations recorded. Never mark done from unrun browser/manual checks.
- [ ] Committed/deployed only when separately authorized. Read latest `AGENTS.md` and relevant architecture/manifest before editing.

**Sizing:** S = 1–2 files; M = 3–5 files. The listed paths include tests. If a task requires >5 actual files, split into named child tasks **before coding**; do not treat a directory as one file to evade sizing. Configuration foundation tasks deliberately split files across T02–T04. New act/mission production follows the explicit repeatable packets below.

**Common verification:** `rtk proxy npm run typecheck`, `rtk proxy npm run lint`, `rtk proxy npm run format:check` after every code slice; focused unit/E2E/fixture checks specified below. At phase gates run the full supported suite on the built app. Test tools must fail if a requested selector matches zero cases.

## Phase 0 — feasibility and typed contracts (M0)

### T01 — Resolve implementation contract ambiguities

**Description:** Record the owner's approval of D01–D13 in detailed architecture/contract documents; identify remaining factual unknowns and owners before affected code/content is authored. Do not request approval of the same dispositions again.

**Acceptance criteria:**
- [x] D01–D13 proposed dispositions explicitly approved by the project owner; identity/mastery/evidence/filing approaches accepted (implementation not completed).
- [x] Worker, manifest, result and save boundary vocabulary defined without inventing APIs; Ubuntu VPS/Nginx access and device/tester owners assigned.
- [x] MVP vs post-MVP scope and unsupported-browser behavior documented.

**Verification:** Cross-check spec §§6–12 against decision log; human sign-off with no silent spec changes.  
**Dependencies:** None.  
**Files likely touched:** `docs/ARCHITECTURE.md`, `docs/adr/0001-contract-clarifications.md`, `tasks/plan.md`.  
**Estimated scope:** M.

### T02 — Establish the pinned build toolchain

**Description:** Create reproducible Node/npm project and strict TS/Vite static configuration, resolving compatible approved packages only.

**Acceptance criteria:**
- [x] Exact PG/parser pins preserved; lockfile committed when authorized; Node/npm engine choices recorded. (CP0a lock committed through `7882873`; CP0b editor/type additions and integrity-metadata repair are clean-install verified and owner-approved for the CP0b commit.)
- [x] Strict/noUncheckedIndexedAccess configs and worker ES format; production emits static dist only.
- [x] Build/content-staging exclusions prevent committing generated dependencies/assets or credentials.

**Verification:** `rtk proxy npm ci`; `rtk proxy npm run typecheck`; inspect effective Vite configuration.  
**Dependencies:** T01.  
**Files likely touched:** `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`.  
**Estimated scope:** M; split additional tool/worker tsconfigs into a child if necessary.

### T03 — Render the static Lit entrypoint

**Description:** Add lean HTML entry, Lit registration/shell and initial accessible tokens without gameplay logic.

**Acceptance criteria:**
- [x] Static build opens with semantic main/heading and readable boot/unsupported states.
- [x] Reactive-property/decorator mode is deliberate; no second UI library or unsafe content rendering.
- [x] Initial token values have recorded contrast checks and reduced-motion defaults.

**Verification:** Build and static preview; keyboard/360px inspection; no runtime Node/API/CDN requests.  
**Dependencies:** T02.  
**Files likely touched:** `index.html`, `src/main.ts`, `src/app/app.ts`, `src/styles/tokens.css`, `src/styles/global.css`.  
**Estimated scope:** M.

### T04 — Establish executable quality gates

**Description:** Wire required script names to working lint, unit and browser infrastructure; stage scripts as their tools land rather than fake success placeholders.

**Acceptance criteria:**
- [x] Separate typecheck, lint/format, Vitest and built-app Playwright checks run in CI. Hosted quality and built-browser jobs passed on `7882873`: [run 41208362500](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/41208362500).
- [x] Every spec-required script has an assigned implementation task; unavailable checks fail clearly until introduced, never exit successfully as TODO.
- [x] Focused selector conventions and zero-match failures documented.

**Verification:** Introduce temporary test/type failure to prove CI rejects it, then remove; run baseline checks.  
**Dependencies:** T02,T03.  
**Files likely touched:** `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `package.json`.  
**Estimated scope:** M; formatting config is a separate child if needed.

### Checkpoint CP0a — foundation
- [x] T01–T04 reviewed; static shell works and installed dependencies are reproducible.
- [x] Type/build/lint/test commands genuinely execute; no application behavior claimed yet.

**CP0a review handoff:** The owner approved T01–T04; implementation and LF-checkout fix were committed/pushed through `7882873`. Hosted CI passed both jobs ([run](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/41208362500)). Historical local evidence is in [cp0a-review.md](cp0a-review.md); assigned follow-ups remain in [owner-actions.md](owner-actions.md). The owner subsequently authorized T05–T07 through CP0b using TDD, with no commit/push until separately requested; see [cp0b-review.md](cp0b-review.md).

### T05 — Prove the real PostgreSQL worker

**Description:** Spike PGlite in a dedicated Vite-built module worker with structured request/response types and emitted same-origin binaries.

**Acceptance criteria:**
- [x] `version()` confirms PostgreSQL 18; DATE_TRUNC, DISTINCT ON, CTE/window and EXPLAIN JSON smoke statements pass. Built Chromium/Firefox/WebKit proof in [QA](../docs/QA.md).
- [x] UI never imports/constructs PGlite; actual worker/WASM/data URLs and MIME captured. Dedicated ES worker and same-origin binary MIME / worker CSP checked in production-preview browser tests.
- [x] Dependency integrity/license inventory verifies the pinned artifacts and fails on deliberate checksum mismatch. Independent registry/lock baseline, installed-file and emitted-binary negative tests; [inventory](../docs/THIRD_PARTY.md).

**Verification:** `rtk proxy npm run build`; `rtk proxy npm run smoke:dist`; `rtk proxy npm run verify:vendor`.  
**Dependencies:** T04.  
**Files likely touched:** `src/workers/postgres.worker.ts`, `src/engine/protocol.ts`, `tests/smoke/pg.spec.ts`, `tools/verify-third-party.mjs`, `docs/THIRD_PARTY.md`.  
**Estimated scope:** M.

### T06 — Prove PostgreSQL AST compatibility

**Description:** Load the research-pinned parser in the built worker and document actual AST structures before safety code relies on them.

**Acceptance criteria:**
- [x] Parse adapter returns typed success/errors with cursor positions where available, no guessed AST paths or general regex parser. Actual grammar 180004 and paths recorded in [architecture](../docs/ARCHITECTURE.md).
- [x] Fixtures cover SELECT, joins, aggregate/group columns, subquery, recursive/nested CTE, modifying CTE and multiple statements.
- [x] Browser packaging/CSP works or an explicit blocker/ADR is raised without substituting silently. All three built browser engines pass the pinned parser with restrictive local response CSP; exact loader transform documented. Deployed-host proof remains distinct and open.

**Verification:** Focused AST Vitest tests plus production browser parser smoke on Chromium/Firefox/WebKit.  
**Dependencies:** T05.  
**Files likely touched:** `src/engine/pg-ast.ts`, `src/types/engine.ts`, `tests/unit/pg-ast.test.ts`, `tests/smoke/ast.spec.ts`, `docs/ARCHITECTURE.md`.  
**Estimated scope:** M.

### T07 — Audit the CodeMirror adapter and fallback

**Description:** Prove the required editor can mount once inside Lit and remain usable on target mobile/assistive technology.

**Acceptance criteria:**
- [x] PostgreSQL dialect, visible-only completion, undo/selection, Ctrl/Cmd+Enter and accessible content-DOM labels work. Built automated checks pass on Chromium/Firefox/WebKit.
- [x] Typed adapter reconfiguration preserves editor instance; fallback retains draft/history/shortcut and announces itself. In-page editing state only, not durable-save implementation.
- [ ] Record real keyboard/VoiceOver/TalkBack findings and relevant deployed-CSP style behavior. Owner-reported Android Chrome and Windows functional passes are recorded below. Named AT/Safari audits remain unreported, and the inspected Cloudflare host lacks CSP/nosniff response headers; [QA evidence](../docs/QA.md) distinguishes these from general functional success.
  - [x] Owner-reported Android Chrome functional acceptance at the deployed feasibility URL.
  - [x] Owner-reported Windows functional acceptance at the same URL (browser unspecified).
  - [x] Owner code-review approval and authorization to commit CP0b.
  - [ ] Specifically reported VoiceOver/TalkBack/NVDA and Safari/iOS audit results.
  - [ ] Complete deployed response-CSP proof, including the worker; meta CSP alone is insufficient.

**Verification:** Editor smoke tests; manual mobile keyboard/AT audit against textarea baseline.  
**Dependencies:** T03,T04.  
**Files likely touched:** `src/components/editor/tqi-sql-editor.ts`, `src/components/editor/codemirror-adapter.ts`, `src/components/editor/textarea-fallback.ts`, `tests/e2e/editor.spec.ts`, `docs/QA.md`.  
**Estimated scope:** M.

### Checkpoint CP0b — engine/input feasibility
- [ ] T05–T07 prove exact artifacts, actual AST paths and usable SQL input.
- [x] Record failed browsers/features; no weakening PostgreSQL or grading to bypass failures. Local parser asset/MIME, shortcut and syntax-contrast defects fixed; WebKit synthetic-fill limitation and remaining real-device/deployment gaps recorded in [QA](../docs/QA.md).

**CP0b review handoff:** Owner code review and Android Chrome/Windows functional acceptance are recorded; the owner authorizes committing CP0b. Remaining named AT/Safari and deployed response-CSP criteria remain open. [Evidence/file map](cp0b-review.md). Commit only; no push or T08 implementation authorized by this request.

### T08 — Select a measured boot strategy

**Description:** Compare fresh initdb+SQL with one version-coupled shared snapshot on real devices.

**Acceptance criteria:**
- [ ] Cold/warm/offline P75, bytes, memory and input responsiveness recorded on desktop, real Android and iOS Safari.
- [ ] Snapshot ships only if first-playable improves without repeat/offline regression; no per-case giant snapshots.
- [ ] Define tested memory envelope and browser compatibility notice; emulator-only results labeled honestly.

**Verification:** Repeated reproducible browser benchmarks and actual device report; checksums verify snapshot engine coupling.  
**Dependencies:** T05,T06,T07.  
**Files likely touched:** `tools/build-base-snapshot.mjs`, `tests/smoke/boot-benchmark.spec.ts`, `docs/ARCHITECTURE.md`, `docs/QA.md`.  
**Estimated scope:** M.

### T09 — Prove production PWA install/update behavior

**Description:** Implement minimal custom injectManifest worker/update prompt for a PG demo before relying on offline promises.

**Acceptance criteria:**
- [ ] Production-built offline demo works, with engine/parser explicitly downloaded rather than unconditional huge precache.
- [ ] Waiting update never forces reload/activation; explicit approval updates safely.
- [ ] CSP/MIME and stale-shell/new-assets scenario documented; no hidden runtime network dependency.

**Verification:** Two-release production-preview E2E; disconnect/reopen version() demo; inspect generated precache URLs.  
**Dependencies:** T05,T06,T08.  
**Files likely touched:** `src/sw.ts`, `vite.config.ts`, `src/app/update-controller.ts`, `tests/e2e/pwa-spike.spec.ts`, `docs/ARCHITECTURE.md`.  
**Estimated scope:** M.

### Checkpoint M0 — mandatory go/no-go
- [ ] GATE-PG, GATE-AST, GATE-TYPES, GATE-BUILD; editor/device and update proof attached.
- [ ] Dependency/asset/boot decisions recorded; actual device gaps remain blockers, not presumed passes.
- [ ] Human approval before reliable-shell implementation or broad content production.

## Phase 1 — reliable investigator shell (M1)

### T10 — Save campaign identity immediately

**Description:** Add native IDB schema/open lifecycle and transactional campaign+seed creation.

**Acceptance criteria:**
- [ ] All v1 stores/key paths/indexes created without storing unique progress in PGlite.
- [ ] Creation commits campaign/seed together; abort leaves no partial campaign.
- [ ] Unavailable/blocked/versionchange IDB produces actionable state rather than silent new game.

**Verification:** Unit schema tests and real-browser transaction abort/reopen checks.  
**Dependencies:** M0.  
**Files likely touched:** `src/types/save.ts`, `src/storage/progress-db.ts`, `tests/unit/progress-db.test.ts`, `tests/e2e/storage-create.spec.ts`.  
**Estimated scope:** M.

### T11 — Persist settings and SQL drafts safely

**Description:** Add small localStorage settings and IDB mission draft lifecycle without overwriting simultaneous progress.

**Acceptance criteria:**
- [ ] 500ms draft debounce plus hidden-visibility flush; no beforeunload-only assumption.
- [ ] Two tabs merge evidence/solved events by ID and apply deterministic draft conflict policy using current transactional records.
- [ ] Locale/theme/motion settings survive reload without becoming sole canonical progress.

**Verification:** Two-tab delayed-write race, hidden/reopen and blocked-localStorage tests.  
**Dependencies:** T10.  
**Files likely touched:** `src/storage/local.ts`, `src/storage/progress-db.ts`, `src/app/draft-controller.ts`, `tests/e2e/drafts.spec.ts`, `tests/unit/draft-policy.test.ts`.  
**Estimated scope:** M.

### T12 — Migrate and recover saves without revoking progress

**Description:** Add pure migration chain, transaction rollback and explicit quota/missing/future-version recovery states.

**Acceptance criteria:**
- [ ] Migration runs on copies and preserves solved IDs, notes, evidence; stale row refs become archived_legacy.
- [ ] Unknown future save preserved/read-only; surviving pointer with missing IDB offers import, not silent reset.
- [ ] Quota/abort keeps in-memory work exportable, pauses evidence writes and never displays false saved status.

**Verification:** Migration crash injection, future-version fixture, quota fault, complete-vs-partial eviction tests.  
**Dependencies:** T10,T11.  
**Files likely touched:** `src/storage/migrations.ts`, `src/storage/progress-db.ts`, `tests/unit/migrations.test.ts`, `tests/e2e/storage-recovery.spec.ts`, `docs/STORAGE.md`.  
**Estimated scope:** M.

### Checkpoint CP1a — local durability
- [ ] T10–T12 transaction/recovery checks pass on a built app.
- [ ] No cache/database reset path can erase canonical progress.

### T13 — Export a canonical, lossless case file

**Description:** Serialize all defined progress collections with deterministic integrity hash and Blob download.

**Acceptance criteria:**
- [ ] Recursive key ordering/UTF-8 SHA-256 excludes integrity field and round-trips bigint-safe record representations.
- [ ] Mastery events, evidence/query provenance, notes, choices and solved IDs exported, not just active mission.
- [ ] Unsupported-save recovery can export preserved original data without destructive conversion.

**Verification:** Known digest vectors, Unicode/nested-key tests, browser download and logical-equality round-trip fixture.  
**Dependencies:** T12.  
**Files likely touched:** `src/storage/export-import.ts`, `schemas/save.schema.json`, `tests/unit/export.test.ts`, `tests/e2e/export.spec.ts`.  
**Estimated scope:** M.

### T14 — Import with preview and explicit merge/copy

**Description:** Validate bounded untrusted save JSON before opening a write transaction.

**Acceptance criteria:**
- [ ] 5MiB cap, schema/string/count/version/hash checks and recursive pollution-key rejection; malformed imports cannot partially write.
- [ ] Preview supports confirmed merge or new copy with all campaign-linked foreign IDs remapped.
- [ ] Merge dedupes stable IDs, unions solved progress and follows approved draft/choice conflicts without silent overwrite.

**Verification:** Corruption, oversized/polluting/malformed JSON, conflicting campaigns, atomic failure and full export/import browser tests.  
**Dependencies:** T13.  
**Files likely touched:** `src/storage/export-import.ts`, `src/storage/import-validator.ts`, `tests/unit/import.test.ts`, `tests/e2e/import.spec.ts`, `docs/STORAGE.md`.  
**Estimated scope:** M.

### T15 — Implement typed routes and app snapshots

**Description:** Wire home/act/mission/casebook/practice/settings hash routes to immutable state and typed commands.

**Acceptance criteria:**
- [ ] Deep-link mission route explains locked state; navigation cancellation cannot accept stale SQL result.
- [ ] No app-server routing requirement or global event-bus dependency.
- [ ] Bootstrap/unsupported/storage error view models have explicit discriminated states and focus destinations.

**Verification:** Unit hash parsing/route tests; built static deep-link/navigation smoke.  
**Dependencies:** T10,T11.  
**Files likely touched:** `src/app/router.ts`, `src/app/app-store.ts`, `src/app/selectors.ts`, `src/types/events.ts`, `tests/unit/router-store.test.ts`.  
**Estimated scope:** M.

### Checkpoint CP1b — portable progress/navigation
- [ ] T13–T15 preserve all existing records and survive direct hash navigation.
- [ ] Import error never replaces canonical campaign without confirmation.

### T16 — Build accessible workspace primitives

**Description:** Implement reusable tabs/dialog/status and responsive workspace container before adding mission-specific skins.

**Acceptance criteria:**
- [ ] Keyboard tabs, modal Escape/focus restore and non-obscured focus work across Shadow DOM.
- [ ] Desktop and 360px layouts show reachable Run action, correct overflow and reduced motion.
- [ ] Explicit loading/error/disabled states and tokenized styles pass contrast checks.

**Verification:** Focus E2E, axe checks, reviewed desktop/360px/theme snapshots.  
**Dependencies:** T07,T15.  
**Files likely touched:** `src/components/common/tqi-tabs.ts`, `src/components/common/tqi-dialog.ts`, `src/components/common/tqi-status.ts`, `src/components/workspace/tqi-sql-workspace.ts`, `tests/e2e/workspace-layout.spec.ts`.  
**Estimated scope:** M; button primitive/additional CSS split into named children if needed.

### T17 — Render typed results and teaching feedback

**Description:** Present schema, row-array results, SQLSTATE explanations, query history and hint ladder through typed view models.

**Acceptance criteria:**
- [ ] Semantic table preserves duplicate names/NULL display, shows 200 of N and internal scroll; no unsafeHTML.
- [ ] Visible-only schema, one primary diagnosis and ≤2 details; one status announcement per explicit run.
- [ ] History and four free hint rungs are keyboard reachable; reusable presentation has no SQL/evidence business logic.

**Verification:** Table/XSS fixtures, screen-reader status check, built-app schema/hint/history E2E.  
**Dependencies:** T16,T06.  
**Files likely touched:** `src/components/workspace/tqi-results.ts`, `src/components/workspace/tqi-schema-explorer.ts`, `src/components/game/tqi-hints.ts`, `src/components/game/tqi-query-history.ts`, `tests/e2e/results-feedback.spec.ts`.  
**Estimated scope:** M.

### T18 — Recover a terminated query worker

**Description:** Implement engine-client serialization, request/session guards, watchdog and deterministic restart in the real workspace.

**Acceptance criteria:**
- [ ] Every message validates session/request; termination rejects pending work with ENGINE_RESET and ignores late responses.
- [ ] Draft and canonical save survive timeout/reset/reload; mission seed restored before next run.
- [ ] Query budgets and recovery loading state are honest; reset only mission DB, not campaign progress.

**Verification:** Runaway/late-message/navigation/reload tests in built browser; two independent tab workers.  
**Dependencies:** T05,T11,T15–T17.  
**Files likely touched:** `src/engine/engine-client.ts`, `src/engine/protocol.ts`, `src/workers/postgres.worker.ts`, `tests/unit/engine-client.test.ts`, `tests/e2e/worker-recovery.spec.ts`.  
**Estimated scope:** M.

### Checkpoint M1 — reliable shell
- [ ] Real CodeMirror SQL → worker → result; close/reopen draft, export/import and basic offline demo succeed.
- [ ] GATE-SAVE, GATE-COMPONENTS, GATE-TYPES and initial GATE-VISUAL; no narrative dependence on an unproven save.
- [ ] T10–T18 review complete; real IDB and browser recovery tested, not only mocked.

## Phase 2 — grading/content infrastructure (M2)

### T19 — Create deterministic MVP relational data

**Description:** Implement the twelve-table baseline schema, specified PRNG and reviewed shared case-identity/mission-delta contract.

**Acceptance criteria:**
- [ ] Same version/seed/case/mission/variant yields stable IDs/timestamps and coherent shared identities.
- [ ] FK/CHECKs, NULL/duplicate/decoy and row-budget invariants hold on ≥5 fixed seeds.
- [ ] Parameterized/escaped generated literals only; no grading/answer lookup table.

**Verification:** PRNG golden vectors, data/FK/timeline/NULL/cardinality fixture tests.  
**Dependencies:** T01(D02),T05.  
**Files likely touched:** `content/datasets/base.sql`, `src/content/seed.ts`, `src/content/case-identities.ts`, `tests/unit/seed.test.ts`, `tests/fixtures/base-data.test.ts`.  
**Estimated scope:** M.

### T20 — Validate mission schemas and season registry

**Description:** Define strict manifest types/schemas and distinguish 80-mission outline from published playable assets.

**Acceptance criteria:**
- [ ] Unknown keys, invalid paths/IDs/concepts/locales/constraint predicates fail with source location; x_* policy explicit.
- [ ] All 80 authoritative mission IDs/arcs exist in season outline, only implemented content enters playable registry.
- [ ] Exact source-to-generated SQL variant naming and required content counts specified.

**Verification:** `rtk proxy npm run validate:content` passes valid miniature pack and rejects malformed examples.  
**Dependencies:** T01(D09),T19.  
**Files likely touched:** `schemas/mission.schema.json`, `src/content/manifest-types.ts`, `tools/validate-content.mjs`, `content/season.json`, `content/concepts.json`.  
**Estimated scope:** M; registry/locales established by separate content packet children.

### T21 — Validate investigation and unlock graphs

**Description:** Implement runtime-independent graph contracts/lints and solvability simulation before case authoring scales.

**Acceptance criteria:**
- [ ] Reject cycles, dangling/contradictory IDs, clue depending on conclusion, impossible taught/mastery/story prerequisites and invalid sawtooth metadata.
- [ ] Three distinct source/reasoning paths reachable; every optional single-clue removal preserves required robustness and approved resolution feasibility.
- [ ] Practice item coverage allows act-critical concepts to reach familiar without seed-variant farming.

**Verification:** Synthetic good/deadlocked/cyclic/duplicate-path graphs; route-to-each-synthesis simulation.  
**Dependencies:** T20,T01(D03,D05–D07).  
**Files likely touched:** `schemas/graph.schema.json`, `src/gameplay/case-graph.ts`, `tools/validate-graphs.mjs`, `tests/unit/graph-validation.test.ts`, `docs/CONTENT_AUTHORING.md`.  
**Estimated scope:** M.

### Checkpoint CP2a — content foundations
- [ ] T19–T21 stable identity/data/schema/graph contracts accepted.
- [ ] Validator failures are meaningful; complete novice progression is demonstrably possible in synthetic cases.

### T22 — Compare PostgreSQL typed results without precision loss

**Description:** Implement row-array normalization and exact multiset/ordered comparators using actual PGlite type parsers.

**Acceptance criteria:**
- [ ] NULL/bool/int/bigint/numeric/date/timestamptz/array/UUID/JSONB values remain lossless; duplicate columns/rows retained.
- [ ] Column-name/type/alias policy follows rubric; JSONB key ordering equivalent, DATE not coerced to UTC timestamp.
- [ ] Ordering enforced only when declared; tie counterexamples and 1,000-row ceiling tested independently of preview.

**Verification:** Property/golden tests plus actual PG parser output fixtures, large numeric and timestamp edge cases.  
**Dependencies:** T06,T19,T20.  
**Files likely touched:** `src/engine/normalize.ts`, `src/engine/compare.ts`, `src/workers/postgres.worker.ts`, `tests/unit/normalize-compare.test.ts`, `tests/fixtures/type-parsers.test.ts`.  
**Estimated scope:** M.

### T23 — Enforce recursive read-only SQL policy

**Description:** Add AST/function/relation allowlisting and tested read-only transaction wrapper for all execution paths, including Run previews.

**Acceptance criteria:**
- [ ] Multi-statement/modifying CTE/nested dangerous function/state mutation/I/O rejected before execution; no generic regex decision.
- [ ] query-only execution with tested transaction/timeout/cleanup; trusted seed exec stays separate.
- [ ] Catalog/series permissions mission-scoped; input/result/payload limits and residual memory risk documented.

**Verification:** Adversarial nested AST/SQL corpus, rollback/timeout tests; no story DB mutation.  
**Dependencies:** T06,T18,T20.  
**Files likely touched:** `src/engine/sql-policy.ts`, `src/engine/read-only-query.ts`, `tests/unit/sql-policy.test.ts`, `tests/fixtures/query-safety.test.ts`, `docs/SECURITY.md`.  
**Estimated scope:** M.

### T24 — Diagnose declared misconceptions deterministically

**Description:** Implement localized SQLSTATE/constraint mapping and prioritized feedback without narrowing general-practice valid SQL.

**Acceptance criteria:**
- [ ] 42601/42703/42803/42P01/42702 plus required grouping/Cartesian/NULL/outer/self-join/order diagnostics covered.
- [ ] Concept-only AST constraints enforced; equivalent general-practice alternatives pass behavior tests.
- [ ] Primary/secondary ordering and blocked→verified ladder have no suspect-name oracle or overlap percentage.

**Verification:** Feedback priority matrix and reviewer-approved fixture expectations; redacted error tests.  
**Dependencies:** T22,T23.  
**Files likely touched:** `src/engine/feedback.ts`, `src/engine/constraints.ts`, `content/locales/en.json`, `tests/unit/feedback.test.ts`, `tests/fixtures/diagnostics.test.ts`.  
**Estimated scope:** M.

### Checkpoint CP2b — safe, faithful query semantics
- [ ] T22–T24 prove lossless comparison, recursive SQL policy and actionable diagnoses on real PG outputs.
- [ ] A valid alternative cannot fail merely because its SQL text differs.

### T25 — Check counterexamples without contaminating the live mission

**Description:** Coordinate current-seed grading, reference cache and serial variant evaluation/restore inside the disposable worker.

**Acceptance criteria:**
- [ ] Run preview differs from Check; Check evaluates ≥2 counterexamples for applicable objectives and rejects overfit query.
- [ ] Reference cache versioned; variants never interleave with live rows; failure/cancel restores or rebuilds same live seed.
- [ ] No grade result can be filed after a session/mission/version change.

**Verification:** Current-pass/variant-fail fixtures, restore-after-error/timeout and concurrent-navigation tests.  
**Dependencies:** T18,T19,T22–T24.  
**Files likely touched:** `src/engine/grader.ts`, `src/engine/counterexamples.ts`, `src/workers/postgres.worker.ts`, `tests/fixtures/counterexamples.test.ts`, `tests/e2e/check-investigation.spec.ts`.  
**Estimated scope:** M.

### T26 — File selected, verified rows atomically

**Description:** Add authored evidence row mappings/provenance, explicit row selection and single transaction completion service.

**Acceptance criteria:**
- [ ] Filing requires valid selected current-result rows; stores query text/hash, row/source refs, seed/variant and content/mission IDs.
- [ ] Mission/evidence/concept/campaign records commit together and emit secured status only after transaction complete.
- [ ] Replay/double-click/two-tab retries cannot duplicate rank/events; notes remain escaped/private.

**Verification:** Rejected/noncurrent row tests, transaction abort, duplicate filing, two-tab and export provenance tests.  
**Dependencies:** T10–T14,T21,T25.  
**Files likely touched:** `src/gameplay/evidence.ts`, `src/components/evidence/tqi-evidence-card.ts`, `src/storage/progress-db.ts`, `tests/unit/evidence.test.ts`, `tests/e2e/evidence-file.spec.ts`.  
**Estimated scope:** M.

### T27 — Prove the four-mission teaching engine

**Description:** Integrate completed probe packets 003/015/021/023 with authoring harness and measurable safety/performance recovery.

**Acceptance criteria:**
- [ ] Each probe has reference + ≥2 independent correct variants + ≥3 wrong fixtures on ≥5 seeds, targeted feedback and evidence filing.
- [ ] Harness reports misconception precision/fairness, rejects known wrongs and has deterministic incident IDs (versions, mission, seed, variant, diagnostic; no automatic SQL upload).
- [ ] Cancellation/memory restore preserves progress and normal checks meet provisional measured budgets or remain explicitly blocked.

**Verification:** `rtk proxy npm run test:fixtures` for all probes; integrated E2E and worker stress checks.  
**Dependencies:** T20–T26, C003-A/B/C, C015-A/B/C, C021-A/B/C, C023-A/B/C.  
**Files likely touched:** `tools/test-fixtures.mjs`, `tests/e2e/probes.spec.ts`, `tests/fixtures/incident-id.test.ts`, `docs/QA.md`.  
**Estimated scope:** M.

### Checkpoint M2 — do not skip
- [ ] Four probes pass end-to-end; GATE-CONTENT, PG/AST/safety/save proofs current.
- [ ] Correct alternate accepted, overfit wrong rejected, actual learner diagnosis reviewed.
- [ ] Human go/no-go before remaining twenty missions. A beautiful name-string checker is not this milestone.

## Mission work packets — all 24 explicit instances

These are real parameterized tasks, not permission to generate 24 finished missions in one batch. Each row below instantiates **three separately checkable tasks**, with the common description/acceptance/verification/files below plus that row's objective and risk. Minimum source file count is handled by splitting each mission across A/B/C; if translations/evidence need extra files, add a child instead of expanding beyond five.

### Packet A — runnable query objective (`Cnnn-A`)

**Description:** Author mission nnn's executable objective, seed profile and rubric, one reference SQL and two independently authored correct alternatives. Declare concept-role constraints only when teaching that exact construct; attach existing approved locale/graph key contracts.

**Acceptance criteria:**
- [ ] Manifest objective/result shape/concepts/visibility/evidence mapping match the inventory row and approved shared case data.
- [ ] Reference + two distinct correct solutions pass ≥5 fixed seeds; strict teaching-role rules are disclosed to player.
- [ ] Fresh seeded predicate/task follow-up after h4 has a stable itemId policy and remains solvable.

**Verification:** Content schema check; focused mission fixture run on five seeds; independently review alternative SQL (trivial whitespace edits are not independence).  
**Dependencies:** T19–T25; previous reviewed narrative/seed contracts. Nonprobe A packets additionally require M2.  
**Files likely touched:** `content/missions/nnn/mission.json`, `reference.sql`, `variants.sql`, `seed.sql`, `tests/fixtures/nnn.test.ts`.  
**Estimated scope:** M, five files. Named variants expanded at build time per T20 contract.

### Packet B — misconception regression (`Cnnn-B`)

**Description:** Author ≥3 wrong SQL files targeted at the mission's known trap; register their IDs/diagnostics in the mission manifest.

**Acceptance criteria:**
- [ ] Three representative wrong queries never receive verified; intended diagnostic or explicitly reviewed better diagnosis appears.
- [ ] Include row/seed counterexample that distinguishes a superficially correct query when applicable; do not force irrelevant advanced traps into beginner missions.
- [ ] Existing valid alternatives still pass; no lowering gold standards to accommodate a flawed wrong query.

**Verification:** Five-seed correct/wrong fixture run; reviewer-approved diagnostic copy and sensitivity report.  
**Dependencies:** Corresponding Cnnn-A, T24,T25.  
**Files likely touched:** `content/missions/nnn/wrong_1.sql`, `wrong_2.sql`, `wrong_3.sql`, `mission.json`, `tests/fixtures/nnn.test.ts`.  
**Estimated scope:** M, five files.

### Packet C — complete investigation experience (`Cnnn-C`)

**Description:** Write briefing/objective/teaching/wrap-up, exactly four free hint rungs and evidence path integration for this mission; publish only after A/B pass.

**Acceptance criteria:**
- [ ] Complete playable loop uses selected query-backed rows, relevant story motive and appropriate novice scaffolding; prose does not leak protected revelations.
- [ ] Four hints support reflection without currency/mandatory delays; h4 gives annotated query plus fresh task variant, not copied-answer proficiency.
- [ ] Locale/graph/registry IDs valid; reload/replay retains draft/evidence and next unlock or synthesis is reachable.

**Verification:** Content+five-seed fixtures; built-app mission walkthrough (keyboard/mobile representative coverage); act integration test and human editorial review.  
**Dependencies:** Corresponding A/B, T26; applicable T28–T31 services for public campaign integration. Probe packets may use development harness until these services land; T32 must reverify them in the real campaign.  
**Files likely touched:** `content/locales/en.json`, `content/graph/actXX.json`, `content/cases/actXX/case.json`, `content/registry.json`, `tests/e2e/mission-nnn.spec.ts`.  
**Estimated scope:** M, five files; shared-file integrator required.

### Explicit mission checklist

| A | B | C | Mission / technical focus | Critical test or narrative property |
|---|---|---|---|---|
| [ ] C001-A | [ ] C001-B | [ ] C001-C | 001 Open intake ledger — SELECT/FROM | Active-incident interpretation made explicit in rubric; beginner can produce a meaningful first result |
| [ ] C002-A | [ ] C002-B | [ ] C002-C | 002 Relevant incident columns — projection/aliases | Required names/order distinguished from allowed alternatives; no arbitrary alias rejection |
| [ ] C003-A | [ ] C003-B | [ ] C003-C | 003 Harbor incidents — WHERE equality **probe** | Missing/incorrect predicate, case-specific harbor decoys; three correct solutions |
| [ ] C004-A | [ ] C004-B | [ ] C004-C | 004 Midnight reports — comparisons/date literal | Boundary date/time and later-date decoys; correct DATE/TIMESTAMPTZ semantics |
| [ ] C005-A | [ ] C005-B | [ ] C005-C | 005 Official/informal descriptions — boolean grouping | AND/OR precedence changes result on counterexample |
| [ ] C006-A | [ ] C006-B | [ ] C006-C | 006 Recurring consignment mark — LIKE/ILIKE | Wildcards/case decoys; ECHO-17 optional for solving case |
| [ ] C007-A | [ ] C007-B | [ ] C007-C | 007 Latest deliveries — ORDER BY/LIMIT | Equal timestamps demand deterministic secondary key |
| [ ] C008-A | [ ] C008-B | [ ] C008-C | 008 Dispatch memo — first synthesis | Two incident facts and approved finale proof policy; no scalar answer bypass |
| [ ] C009-A | [ ] C009-B | [ ] C009-C | 009 Night badge scans — COUNT(*) | Counting scans differs from counting personnel; bigint result |
| [ ] C010-A | [ ] C010-B | [ ] C010-C | 010 Unique badges — COUNT DISTINCT | Duplicate scans force DISTINCT behavior |
| [ ] C011-A | [ ] C011-B | [ ] C011-C | 011 Overtime by employee — GROUP BY/SUM | Numeric precision, wrong grouping key and common-name decoys |
| [ ] C012-A | [ ] C012-B | [ ] C012-C | 012 Scan interval per badge — MIN/MAX | Grouped range not global extrema; impossible interval supported by records |
| [ ] C013-A | [ ] C013-B | [ ] C013-C | 013 Unusually busy badges — HAVING | Aggregate-in-WHERE feedback vs filtering source rows |
| [ ] C014-A | [ ] C014-B | [ ] C014-C | 014 Classify regular/suspect shifts — CASE | Legitimate exceptions and boundary values prevent simplistic accusation |
| [ ] C015-A | [ ] C015-B | [ ] C015-C | 015 Repair grouped projection — grouping **probe** | Actual 42803 and grouped-column checklist, not engine-string regex |
| [ ] C016-A | [ ] C016-B | [ ] C016-C | 016 Wage-timeline synthesis | Three independent sources, forged correction and reachable mastery gate |
| [ ] C017-A | [ ] C017-B | [ ] C017-C | 017 Badge to staff — INNER JOIN | Wrong key/missing join changes rows; cloned badge reasoning |
| [ ] C018-A | [ ] C018-B | [ ] C018-C | 018 Staff to assigned vehicle — second join | Assignment is not proof of actual driving; valid temporal assignments |
| [ ] C019-A | [ ] C019-B | [ ] C019-C | 019 Gate/vehicle/dispatch — three-way joins | Missing predicate yields Cartesian combinations; source row provenance |
| [ ] C020-A | [ ] C020-B | [ ] C020-C | 020 Ambiguous ID — qualified aliases | Deliberately produces real 42702 with reviewed dataset/column naming, no accidental schema-inventory drift |
| [ ] C021-A | [ ] C021-B | [ ] C021-C | 021 Staff sharing supervisor — self-join **probe** | Two logical roles, exclude self-pairs, define symmetric-pair policy; single-role fails counterexample |
| [ ] C022-A | [ ] C022-B | [ ] C022-C | 022 Retain employees without scans — LEFT JOIN | Missing records remain; potential rest after self-join spike |
| [ ] C023-A | [ ] C023-B | [ ] C023-C | 023 Never scanned — LEFT JOIN/IS NULL **probe** | =NULL, inner join and right-filter-in-WHERE wrongs; canonical evidence ID |
| [ ] C024-A | [ ] C024-B | [ ] C024-C | 024 Alibi capstone | Three independently sourced systems, guard cleared, correct alternatives accepted without forced LEFT JOIN |

**Per-act content checkpoint:** After each completed A/B/C trio, its focused validation passes; after every two completed missions, run the act regression. After 008/016/024, review complete act route, independent clue paths, sawtooth shape, hints/interludes and next unlock. Probe packets are authored first, not a public skip mechanism.

## Phase 3 — playable campaign and production content

### T28 — Compute unlocks without deadlock

**Description:** Implement taught-concept/story gates, first-16 spine, later spokes and synthesis eligibility from validated data.

**Acceptance criteria:**
- [ ] Locked route explains missing prerequisite; completing/replaying cannot bypass evidence or fabricate taught concepts.
- [ ] One primary novice next task in A1/A2; A3 reviewed spokes available appropriately.
- [ ] Full novice simulation reaches 024, including practice paths for familiar gates.

**Verification:** Pure unlock scenarios, synthesized full-route tests and built-app gate E2E.  
**Dependencies:** T21,T26,M2.  
**Files likely touched:** `src/gameplay/unlock.ts`, `src/gameplay/campaign.ts`, `src/app/selectors.ts`, `tests/unit/unlock.test.ts`, `tests/e2e/unlocks.spec.ts`.  
**Estimated scope:** M.

### T29 — Derive mastery and non-grindable rank

**Description:** Implement pure event-based skill reducer and solved-ID-only rank calculation.

**Acceptance criteria:**
- [ ] Thresholds follow spec (distinct items, ≥3 for familiar, cross-case/packs proficiency, mixed-only mastery/demotion).
- [ ] Same item/seed variants, replay and copied h4 answers cannot inflate proficiency/rank; rank never gates content.
- [ ] Two wrong mixed items demote at most one state, never below attempted; no clock decay.

**Verification:** State transition table/property tests, event replay/reordering/idempotence, save round-trip recomputation.  
**Dependencies:** T10,T21,T28.  
**Files likely touched:** `src/gameplay/mastery.ts`, `src/gameplay/rank.ts`, `tests/unit/mastery.test.ts`, `tests/unit/rank.test.ts`, `docs/ARCHITECTURE.md`.  
**Estimated scope:** M.

### T30 — Present caseboard and reversible deductions

**Description:** Build accessible evidence casebook/links, notes and aggregate theory slots backed by domain proof rules.

**Acceptance criteria:**
- [ ] Keyboard selection/linking and editable escaped notes; query/row/source provenance inspectable.
- [ ] Resolution follows declared independent-path policy; no single-name guess or isolated-claim oracle.
- [ ] Authored wrong inference opens remedial comparison without false mastery or irreversible progress loss.

**Verification:** Case theory good/incomplete/wrong-route E2E, focus/a11y and note export tests.  
**Dependencies:** T21,T26,T28,T29.  
**Files likely touched:** `src/components/evidence/tqi-evidence-board.ts`, `src/components/game/tqi-casebook.ts`, `src/gameplay/case-theory.ts`, `tests/unit/case-theory.test.ts`, `tests/e2e/casebook.spec.ts`.  
**Estimated scope:** M.

### Checkpoint CP3a — gameplay correctness
- [ ] T28–T30 work with probes and synthetic act graphs; data rules remain outside views.
- [ ] Human approval of novice route, familiar gate item coverage and wrong-deduction flow.

### T31 — Offer non-punitive Cold Case practice

**Description:** Add attempted-concept practice/replays and fresh h4 follow-up behavior integrated with history/mastery.

**Acceptance criteria:**
- [ ] Only attempted concepts offered; practice has stable distinct item IDs and does not award story evidence/repeat XP.
- [ ] Three bottom-out pattern offers optional remediation, no enforced delay/denial/penalty.
- [ ] Follow-up changes task predicate and seed with honest story-vs-proficiency treatment.

**Verification:** Practice/hint/replay E2E and item/event accounting regression.  
**Dependencies:** T17,T28–T30.  
**Files likely touched:** `src/components/game/tqi-practice.ts`, `src/gameplay/practice.ts`, `content/practice/mvp-items.json`, `tests/unit/practice.test.ts`, `tests/e2e/practice.spec.ts`.  
**Estimated scope:** M; split practice bank by act if authoring review exceeds one session.

### T32 — Integrate all three completed acts

**Description:** Revalidate every C packet in actual public campaign order and enforce the production content ledger.

**Acceptance criteria:**
- [ ] Exactly 24 complete playable missions; ≥24 references + ≥48 independent variants + ≥72 wrong fixtures, 96 hint rungs, six interludes and three summaries.
- [ ] All act conclusions have three reviewed independent proof routes and coherent local resolution; 024 clears guard and points to city office.
- [ ] Locale service updates document lang and live UI strings; English complete, no placeholder Indonesian masquerading as translation.

**Verification:** Full content/five-seed fixture run; new campaign 001→024 E2E, all act branches and export/resume.  
**Dependencies:** T28–T31; every C001–C024 packet A/B/C.  
**Files likely touched:** `src/i18n/i18n.ts`, `tests/e2e/campaign.spec.ts`, `tools/validate-content.mjs`, `docs/CONTENT_AUTHORING.md`, `docs/QA.md`.  
**Estimated scope:** M; content defects return to their own C packets, not swept into this task.

### T33 — Download complete version-pinned offline acts

**Description:** Implement validated staging/release manifest and per-act offline artifact sets, not blanket cache-ready claims.

**Acceptance criteria:**
- [ ] Correct build order/content URLs and final release hashes; no self-referential hash or missing staged asset.
- [ ] Shell/first-act metadata only precached; PG/parser/optional snapshot/selected act explicitly downloaded and verified.
- [ ] Ready flag only after full set; interruption/quota/corrupt asset gives retry without deleting progress.

**Verification:** Dist URL/hash checks, interrupted-pack tests, each MVP act disconnected completion.  
**Dependencies:** T09,T20,T32.  
**Files likely touched:** `tools/build-content.mjs`, `tools/verify-dist.mjs`, `src/content/loader.ts`, `src/app/offline-packs.ts`, `tests/e2e/offline-packs.spec.ts`.  
**Estimated scope:** M.

### Checkpoint CP3b — content/offline integrity
- [ ] T31–T33 full content ledger and offline coverage independently verified.
- [ ] Offline status names exact available acts; no raw query/notes in Cache API.

### T34 — Preserve active cases across updates

**Description:** Harden release cache retention, explicit update activation and persistence/export safety UI.

**Acceptance criteria:**
- [ ] Save flush/commit before approved activation; no forced reload, version mismatch or premature old-cache deletion.
- [ ] Old page/new SW/two-tab releases coexist until safe retirement; failed new boot preserves last-known-good assets.
- [ ] User gesture persist result and export reminder truthful; no promise against Safari eviction.

**Verification:** Two-release/two-tab update, declined-update, crash/missing binary and storage-quota rehearsals.  
**Dependencies:** T12–T14,T33.  
**Files likely touched:** `src/sw.ts`, `src/app/update-controller.ts`, `src/components/game/tqi-storage-settings.ts`, `tests/e2e/update-safety.spec.ts`, `docs/STORAGE.md`.  
**Estimated scope:** M.

### T35 — Keep diagnostic events local and exports redacted

**Description:** Provide local-only counts and an explicit user-readable diagnostic export without analytics transmission.

**Acceptance criteria:**
- [ ] Aggregate mission/concept/SQLSTATE/diagnostic/outcome/hint/repair counts remain on device by default.
- [ ] Export preview excludes raw SQL, notes and identifying seed/query data unless a separately disclosed explicit choice requires it.
- [ ] Runtime network assertion rejects tracker/CDN/telemetry requests; feedback link does not attach queries automatically.

**Verification:** Redaction fixtures and browser network audit under play/hints/export/update flows.  
**Dependencies:** T24,T29,T32.  
**Files likely touched:** `src/analytics/local-events.ts`, `src/storage/diagnostic-export.ts`, `tests/unit/diagnostic-export.test.ts`, `tests/e2e/privacy.spec.ts`, `docs/PRIVACY.md`.  
**Estimated scope:** M.

### T36 — Audit keyboard, reflow and visual states

**Description:** Complete desktop/360px/theme visual and automated accessibility coverage on finished campaign surfaces.

**Acceptance criteria:**
- [ ] No hidden Run/focus, page-level overflow, color-only state, drag-only evidence or mandatory motion/timer.
- [ ] 200%/400% zoom and 320–360px reflow; principal controls target 44px with WCAG exceptions documented.
- [ ] All loading/error/partial/verified/offline/update and fallback states have reviewed baselines, no blind snapshot acceptance.

**Verification:** `rtk proxy npm run test:visual`; `rtk proxy npm run test:a11y`; keyboard-only act flows and contrast report.  
**Dependencies:** T32–T35.  
**Files likely touched:** `tests/visual/workspace.spec.ts`, `tests/a11y/campaign.spec.ts`, `tests/e2e/keyboard.spec.ts`, `docs/DESIGN_SYSTEM.md`, `docs/QA.md`.  
**Estimated scope:** M; fixes stay in small component-specific child tasks.

### Checkpoint CP3c — update/privacy/UI
- [ ] T34–T36 save/update/network/a11y automation current on built dist.
- [ ] No known privacy or progress-loss blocker allowed into beta candidate.

### T37 — Verify actual devices and assistive technology

**Description:** Audit real Chrome/Edge Windows+Android, Firefox Windows, Safari macOS+iOS and required AT.

**Acceptance criteria:**
- [ ] NVDA/VoiceOver/TalkBack test editor, fallback, Shadow DOM labels/status/focus and evidence selection.
- [ ] Low-end ~4GB Android and iOS keyboard/layout/recovery tested; ≥95% successful boot on documented matrix.
- [ ] Unsupported combinations get readable compatibility/recovery notice; no Playwright-WebKit-as-iOS claim.

**Verification:** Manual device matrix with versions, steps, outcomes and retest records; blocking AA defects resolved.  
**Dependencies:** T36.  
**Files likely touched:** `docs/QA.md`, `docs/DESIGN_SYSTEM.md`.  
**Estimated scope:** S; bug fixes become separate code tasks. **External dependency:** actual devices/AT access.

### T38 — Run silent act playtests

**Description:** Observe 5–7 participants per act without coaching, including true beginners and mobile/keyboard/AT coverage.

**Acceptance criteria:**
- [ ] Record missed clues, interpretation errors, hint usage and complexity cliffs without asserting unsupported learning effect sizes.
- [ ] Three independent routes are genuinely discoverable, motif never prerequisite to early case, each act locally resolves.
- [ ] Every rejected valid alternative becomes accepted fixture or justified concept-specific rejection; content revisions retested.

**Verification:** Consent-aware anonymized observation reports, human act sign-off and new regression fixtures.  
**Dependencies:** T32,T37.  
**Files likely touched:** `docs/playtests/act01.md`, `docs/playtests/act02.md`, `docs/playtests/act03.md`, `docs/QA.md`.  
**Estimated scope:** M across separate observation sessions; content fixes return to named C packets. **External dependency:** recruiting.

### T39 — Measure finished-campaign performance

**Description:** Repeat realistic startup/check/save/worker-memory measurements after content/UI/PWA costs are present.

**Acceptance criteria:**
- [ ] Spec P75/P95/long-task budgets recorded on desktop and low-end mobile, actual wire bytes/peak memory included.
- [ ] Counterexample checks, 200-row preview, large-cell/row stress and worker recovery do not cause unbounded UI work.
- [ ] Missed provisional targets remain blockers or human-approved measured deviations with mitigation, not deleted metrics.

**Verification:** Reproducible built-release benchmark with sample counts/device/network conditions.  
**Dependencies:** T34,T36–T38.  
**Files likely touched:** `tests/smoke/performance.spec.ts`, `docs/QA.md`, `docs/ARCHITECTURE.md`.  
**Estimated scope:** M; optimization changes require separate measured slices.

### Checkpoint MVP candidate
- [ ] T37–T39 manual audit/playtest/performance evidence attached; all 24 missions playable with preserved saves.
- [ ] No known blocking AA/save/grading/plot defect. Public beta awaits actual-host release rehearsal.

## Phase 4 — static deployment and public beta (M3)

### T40 — Publish contributor and player contracts

**Description:** Document setup, authoring, architecture, security/privacy and attribution with truthful MVP feature claims.

**Acceptance criteria:**
- [ ] README/authoring instructions reproduce setup, all script names and mission contribution/acceptance flow.
- [ ] Local-only progress/export warning and licensing/attribution visible; no copied competitor story assets.
- [ ] AGENTS enforces RTK/graph-first navigation and spec boundaries; docs don't claim unavailable translations/advanced acts.

**Verification:** Clean-checkout documentation walkthrough; link/path review; license inventory.  
**Dependencies:** T32,T35,T39.  
**Files likely touched:** `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/CONTENT_AUTHORING.md`, `docs/THIRD_PARTY.md`.  
**Estimated scope:** M; privacy/architecture/security docs already maintained by owning tasks.

### T41 — Verify Ubuntu VPS / Nginx readiness

**Description:** Integrate V01–V07 below against [the detailed VPS plan](vps-deployment.md). Hosting selection is approved; actual server access/changes and public release still require operational authorization.

**Acceptance criteria:**
- [ ] V01–V07 evidence proves actual-domain HTTPS, MIME/CSP/cache/compression, hash routes and safe static serving without disrupting existing sites.
- [ ] Atomic releases retain old clients' immutable dependencies; compatibility-aware rollback and certificate renewal rehearsed.
- [ ] Only verified dist artifacts deployed; no Node/PG/API service, private files or third-party runtime network dependency.

**Verification:** Review V01–V07 reports; actual-domain private-window/mobile boot, install/offline, update and rollback checks.  
**Dependencies:** T33,T34,T40,V01–V07; owner supplies VPS/DNS access and authorizes live work.  
**Files likely touched:** `docs/DEPLOYMENT.md`, `tests/smoke/deployed.spec.ts`, `docs/releases/mvp-checklist.md`.  
**Estimated scope:** M for integration; infrastructure changes are separate V tasks, not hidden within T41.

### V01 — Inventory the VPS and approve operational access

**Description:** Establish the real Ubuntu/Nginx/DNS/firewall environment and least-privilege deployment ownership without changing live services.

**Acceptance criteria:**
- [ ] Ubuntu/package versions, existing sites/certificates, disk/RAM, SSH/recovery path and effective configuration reviewed securely.
- [ ] Owner supplies VPS/address/domain permissions, ACME contact and explicit scope for live package/config/DNS/firewall actions.
- [ ] A/AAAA/CAA, TCP 80/443 and current SSH rules validated; unsupported IPv6 or conflicting proxy identified before edits.

**Verification:** Read-only inventory/owner sign-off; no secret-bearing output in reports; verify unrelated site baseline responses.  
**Dependencies:** T01; live read-only SSH inspection only when authorized.  
**Files likely touched:** `docs/DEPLOYMENT.md`, `docs/QA.md`.  
**Estimated scope:** S. **External dependency:** VPS/access details, not yet supplied.

### V02 — Define the isolated Nginx static virtual host

**Description:** Implement reviewed domain-specific configuration and MIME/cache/security routing on an authorized test host; preserve other vhosts.

**Acceptance criteria:**
- [ ] Hash routes need no catch-all SPA fallback; absent JS/WASM/JSON/API returns real noncacheable errors, no HTML masquerading as binary.
- [ ] Header matrix preserves CSP/nosniff/referrer/frame policy on child locations/errors; immutable paths successful responses only, stable entrypoints revalidate.
- [ ] www-data read-only, public roots free of private files/listings, gzip/MIME correct; no assumed Brotli/new Nginx syntax or Node reverse proxy.

**Verification:** nginx -t plus HTTP GET/HEAD/304/404/header/compression/path tests; initial HTTP-only bootstrap validated before certificates exist. HTTPS-specific assertions completed in V03.  
**Dependencies:** V01,T03,T05,T06; explicit config/package authorization.  
**Files likely touched:** `deploy/nginx/the-quiet-index.conf`, `deploy/nginx/tqi-security-headers.conf`, `tests/deployment/nginx-headers.test.mjs`, `docs/DEPLOYMENT.md`.  
**Estimated scope:** M; test actual Lit/editor CSP when T07 is available; no successful syntax test substitutes for browser proof.

### V03 — Bootstrap HTTPS and unattended certificate renewal

**Description:** Use approved Certbot webroot HTTP-01 flow without stopping unrelated sites; enable TLS only after certificate issuance.

**Acceptance criteria:**
- [ ] DNS and HTTP challenge reachable on every advertised address; valid canonical-domain certificate, TLS and redirect with challenge exception.
- [ ] Existing Certbot installation respected; renewal timer, dry-run and successful-renewal nginx-test/reload hook each verified.
- [ ] Private keys root-controlled; staged HSTS has no unapproved includeSubDomains/preload or broad host-wide change.

**Verification:** Real certificate chain/hostname check, `certbot renew --dry-run`, separate deploy-hook execution test, canonical HTTPS worker/WASM boot and unrelated-site regression.  
**Dependencies:** V02,T09; explicit certificate/terms/DNS/firewall authorization. Can support M0 staging proof before complete campaign exists.  
**Files likely touched:** `deploy/nginx/the-quiet-index.conf`, `deploy/certbot/renewal-deploy-hook.sh`, `tests/deployment/tls.test.mjs`, `docs/DEPLOYMENT.md`.  
**Estimated scope:** M.

### Checkpoint CP-VPSa — secure static origin
- [ ] V01–V03 authorized and verified; SSH/other sites unaffected; TLS renewal independently tested.
- [ ] No current application/manual-device gate marked complete merely because HTTPS responds.

### V04 — Package versioned assets for atomic releases

**Description:** Extend content/release packaging with pinned content paths and additive shared asset continuity; never mutate an existing immutable URL.

**Acceptance criteria:**
- [ ] Verified dist archive/manifest/checksums and constrained release ID; no source/secrets/node_modules/source maps by default, safe archive entries.
- [ ] `/assets/<hash>` and `/content/releases/<id>/` resolve through additive shared paths; same-URL/different-digest aborts; old page retains its version mapping.
- [ ] Release metadata/checksum finalization and offline pack URLs consistent; retained dependencies remain reachable after current changes.

**Verification:** Two-artifact packaging/hash/path tests; paused old client loads previously uncached old chunk/mission after new promotion.  
**Dependencies:** V02,V03,T33,T34.  
**Files likely touched:** `tools/package-release.mjs`, `tools/build-content.mjs`, `tools/verify-dist.mjs`, `tests/deployment/release-artifacts.test.mjs`, `docs/DEPLOYMENT.md`.  
**Estimated scope:** M; loader/SW changes, if required, split into a named child rather than exceeding file budget.

### V05 — Promote and roll back releases safely

**Description:** Implement narrow SSH upload/validation/activation tooling using staging directories, deployment lock and same-filesystem atomic symlink replacement.

**Acceptance criteria:**
- [ ] Verify uploaded checksums/archive entries/disk permissions, publish immutable assets first; never rsync-delete shared or modify active root in place.
- [ ] Concurrent deployment rejected/serialized; promotion/smoke failure restores prior compatible target without deleting assets or clearing browser storage.
- [ ] N→N+1→rollback rehearsed with two tabs/SW/offline; unsupported newer saves preserved/exportable, not destructively downgraded.

**Verification:** Failure injection before/after activation, duplicate deploy/collision tests, actual-domain smoke and saved-campaign rollback rehearsal; config changes require nginx -t before graceful reload.  
**Dependencies:** V04,T39,T40.  
**Files likely touched:** `tools/deploy-vps.sh`, `tools/rollback-vps.sh`, `tests/deployment/release-switch.test.mjs`, `tests/e2e/vps-rollback.spec.ts`, `docs/DEPLOYMENT.md`.  
**Estimated scope:** M. Scripts use approved host aliases/keys, not committed credentials or unrestricted sudo.

### V06 — Define operations, retention and disaster recovery

**Description:** Document and test maintenance ownership, health/expiry/disk monitoring, safe asset retention and restore of the static origin.

**Acceptance criteria:**
- [ ] Certificate expiry/timer/Nginx/disk/asset-404 monitoring and minimal rotated logs have owner-approved retention/privacy policy; no query/notes collection.
- [ ] Keep current/previous dependency closures and proposed ≥3 releases/30-day asset window unless explicitly revised for capacity; cleanup serialized and never assumes all old clients gone.
- [ ] Protected config/artifact backups restore same HTTPS origin; server backups explicitly do not recover unexported IndexedDB saves.

**Verification:** Restore walkthrough/test host, pruning dry-run protecting referenced assets, expiry/renewal alert tests; no unapproved host-wide updates/reboots.  
**Dependencies:** V03,V05.  
**Files likely touched:** `tools/prune-vps-releases.sh`, `tests/deployment/retention.test.mjs`, `docs/DEPLOYMENT.md`, `docs/PRIVACY.md`.  
**Estimated scope:** M; actual monitoring integration chosen with operator, not speculative infrastructure additions.

### V07 — Accept the actual VPS delivery boundary

**Description:** Run the full VPS acceptance matrix at sql.thetirtayasa.my.id, combining infrastructure and completed-browser behaviors.

**Acceptance criteria:**
- [ ] DNS/TLS/MIME/cache/security/compression/error matrix passes on the installed Nginx version and canonical domain.
- [ ] PG/parser/editor, old-asset continuity, download/offline, declined/accepted update, two tabs and rollback retain progress.
- [ ] Other sites/SSH unaffected; permission/backup/renewal evidence and remaining operational limitations recorded truthfully.

**Verification:** Real-domain tests in clean desktop/mobile browsers, header/hash tests, GATE-DEPLOY/OFFLINE/SAVE evidence attached; M0 demo evidence alone insufficient.  
**Dependencies:** V05,V06,T37,T38,T39.  
**Files likely touched:** `tests/smoke/deployed.spec.ts`, `tests/e2e/deployed-pwa.spec.ts`, `docs/QA.md`, `docs/releases/mvp-checklist.md`.  
**Estimated scope:** M.

### Checkpoint CP-VPSb — releasable static infrastructure
- [ ] V04–V07 additive assets, atomic activation, save-compatible rollback and operations accepted.
- [ ] T41 integration may close; T42 still rehearses the exact candidate artifact, T43 still requires public-release authorization.

### T42 — Rehearse the exact release artifact

**Description:** Freeze content version and validate production hashes, all fixtures and save/cache migration on exact staged dist.

**Acceptance criteria:**
- [ ] npm ci → vendor/content/unit/fixture/type/lint/format/build/smoke/E2E/visual/a11y suite passes; 24×≥5 seed fixture matrix complete.
- [ ] Old→new update, crash, two tabs, corruption recovery, export/import, reset/replay and cached-act play retain 100% accepted records.
- [ ] Release report enumerates all spec gates and manual evidence; no unreviewed snapshot/asset changes.

**Verification:** Full CI plus deployed-domain two-release rehearsal; artifact hashes match deployed bytes.  
**Dependencies:** T37–T41.  
**Files likely touched:** `.github/workflows/ci.yml`, `tests/e2e/release.spec.ts`, `docs/QA.md`, `docs/releases/mvp-checklist.md`.  
**Estimated scope:** M.

### T43 — Authorize and publish public beta

**Description:** Obtain final release sign-off, publish approved static artifacts and supply a non-uploading feedback route.

**Acceptance criteria:**
- [ ] All gates approved; measured deviations/manual limitations explicitly disclosed, no false fully-advanced claim.
- [ ] One URL supports class handout without accounts; offline/save/export hints discoverable.
- [ ] Rollback plan retains player save compatibility and last-good release; no telemetry enabled by release.

**Verification:** Human release authorization, public-domain smoke/continue/import/offline check, documented rollback rehearsal.  
**Dependencies:** T42.  
**Files likely touched:** `docs/releases/mvp-checklist.md`, `docs/DEPLOYMENT.md`, `README.md`.  
**Estimated scope:** M. **No deployment authorized by this planning request.**

### Checkpoint M3 — public MVP
- [ ] GATE-DEPLOY/OFFLINE/A11Y/PERF/SAVE and all other mandated gates passed with evidence.
- [ ] M3 release is 24-mission public beta; only now begin later acts after separate approval.

## Post-MVP — explicit gated work queue

These work packages are **not single implementation tasks**: each must first be expanded into ≤5-file technical children and per-mission A/B/C instances. Do not mark a package complete from its design alone. All use the same global DoD, content ledger/seed/plot tests, real-device gates and preservation of previous saves. The plan's §8 defines act-specific risks and table groups.

| ID / status | Description and dependencies | Acceptance criteria | Verification / likely files |
|---|---|---|---|
| [ ] A4-PLAN | Review act04 migration/data/graph; depends M3 | Exact DDL/FKs/CHECKs/indexes and eight mission contracts approved; bounded series/NULL tests defined; small tasks written before code | Human review + synthetic solvability; `docs/acts/act04.md`, tasks children |
| [ ] A4-BUILD | Instantiate C025–C032 A/B/C; depends A4-PLAN | Eight complete missions and 3-path finale; NULL/NOT IN counterexamples; MVP saves remain solved | Five-seed fixtures, act E2E, 5–7 silent playtests; act04 content/tests/schema migration children |
| [ ] A5-PLAN | Review finance grain/cardinality contracts; depends A4-BUILD | Exact one-to-many DDL/data and eight objectives approved; duplicate-count traps specified; children sized | Human review + graph/grain examples; `docs/acts/act05.md`, tasks children |
| [ ] A5-BUILD | Instantiate C033–C040 A/B/C; depends A5-PLAN | Complete beneficiary case; grouping-over-join/FILTER/correct grain; old saves preserved | Five-seed/alternative/wrong/act/offline/playtests; act05 content/tests/migration children |
| [ ] A6-PLAN | Review property/eviction/CTE/set data contracts; depends A5-BUILD | Exact keys, temporal cardinalities and CTE/set semantics approved; children sized | Human review + denominator examples; `docs/acts/act06.md`, tasks children |
| [ ] A6-BUILD | Instantiate C041–C048 A/B/C; depends A6-PLAN | Complete displacement map; CTE scope, correlated/LATERAL alternatives and set multiplicity fair | Five-seed/act/offline/playtests/save regression; act06 content/tests/migration children |
| [ ] A7-PLAN | Review timezone/forgery/regex contracts; depends A6-BUILD | Exact timestamp vs date semantics and JSONB introduction placement approved; children sized | Human review + chronology counterexamples; `docs/acts/act07.md`, tasks children |
| [ ] A7-BUILD | Instantiate C049–C056 A/B/C; depends A7-PLAN | Complete chronology case, true TZ handling, no local-date coercion; 56 total missions | Five-seed/cross-timezone/act/offline/playtests/save regression; act07 content/tests/migration children |
| [ ] L01 | Translate full published content en/id; depends stable T32 keys, A7-BUILD | Native-reviewed UI/story/hints/diagnostics; exact key parity, document lang, invariant SQL; no missing locale branches | Key validation, locale-switch E2E/visual/AT; locales/i18n/tests children ≤5 files each |
| [ ] M4 | Review intermediate release; depends A4–A7-BUILD,L01 | 56 missions complete with preserved MVP evidence and all gates current | Full fixture/old-save import/offline/domain reports |
| [ ] A8-PLAN | Review versions/windows/JSONB contracts; depends M4 | Frame/tie/version identity and exact DDL reviewed; children sized | Human review + window fixtures; `docs/acts/act08.md`, tasks children |
| [ ] A8-BUILD | Instantiate C057–C064 A/B/C; depends A8-PLAN | Complete tampering chain, frames/partition/latest-version/JSONB behavior correct | Five-seed/act/offline/playtests/save regression; act08 content/tests/migration children |
| [ ] A9-PLAN | Review command hierarchy/temporal authority; depends A8-BUILD | Cycle/series bounds, keys and reconciliation routes approved; children sized | Human review + cycle/authority fixtures; `docs/acts/act09.md`, tasks children |
| [ ] A9-BUILD | Instantiate C065–C072 A/B/C; depends A9-PLAN | Complete shutdown proof; bounded recursion/cycle avoidance, rollups/grouping sets correctly taught | Five-seed/resource/act/offline/playtests/save regression; act09 content/tests/migration children |
| [ ] A10-PLAN | Review plans/lab/cross-case/finale contracts; depends A9-BUILD | Three factual claims, truthful aggregate feedback, endings and exact tables approved; children sized | Human review + who/how/why graph and D12 decision; `docs/acts/act10.md`, tasks children |
| [ ] A10-LAB | Separate disposable writable practice; depends A10-PLAN | Narrow authored table/statement allowlists; index/DML/transaction postconditions+rollback; story/save untouched | Adversarial lab/reset/EXPLAIN ANALYZE tests; lab engine/protocol/tests children |
| [ ] A10-BUILD | Instantiate C073–C080 A/B/C; depends A10-LAB | Plans taught without universal timing claims; query/rows/hypothesis finale and all three outcomes; print dossier with provenance | Five-seed/full-80/ending/offline/playtest/old-save regression; act10 content/print/tests children |
| [ ] M5 | Review v1.0; depends A10-BUILD | All 80 missions/gates/endings and v0.1 compatibility; no roof-of-complexity blocker | Full season human/automated/device/domain release report |
| [ ] P01 | Assessment/pilot design; mixed mastery UI and optional placement/review subplans; depends M3, advanced bank after M5 | Deterministic genuine distinct item bank; opt-in 3×2 mastery and separate matched 20-item A/B pre/post; explicit consent/export/redaction | Mastery/assessment/locale/save tests and reviewed study protocol; assessment modules/content/tests/docs children |
| [ ] P02 | Two evidence-backed improvement cycles; depends P01 and M5 | Sample/baseline/device/attrition/CI reported; recurring mistakes become fixtures/hint revisions; no XP=learning inference | Consented local exports, analysis report, re-run fairness/diagnostic regressions; no hidden upload |

### Final review before implementation
- [ ] Every executable task has acceptance, verification, dependencies and file/scope bounds.
- [x] Project owner approved all D01–D13 dispositions; accepted approaches recorded in plan.md (feasibility/implementation gates remain open).
- [ ] Four probes precede remaining twenty; no all-80 implementation shortcut.
- [ ] Ubuntu VPS/Nginx access details and device/AT/playtest owners identified; no unverifiable public claims.
- [x] Project owner approved the full implementation and deployment plan; commit and push this baseline before starting application implementation. Live VPS changes still require operational access and authorization.

# CP1a — local durability (T10–T12)

## Authorization and limits

The owner explicitly requested Phase 1 through CP1a using TDD, with **no staging, commit, push or deployment until separately requested**. Base `201ed3e`; its hosted [quality/browser run passed](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42190341112). This authorizes T10–T12 development, not an inferred M0 real-device/AT/HTTPS pass or T13/M1 expansion. Initdb remains the provisional engine default. Original specifications, LICENSE, dependency pins and historical Graphify outputs stay unchanged.

## Owner approval and Git delivery

The owner subsequently **approved the CP1a changes and explicitly requested a one-line commit, push and successful remote CI monitoring**. This authorizes staging/commit/push and necessary CI repair, not deployment, T13 or inferred device/AT/HTTPS acceptance.

Predeclared documentation-only delivery children (at most five files each): **Git-A** this review, AGENTS.md, README.md, tasks/plan.md, tasks/todo.md; **Git-B** this review, docs/ARCHITECTURE.md, docs/QA.md, tasks/owner-actions.md. Reconcile current approval wording without changing runtime acceptance contracts. The initial handoff evidence below remains historical; hosted outcome must be checked against the actual pushed commit.

## Plan / verification

1. Native schema/lifecycle and atomic identity → real built-browser abort/reopen/blocked/versionchange tests.
2. Transactional drafts/events and tiny settings → pure ordering tests, real two-connection races, hidden flush and blocked settings tests.
3. Copy-only migrations and recovery → pure preservation/crash tests and native transaction/future/quota/eviction tests.
4. Minimal separate storage review desk (not T15 workspace) → production-build journeys, keyboard/reflow/axe and reviewed 360/1280 screenshots. Full existing relevant regression suite; leave changes uncommitted.

## Predeclared children (at most five files each)

| Slice                     | Actual files                                                                                                                                   | RED / verification                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Scope                     | this file; AGENTS.md; tasks/plan.md; tasks/todo.md                                                                                             | documentation / new authorization, no fabricated M0 acceptance          |
| T10-A contracts           | src/types/save.ts; src/storage/schema.ts; tests/unit/save-schema.test.ts                                                                       | exact stores, compound indexes, seed bounds                             |
| T10-B native transactions | src/storage/progress-db.ts; tests/e2e/storage-create.spec.ts; tests/fixtures/storage-browser.ts; tools/build-storage-fixture.mjs; package.json | first native fixture fails; atomic abort/reopen, lifecycle              |
| Test fixture integration  | .github/workflows/ci.yml; playwright.config.ts                                                                                                 | explicit storage suite, no skipped tests or shipped fixture hooks       |
| T11-A settings/order      | src/storage/local.ts; src/storage/draft-policy.ts; tests/unit/local.test.ts; tests/unit/draft-policy.test.ts                                   | invalid/blocked settings, deterministic timestamp/tie policy            |
| T11-B transactional merge | src/storage/progress-db.ts; tests/e2e/storage-drafts.spec.ts; tests/fixtures/storage-browser.ts                                                | delayed old draft cannot erase solved/events; two connections           |
| T11-C flush               | src/app/draft-controller.ts; tests/unit/draft-controller.test.ts                                                                               | 500ms, hidden flush, overlapping edit, failed-write retention           |
| T12-A migration           | src/storage/migrations.ts; tests/unit/migrations.test.ts; src/types/save.ts                                                                    | pure sequential copies, stable IDs, archived legacy references          |
| T12-B native recovery     | src/storage/progress-db.ts; tests/e2e/storage-recovery.spec.ts; tests/fixtures/storage-browser.ts                                              | atomic backup/rollback, future preservation, abort/quota pause          |
| T12-C orchestration       | src/app/storage-controller.ts; tests/unit/storage-controller.test.ts; src/storage/local.ts                                                     | pointer loss states, no automatic campaign creation, recovery snapshot  |
| Desk shell                | storage.html; src/storage.ts; vite.config.ts                                                                                                   | built entry, no runtime test hooks, no engine/cache reset               |
| Desk view                 | src/components/storage/tqi-storage-desk.ts; src/app/storage-copy.ts; src/styles/storage.css; tests/e2e/storage-ui.spec.ts                      | actual create/reload/draft/settings/recovery; no pretend import/grading |
| Desk accessibility        | tests/e2e/storage-a11y.spec.ts; docs/DESIGN_SYSTEM.md                                                                                          | keyboard/reflow/axe, no claims about unrun AT                           |
| Desk visual               | tests/e2e/storage-visual.spec.ts; four storage dark/light 360/1280 PNGs                                                                        | inspect before accepting, previous baselines unchanged                  |
| Documentation A           | docs/STORAGE.md; docs/ARCHITECTURE.md; docs/QA.md; README.md; this file                                                                        | precise contracts and actually executed evidence                        |
| Documentation B           | AGENTS.md; tasks/plan.md; tasks/todo.md; tasks/owner-actions.md; this file                                                                     | acceptance ledger and stop for owner review                             |

## Design boundaries to freeze before implementation

- Native database `tqi-progress-v1`, schema version 1, nine spec stores; indexes include campaign ID before mission/case/node/concept/item/timestamp so campaign-scoped reads cannot mingle records.
- Campaign seed is cryptographic lowercase 16-hex; identity+seed persist together. Success means transaction **complete**, never request success. No production clear/delete/reset operation.
- Draft order: ISO UTC timestamp, then stable per-tab ID, then per-tab monotonic revision. Timestamp is conflict policy, not trusted security time. Read latest campaign/mission/events in the writing transaction; patch drafts only and dedupe append-only events by ID.
- DB version upgrades close older connections and expose an actionable notice. Unknown save/schema versions are read-only, never downgraded. Missing pointer is not proof of eviction; surviving pointer with missing campaign triggers recovery. Complete origin eviction is inherently indistinguishable from a first visit.
- Migration engine runs explicit sequential steps over structured copies, preserves all existing stable IDs/records and solved IDs, archives stale evidence rather than deleting it. v1 is the first actual save format; **do not invent a historical v0 or ship a fictitious v2 migration**. Native tests exercise representative future migration steps through the same repository transaction path. Backup is the whole campaign's collections in that same transaction, one immutable backup per version transition; no pruning.
- Quota/abort pauses writes; pending text stays in memory and can be downloaded in a clearly labeled recovery copy. This is **not** the canonical SHA-256 export/import contract (T13–T14). Missing-save copy invites import using a compatible release, without a fake working Import button.
- Threat boundaries: unknown local/IDB data is validated or preserved read-only; never rendered as HTML or sent off-device. No new dependencies, telemetry, backend, SQL execution, artificial mission solves or production test API.

Additional predeclared **CP1a teardown/recovery proof** child: `tests/e2e/storage-ui.spec.ts`, `tests/fixtures/storage-browser.ts`, this file. Verify a recovery download contains latest unsaved text after quota fault and retry; delete only disposable caches and terminate a real PG probe worker in an isolated test context without altering canonical records. Eviction simulation deletes only that isolated test database, never a production reset command.

## Evidence

### RED → GREEN and review corrections

- Missing schema, local/order, draft lifecycle, migration and startup modules first failed their focused tests. Native fixture compilation first failed on the absent repository; the storage UI first failed against the absent built entry. The resulting native and built-app journeys are GREEN on Chromium/Firefox/WebKit.
- Real regressions caught before handoff: duplicate IDs in one batch aborted rather than deduplicated; duplicate migration output keys could overwrite a preserved row; a future-version child could be downgraded; a delayed draft changed active navigation; malformed existing v1 schema looked empty; an already-queued write could commit after quota failure. Each had an observed RED reproduction and a passing focused/native check after repair.
- Native strict durability initially reported `default`, then `strict` after the explicit hint on all three engines. A later real constraint failure proves request success is not commit success. Quota/abort injection is at native request boundaries, not an actual full-disk experiment.
- Keyboard RED exposed focus loss when Create disappeared; creation now focuses the newly available native draft. Label wrapping initially included option text in control names; labels/selects are separate, and the original exact-label test passes without relaxing assertions.
- Added fault/teardown coverage also verified existing safe paths (some were already GREEN); no claim that every added assertion required a production fix. No `.only`, skipped tests, warning suppression, loose TypeScript, new dependency or installed-package edit.
- Inspected all four new screenshots, corrected copy that could imply unwritten default preferences were already persisted, regenerated **only those four**, inspected them again, then ran ordinary comparison. Previous twelve baselines remain unchanged; only generated ID/seed is masked.

### Executed verification

Local Windows, Node 24.14.1 / npm 11.5.2, pinned Playwright 1.64.1; built static preview with enforced existing CSP. Not hosted/device certification.

| Command                                   | Actual result                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `rtk proxy npm ci`                        | passed; unchanged lockfile/dependency pins                                                                       |
| `rtk proxy npm run typecheck`             | passed: strict app/tools/SW                                                                                      |
| `rtk proxy npm run lint` / `format:check` | passed                                                                                                           |
| `rtk proxy npm run test:unit`             | **112 tests / 25 files passed**; full suite also passed with CI=true before final documentation changes          |
| `rtk proxy npm run build`                 | passed; 30 vendor packages / 97 independent file hashes, final binary/notices/hash/SW gates                      |
| `rtk proxy npm run test:storage`          | **63 passed**, real native IDB across three engines; output isolated under `test-results/storage`                |
| `rtk proxy npm run smoke:dist`            | **18 passed**, overlapping E2E subset                                                                            |
| `rtk proxy npm run test:e2e`              | **66 passed**                                                                                                    |
| `rtk proxy npm run test:pwa-update`       | **9 passed**, actual A/B built releases                                                                          |
| `rtk proxy npm run benchmark:boot`        | **9 cohorts passed / 90 timed trials**, not new device certification or a new boot decision                      |
| `rtk proxy npm run test:visual`           | **16 passed**, ordinary comparison after image review                                                            |
| `rtk proxy npm run test:a11y`             | **36 passed**, includes six storage tests exercising both empty/ready states                                     |
| `rtk proxy npm audit --audit-level=high`  | passed threshold; existing **four low build-only** deepmerge-chain findings remain disclosed, not force-repaired |

Final hygiene passed: relative Markdown links, high-confidence secret-pattern scan, Git whitespace check (preserving intentional Markdown hard breaks), empty staged diff, and unchanged original specs/LICENSE/lockfile/Graphify outputs. At the initial handoff all 44 changed files were unstaged. Six synthetic recovery-download artifacts remain under `test-results/storage`; the dedicated script run also passed all 63 cases after its output-directory change.

The final proof inventory has 27 resources at release `m0-89c114d3-9c24-46fe-90cc-780789fa86ba`; storage adds only small shell assets, not a new engine/snapshot. Build log: ignored `graphify-out/cache/cp1a-final-build.log`. Latest boot artifacts are under `test-results/boot-benchmark`; the original committed M0 measurement report is not rewritten. The test-only fixture is built under ignored `generated/storage-fixture` and is absent from production dist. CI now explicitly runs storage tests, but no hosted CP1a run is claimed because nothing was pushed.

Graphify used for CP1a/T10–T12/M0 dependencies and storage/migration/recovery navigation (budgets 1800/1000), with important claims verified against actual spec/todo/ADR source. The 453-node graph is historical navigation, not implemented-code proof. Hooks are installed; the existing CLI/skill version warning was not repaired by a global upgrade. No repository content was sent for external extraction.

### Five-axis self-review

- **Correctness:** complete-event acknowledgment, latest-record transactions, queued-write abort, deterministic conflicts, immutable transition backup, future/missing recovery and explicit no-reset path verified above. v1 is the actual format; migrations to later versions exist only as test-supplied representative steps.
- **Architecture/readability:** native infrastructure, pure policy/migration, app orchestration and escaped Lit view remain separate. Callback scheduling intentionally avoids awaiting unrelated work inside a native transaction. No gameplay/grading or T13 interchange masquerades as implemented.
- **Security:** no backend, telemetry, external runtime fetch, unsafe HTML, credential changes or production test globals. Recovery copies are private local downloads; original browser records are never cleared to recover. Import validation/original file-byte protection is T14, not falsely claimed here.
- **Performance:** storage desk does not initialize PG/parser; 500ms debounce serializes draft I/O. Current snapshots read collections for startup/recovery/cache; full-data/import ceilings and later large-campaign profiling remain T14/T39. No unmeasured mobile memory or latency pass.
- **Verification:** independent strict/build/vendor gates, native three-engine journeys, existing regressions and inspected screenshots. This is self-review; owner checkpoint review remains outstanding.

### Approved changed-file map — 44 files

- **Scope/documentation (10):** `AGENTS.md`, `README.md`, `docs/{ARCHITECTURE,DESIGN_SYSTEM,QA,STORAGE}.md`, `tasks/{cp1a-review,owner-actions,plan,todo}.md`.
- **Configuration (3):** `.github/workflows/ci.yml`, `package.json`, `vite.config.ts`. Existing Playwright configuration needed no change; the storage script supplies its dedicated output directory.
- **Runtime/desk (13):** `src/types/save.ts`; `src/storage/{schema,progress-db,local,draft-policy,migrations}.ts`; `src/app/{draft-controller,storage-controller,storage-copy}.ts`; `src/components/storage/tqi-storage-desk.ts`; `src/storage.ts`; `src/styles/storage.css`; `storage.html`.
- **Unit suites (6):** `tests/unit/{save-schema,local,draft-policy,draft-controller,migrations,storage-controller}.test.ts`.
- **Browser suites (6):** `tests/e2e/storage-{create,drafts,recovery,ui,a11y,visual}.spec.ts`.
- **Test fixture/tool (2):** `tests/fixtures/storage-browser.ts`, `tools/build-storage-fixture.mjs`.
- **Reviewed screenshots (4):** `tests/e2e/__screenshots__/win32/chromium/storage-{dark,light}-{360,1280}.png`.

## CP1a acceptance / stop for review

- [x] T10 all v1 native stores/key paths/indexes; immediate atomic identity+seed; unavailable/blocked/versionchange actionable, no silent new case.
- [x] T11 500ms/hidden flush; latest-record two-tab stable-ID merge and deterministic draft conflict; locale/theme/motion persist independently of canonical progress.
- [x] T12 copied migrations preserve solved IDs/notes/evidence and archive stale references; atomic backup/rollback; future/missing/quota/abort recovery with retained downloadable work and paused writes.
- [x] CP1a built-app transaction/recovery proof, not just mocks; no production cache/database reset erases canonical progress.
- [x] Owner reviewed and approved these CP1a changes; explicitly authorized commit/push and remote CI monitoring.

**The initial handoff left everything unstaged at base `201ed3e`. The owner subsequently approved CP1a Git delivery and CI monitoring. No deployment or T13 is authorized.** Full M0 actual Android/iOS/AT/HTTPS findings, final boot decision and human acceptance remain open. CP1a does not claim full M1/GATE-SAVE canonical export/import/update acceptance. Review with `rtk proxy npm run preview` after the build, then `http://127.0.0.1:4173/storage.html`; stop preview before Playwright.

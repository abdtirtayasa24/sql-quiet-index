# CP1b — portable progress and navigation

## Authorization / boundaries

Owner initially authorized T13–T15 using TDD through CP1b with a review stop. The owner has now approved CP1b and explicitly requested a one-line commit and push; staging/commit/push are authorized. No further agent deployment or T16 is authorized. Base `26e89d8`; [hosted CP1a quality/browser CI passed](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42552847584). No T16, gameplay, grading, authored playable missions, real-device/AT/HTTPS acceptance or boot-strategy change is inferred.

## Owner approval and Git delivery

The owner reports reviewing the newly built static staging deployment at `https://sql.abdtirtayasa24.workers.dev`: `/storage.html` saving and recovery download worked; settings export, import and local recovery-copy download also worked. The owner deployed the updated `dist` and approved this checkpoint, then requested commit/push with a one-line commit message. This is owner-reported functional evidence, not independent device/version/AT/install/update/security-header certification. Canonical campaign data lives in IndexedDB; small preferences/pointers use localStorage.

Documentation-only delivery slices (predeclared, at most five files each): Git-A updates this ledger, `AGENTS.md`, `README.md`, `tasks/owner-actions.md`; Git-B reconciles `tasks/plan.md`, `tasks/todo.md`, `docs/ARCHITECTURE.md`, `docs/QA.md`. No runtime/test/dependency change is planned for delivery. Existing local evidence below remains historical executed evidence; hosted CP1b CI is not inferred before a run completes. Before Git delivery, fetched origin (`HEAD...origin/main` = `0 0`), reran strict typecheck/lint/format and all 145 unit tests, checked whitespace/protected sources and reviewed exactly 52 changed files for artifact inclusion, secret patterns and relative links; all passed. No runtime/test/dependency edits were made during delivery.

## Plan and predeclared children

Each child touches at most five actual files; repeat focused tests after relevant changes. Behavioral tests precede implementation. No commits between slices: owner's review-before-commit instruction overrides generic skill advice.

| Child       | Candidate files (maximum five)                                                                                                           | Proof                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| T13-A       | src/storage/export-import.ts; tests/unit/export.test.ts; this file                                                                       | recursive canonical JSON, UTF-8 known digests, lossless typed numeric strings, unsupported values fail closed |
| T14-A       | package.json; package-lock.json; tools/build-save-validator.mjs; schemas/save.schema.json; this file                                     | approved Ajv build-only standalone generation, strict schema, no runtime eval/dependency                      |
| T14-B0      | tests/fixtures/save-file.ts; this file                                                                                                   | complete two-campaign interchange fixture, synthetic provenance only                                          |
| T14-B       | src/storage/import-validator.ts; src/types/case-file.ts; tests/unit/import.test.ts; schemas/save.schema.json; this file                  | byte/depth/node/string/count/schema/version/hash/pollution/foreign-key checks before writes                   |
| T14-C       | src/storage/import-policy.ts; tests/unit/import-policy.test.ts; src/types/case-file.ts; this file                                        | copied identities, deterministic merge, conflict retention, stable provenance                                 |
| T14-D       | src/storage/progress-db.ts; tests/fixtures/storage-browser.ts; tests/e2e/portable-db.spec.ts; tools/build-storage-fixture.mjs; this file | latest-record atomic confirmed merge/copy, collision/abort rollback, no preview writes                        |
| T13/T14-E   | src/app/portable-controller.ts; tests/unit/portable-controller.test.ts; src/storage/export-import.ts; this file                          | File/Blob I/O, fresh export, preview confirmation, retained original unsupported bytes                        |
| T15-A       | src/app/router.ts; src/app/app-store.ts; src/app/selectors.ts; src/types/events.ts; tests/unit/router-store.test.ts                      | typed hash routes, immutable discriminated snapshots, navigation cancellation/stale reply rejection           |
| UI-A        | src/components/storage/tqi-portable-desk.ts; src/app/portable-copy.ts; src/styles/portable.css; tests/e2e/portable-ui.spec.ts; this file | actual export/select/preview/confirm, errors, focus, escaped user data                                        |
| UI-B        | src/app/navigation.ts; src/main.ts; tests/e2e/navigation.spec.ts; src/components/storage/tqi-navigation-desk.ts; this file               | built root hash routes, locked mission, bootstrap/unsupported/recovery destinations                           |
| Integration | package.json; .github/workflows/ci.yml; tests/fixtures/storage-browser.ts; this file                                                     | explicit portable/navigation CI suite, isolated outputs, fixture never shipped                                |
| QA-A        | tests/e2e/portable-a11y.spec.ts; tests/e2e/portable-visual.spec.ts; this file                                                            | keyboard/axe/reflow, desktop/360px dark/light image review                                                    |
| QA-B        | four portable screenshot baselines; this file                                                                                            | inspect images before normal comparison, preserve older baselines                                             |
| Docs-A      | docs/STORAGE.md; docs/ARCHITECTURE.md; docs/QA.md; docs/THIRD_PARTY.md; docs/DESIGN_SYSTEM.md                                            | actual contracts/bounds, evidence and remaining gates                                                         |
| Docs-B      | AGENTS.md; README.md; tasks/plan.md; tasks/todo.md; tasks/owner-actions.md                                                               | truthful scope and uncommitted checkpoint stop                                                                |
| Vendor      | tools/vendor-manifest.json; docs/THIRD_PARTY.md; tests/unit/vendor.test.ts; this file                                                    | add only newly approved build-validator package provenance, never regenerate old baseline                     |

## Design decisions within approved D13

- File boundary is user-selected local JSON only; no upload/network service. SHA-256 detects accidental corruption, not authentication. A valid file never grants trusted/anti-cheat progress.
- Canonical serialization recursively sorts object keys by JS lexicographic order; arrays retain order/multiplicity. JSON-safe tagged bigint/numeric strings retain exact text; raw bigint/unsafe integral numbers/non-JSON values are rejected rather than silently coerced.
- Freeze numeric count/string/depth limits before validator implementation, within the normative 5 MiB total. Compile the approved Ajv schema at build time; do not ship runtime compilation or loosen CSP. No other dependency/engine/parser replacement.
- Preview never opens a write transaction. Confirmation re-reads canonical data in the writing transaction; merge rejects different seed/content/engine identity, preserves immutable provenance/event IDs and solved progress. Drafts use CP1a timestamp/tab/revision ordering. Conflicting notes/choices remain local with an explicit conflict report; no silent overwrite.
- Copy creates fresh campaign IDs and rewrites every structured `campaignId` reference consistently, including nested provenance extensions; mission/evidence/event/row IDs remain stable within their new campaign. Never text-replace SQL/notes or remap domain/database row IDs. Backups/meta are local operational records, not interchange collections per spec envelope.
- Future-version files remain non-importable/read-only and their original bytes are downloadable, unchanged. No downgrade/reset. Current malformed files also cannot write.
- T15 is typed navigation/state, not T16–T18 workspace/query execution. Existing un-hashed foundation and proof pages remain available; root hash routes expose the navigation desk. Unpublished missions explain locked/unavailable state rather than pretending to play. Engine-work cancellation is a typed port using current engine replies, with stale-session tests, not arbitrary SQL execution.

## Additional predeclared hardening children

- **H1:** tests/unit/portable-controller.test.ts + tests/unit/portable-lifecycle.test.ts (isolated teardown check) + src/app/portable-controller.ts: expected failed opens must not become unhandled rejections on disposal; retain readable work after write failure.
- **H2:** tests/e2e/portable-ui.spec.ts + src/components/storage/tqi-portable-desk.ts: changing import mode invalidates previous consent.
- **H3:** tests/e2e/navigation.spec.ts + src/app/navigation.ts + src/app/app-store.ts + src/types/events.ts: future physical schemas and stale bootstrap completions must not overwrite recovery/unsupported states.
- **H4:** tests/e2e/portable-db.spec.ts + src/storage/progress-db.ts + src/storage/import-policy.ts: copy ID collisions, capacity and quota preserve original records; metadata/backups remain untouched.

- **H5:** tests/unit/portable-lifecycle.test.ts + tests/e2e/navigation.spec.ts + src/app/portable-controller.ts + src/app/navigation.ts + this file: BFCache suspension closes connections without discarding the selected original file; pageshow reopens canonical records.
- **H6-A:** tests/e2e/navigation.spec.ts + src/app/navigation.ts + this file: surviving save pointers still trigger recovery; confirmed import updates the convenience pointer only after commit.
- **H6-B:** tests/e2e/portable-ui.spec.ts + src/components/storage/tqi-portable-desk.ts + src/components/storage/tqi-navigation-desk.ts + this file: unsupported local saves permit preview/download, never an import confirmation.
- **T13-A follow-up:** export.test.ts + export-import.ts: unsupported native records cannot be wrapped in a misleading current-version envelope.

- **H7:** src/app/portable-controller.ts + src/components/storage/tqi-portable-desk.ts + tests/e2e/portable-ui.spec.ts + this file: image review exposed ambiguous reset native-file text; retain a bounded escaped filename in the view model, including after navigation.
- **Focus follow-up:** src/app/navigation.ts + tests/e2e/portable-a11y.spec.ts + this file: startup focus cannot supersede a later file action; keyboard tests explicitly await the ready focus/enable state before keystrokes.

- **H8:** src/storage/import-policy.ts + tests/unit/import-policy.test.ts + this file: divergent mission/root payloads must be reported even when SQL text is identical; local-winning fields are never silently discarded.

- **T13/T14-E follow-up:** portable-controller.ts + portable-controller.test.ts + this file: retain an owned Blob of the bytes actually read, independent of a subsequently changing filesystem-backed file handle.

- **Regression fixture update:** tests/e2e/foundation.spec.ts + this file: CP0a's foundation smoke originally visited `/#/home` before routing existed. T15 now owns that URL; keep the old foundation assertions intact but point that historical proof at its documented bare `/` URL. Dedicated new route smoke continues to test `/#/home` and the other actual routes. Initial full regression exposed this mismatch on all three engines; no assertion is removed or weakened.

## Evidence

### Recovery follow-up (predeclared)

`tests/e2e/portable-ui.spec.ts`, `src/components/storage/tqi-navigation-desk.ts`, and this ledger: a corrupt convenience pointer must not disable an otherwise valid, explicitly confirmed canonical import. Native schema/data validation remains authoritative; unsupported native formats stay read-only. No browser storage reset is introduced.

## Executed TDD and corrective review

- Focused export, validation, merge/copy, controller and router/store tests first failed against absent modules. Native import tests then failed on the missing repository method; built navigation/file tests failed against the original foundation. Subsequent GREEN tests exercise actual code, not interface-only stubs.
- Observed additional RED → GREEN regressions: unsupported native records wrapped in a misleading v1 envelope; hidden non-draft/root conflicts; original download following a changed backing handle instead of owned read bytes; failed-open rejection escaping disposal; missing-pointer startup; BFCache teardown leaving routes inert; physical future DB described as a missing browser feature; late startup completion clearing versionchange recovery; native preview consent remaining checked after a mode change; import controls enabled in unsupported storage; ambiguous reset file-picker label; older startup focus stealing preview focus on WebKit.
- Native four-path RED was followed by an actual packaging failure: dynamic imports split the test library into unserved chunks. Existing Vite/Rolldown `output.codeSplitting: false` makes the **test-only** fixture self-contained without exposing it in dist. Production lazy loading stays enabled.
- Standalone generation initially failed its naive require-text check because Ajv helpers contain inert `.code` metadata strings. Replaced it with a real TypeScript AST call/import check; no warning suppression, browser eval or installed-package edit. Removed the attempted deprecated Unicode option; independent UTF-16 guards enforce SQL/note limits while Ajv checks Unicode lengths.
- Initial full smoke exposed the historical foundation test's `/#/home` URL, now legitimately owned by T15. Changed only that old fixture's URL to bare `/`; every old assertion stays intact. The separate route smoke tests the new URLs. Subsequent full smoke/E2E passed all three engines.
- Extra fault/limit tests also verified paths already GREEN (native capacity, collision, quota and operational-store preservation); not every added assertion needed a production fix. No tests skipped, filters relaxed, retries added, production test globals, loose TS or TODO passes.

### Final executed verification

Local Windows, Node **24.14.1**, npm **11.5.2**, pinned Playwright **1.64.1**. Static built preview enforces the existing CSP/nosniff policy. The first chained regression stopped on the foundation URL mismatch; the remaining suite was explicitly resumed after its correction, not inferred from missing logs.

| Command (all through `rtk proxy`) | Actual result                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm ci`                          | passed, 521 packages installed; existing four low audit findings                                                 |
| `npm run typecheck`               | passed, strict app/tools/SW; schema generated before clean-checkout imports                                      |
| `npm run lint` / `format:check`   | passed; final documentation rechecked separately                                                                 |
| `npm run test:unit`               | **145 tests / 31 files passed**                                                                                  |
| `npm run build`                   | passed: **32 vendor packages / 105 selected SHA-256 file checks**, binary/notices/final-hash/SW gates            |
| `npm run test:storage`            | **63 passed**, unchanged CP1a native/UI acceptance suite                                                         |
| `npm run test:portable`           | **63 passed**, native/File/Blob/navigation across Chromium/Firefox/WebKit                                        |
| `npm run smoke:dist`              | **21 passed**, overlapping smoke subset                                                                          |
| `npm run test:e2e`                | **66 passed**                                                                                                    |
| `npm run test:pwa-update`         | **9 passed**, actual A/B compiled releases                                                                       |
| `npm run benchmark:boot`          | **9 cohorts / 90 timed trials passed**, no skipped browser/strategy; not new device certification                |
| `npm run test:visual`             | **20 passed**, ordinary comparison after inspecting all four new images twice                                    |
| `npm run test:a11y`               | **48 passed**, automated/keyboard/reflow, not named AT                                                           |
| `npm audit --audit-level=high`    | threshold passed; existing **four low build-only** deepmerge-chain findings remain disclosed, no force downgrade |

After the full regression pass, the final corrupt-pointer UI-affordance follow-up reran strict types/lint/build and the complete portable (63), visual (20) and accessibility (48) suites. No engine/parser/SW/migration policy changed in that follow-up; earlier unit/storage/E2E/update/benchmark passes are reported as executed, not rerun for reassurance.

The final build is `m0-fa6fa38b-cea8-4b28-b6a4-6ccb3cfe02be`, **33 hash-verified proof resources**, lean precache **25 entries / 619.74 KiB**. The lazy import-validator chunk is approximately 77 kB / 9 kB gzip, not a measured wire transfer. New assets do not change the provisional initdb choice or publish any mission. Original 90-observation committed M0 report is unchanged; latest repeat artifacts remain ignored under `test-results/boot-benchmark`.

Ignored command evidence: `graphify-out/cache/cp1b-{ci,types,lint,format,unit,final-build,storage,portable,smoke,e2e,update,benchmark,visual,final-a11y,audit}.log`. Portable synthetic downloads live under `test-results/portable`; test-only bundles/declarations under `generated/` are not production entries or commit candidates. The CI workflow invokes the new portable suite, but **no hosted CP1b result is inferred** from local tests or owner staging approval. CP1a's successful hosted run is the baseline link above.

Graphify used for checkpoint/task/identity/draft/routing dependencies (budgets 1000/1800); key claims verified against actual spec/todo/ADR and source. Historical 453-node graph remains navigation, not implementation proof. No global CLI/skill upgrade, external extraction, deployment or machine-service change.

Final hygiene passed: relative Markdown links, high-confidence secret-pattern scan, production fixture-route exclusion, whitespace check preserving Markdown hard breaks, empty staged diff, and unchanged original specs/LICENSE/historical Graphify artifacts/committed benchmark report/previous sixteen snapshots. At the original review handoff, all **52 files remained unstaged** on `main` at `26e89d8`. Graphify post-commit/post-checkout hooks and merge driver were checked installed; no hook output was committed.

### Five-axis self-review

- **Correctness:** complete-event writes, no preview writes, latest-record conflict policies, owned original bytes, unsupported/future read-only behavior, explicit confirmation, native all-store rollback and preserved backup/meta covered. Solved IDs/notes/provenance are not regraded or revoked. Canonical files represent supported JSON-safe v1 records; malformed/exotic native records use best-effort recovery rather than silent conversion.
- **Readability:** pure canonicalization, declarative schema, boundary validation, merge/copy, native transactions, File/Blob orchestration, router/store/selectors and Lit views are separately reviewable. Main remains a small bootstrap; existing proof surfaces remain intact.
- **Architecture:** Lit/strict TS/Vite/native APIs only; approved Ajv is a build compiler, not a new browser framework. No global bus, backend, query/grading logic in views or invented playable registry. T15's typed engine cancellation port is tested without claiming T18's integrated query workspace.
- **Security:** original-byte and UTF-8 bounds precede parsing; recursive pollution/version/shape/reference/hash checks precede writes; escaped filenames/IDs, fixed local Blob names, no uploads/telemetry. Integrity is not authentication. Standalone compiler helpers are explicitly licensed/hashed. Previous 30 vendor entries and prior package-version/tarball identities were compared unchanged; lock changes are only the reviewed direct Ajv declaration/hoisting.
- **Performance:** file bytes/depth/node/property/array/count/string limits are explicit; schema compilation is off the browser path and runtime checks load lazily. Whole-collection native snapshots/aggregate planning still cost memory/CPU on large local saves; device profiling remains an evidence gate, not an inferred pass. No unmeasured mobile latency/peak-memory claim.

The five-axis review above is self-review, not independent review; the owner's subsequent checkpoint approval is recorded separately above. Real Android/iOS/Safari, named AT, physical disk exhaustion/power loss, actual HTTPS/install/security-header findings and full M0/M1/public-release acceptance remain open. `validate:content`/`test:fixtures` intentionally remain future T20/T25 failing placeholders. The existing PWA plugin's deprecated inlineDynamicImports warning is upstream, not hidden or patched in installed code.

### Changed-file map — 52 checkpoint files

- **Scope/contracts/evidence (11):** `AGENTS.md`, `README.md`, `docs/{ARCHITECTURE,DESIGN_SYSTEM,QA,STORAGE,THIRD_PARTY}.md`, `tasks/{cp1b-review,owner-actions,plan,todo}.md`.
- **Configuration/vendor (4):** `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, `tools/vendor-manifest.json` (only two appended reviewed packages).
- **Runtime (16):** `src/main.ts`; `src/app/{app-store,navigation,portable-controller,portable-copy,router,selectors}.ts`; `src/storage/{export-import,import-policy,import-validator,progress-db}.ts`; `src/types/{case-file,events}.ts`; `src/components/storage/tqi-{navigation,portable}-desk.ts`; `src/styles/portable.css`.
- **Schema/tooling (3):** `schemas/save.schema.json`, `tools/{build-save-validator,build-storage-fixture}.mjs`.
- **Unit suites (6):** `tests/unit/{export,import,import-policy,portable-controller,portable-lifecycle,router-store}.test.ts`.
- **Browser suites (6):** `tests/e2e/{foundation,navigation,portable-db,portable-ui,portable-a11y,portable-visual}.spec.ts` (foundation changes only its historical URL).
- **Fixture sources (2):** `tests/fixtures/{save-file,storage-browser}.ts`.
- **New reviewed images (4):** `tests/e2e/__screenshots__/win32/chromium/portable-{dark,light}-{360,1280}.png`. Prior sixteen baselines unchanged; new fixtures are deterministic, no masking/tolerance increase.

## CP1b acceptance / owner review stop

- [x] T13 recursive key order / canonical UTF-8 SHA-256 excluding integrity, exact typed numeric strings, complete seven-collection export and unsupported original/recovery preservation.
- [x] T14 bounded untrusted files, strict schema/version/hash/pollution/reference checks, zero preview writes, explicit merge/new-copy confirmation, complete campaign-reference remapping, deterministic conflict reporting and atomic failure.
- [x] T15 six direct static hash routes, honest lock explanation, immutable discriminated states/focus destinations, typed cancellation/stale-reply guard, startup/pointer/version/BFCache recovery. No T16–T18 workspace claim.
- [x] Existing records/operational stores preserved and errors cannot replace canonical campaigns without confirmation; relevant old regression gates remain green.
- [x] Owner checkpoint review/acceptance and explicit staging/commit/push authorization; staging functional findings recorded above.

**Owner approved CP1b and requested Git delivery. Stage/commit/push this reviewed checkpoint; do not start T16 or perform further deployments until explicitly requested.** Review via `rtk proxy npm run preview` after build, then `http://127.0.0.1:4173/#/settings` and `/#/home`; stop preview before Playwright.

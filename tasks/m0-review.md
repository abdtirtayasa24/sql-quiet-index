# M0 — measured boot and offline/update proof

## Authorization and gate

The owner authorized T08–T09 through M0 using TDD after CP0b `122a7fa` was committed and pushed. **Do not commit, push, deploy or begin T10 until separately requested.** Earlier Android Chrome/Windows functional acceptance remains valid for CP0b only; it is not an M0 benchmark, named AT audit or security-header certification.

M0 is a mandatory human go/no-go. Real Android/iOS Safari P75, total peak memory, keyboard/AT and actual HTTPS install/update/header findings require actual operators. Implement and exercise the software proof locally, but leave those criteria open if unavailable. Pending T08 device-based selection does not prevent preparing/testing T09 as a risk-reduction spike; initdb remains the conservative default and the snapshot is a benchmark candidate only.

## Predeclared child slices (at most five actual files each)

| Slice                       | Files                                                                                                                               | RED / verification                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| M0-00 scope                 | this file; AGENTS.md; tasks/plan.md; tasks/todo.md                                                                                  | Documentation only; record changed authorization, not fabricated acceptance                     |
| T08-A snapshot fixture      | tools/build-base-snapshot.mjs; src/engine/benchmark-seed.sql; tests/unit/snapshot.test.ts; .gitignore                               | Altered snapshot/metadata fail verification; actual pinned PG18 dump and coupling hashes        |
| T08-B worker benchmark      | src/engine/boot-benchmark.ts; src/workers/boot-benchmark.worker.ts; src/app/boot-benchmark.ts; tests/unit/boot-benchmark.test.ts    | Typed validation/statistics RED; browser equivalence and lifecycle proof in T08-C               |
| T08-C proof desk            | technical.html; src/technical.ts; src/app/technical.ts; vite.config.ts; tests/e2e/boot-benchmark.spec.ts                            | Built initdb/snapshot equivalence, worker-only startup, input usable during boot                |
| T09-A approved dependencies | package.json; package-lock.json; tools/vendor-manifest.json; docs/THIRD_PARTY.md                                                    | Exact compatible vite-plugin-pwa/Workbox; selected shipped files/notices and audit              |
| T09-B asset contract        | tools/m0-assets.ts; tests/unit/m0-assets.test.ts; vite.config.ts                                                                    | Fail-closed same-origin asset inventory, integrity/byte accounting, lean precache               |
| T09-C download boundary     | src/app/offline-proof.ts; tests/unit/offline-proof.test.ts                                                                          | Malformed paths, checksum/partial/quota failures cannot report ready                            |
| T09-D authored SW           | src/sw.ts; tsconfig.sw.json; tsconfig.json; tsconfig.tools.json; eslint.config.js                                                   | Strict isolated worker types; registration and built SW tested next slice                       |
| T09-E update controller     | src/app/update-controller.ts; tests/unit/update-controller.test.ts; src/app/technical.ts; tests/e2e/pwa-spike.spec.ts; package.json | No unsolicited activation/reload; explicit approval; failure/retry; offline reopen              |
| T09-F two releases          | tools/m0-test-server.mjs; tests/e2e/pwa-update.spec.ts; playwright.m0.config.ts; package.json; .github/workflows/ci.yml             | Actual A/B compiled workers, old page/new assets, waiting/declined/approved update and two tabs |
| M0-UI audit                 | src/styles/feasibility.css; tests/e2e/technical-a11y.spec.ts; docs/DESIGN_SYSTEM.md                                                 | Keyboard, 320/360 reflow, axe in both themes; no original proof baseline changes                |
| M0-UI visuals               | tests/e2e/technical-visual.spec.ts; four technical dark/light 360/1280 PNGs                                                         | Inspect new images before normal comparisons                                                    |
| M0-docs A                   | docs/ARCHITECTURE.md; docs/QA.md; README.md; tasks/owner-actions.md; this file                                                      | Exact implemented contracts, commands and explicit evidence limitations                         |
| M0-docs B                   | tasks/plan.md; tasks/todo.md; AGENTS.md                                                                                             | Truthful checkpoint status; no T10 expansion                                                    |

Do not add files to a slice to evade the limit; record any additional child slice before editing it. Pure configuration/documentation is exempt from behavioral RED, not from verification.

Additional predeclared **M0-L functional input proof controls** child: `src/app/technical.ts`, `tests/e2e/boot-benchmark.spec.ts`. Visual review found the reused editor's Inspect action had no handler on the technical desk. Add a RED browser assertion, wire the existing typed EngineClient parser (never execution), and keep a single owned inspection worker with disposal/stale-result protection. Refresh only the already-declared four technical baselines after review; original CP0a/CP0b baselines stay unchanged.

Additional predeclared **T09-K SW-owned download lifetime** child: `src/app/sw-download.ts`, `src/sw.ts`, `src/app/proof-controller.ts`, `tests/unit/sw-download.test.ts`, `tests/e2e/pwa-spike.spec.ts`. Actual WebKit regression: the page-written pack has all 26 keys before the final page closes and zero after reopening, while SW precache survives. Move opt-in download ownership into an awaited SW message/event lifetime, with correlated MessagePort reply and no page/storage deletion workaround. Also retain cache-mode/HTTP-header normalization regressions.

Additional predeclared **M0 test isolation** child: `playwright.config.ts` excludes the A/B and repeated-performance suites from the ordinary preview server. Dedicated scripts/configs run them explicitly, never skip them silently.

Additional predeclared **T08-E repeated measurements** child: `tests/e2e/boot-performance.spec.ts`, `playwright.benchmark.config.ts`, `src/technical.ts`, `package.json`. Five trials per strategy/condition, fresh contexts for HTTP-cold, labeled HTTP-warm and verified SW-offline repeats; shell mark, input→frame and allocated PG WASM observations. Unsupported/whole-process memory and real-device findings remain unknown.

Additional predeclared **T08-D release correlation** child: `src/engine/boot-benchmark.ts`, `src/workers/boot-benchmark.worker.ts`, `src/app/boot-benchmark.ts`, `tests/unit/boot-benchmark.test.ts`. Include/check the actual compiled release in trial replies so the two-release test proves old worker/new worker distinction rather than testing identical worker files.

Additional predeclared **T09-J final artifact gate** child: `tools/verify-m0-dist.mjs`, `tests/unit/m0-dist.test.ts`, `package.json`. Verify final on-disk asset hashes and injected lean SW, not pre-finalized generateBundle code. Browser RED revealed Vite post-processing changed one chunk after the initial inventory.

Additional predeclared **T09-I build adapter** child: `tools/pwa-plugin.mjs`, `tools/pwa-plugin.d.mts`, `vite.config.ts`, `tests/unit/pwa-plugin.test.ts`. The upstream plugin's optional image-generator declarations are missing and Workbox build declarations do not compile with exactOptionalPropertyTypes/DOM-only tooling. Isolate this build-only JavaScript integration behind its own narrow typed Vite-plugin API, test its actual options/build output, and retain strict application/SW checks. Do not use skipLibCheck, fake vendor globals, an any shim, or edit installed packages.

Additional predeclared **T09-H orchestration** child: `src/app/proof-controller.ts`, `tests/unit/proof-controller.test.ts`, and its `src/app/technical.ts` loading-state binding, with behavior exercised by the already-declared PWA browser tests. Keep Cache API/SW lifecycle out of the Lit view rather than growing the component with infrastructure logic.

Additional predeclared children: **T09-G icons** (`tools/build-proof-icons.mjs`, `public/icons/proof-192.png`, `public/icons/proof-512.png`) creates original local install icons, no external art. **M0-tool exclusions** (`.prettierignore`) excludes generated A/B builds and snapshot staging from formatting. No behavior is claimed from these static/configuration changes.

Additional predeclared **M0 measurement evidence** child: `graphify-out/cache/export-m0-benchmarks.mjs` (ignored local evidence processor), `docs/benchmarks/m0-local.json` (generated, reviewable measured samples), and this review. Export only if all nine cohorts contain five successful trials of each strategy from the exact same built release; preserve unsupported metrics as null. No personal/participant data.

Additional predeclared **CI-1 hosted import-boundary diagnosis** child: `tests/unit/import-boundary.test.ts`, this review. Previous hosted run `41217792321` failed two real ESLint import-boundary assertions (empty diagnostics / typed-compiler exception), before browser CI. Reproduce/check the harness and retain actual configured restriction assertions; isolate native ESLint from Vitest's module runner if the differential supports it. Do not weaken production rules or skip the tests.

Additional predeclared **CI-3 CI-mode virtual-source regression** child: `tests/unit/import-boundary.test.ts`, this review. Run the native regression with CI=true; isolate only its parser single-run inference, which otherwise uses the on-disk AST instead of substituted lintText input. Keep the real CI lint configuration/rules unchanged.

Additional predeclared **CI-2a delivery status** child: `AGENTS.md`, `README.md`, `tasks/plan.md`, `tasks/todo.md`, this review. **CI-2b historical hosted evidence** child: `docs/QA.md`, this review. Record the new Git/monitoring authorization without marking device gates accepted.

Owner subsequently authorized committing and pushing the reviewed M0 changes with a one-line message, and monitoring remote CI. This authorizes Git delivery and necessary CI repair, **not** T10, deployment or closure of device/AT/HTTPS acceptance.

## Threat boundaries and conservative choices

- The benchmark accepts only fixed strategy names, never user SQL, paths or external URLs. Each trial owns and terminates one disposable worker. The seed is a small synthetic fixture, not shipped mission content or a production performance prediction.
- One generated gzip snapshot is coupled to the exact pinned engine/WASM and seed hashes; altered bytes fail verification. No package substitution, installed-package edits, persistent PostgreSQL, or per-case snapshots.
- Same-origin immutable asset hashes and byte ceilings govern opt-in offline download. Never cache player text or call an incomplete download ready. Installation must not unconditionally fetch engine/parser/snapshot binaries.
- Authored injectManifest worker: no unconditional skipWaiting/clientsClaim/reload. Preserve old release caches; do not clear IndexedDB/localStorage or hide missing assets with HTML. Updates need explicit user approval; warn that this proof's in-page draft is not durable and refuse unsafe reload.
- Local preview is not production Nginx/Cloudflare/TLS acceptance. No live server/DNS/security configuration changes are authorized.

## Evidence log

- Initial branch `main`, clean tree, HEAD `122a7fa`.
- Graphify query: `T08 T09 M0 boot snapshot service worker update offline`, budget 1800. Historical 453-node planning graph identifies T08/T09/M0 and snapshot/update/offline requirements; source text verified. Installed CLI/skill version warning remains non-blocking; no global installation changed.
- Official [PGlite prepopulated FS](https://pglite.dev/docs/prepopulatedfs), [injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest) and [prompt update](https://vite-pwa-org.netlify.app/guide/prompt-for-update) documentation inspected. Registry confirms vite-plugin-pwa 2.0.0 explicitly supports Vite 8 and Node >=20.19; Workbox 7.4.1 is the compatible selected line. These are implementation inputs, not browser/device evidence.

## Final local verification

| Command                                  | Actual result                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `rtk proxy npm ci`                       | Pass; clean locked install                                                                                                |
| `rtk proxy npm run typecheck`            | Pass; app + tools + isolated WebWorker SW                                                                                 |
| `rtk proxy npm run lint`                 | Pass                                                                                                                      |
| `rtk proxy npm run test:unit`            | **94 tests / 19 files passed**                                                                                            |
| `rtk proxy npm run build`                | Pass; pinned vendor, coupled snapshot, icons, real injectManifest, static/binary/notices and final disk hashes            |
| `rtk proxy npm run test:e2e`             | **66 passed** across Chromium/Firefox/WebKit                                                                              |
| `rtk proxy npm run smoke:dist`           | **18 passed**, overlapping E2E; one combined tool call hit its walltime, independent smoke invocation exited successfully |
| `rtk proxy npm run test:pwa-update`      | **9 passed** on actual separately built A/B artifacts                                                                     |
| `rtk proxy npm run benchmark:boot`       | **9 complete cohorts / 90 measured trials**, all three engines, five samples per strategy/condition; no browser skipped   |
| `rtk proxy npm run test:a11y`            | **30 passed**, not human AT certification                                                                                 |
| `rtk proxy npm run test:visual`          | **12 normal comparisons passed** after four new images were inspected; old eight baselines unchanged                      |
| `rtk proxy npm audit --audit-level=high` | Pass threshold; **four low build-only findings remain**, not zero vulnerabilities                                         |
| `rtk proxy npm audit --omit=dev`         | Zero findings; does not alone cover Workbox shipped from dev dependencies                                                 |

Final formatting, Git whitespace/protected-file checks, changed Markdown links and secret-pattern scan pass. At the initial review handoff, 66 files changed with nothing staged at HEAD `122a7fa`; the subsequent CI harness correction adds one file to the change set. Original specifications, LICENSE and committed Graphify artifacts are unchanged.

CI now invokes the two-release and repeated-benchmark suites explicitly. First M0 push `4c48ef6` reached [hosted run 42189597199](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42189597199), which failed the same two boundary assertions and skipped the browser job. The CI-3 follow-up below addresses the now-reproduced CI-mode root cause; use the exact follow-up commit's hosted result, not the earlier local-only pass. See [QA](../docs/QA.md) and [raw measured samples](../docs/benchmarks/m0-local.json) for actual limits, device procedure and benchmark build ID.

### CI-1 follow-up to the previous failed hosted run

[CP0b run 41217792321](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/41217792321) actually failed its two in-process typed ESLint boundary tests; browser work was skipped. Earlier CP0b local success was not remote success. A fresh local isolated invocation also exceeded the original 5-second test deadline. Native programmatic ESLint reports the real configured restriction, whereas the tested CLI-stdin path unexpectedly reported empty diagnostics, so the fix uses the native **API**, not that CLI-stdin path. Run each existing forbidden-import fixture through native Node outside Vitest's module/compiler context, with bounded child/test deadlines. Retain the exact `no-restricted-imports` assertions and production config unchanged; no browser, lint rule or unit case is skipped. The two original assertions initially passed locally with this isolation, but the first M0 hosted run still failed. Setting **CI=true** locally then reproduced both empty diagnostic arrays deterministically. Installed typescript-eslint `inferSingleRun` selects immutable on-disk Programs under CI; its parser uses the disk AST for the first virtual-file call, and an isolated fallback on subsequent calls (explaining the earlier second-call compiler exception). The [documented single-run flag](https://typescript-eslint.io/packages/parser/#disallowautomaticsingleruninference) is now **false only in this test subprocess**, while CI=true is forced to exercise the original trigger even locally. The CI-mode original reproduction is GREEN; production CLI lint still uses its unchanged full strict rules/normal optimization. No tests or lint rules are disabled.

### RED→GREEN record and corrected assumptions

- Snapshot positive/altered-byte/engine-coupling tests failed before the builder existed, then passed using actual PG18 dumps. Statistics/metric guards, invalid NaN percentile and setup concurrency had observed RED before fixes.
- Built benchmark initially lacked the desk; browser test failed, then both PG strategies/fixture sum/parser readiness passed. The real `.gz` HTTP-decoding mismatch was reproduced and fixed with the opaque extension, not a weakened checksum.
- Asset/manifest/download/update/MessagePort suites were written before their implementations. Extra negative tests proved no ready marker after checksum, oversize, missing-file or quota errors, and verified CSP/nosniff normalization.
- Real wildcard glob RED demonstrated the minimatch/glob incompatibility; the scoped glob@14 compatibility/security fix restored actual precache discovery. Initial literal-filename probing was not counted as sufficient evidence.
- The final artifact verifier rejected the actually built late-mutated index chunk before writeBundle inventory generation; positive and negative verifier fixtures now pass.
- Repeated WebKit offline measurements exposed loss of page-owned cache contents after the last page closed. Cache-mode/header hypotheses alone did not fix that scenario. SW-owned waitUntil download did: fresh clients and all repeated cohorts now pass. An artificial Firefox force-network reload-fetch expectation was replaced with the actual default offline path/native Request cache matching, while retaining every browser and fresh-client worker proof. The app's obsolete custom bypass-header policy was removed, not retained as an unexplained workaround.
- Visual review found the technical editor's unwired Inspect action; a failing actual click test drove real parser wiring. Another RED injected Worker constructor failure drove the safe retry state. WebKit keyboard RED drove an explicit skip-link tabindex matching the existing proof-page convention.
- Unit assertions were never weakened to certify unrun devices, accept a failed checksum, skip a browser or invent missing measurements. New screenshots mask only the variable release label.

## Changed-file review map — 67 files including CI harness correction

- **Scope/docs (10):** `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/QA.md`, `docs/THIRD_PARTY.md`, `tasks/owner-actions.md`, `tasks/plan.md`, `tasks/todo.md`, `tasks/m0-review.md`.
- **Measurement evidence (1):** `docs/benchmarks/m0-local.json` — generated from nine complete same-release cohorts, with raw worker Resource Timing and unsupported values retained.
- **Toolchain (13):** `.github/workflows/ci.yml`, `.gitignore`, `.prettierignore`, `eslint.config.js`, `package.json`, `package-lock.json`, `playwright.config.ts`, `playwright.m0.config.ts`, `playwright.benchmark.config.ts`, `tsconfig.json`, `tsconfig.tools.json`, `tsconfig.sw.json`, `vite.config.ts`.
- **Build/integrity tools (8):** `tools/build-base-snapshot.mjs`, `tools/build-proof-icons.mjs`, `tools/m0-assets.ts`, `tools/m0-test-server.mjs`, `tools/pwa-plugin.mjs`, `tools/pwa-plugin.d.mts`, `tools/verify-m0-dist.mjs`, `tools/vendor-manifest.json`.
- **Runtime (13):** `technical.html`, `src/technical.ts`, `src/sw.ts`, `src/styles/feasibility.css`, `src/app/technical.ts`, `src/app/boot-benchmark.ts`, `src/app/offline-proof.ts`, `src/app/proof-controller.ts`, `src/app/sw-download.ts`, `src/app/update-controller.ts`, `src/engine/boot-benchmark.ts`, `src/engine/benchmark-seed.sql`, `src/workers/boot-benchmark.worker.ts`.
- **Unit suites (10):** `tests/unit/{snapshot,boot-benchmark,m0-assets,m0-dist,offline-proof,proof-controller,pwa-plugin,sw-download,update-controller,import-boundary}.test.ts`.
- **Built browser suites (6):** `tests/e2e/{boot-benchmark,boot-performance,pwa-spike,pwa-update,technical-a11y,technical-visual}.spec.ts`.
- **Original generated install icons (2):** `public/icons/proof-192.png`, `public/icons/proof-512.png`.
- **Reviewed new baselines (4):** `tests/e2e/__screenshots__/win32/chromium/technical-{dark,light}-{360,1280}.png`.

### Five-axis self-review

- **Correctness:** real PG18 and grammar, exact fixture count/sum, release-correlated workers, final byte hashes, partial/failure/retry and two-client proof. Cached worker CSP preserved. Human/device criteria remain unchecked.
- **Readability:** small declared child slices, clear named boot/cache/update boundaries; no global event bus or new application framework. The technical view only coordinates typed services and renders escaped data.
- **Architecture:** separate technical proof, original foundation/input page preserved; no T10, mission data, arbitrary SQL execution or fake save flush. Build-only JS adapter isolates actual upstream declaration incompatibilities without changing app/SW strictness.
- **Security:** same-origin allowlisted manifest paths, count/byte ceilings, digest checks, bounded MessagePort/download lifetimes, no unconditional activation/reload or player-storage deletion. Four low build-tool advisories and legal-notice follow-ups are recorded rather than hidden.
- **Performance:** 90 raw observations, separate cold/warm/offline conditions and input/allocated-WASM limits; not real-device peak memory or production wire budgets. Initdb remains the default; no snapshot adoption inferred from loopback.

## Acceptance — software review is not full M0 acceptance

- [x] T08 reproducible snapshot/benchmark software and automated equivalence proof.
- [ ] T08 real-device cold/warm/offline P75, transfer bytes, peak memory and input comparison; final strategy decision.
- [x] T09 built offline demo, opt-in complete download and safe prompt-controlled two-release update proof.
- [x] Full local strict/build/vendor/regression/visual/a11y suite (formatting/diff hygiene finalized with this handoff).
- [ ] Real Safari/iOS and named AT findings; actual HTTPS install/update/CSP/MIME evidence.
- [ ] Owner M0 go/no-go before T10.

**Owner subsequently authorized commit/push and CI monitoring only; no deployment, global-tool change or T10 implementation.** The initial review base is `122a7fa`; original specifications, LICENSE and committed Graphify artifacts are unchanged. Existing package/version identities/root versions are unchanged; the new dev dependencies/compatible scoped override are explicit. Remaining device/AT/host findings and human review block claiming all M0 acceptance criteria met.

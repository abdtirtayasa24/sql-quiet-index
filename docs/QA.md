# QA — CP2a content foundations and historical feasibility

## CP2a — owner-approved for Git delivery

Owner authorized T19–T21 through CP2a using TDD and a review stop, then approved the changes and explicitly requested commit/push and remote CI inspection/monitoring. M1 was delivered as `c6d1b77`; older no-T19 statements below are historical. [Full executed evidence, RED→GREEN corrections, file map and limits](../tasks/cp2a-review.md). No T22, mission publication or deployment.

`test:unit` now passes **230 tests / 42 files**, including actual PostgreSQL 18 **three acts × five seeds**, baseline constraints/columns/row budgets, shared identity replay, PRNG vectors and bounded source/manifest/graph rejection. `validate:content` is real and reports 80 outline IDs, **zero playable missions and zero authored cases**; `validate:graphs` is real too. Synthetic separate-act routes reach 008/016/024 with independent paths/distinct items, and fail on missing/optional clues, graph cycles, source/task duplication and unlock/familiar deadlocks. These are authoring foundation proofs, not runnable probe grading, human plot discoverability or learning evidence.

Executed build/types/lint/format, smoke (21), E2E (69), native storage (63), portable (63), visual (24), automated a11y (54), two-release update (9) and desktop benchmark (9 cohorts/90 trials) passed. No baselines/runtime UI/dependency pins/save schema changed. The full unit run initially timed out the existing snapshot test under 42 concurrent workers; bounding concurrency at two preserves all deadlines/assertions and passes all 230.

**Browser regression caveat:** full workspace runs remain **26/27**, with WebKit fresh-offline navigation failure initially and a 90s multi-tab recovery timeout in subsequent serial/final parallel suites. Three isolated WebKit offline runs and one targeted recovery run passed unchanged; these do not erase the failures. Final trace shows long real-keyboard typing (~28.9s for the long query alone), but root cause is unproven. CP2a does not change workspace/worker/SW/browser-test code, retry/timeout/tolerance settings or hide a browser. Retained logs/traces and exact commands are in the ledger. Treat a fully green workspace regression as an outstanding review caveat, not inferred acceptance. Real-device/AT/HTTPS/performance/M0 evidence also remains open.

## M1 software review — owner-approved for Git delivery

Owner authorized T16–T18 through M1 using TDD, with no commit until review. [Executed commands, file map, RED→GREEN findings and manual gates](../tasks/m1-review.md). The owner subsequently reported successful basic SELECT/WHERE/GROUP BY checks on their Cloudflare `/workspace` deployment, then requested a desktop layout revision; this is not named device/AT/HTTPS certification. [Layout follow-up, RED→GREEN regression and current verification](../tasks/m1-layout-review.md). Use Node 24.14.1/npm 11.5.2; `rtk proxy npm run build`, `rtk proxy npm run preview`, then `/workspace.html` (also linked from `/#/home`). Stop preview before Playwright. Wanted active-campaign SQL should be exported first: the practice workbench edits that campaign's current mission draft, never its completion/evidence/mastery.

`rtk proxy npm run test:workspace` exercises actual built PG18 in dedicated workers on Chromium/Firefox/WebKit: rich/native shortcut and immediate hidden flush/reload; duplicate result names/NULL/XSS escaping; full 240-row result with 200 preview; SQLSTATE/grouping feedback; keyboard hints/history; exclusive tabs at all viewport sizes/modal Escape and focus restore; statement/watchdog budget and exact-seed recovery; independent tab workers; close during running query; navigation-flushed draft; imported solved IDs and all non-draft collections preserved through run/reset/export; fresh offline closed-page workbench and canonical export after explicit proof download. Unit tests separately verify malformed/stale identity/wrong-kind replies, serialized active/queued cancellation, constructor/error/deadline paths, denylisted ASTs, typed numeric/date precision, cursor cleanup after PG errors, output limits, oversized retained drafts and distinct completion announcements.

`test:visual` includes four inspected Windows/Chromium workbench images with no masking/tolerance changes; older twenty images remain unchanged. `test:a11y` includes six additional theme×engine journeys, each auditing empty, ready, result, grouping error, modal and native fallback states plus 320–1280px reflow and 44px principal controls. These are automated DOM/keyboard checks, **not a named screen-reader status audit**. WebKit tests use real selection/typing rather than synthetic contenteditable `fill`, following the earlier documented harness limitation; no browser is skipped and no production workaround is added for that synthetic event.

The existing technical proof-pack URL reader and independent artifact verifier both had to explicitly admit `workspace.html`; broadening the emitted inventory alone correctly failed closed. Offline readiness was not marked passed until the actual three-engine fresh-client test succeeded. CSP/nosniff remain enforced by the local preview and worker responses; no broad eval/inline relaxation or external runtime source.

The owner approved M1 and the all-tab layout and explicitly requested commit/push with a one-line message. No deployment or T19 authorized. Outstanding acceptance: NVDA/VoiceOver/TalkBack status/labels/focus, real macOS/iOS Safari/Android/IME, physical memory/power/quota evidence, final measured mobile budget and actual HTTPS/install/response-header gates. Do not substitute desktop WebKit or viewport screenshots. No live server change, deployment, remote CI run or learning outcome is claimed. `validate:content`/`test:fixtures` remain intentionally unavailable until their future tasks.

## Historical CP1b status

**Historical CP1b:** T13–T15 portable progress and typed navigation are implemented and owner-approved for commit/push after storage/settings functional review on the owner-updated Cloudflare staging deployment; [executed evidence/file map](../tasks/cp1b-review.md). CP1a was delivered as `26e89d8`, with [hosted quality/browser CI passing](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42552847584). See native durability [contracts](STORAGE.md) and [executed evidence](../tasks/cp1a-review.md). M0 was committed/pushed through `201ed3e`, with [hosted quality/browser CI passing](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42190341112). Actual M0 device/AT/deployed-host findings remain open, not inferred from the owner's subsequent CP1a implementation authorization. Historical records below are not substituted for new evidence.

## CP1b review procedure

Build with `rtk proxy npm ci` and `rtk proxy npm run build`; preview with `rtk proxy npm run preview`, then visit `http://127.0.0.1:4173/#/settings` (stop preview before Playwright). Inspect exact [v1 file/schema/conflict limits](STORAGE.md). Do not use real private notes as automated fixtures or upload exported data.

`test:portable` exercises real File input/Blob downloads, full seven-collection round-trip, preview/no-write/explicit merge or copy, stable ID/provenance remapping, latest-record transactions, identity/capacity/collision failures, native constraint/quota rollback, future original bytes including BOM, read-only local formats, pointer recovery, six direct hash routes, back/forward, bootstrap generation/focus races and BFCache lifecycle. Test-only library routes exist only inside isolated contexts and are absent from production dist. Bounded complete synthetic fixtures are not authored missions or proof of learning.

The additional axe/keyboard/reflow suite covers empty/preview/error/future states, dark/light, 320/360/768/1280 and explicit preview/status focus. Four `portable-{dark,light}-{360,1280}.png` images are visually reviewed before ordinary comparison; prior sixteen baselines remain unchanged, with no new masking or tolerance increase. Full relevant regression counts/commands belong to the executed review ledger, not guesses from truncated output. CI explicitly adds the portable suite; **no hosted CP1b success is inferred from the owner's staging review**. Owner-reported saving/recovery and export/import/recovery findings are recorded in the checkpoint ledger; no additional device/version/AT/header findings were supplied. Actual iOS/Safari/Android, named AT, physical quota/power-loss, HTTPS and performance gates remain open. T15's typed cancellation port is tested; integrated arbitrary SQL/CodeMirror workspace and complete M1 remain T16–T18.

## CP1a review procedure (historical scope)

Build and preview with RTK, then open `http://127.0.0.1:4173/storage.html`. Creating a local case file is explicit; typing into the native draft field never executes SQL or earns evidence. Check pending/saving/committed text, reload, theme/language/motion, and local recovery download. Stop preview before automated suites own port 4173.

`rtk proxy npm run test:storage` compiles a **test-only** fixture from the real storage modules, then runs real native IDB and built-desk journeys across Chromium/Firefox/WebKit. No fake IndexedDB, production reset control or globally shipped test API. Coverage includes:

- Exact v1 keys/indexes, cryptographic seed, strict durability hint, aborted creation, late request failure after earlier success, blocked open/late connection close, versionchange and malformed existing schema.
- Two tabs, stable event-ID union, same-batch duplicates, timestamp/tab/revision ordering and stale draft writes that cannot change navigation/progress.
- Pure copied sequential migration, duplicate/mixed-future rejection, legacy-reference archival, native backup/metadata rollback and future read-only recovery.
- 500ms debounce and immediate-text hidden flush, actual reload/resume, denied convenience settings, partial/complete isolated-origin eviction, quota pause/recovery download/retry, queued-write abort and real PG worker termination plus disposable cache deletion without canonical data loss.

Storage axe/keyboard tests cover empty/ready states, both themes and 320/360/768/1280 reflow, with create-action focus restored to the draft. New four Windows/Chromium 360/1280 screenshots mask only generated campaign ID/seed; existing twelve baselines remain unchanged. These tests are not named AT, real Safari/iOS/Android, physical disk exhaustion or OS power-loss certification. Recovery JSON is not T13–T14 canonical interchange. Current CI configuration explicitly invokes the storage suite, but local evidence is not a hosted result: inspect the run for the exact pushed CP1a commit.

## CP0b status and how to review (historical)

**Local automated evidence passes; the owner approves the CP0b code commit and reports successful manual functional checks on Android Chrome and Windows.** Real Safari/iOS, named AT audits and complete deployed security-header acceptance remain open. General platform success is not inferred to include unreported VoiceOver/TalkBack/NVDA or individual IME/clipboard checks.

From the repository root (Node 24.14.1 / npm 11.5.2):

```sh
rtk proxy npm ci
rtk proxy npm run build
rtk proxy npm run preview
```

Open `http://127.0.0.1:4173/feasibility.html`. The original `/` foundation remains intact. Stop preview before running Playwright, which owns its own server. A phone's localhost is **not** this Windows computer; real-device HTTPS hosting needs the separately authorized deployment/access process.

- **Inspect SQL** / Ctrl+Enter / Command+Enter sends text only to the local parser worker. Syntax success is not query correctness or read-only safety. DELETE/modifying CTEs can parse successfully but are never executed by this demo.
- **Run fixed PostgreSQL probes** executes only the five spec §Phase-0 constants, using memory PGlite. There is no player-query execution endpoint.
- **Use native editor** retains draft, selection and undo/redo in the same in-memory editing model. **Use CodeMirror** returns to the rich editor. An actual synchronous mount error selects the native editor automatically and announces the switch.
- Draft and history survive an editor adapter switch / component reconnect **within this page**, not reload, navigation or tab closure. No IndexedDB, service worker, campaign, save, offline pack or gameplay is implemented here.

## CP0b automated matrix (historical)

Environment: Windows; built static `dist`; Playwright **1.64.1** Chromium, Firefox and WebKit. WebKit is not a real Safari/iOS audit. Tests run with restrictive preview response CSP, including the worker response; no broad `unsafe-inline` or `unsafe-eval` was added.

| Check                                                                                                                 | Chromium       | Firefox               | WebKit                |
| --------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------- | --------------------- |
| PG `version()` reports PostgreSQL 18                                                                                  | Pass           | Pass                  | Pass                  |
| DATE_TRUNC, DISTINCT ON, CTE/window, EXPLAIN JSON                                                                     | Pass           | Pass                  | Pass                  |
| Same-origin worker + three WASM + data, binary MIME / worker CSP                                                      | Pass           | Pass                  | Pass                  |
| PG18 parser, actual LEFT JOIN/count paths, modifying CTE, syntax cursor, multiple statements                          | Pass           | Pass                  | Pass                  |
| CodeMirror PostgreSQL / visible-only completion                                                                       | Pass           | Pass                  | Pass                  |
| One view through schema/theme reconfigure; selection and undo retained                                                | Pass           | Pass                  | Pass                  |
| Native switch: draft/selection/undo/redo and keyboard inspect intent                                                  | Pass           | Pass                  | Pass                  |
| Ctrl+Enter and Command+Enter; automatic mount-error fallback                                                          | Pass           | Pass                  | Pass                  |
| Debounced typed composed change event; reconnect keeps draft/history                                                  | Pass           | Pass                  | Pass                  |
| Missing worker leaves editable draft / native switch usable                                                           | Pass           | Pass                  | Pass                  |
| 360px dark/light CodeMirror and native: label, Tab exit, ≥160px/16px, no page overflow, axe AA, no console/CSP errors | Pass           | Pass                  | Pass                  |
| Desktop/360px dark/light screenshot comparison                                                                        | Pass (Windows) | Not a baseline target | Not a baseline target |
| Detailed real-device soft keyboard / IME / paste / AT / deployed policy (owner functional checks below)               | **Not run**    | **Not run**           | **Not run**           |

Full commands/results and RED→GREEN evidence are in [the checkpoint review](../tasks/cp0b-review.md). All previous foundation visual/a11y/keyboard regressions also pass. CI is wired to execute these same commands; the subsequently pushed CP0b [hosted run 41217792321](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/41217792321) failed two typed ESLint import-boundary unit tests before any browser job ran. Local success did not imply remote success. M0's CI-1 follow-up isolates the same real assertions in native Node; see the [review](../tasks/m0-review.md). The earlier successful hosted run belongs to CP0a only.

### Defects discovered and resolved locally

- Default `basicSetup` Ctrl+Enter consumed the intended action. The adapter's explicit Ctrl/Meta bindings now have highest CodeMirror precedence; the unchanged action test passes.
- Default keyword color `#770088` had **1.71:1** dark contrast. An explicit syntax highlighter now uses the already-checked accent/warning/muted tokens, with bold keyword and italic comment differentiation. No axe exclusion or relaxed contrast threshold.
- Parser's runtime `locateFile("libpg-query.wasm")` fetched a missing unhashed file and received HTML. A fail-closed build transform emits the pinned WASM through Vite's static asset graph; no package edit/substitute or CSP relaxation.
- Preview originally omitted `.data` MIME. Local preview now explicitly serves `application/octet-stream`; WASM responses are `application/wasm`. Nginx must independently implement/verify the same contract after authorization.
- Playwright's synthetic contenteditable `fill()` did not commit CodeMirror state reliably in WebKit. Editor behavioral tests now use real keyboard replacement/typing events on **all** engines rather than bypassing the view with an internal state setter. This does not certify native clipboard/IME behavior; those remain manual checks.

## Emitted assets and CSP observations

The verified local build emitted these `/assets/` URLs. Hash names may change on later builds; never manually hardcode them in the runtime. Raw sizes are file bytes, **not** throttled/real-device wire measurements.

| Asset                         | Raw bytes | Observed local MIME                                 |
| ----------------------------- | --------- | --------------------------------------------------- |
| `postgres.worker-COxQm7MC.js` | 518595    | JavaScript module, same origin; CSP header verified |
| `pglite-C0uZ7c5N.wasm`        | 9087748   | `application/wasm`                                  |
| `initdb-BnC8r6Zv.wasm`        | 300109    | `application/wasm`                                  |
| `pglite-BgbVgg6N.data`        | 6248509   | `application/octet-stream`                          |
| `libpg-query-DwCfCEfv.wasm`   | 1717872   | `application/wasm`                                  |

`tests/e2e/engine.spec.ts` attaches actual response URLs/status/MIME and worker URL to the report. `ast.spec.ts` attaches the observed AST summaries. CI preserves separate smoke/E2E/visual/a11y report directories instead of overwriting earlier evidence. `verify:vendor` also verifies emitted binary bytes against the independent installed-file baseline during `build`.

PGlite's generated Node fallback branches cause bundler externalization / direct-eval warnings. They were **not suppressed or patched**. The tested browser paths run all five probes with worker `script-src 'self' 'wasm-unsafe-eval'` and no console errors; this is evidence for these paths only, not every optional extension/backend. The output may contain unused Node/OPFS fallback chunks; no Node service or API is required.

Local CodeMirror uses Shadow DOM and constructed stylesheets in all three tested engines, retaining `style-src 'self'`. Fallback labels/help live within that same shadow root. Meta CSP in the HTML is only a partial fallback; it cannot establish worker-response/header-only controls. Preview headers apply locally; copying `dist` alone does not configure Nginx. Confirm header-only controls, MIME, TLS and injected/constructed styles on the actual host separately.

## Owner-reported manual evidence and hosted inspection

- [x] **Android Chrome functional check:** the project owner reports that all works well at `https://sql.abdtirtayasa24.workers.dev/feasibility.html`.
- [x] **Windows functional check:** the project owner reports that all works well at the same URL; the Windows browser was not specified.
- [x] **Owner code review / commit approval:** explicitly granted after these checks. Push and T08 were not requested.

These are owner-reported functional passes, not agent-observed manual audits. Device models, OS/browser versions, exact steps, AT use and the deployed source revision were not supplied. The observed HTML references the same feasibility/worker asset names as the local proof build; a filename match is not full deployment integrity certification. The owner-operated Cloudflare test URL does not silently replace the approved Ubuntu/Nginx production plan.

Read-only HEAD and GET requests to that HTTPS origin observed the same status/MIME/security-header results (large GET bodies were cancelled after reading headers):

| Resource                              | HTTP | Content-Type               | CSP response header | X-Content-Type-Options |
| ------------------------------------- | ---- | -------------------------- | ------------------- | ---------------------- |
| `/feasibility.html`                   | 200  | `text/html`                | Absent              | Absent                 |
| `/assets/postgres.worker-COxQm7MC.js` | 200  | `text/javascript`          | Absent              | Absent                 |
| `/assets/pglite-C0uZ7c5N.wasm`        | 200  | `application/wasm`         | Absent              | Absent                 |
| `/assets/initdb-BnC8r6Zv.wasm`        | 200  | `application/wasm`         | Absent              | Absent                 |
| `/assets/libpg-query-DwCfCEfv.wasm`   | 200  | `application/wasm`         | Absent              | Absent                 |
| `/assets/pglite-BgbVgg6N.data`        | 200  | `application/octet-stream` | Absent              | Absent                 |

The fetched HTML includes the target CSP **meta tag**, but meta CSP does not establish the dedicated worker response policy or `nosniff`. Correct MIME and successful operation therefore pass the reported functional checks, **not** the complete deployed-CSP criterion. No server/header configuration was modified during inspection.

## Remaining owner-operated manual acceptance

Accountable coordinator: Abdul F. Tirtayasa, already assigned in [owner actions](../tasks/owner-actions.md). Add consenting operators and actual device/browser/OS/AT versions when available; do not store participant personal data in the repository.

- [ ] Real macOS Safari: load built HTTPS proof with target response CSP; run five PG probes and parser; preserve draft and selection while reconfiguring/switching editor.
- [ ] Real iPhone/iPad Safari + VoiceOver: editing DOM name/help, touch exploration, soft keyboard/IME, newline vs keyboard inspect intent, selection/copy/paste/undo, completion menu, fallback announcement, focus visibility and reading order.
- [ ] Real Android Chrome + TalkBack: the same sequence against **both CodeMirror and native textarea**; ensure the keyboard does not cover focused input/actions and recovery never loses the current draft.
- [ ] Windows keyboard + NVDA: labels across Shadow DOM, Tab exits input, visible focus, completion navigation/Escape, one meaningful status on explicit inspection and unobtrusive native-mode announcement.
- [ ] Deployed CSP: record actual HTML **and worker** response headers, WASM/data status/MIME, same-origin URLs, engine/editor success and console/CSP findings. No implicit operational authorization; coordinate V01–V03 before touching VPS/DNS/TLS.
- [ ] Record defects, selected adapter/extension changes and repeat the failing step on the actual affected device. A device failure may choose native input; it must never substitute another SQL dialect or waive grading/save contracts.

For each run record: date, operator role (not personal contact data), device/OS/browser/AT version, build identifier, exact steps, observed result, adapter, screenshot/log references with private data removed, issue/fix and retest result. Blank rows are missing evidence, not passes.

The Android/Windows functional checks and owner code-review approval above are checked. Until the remaining specific findings are supplied, **T07's complete manual criterion and the first CP0b acceptance checkbox remain open**. CP0b was subsequently committed/pushed as `122a7fa`; the owner then authorized T08–T09 through M0, without a commit until review. Those newer instructions supersede the historical handoff restriction, not its missing factual evidence.

## M0 implementation and local evidence

Review `/technical.html` from `rtk proxy npm run build` → `rtk proxy npm run preview`. Keep the preview stopped during Playwright runs. [M0 review/file map](../tasks/m0-review.md) records predeclared slices and RED→GREEN evidence. The owner subsequently authorized commit/push and monitoring remote CI. No M0 deployment is authorized; local counts are not a hosted result.

| Check                                                      | Observed local result                                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clean `npm ci`; strict app/tool/separate-SW TS; typed lint | Pass; exact engine/parser pins and prior lock package/version identities preserved                                                                                                                     |
| `test:unit`                                                | 94 tests / 19 files passed; artifact integrity, bounded manifest/download, lifecycle/update/message validation                                                                                         |
| `build`                                                    | Pass: vendor → coupled candidate/icons → actual injectManifest → final artifact/hash/notice gates                                                                                                      |
| `test:e2e`                                                 | 66 built-app cases passed across Chromium, Firefox, WebKit; includes real syntax inspection and failure, both boot candidates and fresh offline client                                                 |
| `test:pwa-update`                                          | 9 cases passed across all three engines: actual A/B bundles, old uncached worker continuity, deferred/approved/blocked updates, second-tab draft, missing new shell, missing engine and explicit retry |
| `benchmark:boot`                                           | 9 complete cohorts, **90 timed trials**, five per strategy/condition/browser; warm-ups excluded                                                                                                        |
| `test:a11y`                                                | 30 cases passed, both themes/input adapters, keyboard skip-link/reflow and axe; not human AT certification                                                                                             |
| Visual review                                              | Four new technical images inspected; only dynamic release ID masked. Original eight baselines preserved; normal comparison is recorded in the M0 review                                                |
| Supply chain                                               | 30 shipped packages / 97 selected file hashes and emitted binary/notices; four **low** build-only audit findings remain, no moderate/high/critical                                                     |

### Boot observations and decision

[Measured samples and method](benchmarks/m0-local.json), from one uncommitted Windows build, release `m0-4365fb90-9f04-4a4b-8bfc-d8751c6ca672`. Values below are nearest-rank first-playable P75 in milliseconds, **five observations per cell**, not a mobile prediction.

| Browser engine | Cold initdb / snapshot | HTTP-warm initdb / snapshot | SW-offline initdb / snapshot |
| -------------- | ---------------------- | --------------------------- | ---------------------------- |
| Chromium       | 1667 / 723             | 1637 / 697                  | 1456 / 571                   |
| Firefox        | 1758 / 618             | 1499 / 522                  | 1607 / 566                   |
| WebKit         | 1719 / 605             | 1778 / 621                  | 1774 / 614                   |

Cold means fresh browser contexts with SW blocked, **not** cold OS/CPU. Warm uses the preview's real HTTP revalidation, not an invented production cache policy. Offline closes all pages after a verified SW-owned download, then creates fresh offline clients. Maximum observed PG WASM allocation was **197,722,112 bytes**, not total process peak memory. Shell-ready cohort P75 was 80–161 ms. Input event→next-frame P75 was about 7–28 ms by cohort/adapter; this is not INP or hardware input latency. Chromium observed zero >50ms tasks during these trials; unsupported Firefox/WebKit long-task instrumentation is **null**, not zero.

The opt-in proof pack contains 25 resources totaling **23,691,637 uncompressed artifact bytes**, including both candidates. The already-gzipped single snapshot is **4,771,634 bytes**. Separate gzip-level-9 estimates for other binaries are in the JSON; they are **not actual hosted wire transfers**. Worker Resource Timing samples do not cover every page/worker bootstrap byte. The local preview is not a compressed mobile HTTPS network.

**Decision: retain initdb as the default; snapshot selection remains blocked on real-device evidence.** The fixture favors restoration locally, but it is not representative authored mission content and cannot establish Android/iOS first-download cost, memory envelope or whole-game performance. The emitted snapshot is a labeled comparison candidate, not the adopted gameplay strategy or a per-case snapshot.

### Defects exposed by stronger tests

- `.gz` snapshot URLs were transparently HTTP-decompressed; opaque `.snapshot` plus byte checks fixes the packaging defect.
- Workbox glob@11 + the existing minimatch security override produced an empty precache. A failing real wildcard test and actual offline proof drove the scoped compatible glob@14 fix.
- Vite changed a preload chunk after generateBundle; inventory hashing moved to final writeBundle bytes and a separate negative artifact gate detects drift.
- In WebKit, a window-owned pack had 26 keys before the last page closed and zero afterward. Moving download ownership to a SW extendable message event passes fresh-client reopen and repeated offline trials. No storage-clearing or browser skip was used.
- A force-network `fetch(cache:'reload')` probe is not portable offline in Firefox. The final app needs no such page-side request: downloads are SW-owned; default cached fetch, native Request matching and actual fresh offline worker construction are tested in every engine. Delivery-only encoding/length/Vary headers are normalized while CSP/nosniff/MIME remain intact.
- Technical input initially exposed an unwired Inspect control; a RED browser test drove actual parser wiring. Injected Worker-construction failure now leaves input usable with a retry notice. Explicit skip-link tabindex fixes the observed WebKit keyboard failure.

## Remaining M0 owner-operated acceptance — not waived

Use a dedicated test profile/origin with no real player data; **never clear existing case storage to manufacture a cold benchmark**. Keep private contact details and raw personal-device logs out of Git. For every report record build release ID, device/model/RAM, OS/browser/AT versions, exact conditions/steps, raw observations, defects and retests.

- [ ] **Real ~4GB Android Chrome and iOS Safari:** ≥5 trials of each strategy in separately labeled cold, repeat and offline conditions. Retain all raw observations/failures and P75; use actual network transferred-byte evidence and platform total peak-memory measurements. The UI's PG allocation is insufficient to define a safe device envelope. Confirm foreground input/selection/undo in CodeMirror and native textarea during boots, real IME/soft keyboard, paste and Ctrl/Cmd+Enter where supported. Recheck macOS Safari/Windows target browsers too.
- [ ] **Named AT:** NVDA, TalkBack and VoiceOver task findings, including labels, status announcements, keyboard order/focus and both input modes. Automated WebKit/axe and earlier general Android/Windows success do not count as these audits.
- [ ] **Actual HTTPS origin/native install:** inspect manifest and original local 192/512px icons; install from the browser's native UI, close every app tab/window, disconnect, reopen and run both candidates plus `/feasibility.html` PG/parser probes. Only the demo is claimed offline, never an act/save.
- [ ] **Actual headers/MIME:** documents, `/sw.js`, dedicated workers, WASM, `.data`, opaque `.snapshot`, manifest and real 404s under enforced CSP/nosniff. Worker response CSP must survive offline caching; no broad inline/eval waiver. The snapshot must be delivered as opaque gzip-archive bytes without mislabeling them as an HTTP-decoded stream. Earlier Cloudflare inspection found absent CSP/nosniff response headers; no host fix or M0 deployment was performed here.
- [ ] **Actual two-release origin:** retain old immutable assets; open two tabs, create an in-memory draft, install a second release, decline first, verify no forced reload, then copy wanted text and explicitly approve. The other tab must retain its draft and old uncached worker must still load. Missing new shell/engine must remain failed/not-ready and recover on explicit retry. Do not deploy the loopback Node test fixture. Save flushing/act cache retention/rollback hardening remains T33–T34, not an M0 claim.
- [ ] **Human M0 go/no-go:** review all remaining factual gates and the provisional boot choice before T10. This software handoff does not mark the milestone accepted.

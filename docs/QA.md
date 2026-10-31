# CP0b feasibility QA

## Status and how to review

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

## Actual automated matrix

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

Full commands/results and RED→GREEN evidence are in [the checkpoint review](../tasks/cp0b-review.md). All previous foundation visual/a11y/keyboard regressions also pass. CI is wired to execute these same commands; this **CP0b revision has not run on hosted CI**; the owner authorized a local commit only, not a push. The successful prior hosted run belongs to CP0a only.

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

The Android/Windows functional checks and owner code-review approval above are checked. Until the remaining specific findings are supplied, **T07's complete manual criterion and the first CP0b acceptance checkbox remain open**. The owner explicitly authorized committing the CP0b code; do not push or start T08 without further instruction.

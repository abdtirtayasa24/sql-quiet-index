# The Quiet Index

A local-first PostgreSQL detective learning game, built with Lit, strict TypeScript, Vite and vanilla CSS. **Current checkpoint: CP0b engine/input proof, owner-approved for commit after Android Chrome and Windows functional checks. Specific AT/Safari/security-header criteria remain open.** The static foundation and isolated worker/parser/editor demo work locally. Missions, arbitrary player-query execution, grading, saves and offline play are not implemented yet. The 24-mission MVP precedes the full 80-mission season.

## Run locally

Use Node 24.14.1 and npm 11.5.2 (see `package.json`). From the repository root:

```sh
rtk proxy npm ci
rtk proxy npx playwright install chromium firefox webkit
rtk proxy npm run dev
```

Open the Vite URL. To review the actual static production foundation:

```sh
rtk proxy npm run build
rtk proxy npm run preview
```

Open `http://127.0.0.1:4173` for the unchanged foundation, or **`http://127.0.0.1:4173/feasibility.html`** for the CP0b proof desk. Inspect SQL parses but never executes your input; the PostgreSQL button runs only the five fixed spec probes. Draft/history is retained only within the current page, not saved on reload. No database/service/credentials or production Node process is required. Stop the preview before running Playwright; the harness owns port 4173 and fails instead of reusing a possibly stale server.

## Executable checks

| Script              | Current behavior / implementation owner                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `dev`, `preview`    | Local Vite servers; not production hosting                                                                                      |
| `typecheck`         | Strict app and Node/test configs, independently of transpilation                                                                |
| `lint`              | Typed ESLint, Lit rules and forbidden unsafe/main-thread engine imports                                                         |
| `format:check`      | Pinned Prettier; normative specs, generated graph and historical planning formatting preserved                                  |
| `test`, `test:unit` | Vitest; no tests selected is a failure                                                                                          |
| `build`             | Independent vendor check → Vite shell/demo → static artifact + emitted binary/notice verification; not full content/PWA release |
| `smoke:dist`        | Built foundation + real PG/AST/editor smoke on Chromium/Firefox/WebKit; offline remains T09                                     |
| `test:e2e`          | Built foundation, worker/parser, editor/metadata/fallback/shortcut/lifecycle/error checks                                       |
| `test:visual`       | Chromium Windows snapshots, dark/light ×360/1280px; compare reviewed baselines                                                  |
| `test:a11y`         | Axe AA on foundation plus CodeMirror/native in both themes/all engines; real AT still required                                  |
| `verify:vendor`     | 26 runtime inventory entries / 75 independent file hashes, licenses, pins and lock integrity; mismatch fails                    |
| `validate:content`  | **Fails intentionally:** T20 owns schemas/locales/DAG/graph validation                                                          |
| `test:fixtures`     | **Fails intentionally:** T25 owns multi-seed PostgreSQL fixtures                                                                |

At T20/T40, `build` must grow into the normative `validate:content` → content staging → Vite/custom injectManifest → full `verify:dist` release chain. CP0b's working build is not a shortcut around those future release gates. CI runs the implemented foundation/feasibility/vendor checks and preserves per-suite browser reports; it must add later release gates as they land. No successful TODO placeholders.

### Focused test selectors

```sh
rtk proxy npm run test:unit -- tests/unit/compatibility.test.ts
rtk proxy npm run test:e2e -- --project chromium --grep @smoke
rtk proxy npm run test:a11y -- --project webkit
```

Vitest filename filters and Playwright `--grep`/file filters fail when nothing matches. Do not use `--passWithNoTests`, `.only`, skipped checks or “allow failure” to make CI green. Later fixture selectors (`--mission`/`--seeds`) belong to T25 and are not supported yet.

### Visual review

`tests/e2e/__screenshots__/win32/chromium/` contains platform-specific baselines, not a claim about iOS or Linux fonts. The CI browser job uses Windows deliberately. On that platform, after intentional visual changes only:

```sh
rtk proxy npm run test:visual -- --update-snapshots
rtk proxy npm run test:visual
```

Inspect every changed image before acceptance. Never update images merely to remove a failure. HTML browser reports are generated under ignored `playwright-report/`; traces/failure artifacts under `test-results/`. Hosted CI has not run on uncommitted code.

## Architecture and review

- [Normative specification](docs/spec/SPEC-001-The-Quiet-Index-v1.1.md)
- [Architecture/boundary vocabulary and owners](docs/ARCHITECTURE.md)
- [Accepted clarification ADR](docs/adr/0001-contract-clarifications.md)
- [Design system and contrast method](docs/DESIGN_SYSTEM.md)
- [Pinned dependencies, licenses and audit exception](docs/THIRD_PARTY.md)
- [CP0b evidence and file/slice map](tasks/cp0b-review.md)
- [QA matrix and required owner-operated device/AT/deployed-CSP checks](docs/QA.md)
- [Historical CP0a evidence](tasks/cp0a-review.md)
- [Owner action checklist](tasks/owner-actions.md)
- [Implementation checklist](tasks/todo.md) and [Ubuntu/Nginx plan](tasks/vps-deployment.md)

The root shell uses static Lit reactive properties (no decorators) and light DOM for shared document landmarks/focus. The isolated editor uses tested Shadow DOM; PGlite/parser construction stays in the dedicated worker, not the UI. Engine assets are downloaded only on explicit demo use and are not part of the foundation's initial runtime requests. No state library, backend, tracker, runtime CDN or deployment change is introduced.

**Checkpoint workflow:** CP0b code review and the owner's Android Chrome/Windows functional passes are recorded in [QA](docs/QA.md). The owner authorized a local commit only; do not push, change deployments or start T08 without further instruction. Real Safari/iOS, named AT audits and complete deployed response-CSP findings remain open; automated WebKit and general functional success are not substitutes.

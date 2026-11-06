# The Quiet Index

A local-first PostgreSQL detective learning game, built with Lit, strict TypeScript, Vite and vanilla CSS. **Current checkpoint: M0 software proof, owner-authorized for Git delivery and CI monitoring. Real-device/AT/host acceptance remains open.** The static foundation, engine/input desk and opt-in offline/update/boot benchmark work locally. Missions, arbitrary player-query execution, grading and durable saves are not implemented yet. The 24-mission MVP precedes the full 80-mission season.

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

Open `http://127.0.0.1:4173` for the unchanged foundation, or **`http://127.0.0.1:4173/feasibility.html`** for the CP0b proof desk. Inspect SQL parses but never executes your input; the PostgreSQL button runs only the five fixed spec probes. Open **`http://127.0.0.1:4173/technical.html`** for the M0 benchmark, explicit PG/parser offline download and prompt-controlled updates. Its approximately 23.7 MB proof pack includes both benchmark candidates; no act or save is claimed available offline. The snapshot is experimental, not the selected gameplay boot strategy. Draft/history is retained only within the current page, not saved on reload. No database/service/credentials or production Node process is required. Stop the preview before running Playwright; the harness owns port 4173 and fails instead of reusing a possibly stale server.

## Executable checks

| Script              | Current behavior / implementation owner                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `dev`, `preview`    | Local Vite servers; not production hosting                                                                                  |
| `typecheck`         | Strict application, Node/test and separate WebWorker-only SW configs                                                        |
| `lint`              | Typed ESLint, Lit rules and forbidden unsafe/main-thread engine imports                                                     |
| `format:check`      | Pinned Prettier; normative specs, generated graph and historical planning formatting preserved                              |
| `test`, `test:unit` | Vitest; no tests selected is a failure                                                                                      |
| `build`             | Vendor → coupled snapshot/icons → Vite/custom injectManifest → final artifact/hash/binary/notice gates; not content release |
| `smoke:dist`        | Built foundation, real PG/AST/editor, benchmark and offline-reopen smoke in all three engines                               |
| `test:e2e`          | Built foundation, worker/parser, editor/metadata/fallback/shortcut/lifecycle/error checks                                   |
| `test:pwa-update`   | Serial two-release static-origin proof, stale assets/two tabs, declined/approved/failed updates and download retry          |
| `benchmark:boot`    | Five trials per strategy/condition/browser; 90 timed observations, not real-device certification                            |
| `test:visual`       | Chromium Windows snapshots, dark/light ×360/1280px; compare reviewed baselines                                              |
| `test:a11y`         | Axe AA on foundation plus CodeMirror/native in both themes/all engines; real AT still required                              |
| `verify:vendor`     | 30 shipped inventory entries / 97 selected independent file hashes, licenses, pins and lock integrity; mismatch fails       |
| `validate:content`  | **Fails intentionally:** T20 owns schemas/locales/DAG/graph validation                                                      |
| `test:fixtures`     | **Fails intentionally:** T25 owns multi-seed PostgreSQL fixtures                                                            |

At T20/T40, `build` must grow into the normative `validate:content` → content staging → Vite/custom injectManifest → full `verify:dist` release chain. M0's engineering build is not a shortcut around those future release gates. Remaining audit findings are four low-severity build-tool advisories; see [disposition](docs/THIRD_PARTY.md). CI runs the implemented foundation/feasibility/vendor checks and preserves per-suite browser reports; it must add later release gates as they land. No successful TODO placeholders.

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

Inspect every changed image before acceptance. Never update images merely to remove a failure. HTML browser reports are generated under ignored `playwright-report/`; traces/failure artifacts under `test-results/`. Local pass counts are not a hosted CI result; inspect the run for the exact pushed commit.

## Architecture and review

- [Normative specification](docs/spec/SPEC-001-The-Quiet-Index-v1.1.md)
- [Architecture/boundary vocabulary and owners](docs/ARCHITECTURE.md)
- [Accepted clarification ADR](docs/adr/0001-contract-clarifications.md)
- [Design system and contrast method](docs/DESIGN_SYSTEM.md)
- [Pinned dependencies, licenses and audit exception](docs/THIRD_PARTY.md)
- [M0 evidence, child slices and remaining acceptance](tasks/m0-review.md)
- [Measured local benchmark samples](docs/benchmarks/m0-local.json)
- [Historical CP0b evidence and file/slice map](tasks/cp0b-review.md)
- [QA matrix and required owner-operated device/AT/deployed-CSP checks](docs/QA.md)
- [Historical CP0a evidence](tasks/cp0a-review.md)
- [Owner action checklist](tasks/owner-actions.md)
- [Implementation checklist](tasks/todo.md) and [Ubuntu/Nginx plan](tasks/vps-deployment.md)

The root shell uses static Lit reactive properties (no decorators) and light DOM for shared document landmarks/focus. The isolated editor uses tested Shadow DOM; PGlite/parser construction stays in the dedicated worker, not the UI. Engine assets are downloaded only on explicit demo use and are not part of the foundation's initial runtime requests. No state library, backend, tracker, runtime CDN or deployment change is introduced.

**Checkpoint workflow:** CP0b was separately committed/pushed as `122a7fa`. The owner authorized T08–T09 through M0 using TDD and subsequently authorized commit/push with remote CI monitoring. This is Git delivery approval, not full M0 acceptance. Do not deploy or begin T10 without further instruction. M0's real Android/iOS measurements, named AT audits, actual HTTPS install/update/security-header findings and human go/no-go remain open. Automated WebKit and earlier CP0b functional acceptance do not substitute for them.

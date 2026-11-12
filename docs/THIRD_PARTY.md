# Third-party inventory — M0 engineering proof

## Reproducible toolchain

Local verification uses Node **24.14.1**, npm **11.5.2**, Windows, lockfile v3. `packageManager` records npm 11.5.2; engine ranges are Node ≥24.14.1 <25 and npm ≥11.5.2 <12. CI pins the tested Node/npm versions. Use `npm ci`, not an unlocked update. Node/npm are development/CI dependencies; production is static files, not a Node service.

Versions below are exact direct pins resolved from registry metadata, not guessed or floating tags. Root `package-lock.json` records resolved artifacts and registry SHA-512 integrity for transitive packages. npm verifies tarballs on installation; this is **not** independent verification of emitted WASM/checksums. The initial installation timed out; a subsequent clean `npm ci` succeeded, so the partial install was not accepted as reproducibility evidence.

| Package                | Version | Declared license | Reason / runtime scope                                                                           |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `lit`                  | 3.3.3   | BSD-3-Clause     | Sole UI library; current shell runtime                                                           |
| `@electric-sql/pglite` | 0.5.13  | Apache-2.0       | Normative PostgreSQL pin; dedicated-worker PG18 probes verified locally at CP0b                  |
| `libpg-query`          | 18.2.2  | MIT              | Normative parser pin; grammar 180004 / built worker verified locally at CP0b                     |
| `typescript`           | 6.0.3   | Apache-2.0       | Strict compilation; 7.x deliberately not selected because typescript-eslint 8.72.1 requires <6.1 |
| `vite`                 | 8.3.5   | MIT              | Static build/development server                                                                  |
| `vitest`               | 5.0.5   | MIT              | Pure TypeScript unit tests; compatible with selected Vite/Node                                   |
| `@playwright/test`     | 1.64.1  | Apache-2.0       | Built-app Chromium/Firefox/WebKit browser tests                                                  |
| `@axe-core/playwright` | 4.14.0  | MPL-2.0          | Automated accessibility, dev-only; not a human audit                                             |
| `eslint`               | 10.14.0 | MIT              | Static quality gates                                                                             |
| `@eslint/js`           | 10.0.1  | MIT              | ESLint recommended config                                                                        |
| `typescript-eslint`    | 8.72.1  | MIT              | Typed TS linting                                                                                 |
| `eslint-plugin-lit`    | 2.3.1   | MIT              | Lit template safety                                                                              |
| `globals`              | 17.13.0 | MIT              | Node tool lint environment                                                                       |
| `prettier`             | 3.9.10  | MIT              | Deterministic formatting                                                                         |
| `@types/node`          | 24.19.2 | MIT              | Node/tool/test declarations only                                                                 |

### CP0b editor/type additions

These are approved CodeMirror modules, not a second UI framework. Exact versions were read from registry metadata before installation; `@lezer/highlight` was already the resolved language dependency and is now direct because the accessible syntax palette imports its tag API.

| Package                    | Version | License | Scope                                                                           |
| -------------------------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `codemirror`               | 6.0.2   | MIT     | Required editor/basic setup; isolated engineering page only.                    |
| `@codemirror/lang-sql`     | 6.10.0  | MIT     | Explicit PostgreSQL dialect and visible-schema completion.                      |
| `@codemirror/state`        | 6.7.6   | MIT     | Shared draft/selection/history model and compartments.                          |
| `@codemirror/view`         | 6.43.15 | MIT     | Editor lifecycle, accessible content DOM and theme.                             |
| `@codemirror/commands`     | 6.11.1  | MIT     | Undo/redo shared with the native adapter.                                       |
| `@codemirror/autocomplete` | 6.20.4  | MIT     | Required editor completion module.                                              |
| `@codemirror/language`     | 6.13.1  | MIT     | Token-based accessible syntax highlighting.                                     |
| `@lezer/highlight`         | 1.2.5   | MIT     | SQL keyword/literal/comment highlighting tags.                                  |
| `@types/emscripten`        | 1.41.6  | MIT     | Dev-only ambient prerequisite missing from pinned PGlite's public declarations. |

Package metadata licenses were read from installed package manifests. Preserve upstream LICENSE/NOTICE obligations when distributing; these declarations are an inventory, not legal advice or a completed vendor audit. PG/parser artifact checks and notice inventory are now captured below. T09 now adds the approved PWA/Workbox tools below; CP1b adds approved Ajv save-schema compilation below; content validation remains T20. This is an inventory, not legal advice or a full audit of every upstream source component.

## Explicit transitive security resolution

The initial lock resolved `minimatch@10.2.6`, triggering **GHSA-g3hv-75wg-m249** (globparts amplification denial of service) in the dev-only ESLint/typescript-eslint dependency tree. `npm audit --omit=dev` was clean; the full audit was not. npm's proposed forced fix would downgrade ESLint to 4.x and is rejected.

The initial toolchain instead pins transitive **`minimatch@11.0.3` (ISC)** via a documented npm override. This crosses upstream consumers' major ranges, so it is a deliberate compatibility exception, not an assertion that upstream already supports that version. This dependency is used for trusted repository glob selection, never shipped to the browser. Clean `npm ci`, effective Vite config, full typed lint/unit checks, failing lint/test selector checks and full `npm audit` validate this project's used surfaces. Revisit/remove the override once upstream ranges include the patched major; every tool upgrade must retest it, not blindly inherit it.

References: [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [first patched release](https://github.com/isaacs/minimatch/releases/tag/v11.0.1). After the override, the clean install and full audit report **zero known vulnerabilities** at CP0b, before the T09 build-tool additions; that is point-in-time registry evidence, not a promise of no supply-chain risk.

## Independent pinned-artifact verification

`tools/vendor-manifest.json` is the reviewable SHA-256 baseline: **32 shipped packages / 105 selected files** (26 CP0b packages, four Workbox modules, and CP1b's explicitly inventoried Ajv/equality helper provenance). It includes every runtime package's exact version, declared license, lockfile tarball integrity and package metadata; packaged LICENSE/NOTICE/COPYING text; PG entry/root JS/FS wrappers plus WASM/data; and parser wrapper/loader/WASM. It is **not regenerated by verification**. Optional extension archives, source maps and every upstream development file are not claimed as independently file-hashed.

The PG/parser baseline was established by downloading the exact registry tarballs with scripts disabled, hashing the archives, checking the hashes against registry metadata and the lockfile, then comparing each selected installed file byte-for-byte with its archive member. Parser WASM also matches upstream package metadata `x-publish.wasmSha256`: `355c489d8b0bf2bac28b48408f656e818852d7000e1e66a67503ad2bc7cc6062`.

| Artifact                      | Independently checked registry/lock SHA-512                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `@electric-sql/pglite@0.5.13` | `sha512-4rZuxK1k07w6sSpJzjMri0B9+HuXuC7V9pxVB51pR0T9KPqXg6TD0mdaEwBA9rkcL4jdht4tGDf/wYzAiGhT7g==` |
| `libpg-query@18.2.2`          | `sha512-BOKY0X05vnxkFe+FD8JH71sSO560UKoSRv9Fsy67zapmryhqcew+4Hq0Phu8a6mcENklK7LiHJi0d0j8DbIb4A==` |

The audit found existing lock entries without `resolved`/`integrity` metadata. A fresh isolated **npm-generated** lock resolution restored registry integrity metadata; existing package/version sets were checked unchanged, with only hoisting/path normalization, then a clean `npm ci` verified the repaired lock. The lock was not hand-edited and no engine/parser pin or existing direct tool version was floated. Added runtime/type modules are the explicit pins above.

`npm run verify:vendor` checks installed selected bytes, exact research pins, all runtime inventory membership, versions, licenses and lock integrity. `build` runs it before bundling, emits `THIRD_PARTY_NOTICES.txt`, then checks every emitted WASM/data asset's bytes and notice coverage again. Fixture tests prove nonzero failures for changed checksums, license/version/lock drift, missing files, changed emitted binaries and omitted notices. No altered real installation was left behind.

Installed/ship notices are copied from upstream packages, never invented. `@lit-labs/ssr-dom-shim@1.6.0` declares BSD-3-Clause but its npm archive has no standalone license text; the baseline records its package metadata and the generated notice explicitly flags that absence. Complete upstream source-component notice/legal review remains a release follow-up, not an asserted legal certification. The verifier cannot authenticate a malicious replacement of both source and its reviewed baseline.

## T09 approved PWA tooling and audit disposition

- `vite-plugin-pwa@2.0.0` (MIT), explicitly compatible with Vite 8 and Node >=20.19; build-only. `workbox-build@7.4.1` is its resolved build dependency.
- Direct dev pins `workbox-core@7.4.1` and `workbox-precaching@7.4.1` (MIT), plus exact transitive `workbox-routing@7.4.1` and `workbox-strategies@7.4.1`. These four modules are **shipped code despite npm's dev classification**. Their licenses, package metadata and 14 selected implementation/entry files have independent baseline hashes; generated notices include all four. This does not claim every Workbox private helper is separately file-hashed.
- No virtual registration helper is imported, so `workbox-window` is build-tool transitively installed but not bundled in the page. No other UI library or runtime CDN.
- Initial installation reported five build-only findings (two low, three moderate). Actual testing also proved that Workbox's glob@11 silently found zero wildcard files under the pre-existing minimatch@11 security override. The reviewed **scoped `workbox-build → glob@14.0.3` override** fixes wildcard discovery and GHSA-3g3m-2fjr-6pw4; glob@14 explicitly depends on minimatch@11.0.2+. A RED→GREEN real-file glob test, actual 16-entry injected precache, clean install and built three-browser offline/update tests verify used behavior. It does not replace the existing minimatch override or any engine/parser pin. Existing lock package/version identities and root versions are preserved.
- Final full audit reports **four low findings, zero moderate/high/critical**: deepmerge prototype poisoning (GHSA-gcqx-w48m-w2h4) and three affected build-tool dependents. `deepmerge@4.3.1` remains the latest registry version. npm's proposed forced fix downgrades vite-plugin-pwa to 0.2.1, not a compatible Vite-8 repair. Do not run `npm audit fix --force`.
- Reachability: these packages run only while building trusted authored configuration/file globs; no SQL, player text, imports or remote data feed their merge/glob calls. The browser receives the four Workbox modules above, not these vulnerable build utilities. This is a documented **deferred build-tool risk**, not a clean full audit. Recheck upstream before T33/public release, no later than 2026-11-30; the unchanged CI audit threshold remains high. `npm audit --omit=dev` must be checked separately and does not by itself audit the shipped dev-classified Workbox modules.

## CP1b approved save-schema compiler/helper provenance

- Exact root dev dependency **ajv@8.20.0**, MIT. This same version/integrity was already installed under Workbox; npm moves it to root and retains ESLint's original Ajv 6.15.0 under ESLint. json-schema-traverse 0.4.1/1.0.0 move correspondingly. No existing name/version/tarball-integrity identity or root engine/editor/PWA version is replaced; the npm-generated lock diff was reviewed, not hand-edited.
- Strict schema compilation occurs in Node only. Existing Vite bundles standalone ESM checks plus Ajv's `ucs2length`/`equal` helpers and **fast-deep-equal@3.1.3**, MIT (also already locked). Full Ajv/compiler/URI/schema-traversal dependencies do **not** ship. No runtime code generation, browser schema fetch, CDN or CSP relaxation. The helper `.code` strings are metadata, not executed `require`; a TypeScript AST check distinguishes them from real calls.
- Appended only these two reviewed packages to the existing vendor manifest: package/license bytes, standalone generator, exact shipped helper source and equality implementation (eight additional SHA-256 checks). Previous 30 entries are unchanged. Build notices include both MIT licenses despite npm dev classification. The generated checks are hashed as final emitted assets, not committed build output.
- Authoring schema is in `schemas/save.schema.json`; generated CJS/ESM/declaration files are ignored under `generated/`. The actual minified import-validator chunk is approximately 77 kB / 9 kB gzip and is lazy-loaded on file validation/export, not the root reading/PG startup path. These are build-size estimates, not real mobile transfer/performance certification.
- Existing four low build-only deepmerge-chain findings remain tracked above; neither forced downgrades nor blanket advisory suppression was used.

Official implementation reference: [Ajv standalone generation](https://ajv.js.org/standalone.html). Version metadata came from the npm registry and installed/locked packages. Source code/customer files were not uploaded to a third-party validator.

## Actual emitted binaries

See [QA](QA.md) for actual built URLs/status/MIME observed in Chromium/Firefox/WebKit, and `vendor-manifest.json` for complete source hashes. Current source/emitted binary SHA-256 values are:

| Binary             | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `pglite.wasm`      | `90d7b3859ee8e9e9e222c63f1d4c2907606b27a29453c508ee9bae7b48a544c2` |
| `initdb.wasm`      | `0730c91ee9d6bf1c060c618c7c1ca1adcbb14191828ef794a4d77a85f66d965f` |
| `pglite.data`      | `2e46ee079b4a922f7514f2d6d17099bbcb2ac26b7db4938374d663caa07b435e` |
| `libpg-query.wasm` | `355c489d8b0bf2bac28b48408f656e818852d7000e1e66a67503ad2bc7cc6062` |

The pinned parser's runtime filename was invisible to Vite. The exact-expression worker-build adapter now emits a hashed same-origin WASM URL and fails if that upstream loader expression changes. Installed files and these binary hashes are unchanged. PGlite's browser-irrelevant Node fallback/eval build warnings remain visible; tested browser code paths pass restrictive local worker CSP without allowing broad eval.

Desktop automated proof does not establish real Safari/iOS/Android/AT usability, deployed HTTPS/CSP, boot performance, offline readiness or SQL grading. Those gates remain explicit in [QA](QA.md) and the task checklist.

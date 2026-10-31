# Third-party inventory — CP0a

## Reproducible toolchain

Local verification uses Node **24.14.1**, npm **11.5.2**, Windows, lockfile v3. `packageManager` records npm 11.5.2; engine ranges are Node ≥24.14.1 <25 and npm ≥11.5.2 <12. CI pins the tested Node/npm versions. Use `npm ci`, not an unlocked update. Node/npm are development/CI dependencies; production is static files, not a Node service.

Versions below are exact direct pins resolved from registry metadata, not guessed or floating tags. Root `package-lock.json` records resolved artifacts and registry SHA-512 integrity for transitive packages. npm verifies tarballs on installation; this is **not** independent verification of emitted WASM/checksums. The initial installation timed out; a subsequent clean `npm ci` succeeded, so the partial install was not accepted as reproducibility evidence.

| Package                | Version | Declared license | Reason / runtime scope                                                                           |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `lit`                  | 3.3.3   | BSD-3-Clause     | Sole UI library; current shell runtime                                                           |
| `@electric-sql/pglite` | 0.5.13  | Apache-2.0       | Normative PostgreSQL pin; installed, not loaded at CP0a                                          |
| `libpg-query`          | 18.2.2  | MIT              | Normative parser pin; installed, not loaded at CP0a                                              |
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

Package metadata licenses were read from installed package manifests. Preserve upstream LICENSE/NOTICE obligations when distributing; these declarations are an inventory, not legal advice or a completed vendor audit. PGlite/PostgreSQL/WASM notices, parser artifacts and emitted asset hashes must be independently captured in T05/T06 before release. CodeMirror, PWA/Workbox and Ajv are approved future dependencies introduced by T07/T09/T20 respectively, not extra CP0a runtime weight.

## Explicit transitive security resolution

The initial lock resolved `minimatch@10.2.6`, triggering **GHSA-g3hv-75wg-m249** (globparts amplification denial of service) in the dev-only ESLint/typescript-eslint dependency tree. `npm audit --omit=dev` was clean; the full audit was not. npm's proposed forced fix would downgrade ESLint to 4.x and is rejected.

The initial toolchain instead pins transitive **`minimatch@11.0.3` (ISC)** via a documented npm override. This crosses upstream consumers' major ranges, so it is a deliberate compatibility exception, not an assertion that upstream already supports that version. This dependency is used for trusted repository glob selection, never shipped to the browser. Clean `npm ci`, effective Vite config, full typed lint/unit checks, failing lint/test selector checks and full `npm audit` validate this project's used surfaces. Revisit/remove the override once upstream ranges include the patched major; every tool upgrade must retest it, not blindly inherit it.

References: [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [first patched release](https://github.com/isaacs/minimatch/releases/tag/v11.0.1). After the override, the clean install and full audit report **zero known vulnerabilities** at this checkpoint; that is point-in-time registry evidence, not a promise of no supply-chain risk.

## Outstanding vendor gates

`verify:vendor` deliberately exits nonzero with T05 ownership until independent package/license/asset checks exist. Pinning and installation alone do not prove PostgreSQL 18 execution, browser parser entrypoints, acceptable CSP, native mobile behavior or same-origin WASM/data packaging. Never mark those gates complete from this inventory.

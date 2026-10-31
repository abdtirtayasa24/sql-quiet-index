# Architecture and boundary vocabulary

## Authority and current scope

[SPEC v1.1](spec/SPEC-001-The-Quiet-Index-v1.1.md) is normative. [ADR-0001](adr/0001-contract-clarifications.md) records owner-approved D01–D13 without editing that specification. [ADR-0002](adr/0002-ubuntu-vps-nginx.md) selects static Ubuntu/Nginx hosting.

CP0a implemented the static Lit foundation and quality infrastructure; the owner approved and committed it through `7882873`, with hosted CI passing. CP0b adds a separate `/feasibility.html` engineering proof: dedicated memory PostgreSQL worker, pinned parser inspection and CodeMirror/native input. Local automated evidence passes, but real-device/AT and deployed-CSP acceptance remain open. Neither checkpoint implements offline play, durable saves, gameplay or learning-outcome proof. MVP is 24 complete missions (001–024), Acts 1–3; the full season is 80 missions. Later missions, placements, mixed-assessment UI, writable labs and optional study features are not silently included in this checkpoint.

## Boundaries (spec §§7–12)

```text
Lit views: render state / emit typed intents
    → app orchestration: hash navigation, immutable snapshots, coordination
        → gameplay: pure unlock / mastery / rank / evidence rules
        → progress repository: canonical native IndexedDB transactions
        → engine client: correlation, watchdog, worker restart
            → dedicated per-tab worker: parser, grader, memory PGlite
        → content loader: validated same-origin release/mission assets
        → service worker: disposable versioned asset caches, prompt updates
```

At CP0a only the static view/bootstrap and feature-notice modules existed. CP0b implements the probe client/protocol/worker/parser and isolated editor adapters. Remaining diagram arrows describe intended boundaries, not already implemented APIs. Do not call architectural pseudo-code as if it were a vendor SDK method.

| Vocabulary       | Contract / owner                                                                                                                                                                                                  | Implementation slice |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Session          | A fresh identity for one worker lifetime, distinct from campaign identity; termination invalidates every outstanding request.                                                                                     | T05/T18              |
| Request          | Structured-clone-safe discriminated message with `type`, `sessionId`, monotonically increasing `requestId`; runtime-validated at both ends. Ignore stale results. No invented parser/driver fields before spikes. | T05/T06/T18          |
| Mission          | Stable three-digit inventory ID, case ID, content/schema version, seed profile, variant, visibility, concept role and rubric. Published playable registry is separate from 80-ID outline.                         | T19/T20              |
| Dataset identity | Campaign seed + content version + case ID identifies shared case facts; specified mission RNG adds mission ID/variant for local rows, without changing case facts.                                                | T19                  |
| Typed result     | Ordered field descriptors (name + verified PG type OID) and row arrays; preserve duplicate names, multiplicity, NULL and lossless numeric/date values. Full comparison precedes preview truncation.               | T05/T22              |
| Run / check      | Run is current-seed preview; check adds declared AST constraints and counterexamples. Neither automatically secures evidence.                                                                                     | T22–T25              |
| Verified result  | Ephemeral query/mission/seed/version-bound verification, invalidated when its inputs change. Not a persisted solve.                                                                                               | T25/T26              |
| Filed evidence   | Explicit selection of valid rows with SQL/hash, typed row keys, source record refs and version/seed provenance; atomically commits solve, evidence and concept event before success announcement.                 | T26                  |
| Campaign / save  | Canonical IndexedDB play records; localStorage only settings/pointer; Cache API only recoverable assets; PGlite memory is disposable.                                                                             | T10–T14              |
| Completion       | Evidence-bearing mission completes on successful filing transaction, not on a query verdict. Practice completion is a distinct no-story-evidence transaction.                                                     | T26/T31              |
| Item / mastery   | Distinct authored `itemId`, not SQL text or another seed; at least three genuine items where needed to reach familiar without deadlock. Only mixed assessment may demote mastery.                                 | T28/T29              |

Store vocabulary follows spec §12: campaigns, missionStates, attempts, evidence, notes, conceptEvents, verdicts, backups, meta. Compound index key paths and runtime save schemas are frozen and tested in T11/T14, not guessed in this shell. Export is bounded canonical UTF-8 JSON with SHA-256 accidental-corruption detection, never authentication. D13's numeric per-record limits remain a T14 design deliverable within 5 MiB.

## Foundation implementation decisions

- Lit is the only component/rendering library. Static reactive-property declarations; no decorators, `experimentalDecorators` or decorator transform. `declare` fields avoid shadowing Lit accessors under standard class-field semantics. Escaped templates only.
- App TypeScript uses strict mode, unchecked-index protection, DOM libraries and ES modules. Node/test tools have a separate strict config; no server runtime ships. Vite excludes PGlite from dependency optimization and emits ES-format workers. T05 now proves the dedicated built worker. Ambient `@types/emscripten` and `ESNext.Disposable` declarations satisfy the pinned vendor types without `skipLibCheck` or changing the ES2022 runtime target.
- No PGlite/parser import on the UI thread. Only the explicit engineering page loads CodeMirror; engine/parser initialization occurs in its dedicated worker after an explicit probe/inspect action. The original foundation does not fetch those binaries. PWA/Ajv remain future slices.
- Dark charcoal investigation-desk palette, system fonts and vanilla CSS follow spec §13. No external fonts, images, scripts, accounts, API calls or trackers.
- Current shell is a reading surface. No fake Start/Run/Save buttons or invented working game. Boot/no-JS/load-error notices remain readable if the application cannot start.

## CP0b verified engine/input contracts

- `EngineClient` creates one dedicated ES module worker per client lifetime. A fresh session UUID and monotonically increasing request ID correlate runtime-validated messages; malformed/stale/wrong-kind replies do not resolve a pending promise. Disposal/error/message-clone failure reject all pending work. The 60-second **spike transport/boot deadline** terminates the worker; it is not the later gameplay query watchdog or full T18 restart/mission recovery.
- Worker commands are deliberately only `PROBE` (five fixed spec smoke statements) and `PARSE` (≤12,000 characters). Requests are serialized against one memory PGlite instance. Arbitrary editor SQL is **never executed**. No mission loader, state-changing query lab or story safety/grading allowlist has been smuggled into feasibility work.
- Probes return ordered field descriptors (`name`, actual `dataTypeID` as `typeOid`) and row arrays. INT8 and TIMESTAMPTZ probe parsers retain text. This proves the driver seam, not complete T22 lossless canonicalization for every PG type.
- `parseSql` returns a discriminated inspection outcome with parser version, top-level statement kinds and observed node paths, or a typed message and optional **upstream cursorPosition unchanged**. Current grammar version is `180004`. The adapter walks the actual tree, including nested CTE/subquery nodes, with an explicit inspector nesting ceiling; it does not classify a query as safe from its top-level statement.
- Pinned parser packaging uses an exact-expression, fail-closed worker-build transform from `locateFile("libpg-query.wasm")` to a Vite-recognized static `new URL`. Installed vendor files remain unchanged and checksum-verified. This is an asset-loader adapter, not a parser substitute; upgrades must repeat the packaging/browser gate.
- The editor mounts one `EditorView` per connected rich-editor adapter. SQL dialect and dark/light appearance are compartments; reconfiguration preserves view identity, draft, selection and undo. The actual editing DOM receives its name/help. Only explicitly visible tables/columns enter SQL completion configuration.
- One in-memory `EditorModel` preserves CodeMirror history through a native textarea adapter switch/reconnect. Native mode has matching inspect shortcut, current draft, selection and undo/redo and an unobtrusive status announcement. `sql-change` is a typed bubbling/composed 500ms-debounced event; local input is immediate. This is not a save repository or query-attempt history.
- CodeMirror's default Ctrl+Enter action is overridden with highest-precedence explicit Ctrl/Meta bindings. Its low-contrast default syntax palette is replaced with checked semantic tokens. Shadow DOM constructed stylesheets work under local `style-src 'self'` in all tested engines; no broad inline/eval permission was added.

### Observed PG18 AST paths (fixture-relative, not guessed)

Let `S = $.stmts[0].stmt.SelectStmt` for the documented SELECT fixtures.

| Construct                   | Actual path / value                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top-level statements        | `$.stmts[i].stmt` object keys, e.g. `SelectStmt`, `DeleteStmt`; multiple statements remain distinct.                                                                   |
| LEFT JOIN                   | `S.fromClause[0].JoinExpr.jointype = "JOIN_LEFT"`; `larg`/`rarg` hold `RangeVar` wrappers.                                                                             |
| Function spelling (`count`) | `S.targetList[1].ResTarget.val.FuncCall.funcname[0].String.sval = "count"` in the two-target join fixture. A `FuncCall` is not by itself proof of aggregate semantics. |
| Grouped column              | `S.groupClause[0].ColumnRef.fields[*].String.sval`; qualifier/column order retained by upstream tree.                                                                  |
| FROM subquery               | `S.fromClause[0].RangeSubselect.subquery.SelectStmt`.                                                                                                                  |
| CTE                         | `S.withClause.ctes[i].CommonTableExpr.ctequery`; `withClause` is an inline lower-case property, **not** a `WithClause` wrapper key.                                    |
| Recursive CTE               | `S.withClause.recursive = true`; inner SELECT/set-operation nodes are walked too.                                                                                      |
| Nested CTE                  | Outer `CommonTableExpr.ctequery.SelectStmt.withClause.ctes[...]` contains another `CommonTableExpr`.                                                                   |
| Modifying CTE               | `S.withClause.ctes[0].CommonTableExpr.ctequery.DeleteStmt` despite the top-level `SelectStmt`.                                                                         |
| Syntax error                | `SELECT FROM` returns `SqlError.sqlDetails.cursorPosition = 11`; adapter preserves that upstream coordinate rather than guessing a JS offset conversion.               |

Actual local assets/MIME/CSP, automation and manual blockers are in [QA](QA.md); independent file hashes/license inventory are in [THIRD_PARTY](THIRD_PARTY.md). These proofs do not waive the later function/relation allowlist, exact result comparison, query limits or grading gates.

## Compatibility and recovery policy

Feature detection, not user-agent guessing: secure context, dedicated Worker, WebAssembly, IndexedDB and Cache API are needed by the planned game. A missing capability shows a named compatibility notice and preserves reading. This is a presence check, not proof of storage permission or engine boot; actual failures need T05/T11 recovery paths. JavaScript-disabled browsers retain static introduction and an explanatory notice. Module-load failure retains a readable boot/error fallback. A production `vite preview` is used for browser tests; dev-server success is insufficient.

Future unsupported-save handling (T13/T14) preserves original future-version bytes, read-only reading and export; never downgrade or clear saved work. CP0a has no saves to export and does not claim export implementation. Real iOS Safari, Android and assistive-tech audits remain mandatory at T07/T08/T36.

## Owner and factual-access register

| Requirement                                                        | Accountable coordination                                                          | Facts / evidence still required                                                                 | Gate                              |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Ubuntu VPS, existing Nginx sites, SSH/sudo and DNS/TLS permissions | Abdul F. Tirtayasa (project owner), explicitly accepted coordination during CP0a. | IP, Ubuntu version, sites, permissions, ACME contact; no live operations authorized here.       | T01 ownership; V01–V03 live proof |
| Device and assistive-tech coverage                                 | Abdul F. Tirtayasa (project owner), explicitly accepted coordination.             | Named Android/iOS/Safari/Windows device operators and NVDA/VoiceOver/TalkBack access.           | T01 ownership; T07/T08/T36        |
| Silent act playtests                                               | Abdul F. Tirtayasa (project owner), explicitly accepted coordination.             | Consenting 5–7 participants per act and observer; no participant invented.                      | T01 ownership; T38                |
| Local CP0a implementation / automated evidence                     | Coding agent, under owner review                                                  | Commands, screenshots and gate-negative proofs in [checkpoint review](../tasks/cp0a-review.md). | CP0a                              |

Ownership assignments are confirmed; actual access and test results remain open. The owner's actionable checklist is [tasks/owner-actions.md](../tasks/owner-actions.md). No real-device, remote-host or human-review pass may be inferred from automation.

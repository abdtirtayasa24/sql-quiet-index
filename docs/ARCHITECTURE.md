# Architecture and boundary vocabulary

## Authority and current scope

[SPEC v1.1](spec/SPEC-001-The-Quiet-Index-v1.1.md) is normative. [ADR-0001](adr/0001-contract-clarifications.md) records owner-approved D01–D13 without editing that specification. [ADR-0002](adr/0002-ubuntu-vps-nginx.md) selects static Ubuntu/Nginx hosting.

CP0a implements only a static Lit foundation and its quality infrastructure. It does not prove PostgreSQL execution, parser compatibility, offline play, save durability or learning outcomes. MVP is 24 complete missions (001–024), Acts 1–3; the full season is 80 missions. Later missions, placements, mixed-assessment UI, writable labs and optional study features are not silently included in this checkpoint.

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

Only the static view/bootstrap and feature-notice modules exist at CP0a. Diagram arrows describe intended boundaries, not already implemented APIs. Do not call architectural pseudo-code as if it were a vendor SDK method.

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
- App TypeScript uses strict mode, unchecked-index protection, DOM libraries and ES modules. Node/test tools have a separate strict config; no server runtime ships. Vite excludes PGlite from dependency optimization and emits ES-format workers; no worker is claimed until T05.
- No PGlite/parser import on the UI thread; pinned packages are installed but not loaded by the shell. CodeMirror/PWA/Ajv arrive in their owning slices rather than bloating this foundation.
- Dark charcoal investigation-desk palette, system fonts and vanilla CSS follow spec §13. No external fonts, images, scripts, accounts, API calls or trackers.
- Current shell is a reading surface. No fake Start/Run/Save buttons or invented working game. Boot/no-JS/load-error notices remain readable if the application cannot start.

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

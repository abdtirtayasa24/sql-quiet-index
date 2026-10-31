# Implementation Plan: The Quiet Index

**Status:** Full plan approved; planning baseline committed/pushed as `d2aab41`. CP0a was owner-reviewed and committed/pushed through `7882873`; [hosted CI](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/41208362500) passed quality and built-browser jobs. T05/T06 and automated T07 through CP0b are implemented using TDD and locally verified. The owner reports successful Android Chrome and Windows functional checks on the Cloudflare proof URL and authorizes the CP0b local commit. Named AT/Safari and full deployed response-CSP criteria remain open; no push or T08 work is authorized. No live VPS changes are authorized. See [CP0b review](cp0b-review.md).  
**Baseline:** `docs/spec/SPEC-001-The-Quiet-Index-v1.1.md` (normative), with `docs/spec/SQL-Game-Research-Reports.md` as supporting research.  
**Execution checklist:** [`todo.md`](todo.md). Task IDs below refer to that file.  
**Planning baseline:** two specification documents and MIT `LICENSE`; application implementation began only after the approved planning commit/push. Current authorized scope is T05–T07 through CP0b, using TDD, with no commit until separately requested; see [checkpoint review](cp0b-review.md).

## 1. Overview and release boundaries

Build a free, account-free detective learning PWA at `https://sql.thetirtayasa.my.id`. The differentiator is evaluating real PostgreSQL queries and explaining misconceptions, not checking a suspect's name. Browser-local execution, durable evidence provenance, and a reproducible content-validation pipeline are core product features.

Implement spec Phases 0–4 first: **24 playable missions, Acts 1–3**, ending in a coherent guard-exoneration investigation. Full v1 delivers **80 missions across ten acts** and the advanced three-claim finale. Do not advertise the MVP as the complete advanced curriculum. This plan details MVP engineering and per-mission work; later-act production is gated by reviewed DDL/content designs rather than speculative implementation of the compact schema lists.

### MVP deliverable ledger

| Deliverable | Required acceptance evidence |
|---|---|
| 24 missions, IDs `001`–`024` | Every mission playable from a new campaign; stable IDs and reproducible seed fixtures |
| SQL solutions | ≥24 reference queries **plus ≥48 independently authored correct variants**; minimum three executable correct solutions per mission, not counting five seeded runs as five solutions |
| Misconceptions | ≥72 wrong-query fixtures, ≥3 per mission; no known-wrong fixture receives `verified` |
| Learning/story | 24 briefings, 96 hint rungs, six short teaching interludes, three act summaries, explicit wrap-ups |
| Investigation | Three independently accessible proof routes per load-bearing finale conclusion; authored wrong-inference remediation |
| Reliability | Atomic evidence saves, draft/history recovery, versioned export/import, two-tab merge, worker recovery, update-safe offline packs |
| Quality | All spec gates, measured device performance, keyboard/AT audits, 5–7 silent playtest participants per act |
| Season planning | All 80 IDs/concepts/arcs catalogued; unimplemented missions cannot accidentally become playable |

Should-priority offline/PWA capabilities are included in MVP because R-033 and the Phase 1/4 acceptance criteria explicitly require them. Schema inspection, notes and Cold Cases are included where required by the phase definitions. English is complete in MVP; stable localization keys and locale-ready services are foundational. Bahasa Indonesia production is Phase 5 unless separately approved earlier. No compulsory account, backend, trackers, paid hint system, timer, live AI hints, or runtime third-party CDN.

## 2. Source precedence and approved clarification decisions

The revised specification supersedes incompatible report recommendations: dedicated per-tab **memory** database (not shared persistent PGlite), **required CodeMirror** with audited textarea fallback (not textarea-first), no mandatory hint dwell, hash routes, mastery/rank thresholds as defined in the spec. Reported Node timings and learning statistics are not browser guarantees or product outcomes.

**Approval record:** The project owner explicitly approved all thirteen proposed dispositions, D01–D13, in the follow-up planning request. These dispositions are now accepted implementation guidance; T01 records their detailed contracts and remaining factual unknowns rather than requesting the same approval again. Acceptance does not mean the feasibility spikes, schemas, content or tests have already passed. Original specification text remains unchanged.

| ID | Finding / risk | Approved disposition |
|---|---|---|
| D01 | Engine/parser versions are research-pinned, not verified here in browsers. | Registry metadata confirms `@electric-sql/pglite@0.5.13` and `libpg-query@18.2.2` exist with Apache-2.0/MIT metadata. Preserve pins; test emitted assets, PostgreSQL version, parser entrypoint/AST and licensing before selecting adapters. Stop on failure; alternatives need ADR approval. |
| D02 | Case relationships must remain consistent although mission RNG includes mission ID. | Keep the specified mission PRNG unchanged. Define a separate deterministic case-identity mapping from campaign seed + content version + case ID; mission generators reference that mapping, then use mission RNG for local rows/decoys. Implement this approved additional seed contract before authoring. Test the same staff/vehicle/timestamps across missions. |
| D03 | `familiar` needs ≥3 distinct assessed items; early concepts such as self-join may have only one teaching mission. Act synthesis can otherwise deadlock. | Author deterministic practice items for every act-critical concept, accessible once attempted; seed variants of the SAME `itemId` never count as distinct. Add at least three genuinely different items where needed and simulate a novice reaching every synthesis. Mixed assessment UI can remain post-MVP, but the pure mastery reducer must support all states. |
| D04 | Protocol examples omit `sessionId` although surrounding contract requires it. | Require `sessionId` on every message plus monotonic `requestId`; new session on termination. Use runtime guards for messages and reject stale results. |
| D05 | Graph example uses `a3.absent_gate_scan`, mission 023 uses `a3.guard_absent_gate_scan`; self-join inventory description differs from a later boss example. | Use one stable evidence ID registry and the inventory's exact self-join objective (two staff sharing a supervisor). Maintain the inventory objective unless amended; teach two logical table roles without changing the puzzle to employee/supervisor comparison accidentally. |
| D06 | Example mission 023 is `spike`, but 024 is synthesis, not a rest; mission 021 is also described as mini-boss. | Author reviewed role metadata for all 24, with mission 022 as a possible rest. Any synthesis exception must be explicit and playtested; schema must represent exception justification rather than silently bypass the sawtooth lint. |
| D07 | Case example says `requiredPaths: 3`; prose also permits two independent high-confidence branches + reconciliation. Optional-clue removal requires one surviving route, not necessarily all three. | Declare per-case resolution policy and mandatory/optional clues explicitly. Prove three routes are initially accessible and the stated optional-removal robustness. Separately prove the selected resolution policy remains achievable; no build-time robustness claim may hide a runtime three-path deadlock. |
| D08 | Acceptance-time atomic save wording conflates query verification with explicit row filing. | Run/check yields an ephemeral verified result. Explicit row filing atomically records mission solve, provenance, concept event and campaign timestamp; only then announce secured evidence. If separate completion is needed for no-evidence practice, define a distinct transaction. |
| D09 | Manifest sample lacks `caseId`, explicit seed/version/comparison exceptions, and complete evidence dependencies; file listing and `referenceQueries` examples differ. | Freeze a schema design note before implementation: include required case/seed/constraint metadata deliberately, retain namespaced extensions only by policy, distinguish 80-ID outline from published playable registry. `variants.sql` may contain documented named blocks expanded into generated reference assets. Wrong queries remain individually referenced SQL files. |
| D10 | Canonicalization demands raw bigint/numeric/date precision; preview limits do not bound driver allocation. | Spike row-array mode and custom type parsers. Enforce full graded maxRows separately from the 200-row/12-column preview. Test giant result/cell workloads and worker termination; document residual tab-memory risk rather than promise complete sandboxing. |
| D11 | Hosting is now selected: owner-managed Ubuntu VPS with Nginx. VPS address/Ubuntu version, existing sites, SSH/sudo/DNS access, actual devices/AT and playtest participants remain unverified. | Use static Nginx hosting as detailed in [the VPS deployment plan](vps-deployment.md); identify access/test owners before live work. Local static proof is not `GATE-DEPLOY`; Playwright WebKit is not real iOS Safari, nor axe a human audit. Leave affected gates open until actual evidence exists. |
| D12 | Final verdict text “0–2 claims need another look” is ambiguous when all three claims fail. | Before A10, define truthful batch feedback for 0/1/2/3 failures without identifying individual failed claims; do not tell a three-failure submission that ≤2 are wrong. |
| D13 | Import count/string ceilings and concurrent draft ordering are not fully quantified. | Freeze documented per-record/count limits within 5 MiB; deterministic conflict policy (updated timestamp then stable tie-break) and migration backup scope. Do not use client time as a security guarantee. |

D01, D02, D03, D05–D10 still require implementation/verification gates for their affected slices, not renewed disposition approval or unapproved substitutes. The Phase 0 gate may use isolated demos while approved content contracts are specified and tested. D12's exact finale feedback wording and D13's numeric import limits still need detailed design within the accepted dispositions.

## 3. Architecture decisions

### Runtime boundaries

```text
Lit views / CodeMirror adapter
        | typed user intents; immutable view models
App services / hash router / orchestration
        +-- gameplay: unlocks, mastery, rank, evidence, case graph
        +-- storage: native IndexedDB transactions, settings, import/export
        +-- engine client: request correlation, watchdog, restart
                    | structured-clone-safe protocol
           per-tab dedicated module worker
             parser adapter / AST allowlist
             grading / typed results / diagnosis
             disposable memory:// PGlite PG18
             serial counterexample reset + restore
        +-- content loader: validated release/content manifests
        +-- PWA: version-pinned assets and explicit offline packs
```

- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`), Lit `tqi-*` elements, Vite, vanilla CSS tokens only. Pure domain functions import neither DOM nor Lit. No direct IndexedDB or PGlite calls from components.
- Use an authored typed hash router and immutable app snapshots; no global bus/state package. Typed CustomEvents must cross Shadow DOM boundaries intentionally (`bubbles`/`composed` where needed).
- Keep parser and execution in the worker so parsing huge/nested input cannot block UI. The client orchestrates, the worker grades. Worker implementation may be decomposed into pure engine modules; all PGlite construction remains worker-only.
- Prefer explicit static Lit reactive-property declarations for initial implementation, avoiding decorators entirely. If decorators are selected during spike, document one supported mode and tsconfig semantics; never mix modes.
- Native browser IndexedDB, localStorage, Cache API, File/Blob/crypto APIs. Ajv is primarily build/import-boundary code, not an eager gameplay dependency. No dependency added without rationale.
- Pin approved engine/parser exactly; resolve other compatible versions during bootstrap, record Node/npm toolchain and checksums/licenses, commit lockfile only during implementation. No guessed versions in this plan.

### Engine lifecycle and query protocol

States: `booting → ready → loadingMission → editing → running/checking → verified/partial/error`, plus `recovering` and `unsupported`. Serialize work against the single PGlite connection. Navigation/reset cancels outstanding work; session IDs prevent late result acceptance. Capture/retain current draft independently of database lifetime.

`Run SQL` performs safety-checked current-seed execution and preview without story awards. `Check Investigation` validates shape, typed rows/multiplicity/order, declared concepts and at least two short counterexamples for mistake-prone missions. Only verified current-seed results can be filed. Use the same pure engine/grader/seed modules in fixtures and runtime to avoid two inconsistent graders.

Start with **serial reset/reseed/restore in the same worker** for counterexamples to avoid multiplying low-memory mobile DB footprints. Suppress UI dataset changes during checks; in `finally` restore the live mission seed before accepting another command. Cache expected outputs by contentVersion/mission/seed/variant. If measurements reject serial restoration, compare a temporary isolated engine instance and record memory/latency trade-off before changing policy.

Every request carries sessionId/requestId, validates mission/version, and is correlated to a pending promise. Reset rejects all pending promises with `ENGINE_RESET`; restart rebuilds exact mission/seed and restores draft. No claim of instantaneous SQL interruption.

### Grading and safety

1. Input ceiling 12,000 characters; exactly one supported top-level SELECT in story mode.
2. Parse AST; recursively inspect CTEs, subqueries, function/range calls and relation references. Deny modifying CTEs, state changes, external I/O, volatile/non-deterministic/dangerous functions. Catalog access is mission-scoped. Do not equate top-level SELECT with read-only safety.
3. Execute player SQL through `query`, never `.exec`, in a tested read-only transaction. Trusted schema/seed SQL may use `.exec`. Set a tested timeout and always rollback/clean up on failure.
4. Typed shape comparator includes columns/order/names/type OIDs as declared. Use row arrays to preserve duplicate column names; lossless tagged canonical values for NULL, bigint, numeric text, DATE, TIMESTAMPTZ, JSONB, arrays, UUID and booleans. JSONB object-key order must not change semantic equality; arrays and duplicates retain order/multiplicity appropriately.
5. Unordered **multiset**, not set; exact ordered comparison only for ordered tasks, with deterministic ties. No percentage-correct verdict from overlap.
6. Targeted AST rules apply only when explicitly teaching a construct. Practice/capstones accept functional alternatives such as NOT EXISTS.
7. Diagnose deterministically: unsupported → syntax/SQLSTATE → empty/shape → missing join/Cartesian product → type/grouping → cardinality/content → ordering → target concept. One primary hint, at most two secondary details.
8. Explicit evidence selection records query text/hash, typed row keys, source record refs, mission/content version/seed/variant. Do not infer arbitrary SQL lineage with a general solver: authors declare mission evidence extraction/valid-row mappings, validated across seeds.

Desktop query watchdog 2,500ms, low-end mobile 5,000ms (provisional); max 1,000 graded rows, 200 preview rows, 12 preview columns. A legitimate full result must be compared before preview truncation. Exceeding a limit is not correctness. Bound serialized payloads and cell display as well as rendered rows; stress-test memory and report limitations.

Writable labs and EXPLAIN ANALYZE write behavior are excluded until A10's separate disposable lab. Do not widen ordinary story permissions to prepare for them.

### Persistence and recovery

Implement all v1 stores from spec §12: campaigns, missionStates, attempts, evidence, notes, conceptEvents, verdicts, backups, meta. Define actual compound index key paths, not just index names. Stable event IDs prevent duplicate completion/mastery/rank; rederive rank from solved IDs.

- Campaign ID/seed committed immediately; SQL drafts debounce at 500ms, flush on hidden visibility and before approved update/navigation where possible. Never rely on beforeunload.
- Query acceptance is not yet durable evidence. Explicit filing waits for IDB transaction `complete`; abort causes no partial solve/evidence/concept write and no success announcement.
- Two tabs use independent SQL workers but shared transactional progress; merge evidence/completions by ID, drafts by approved newest-wins/tie policy. Read latest canonical records inside write transactions to avoid stale-snapshot overwrite.
- Keep latest 50 attempts per mission, summarize older diagnostic counts; do not retain old raw SQL without a notebook request.
- Pure sequential save migrations on copied records with rollback/backups, stable IDs, unsupported-future read-only preservation, legacy evidence archival. Content updates never silently revoke solved missions.
- Export canonical UTF-8 JSON excluding integrity field, recursively sort object keys, SHA-256 integrity check (not authentication). ≤5MiB import, runtime schema/length/count checks, disallow pollution keys at every depth, preview and explicit merge/new-copy; copy mode rewrites **all** campaign references consistently. Preserve original future-version input bytes for user export.
- Handle unavailable storage/quota/eviction honestly: in-memory recovery/export, pause further evidence writes, clear save status. A surviving localStorage pointer can detect some missing campaigns, but **complete origin eviction removes pointer too**; never claim universal loss detection.
- Persist request only after user gesture; export reminders after acts. Cache and PGlite data are disposable, never save backups.

### Offline and deployment

Build: validate content → stage into gitignored `public/content` with release manifest → Vite static build + custom `injectManifest` → verify dist → write/verify release hashes. Avoid a self-referential hash: the release manifest's hash map excludes its own bytes (or uses a detached digest); document finalization ordering so SW entries reference final assets.

Precache lean shell and first-act **metadata**, not all engines, snapshots or acts. Release manifest network-first with cached fallback; immutable hashed binaries cache-first. Explicit per-act download records readiness only after every required engine/parser/seed/text artifact is verified. Interrupted downloads never show “offline ready.”

Prompt-controlled SW activation: no unconditional skipWaiting/clientsClaim, no forced reload. Flush and commit progress before accepting an update. Keep previous release caches while old clients need them and until new boot succeeds; coordinate active client release versions and handle closed/stale clients without unbounded cache growth. Test two tabs, old page/new SW, missing binary, quota and failed deployment. Never mix engine JS/WASM/snapshot/content versions.

**Selected host: owner-managed Ubuntu VPS, Nginx static HTTPS virtual host** for `sql.thetirtayasa.my.id`. No Node service, reverse-proxied SQL API, Docker requirement or server PostgreSQL is introduced. Build in CI/local environment and deploy **only verified dist artifacts** through versioned release directories with atomic activation and rollback.

The detailed [Ubuntu VPS / Nginx deployment plan](vps-deployment.md) defines preflight, DNS/SSH/firewall safety, least-privilege file ownership, Let's Encrypt renewal, MIME/compression/security/cache policies, additive immutable assets for old clients, atomic promotion, compatibility-aware rollback, monitoring and acceptance tests. T41 is expanded into V01–V07 tasks in `todo.md`; V01–V03 support early Phase 0 HTTPS proof, while V04–V07 complete the production release path.

Test Lit/CodeMirror injected styles under `style-src 'self'` in all target browsers: do not silently add broad unsafe-inline/unsafe-eval to fix integration. Hosting selection is approved, but actual SSH access, package installs, firewall/DNS edits, certificate issuance and production deployment require explicit operational authorization. Application saves stay in the browser; server backups cannot recover a player's unexported IndexedDB.

## 4. Content production and gameplay

### Authoring pipeline

Keep authored `content/` separate from generated runtime assets. JSON Schemas reject unknown keys except approved x_* extensions. Validate IDs, paths (no traversal), concepts, prerequisite DAGs, evidence references, locale keys, sawtooth roles, seed solvability and fixture outcomes. Build registry explicitly lists only playable missions; season outline can contain all 80 without pointing to missing assets.

The specification's 12-table MVP DDL is the baseline, not an excuse to invent later schemas. Deterministic generators preserve FKs, exact timelines, plausible NULLs, decoys, common names, duplicate scans and exceptions; bounded row budgets remain meaningful. Share canonical identities across each case. Use fixed CI seeds `00000001` through `00000005`, plus mission-specific counterexample variants. All random choices use stable input sorting and the specified PRNG.

Each mission is delivered through three small work packets (Cnnn-A/B/C in checklist), not bulk auto-generated story:

- **A:** executable manifest, seed, reference and two independent alternatives; assess objective precision and construct restrictions.
- **B:** ≥3 individually referenced wrong SQL files and expected actionable diagnostics; challenge overfit/duplicates/NULL/order as relevant.
- **C:** briefing, four free hints, wrap-up and evidence linkage in locale/case graph; fresh predicate/task variant after h4. Validate complete player path.

Probe production order is **003 → 015 → 021 → 023** before the other twenty. These exercise filter, grouping, self-join and outer-join/NULL failure classes. Probe missions may be opened in a development-only harness but never unlock out of order in a public campaign. Every C task remains unchecked until its own verification runs; the general template is not completion evidence.

### Unlocks and evidence rules

A1–A2 fixed novice spine; A3 and later reviewed spokes, synthesis gated by evidence and familiar critical concepts. Unlock simulation must find at least one route from new campaign to 024 without hidden author knowledge. Replays preserve evidence and grant no duplicate rank; Cold Cases appear for attempted concepts and award no story evidence or repeat XP.

Implement pure mastery reducer with distinct `itemId`, case/practice-pack context and h4/follow-up tags. Familiar ≥70% of last five distinct items with ≥3 observations; proficient last three correct, ≥2 cases/packs, no copied-bottom-out qualification; mastered only by opt-in mixed assessment. Only mixed assessment can demote, by at most one state and not below attempted. MVP may expose only the states reachable without the post-MVP assessment UI. Seed/text edits do not create new assessed items.

Case graphs contain explicit public starting nodes, clue/path/source IDs, prerequisite links and resolution policies. Validate acyclicity, distinctness and reachability including every optional single-clue removal. Three similarly filtered queries over identical rows are not independent evidence routes. Case-theory UI shows aggregate completeness, never a per-suspect oracle. Wrong deductions reopen with remedial comparison without awarding false mastery.

### UI and accessibility

Dark investigation desk, off-white paper, teal/amber accents; system fonts, original simple SVG/CSS art. Contrast-check actual token values before freezing them. Build reusable button/dialog/tabs/status primitives with loading/error/focus/pressed states and tokenized motion; no per-mission CSS skins.

CodeMirror mounts once per Lit instance, reconfigures schema/themes via compartments, preserves selection/undo/draft, labels the actual editing DOM, and emits typed intents. Only visible metadata reaches completions. Native textarea fallback has equivalent history/shortcut/save behavior and announces fallback unobtrusively.

Desktop three-pane workspace; below 1000px drawer; ≤600px Brief/Query/Results/Evidence tabs with nearby Run action. Minimum 160px editor, ≥16px text; keyboard and focus must not be covered by bottom controls. Real semantic results table with internal labeled overflow, status announcement once per explicit run. Keyboard row selection and evidence linking; drag is optional only.

WCAG 2.2 AA: contrast 4.5:1 normal/3:1 large, focus visibility, modal restore/Escape, 24px normative target minimum with product 44px main controls, 200%/400% zoom, reflow 320–360px, reduced motion, no timers/autodismiss/color-only state. Test actual Shadow DOM announcements and NVDA/VoiceOver/TalkBack; visual screenshots cover desktop/360px, both themes, error/loading/verified and reduced motion.

## 5. Dependency graph and checkpoints

```text
T01 decisions → T02–T04 static/toolchain/CI
               ├→ T05 PG worker → T06 parser → T08 device/performance proof
               ├→ T07 editor proof
               └→ T09 SW proof → [M0 / human go-no-go]

T10–T14 durable settings/save/migrations/import → T15–T18 workspace/recovery → [M1]
T19 schema/seed → T20–T21 content/graphs
T06 + T19 → T22–T25 comparator/safety/diagnostics/counterexamples
T20–T25 + M1 → T26 filing + C003/015/021/023 → T27 → [M2 / no bulk content before pass]

T28–T31 unlock/mastery/caseboard/review + remaining C packets
  → T32 three-act integration → T33–T34 offline/update hardening → T35 privacy
  → T36–T39 device/AT/playtest/performance → [MVP candidate]
V01–V03 Ubuntu/Nginx/TLS proof can support M0 after authorization
T40 + V04–V07 → T41 VPS readiness → T42 rehearsal → T43 → [M3 public beta]

M3 → A4 → A5 → A6 → A7 → [M4: 56 missions]
   → A8 → A9 → A10 lab + finale → [M5: 80 missions] → P01–P02 pilot/revision
```

Checkpoints occur after every 2–3 technical tasks in the checklist, and after each mission packet set/act. Every integrated increment retains a working static site; unfinished content stays out of published registry. Re-run the full relevant suite at M0/M1/M2/M3; do not substitute individual green unit tests for a broken browser journey.

### Parallel ownership

After typed contracts freeze, save work (T10–T14), content foundation (T19–T21) and UI adapters (T15–T17) can progress independently. Parser/engine ownership remains coordinated; PGlite version changes invalidate parser/asset/fixture proof. Independent mission A/B packets can be authored in parallel after M2; one integrator owns shared locale, registry, graph and seed mappings. Do not parallel-edit public content staging, lockfile, release manifests or migrations. Proposed branch/PR granularity is one focused task; phase-level integration review aggregates those tasks without creating one huge phase implementation diff. No branches/commits/PRs were created in this planning session.

## 6. Verification strategy

All npm commands below are **planned script contracts**, not commands available/passed in the current empty repository. Run through RTK; use `rtk proxy npm run <script> -- ...` if a filter could hide needed evidence.

| Layer | Commands / evidence |
|---|---|
| Reproducible toolchain | `rtk proxy npm ci`; `rtk proxy npm run verify:vendor`; lockfile/asset hashes/license inventory |
| Static code | `rtk proxy npm run typecheck`, `lint`, `format:check`; boundary import rules |
| Pure behavior/storage | `rtk proxy npm run test:unit`; actual IDB transaction behavior also tested in browser, not only mocks |
| Content | `rtk proxy npm run validate:content`; invalid-schema/DAG/graph examples must fail with useful locations |
| PostgreSQL | `rtk proxy npm run test:fixtures`; all correct/wrong queries ×≥5 seeds, fixture diagnostic coverage report |
| Built browser app | `rtk proxy npm run build`; `rtk proxy npm run smoke:dist`; `test:e2e`, `test:visual`, `test:a11y` |
| Human | Recorded keyboard/AT/real Safari+iOS+Android, ≥5–7 silent participants per act, reviewed screenshots/contrast results |
| Actual Ubuntu/Nginx host | V01–V07: nginx -t, TLS/renewal, MIME/cache/header matrix, retained old assets, offline/two-tab updates, rollback, no-third-party network; see vps-deployment.md |

T04 establishes the exact selector convention (proposed: Vitest filenames, `test:fixtures -- --mission 003 --seeds ...`, Playwright `--grep <tag>`); tests and tools must reject misspelled selectors/zero selected cases. Until implemented these selector examples are not claims about available CLI support.

### Release gate map

| Gate | Responsible tasks |
|---|---|
| GATE-PG / GATE-AST | T05–T08, T22–T25, T27 |
| GATE-TYPES / GATE-BUILD | T02–T04, continuous CI, T40–T43 |
| GATE-COMPONENTS / GATE-VISUAL | T07, T15–T18, T30–T31, T36–T37 |
| GATE-SAVE | T10–T14, T18, T26, T34, T42 |
| GATE-CONTENT | T19–T27, every C packet, T32, T42 |
| GATE-PLOT | T21, T30, C packets, T32, T38 |
| GATE-OFFLINE | T09, T33–T34, T41–T42 |
| GATE-A11Y | T07, T15–T17, T30, T36–T38 |
| GATE-DEPLOY | V01–V07 and T41–T43; actual authorized Ubuntu VPS/Nginx domain |
| GATE-PERF | T08, T27, T39, T42 |

### Measured release budgets

| Metric | Desktop | Low-end mobile |
|---|---:|---:|
| Warm shell interactive P75 | <0.7s | <1.5s |
| Repeat/offline engine-ready P75 | <3s | <7s |
| Simple warm checks P95 | <500ms | <1500ms |
| Ordinary run-to-feedback P95 | <1s | <2.5s |
| Main-thread >50ms long tasks | <3/run | <5/run |
| Evidence commit P95 | <250ms | <700ms |
| Save/import round-trip | 100% | 100% |

Measure cold first-playable, compressed wire bytes and peak memory too; snapshot choice requires P75 comparison across first/repeat/offline, not a Node-only speedup. No fixed peak-memory limit is invented here: establish a documented safe envelope on the actual ~4GB Android/iOS devices during T08 and retest T39. Require ≥95% successful boot on the documented browser matrix. ≥95% misconception-feedback precision, 100% acceptance of known correct variants, and no known wrong fixture receiving verified; the KPI's ≥98% sensitivity is not permission to ship known false positives.

## 7. Requirements traceability

| Requirements | Planned coverage |
|---|---|
| R-001,004 | T05,T08,T18,T19; real PG18 worker, no other dialect |
| R-002,031,032 | T02,T03,T15–T17,T30,T36–T37; Lit/TS boundaries/tokens |
| R-003,033 | T09,T33–T34,T40–T43; static build/custom SW/actual host |
| R-005,006,012,014,015 | T06,T19–T25,T27; all C packets; runtime + authored behavior/AST |
| R-007,016 | C001–C024; T26,T30,T32,T38; complete 24-mission story/learning |
| R-008 | Season outline T20; post-MVP act expansion below |
| R-009,010 | T10–T14,T18,T26,T34,T42; native tiers/replay/reset/export |
| R-011 | C packets,T17,T31; 96 free hints, follow-up variant, no penalties |
| R-013,022 | T07,T15–T17,T36–T38; CodeMirror/fallback/accessibility |
| R-017 | T35,T40–T42; no network analytics, private-by-default content |
| R-018 | T28–T31 foundations; A4–A10 and P01–P02 full season/assessments |
| R-019 | T20,T32 locale-ready; L01 full Bahasa Indonesia production |
| R-020 | T09,T33–T34,T41–T42; truthful per-act offline readiness |
| R-021 | T17,T26,T30; schema/evidence/notes; advanced join diagram/bookmarks after MVP if not required for teaching |
| R-023 | A10-LAB; explicitly excluded from ordinary story engine |
| R-024 | T35 local counters; P01 consented assessment/export study |
| R-025,026,027 | Deferred optional backlog; no code absent a separately approved scope |
| R-028,029,030 | Negative constraints enforced in AGENTS, T24,T35,T40–T43 and UI/content review |
| R-034 | T04,T27,T36–T43; all mandated CI + manual checks |

G1–G4 map to content/grading/plot gates; G5–G6 to no-account/save checks; G7 to device/accessibility/performance; G8 to consented P01 study, not an MVP efficacy claim; G9 to schemas/contracts/CI/contributor documentation.

## 8. Post-MVP roadmap (controlled expansion)

Keep all 80 stable IDs in `season.json`. Before each act, review exact DDL with PK/FK/CHECK/index/cardinality and timeline/seed constraints; compact spec table lists are **not** implementation-ready migrations. Instantiate the same A/B/C mission packets, ≥5 seed tests, correct alternatives, three independent proof paths and act playtests. Keep previous saves solved and mark legacy evidence rather than delete it.

| Work item | Sequence and scope | Specific risks and acceptance |
|---|---|---|
| A4 (`025`–`032`) | sensors/sites/readings/calibrations; missing data, NULL, FULL JOIN, NOT EXISTS | NULL/NOT IN counterexamples, scaffold-bounded generate_series; case locally complete |
| A5 (`033`–`040`) | agencies/vendors/contracts/invoices/lines; aggregation over joins | Correct grain/one-to-many duplication, FILTER and grouping diagnoses |
| A6 (`041`–`048`) | properties/evictions/risks/resettlement; subqueries/CTEs/set ops/LATERAL | CTE scope, set vs bag multiplicity, no resident double-counting |
| A7 (`049`–`056`) | maintenance/alerts/mail; dates/time zones/regex/strings | Canonical UTC vs local DATE, chronological tampering; explain where promised JSONB introduction occurs because inventory puts primary JSONB task at 063 |
| L01 | Full en/id translation after stable key contracts | Key parity, document lang, live UI/diagnostics, no translated SQL identifiers; native-language review |
| A8 (`057`–`064`) | versions/change log; windows/frames/DISTINCT ON/JSONB | Frame/tie fixtures and semantic JSONB normalization |
| A9 (`065`–`072`) | command roles/commands/approvals; recursion/cycles/series/rollups | Bounded recursive resource policy per mission, cycle guards, temporal authority, three-claim shutdown proof |
| A10-LAB | Separate disposable index/DML/transaction lab before 074–077 | Read-only story unchanged; narrow table/statement allowlists, rollback/postcondition grading, wipe/reseed independent of saves |
| A10 (`073`–`080`) | ledger/crossrefs/disclosure; plans/integration/finale | Teach plan structure not universal timing, who/how/why query+rows+hypothesis, all three endings/reopen route, printable provenance dossier |
| P01 | Mixed 3×2 concept assessments and consented 20-item pre/post A/B pilot | Deterministic item bank, mastery reducer, redacted explicit export, no hidden transmission; 20-item quiz not confused with mastery challenge |
| P02 | Two post-v1 improvement cycles | Report sample size/baseline/device mix/attrition/CI; convert recurring mistakes into fixtures, revise hints, remeasure rather than claim XP proves learning |

Later tasks are planned, not authorized for immediate execution; derive exact ≤5-file packets from reviewed act contracts at the applicable milestone. M4 requires all 56 missions and compatible MVP saves; M5 requires all 80, isolated labs and every finale branch plus complete-season offline rehearsal. Optional placement diagnostic and spaced-review scheduling need explicit subplans after MVP; no time decay or punitive gates.

## 9. Risks, mitigations and blockers

| Risk | Impact | Mitigation |
|---|---|---|
| PG/parser browser packaging or CSP mismatch | Critical | M0 before story volume, real static HTTPS tests, no dialect/parser shortcuts |
| Mobile payload/startup/memory | High | Shell-first loading, optional packs, initdb-vs-snapshot benchmark, serial counters, reset/watchdog |
| Save/import/update corruption | Critical | Transaction completion, event idempotency, pure migrations, crash/quota/two-tab/version-skew rehearsals |
| Valid SQL falsely rejected | High | ≥2 independent alternatives plus reference, ≥5 seeds, concept-only constraints, every discovered alternative becomes fixture |
| Authored content volume/weak mysteries | High | Four probes first, per-mission A/B/C packets, human review, silent act playtests, no all-80 bulk generation |
| Mastery/evidence gates deadlock | High | D03/D07 decisions, practice item coverage, complete novice route simulation |
| Locale/graph drift | Medium | Stable key/ID registries, one integrator, build-time cross-reference validation |
| Partial offline pack / cache skew | High | Complete manifest verification, retained last-good release, prompt-safe updates and two-client tests |
| Unverified VPS access/configuration and device/AT access | High | Ubuntu/Nginx selected; V01 inventories existing sites, SSH/firewall/DNS permissions without disrupting them; keep live-device gates blocked until evidenced |
| Optional study leaks SQL/notes | High | Local default, explicit preview/redaction and export-only consent; no hidden collection |

## 10. Planning-session tooling and review handoff

Used RTK for shell operations after discovering its executable. Installed and verified Graphify post-commit/post-checkout hooks and local merge driver; `.gitattributes` is the installer-created tracked rule. Added project AGENTS instructions so RTK and graph queries remain the default workflow.

The **local outline/concept navigation graph** now indexes seven documents: both source specifications, this plan, the checklist, the VPS deployment plan, the accepted hosting ADR and AGENTS rules, with source locations and explicit local document links. It is not proof of implemented dependencies. Extraction remains local without uploading documents. Hooks refresh code AST relationships; documentation semantics need explicit refresh. Generated helpers and analysis intermediates are ignored under `graphify-out/`; graph.json/report/HTML remain available for future queries.

External checks during planning: npm registry metadata for the two pins; official PGlite bundler/API, Lit decorator and vite-plugin-pwa update documentation. Bundler docs support optimizeDeps exclusion and ES worker format; none of these lookups prove the pinned browser artifacts pass M0. The planning skill's linked `references/definition-of-done.md` is absent in the local skill installation; the repository-wide Definition of Done and normative spec gates govern instead.

### Planning verification performed

- Initial planning checks passed for 43 engineering tasks and 72 mission packets. Follow-up validation expands coverage to seven additional VPS tasks (V01–V07), checks all task fields, expanded T/V dependency acyclicity, 34 requirement IDs, 13 approved decisions, local Markdown links and safety-contract terms. Only owner-approval criteria may be checked; no implementation completion is claimed. Probe packet harness exception checked separately; future-act packages still require their own detailed expansion.
- Refreshed Graphify integrity diagnostic checks the seven-document graph for dangling/missing endpoints, self-loops and same-endpoint collapse; all 80 mission IDs, 34 requirements and V01–V07 remain queryable. Hook installation was verified in the initial session. The graph is an outline/mention map, not a comprehensive semantic model.
- Git confirms original specifications and LICENSE unchanged. New Markdown passes fence/basic whitespace checks; Git diff check passes when intentional Markdown two-space hard breaks are excluded from trailing-whitespace warnings.
- Application tests/build/device audits were not run: no application or package.json exists yet. Dependency registry lookups verify metadata only, not browser feasibility.

**Current handoff:** The approved planning baseline was committed and pushed as `d2aab41`. The owner then authorized TDD implementation through CP0a only, with checkpoint review before any further commit. Hosting/device/AT/playtest coordination is explicitly assigned to the owner in [owner-actions.md](owner-actions.md). The project owner approved the entire plan and requested a one-line planning commit and remote push before implementation begins. D01–D13 remain accepted; do not reopen them without new evidence or a proposed amendment. Hosting is Ubuntu VPS + Nginx, with detailed tasks in [vps-deployment.md](vps-deployment.md) and `todo.md`. Remaining operational inputs: VPS Ubuntu version/address, existing Nginx sites, SSH/sudo and DNS ownership, certificate contact, device/AT/playtest access and explicit authorization for live server changes. Implementation task completion and technical release gates remain open; committing the approved baseline does not mean application or deployment verification has passed.

# Local durability and portable progress — CP1b

Authority: [spec §12](spec/SPEC-001-The-Quiet-Index-v1.1.md), [approved D08/D13](adr/0001-contract-clarifications.md), [T10–T12](../tasks/todo.md), [review/evidence](../tasks/cp1a-review.md).

## Implemented boundary

`/storage.html` is a separate Lit/native-input review desk, not a gameplay workspace. It performs actual local creation, draft saving, preference changes and recovery downloads. It does not execute SQL, grade, invent earned evidence, implement canonical import/export, or make an offline campaign available. Canonical interchange and typed navigation now live at `/#/settings` and `/#/home`. The existing CodeMirror proof remains separate; T16–T18 workspace integration must bind immediate current text/hidden flush to the draft service without stacking two 500ms debounces.

`src/types/save.ts` defines campaign, mission/draft and storage-failure contracts. `src/storage/` owns native IndexedDB, tiny preferences, ordering and pure migrations. `src/app/` orchestrates startup, debounce, retained pending work and recovery; the view only renders snapshots/emits intents. No storage library, backend or new dependency.

## Native schema

Database **`tqi-progress-v1`**, physical version **1**. Keys are not auto-incremented; indexes are non-unique/non-multiEntry. Known-v1 key/index mismatches fail as `corrupt`, without repairing or deleting user records.

| Store         | Primary key path         | Index → compound key path                                                                        |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| campaigns     | campaignId               | —                                                                                                |
| missionStates | [campaignId, missionId]  | —                                                                                                |
| attempts      | [campaignId, attemptId]  | byMission → [campaignId, missionId]; byTimestamp → [campaignId, timestamp]                       |
| evidence      | [campaignId, evidenceId] | byMission → [campaignId, missionId]; byCase → [campaignId, actId]; byNode → [campaignId, nodeId] |
| notes         | [campaignId, noteId]     | byCase → [campaignId, actId]; byUpdatedAt → [campaignId, updatedAt]                              |
| conceptEvents | [campaignId, eventId]    | byConcept → [campaignId, conceptId]; byItem → [campaignId, itemId]                               |
| verdicts      | [campaignId, actId]      | —                                                                                                |
| backups       | [campaignId, backupId]   | —                                                                                                |
| meta          | key                      | —                                                                                                |

D13 index vocabulary is now concrete: attempts use ISO `timestamp`, notes use `updatedAt`, evidence/notes use `actId` for the byCase index. Campaign ID leads all secondary indexes. Future record-writing tasks must follow these fields rather than invent differently named index properties.

Creation generates independent UUID identity and cryptographic **16-character lowercase hex** seed. Both are in the same campaign record, added with its creation metadata in **one transaction**. Content version `cp1a-storage-1` identifies this storage-only review, not a published mission release; engine pin stays 0.5.13. Mission 001 is an initial storage key, not published content. No completion/evidence is awarded by the desk.

## Commit and concurrency contract

- `ProgressDb` owns one writer per transaction. Its write helper requests the standard **strict durability hint** and resolves only on native **transaction complete**, never request success. No timer, fetch, unrelated promise or UI callback is awaited inside a write transaction.
- A later failing request rolls back earlier successful requests. Quota/abort latches a failure and aborts already-queued writes on that connection; callers must explicitly reopen/retry. Readable records remain available for recovery. No false saved/evidence-secured notification.
- `saveDraft()` reads the latest campaign and mission in the writing transaction, validates their versions, and patches only draft fields and the campaign timestamp. Existing solve/hint/provenance fields remain; saving a background draft does **not** change active mission navigation.
- `mergeProgress()` unions solved IDs and appends evidence/concept events by stable ID in one transaction. Existing payloads win; duplicate IDs inside one batch are deduplicated before requests are queued. This is a repository primitive for T11 concurrency, **not** the T26 verification/row-filing business rule. No UI command grants fake solves.
- Separate tabs use separate connections. IndexedDB serializes overlapping readwrite stores. No whole-campaign stale snapshot is written back from a tab.

### Draft order and lifecycle

Each edit captures `{updatedAt, tabId, revision}`. `updatedAt` is ISO UTC; compare it lexicographically, then compare stable random per-tab IDs lexicographically, then numeric per-tab revision. This is a deterministic newest-wins conflict policy, **not a trusted clock or anti-cheat mechanism**. Severe clock skew can cause a newer human edit to lose the policy; the UI preserves the losing text and explicitly says it was not saved.

`DraftController` captures text immediately, debounces **500ms**, and flushes on hidden visibility. Pagehide is an additional best-effort flush, not the sole durability mechanism. It serializes saves and cannot mark a newer edit saved when an older commit finishes. Pending/failed/conflicting text is retained for download. A retry reopens canonical records and reapplies pending text instead of resetting it. Closing before an actual commit can still lose pending text; no browser lifecycle API guarantees finishing I/O after process termination.

## Tiny convenience storage

Only `tqi.v1.settings` (`locale`, `theme`, `motion`) and `tqi.v1.savePointer` (`campaignId`, `updatedAt`) are written. SQL/evidence/mastery/notes are never put in localStorage. EN/ID review copy and document language change together; SQL stays unchanged. Theme uses the existing checked tokens, and reduced motion cannot force animation against an OS preference.

Malformed preferences fall back to safe defaults; malformed pointers are retained and trigger recovery. Denied convenience storage does not disable native canonical saves. If a pointer is unavailable/missing, existing canonical campaigns can still be found; most recent timestamp with stable ID tie-break selects the existing case. No automatic new campaign is created.

## Migration and recovery

`saveVersion` is distinct from physical database version. **v1 is the first implemented save format.** No fictional v0 or actual v2 deployment migration ships. `migrateCollections()` accepts explicit sequential steps so future migrations can use the already-tested transaction path. Tests supply representative 1→2/3 steps; these are test fixtures, not declarations that production v2 is supported.

- Each step gets a structured copy. Validate input record versions, stable store keys, output key uniqueness, retention of existing records/fields, and union preservation of solved IDs. Reject removal/replacement, mixed future child records and destructive downgrade. The current migration engine is deliberately additive; a real future non-additive transformation needs its own reviewed tests/contract.
- `archiveLegacy()` takes explicit currently-valid typed row keys supplied by future content reconciliation. Missing references get `status: archived_legacy`; query text, row keys and original record refs are retained. It never guesses SQL lineage or revokes solved IDs.
- Native `migrateCampaign()` reads all seven campaign collections in the same readwrite transaction, creates a whole-collection backup, writes transformed records and migration metadata together. Failure rolls all of them back. Backup key `migration-<from>-<target>` is immutable per campaign; no backups are silently pruned. Portable capacity/import ceilings are defined below; a backup quota failure must abort, not discard the original.
- A future logical save or physical DB version is read-only. A lower-version open falls back to opening the existing database **without requesting an upgrade**. An unexpected creation race is aborted. Future records/unknown fields remain intact and readable in the recovery copy; an old release never clears/downgrades the DB.
- Blocked opens reject with close-other-tabs guidance; eventual late connections are closed. Versionchange closes the old connection and tells the user to retain work/reopen a compatible release. Native schema upgrades are exercised in isolated tests through the version argument; production continues to request version 1.
- A surviving pointer with a missing campaign offers an import invitation, not a replacement campaign. The historical native desk remains unchanged; actual canonical import/preview now works at `/#/settings`. Complete origin eviction removes both pointer and DB and is indistinguishable from a first visit; the empty state says so and requires an explicit creation click.

### Recovery copy is not canonical interchange

“Download recovery copy” uses a local JSON Blob, with `format: the-quiet-index-recovery`, readable collections and current draft/state. It tries a fresh snapshot, retaining the last readable snapshot if the connection is unavailable. This is a **best-effort recovery copy**, not an assertion that every inaccessible record was recovered. Supported v1 records use JSON-compatible values; exotic future structured-clone values are not a promised interchange format. No download is uploaded or logged.

CP1a did not implement canonical interchange. CP1b implements the recursively-sorted SHA-256 case-file envelope, 5 MiB validation/count limits, original unsupported **import file bytes**, preview/merge/copy and round-trip proof below. Keep the original export and use a compatible release. Do not confuse a cached shell, PG snapshot, browser persistence hint or server backup with a player save backup.

## Canonical interchange — T13/T14

`export-import.ts` serializes all seven specified progress collections: campaigns, missionStates, attempts, evidence, notes, conceptEvents, verdicts. Operational `meta` and `backups` are not part of the spec envelope; importing never changes them. Collections retain records by stable ID; native IDB reads order them by primary key. Logical round-trip equality is by record identity/payload, not arbitrary incoming collection order. Arrays inside records retain order and duplicates.

- Recursively sort object keys by JavaScript lexicographic order, including numeric-looking keys (do not rebuild an object and let JSON.stringify numerically reorder them). UTF-8 SHA-256 excludes only top-level `integrity`. Array order, Unicode and typed bigint/numeric strings are preserved. Hashing is accidental-corruption detection, not authentication or anti-cheat.
- Raw bigint, unsafe integral numbers, undefined/nonfinite/non-JSON objects are rejected rather than coerced or rounded. Use explicit typed string representations such as `bigint:9007199254740993`; decimal text remains decimal text. Unknown structured-clone types are not a promised JSON interchange format.
- `schemas/save.schema.json` is the v1 runtime boundary. The existing approved Ajv **8.20.0** (previously nested under Workbox) is now an exact root dev dependency. `build-save-validator.mjs` compiles strict draft-07 schema to CJS, then bundles isolated ESM using existing Vite. Only generated checks plus Ajv length/equality helpers and fast-deep-equal ship; no browser schema compiler, Function/eval, runtime CDN, schema fetch or relaxed CSP. The build AST-checks for unresolved imports/require/eval/Function calls. Schema generation precedes clean-checkout types, unit tests, build and browser fixture generation.
- File API checks original Blob size before reading; fatal UTF-8 decoding rejects invalid encoding. After a bounded read, an owned Blob of those bytes is retained for exact-byte download, including BOM/whitespace, independent of a changing filesystem-backed handle. Oversized files are not read; their original handle remains available. No parsing/re-encoding/downgrade is used for original download. Closing a tab loses this in-memory selection; keep the original file on disk.
- Preview does not open a write transaction. Default action is New copy; explicit checkbox confirmation is required and changing mode invalidates consent. Current file name remains bounded/escaped in the view even though the picker resets to allow reselecting the same file.

### D13 numeric bounds (v1)

All files are at most **5,242,880 original bytes**. An aggregate import plan must also fit a future portable export; no pruning is used to make it fit.

| Collection    |                     Maximum records per file |
| ------------- | -------------------------------------------: |
| campaigns     |                                8 (minimum 1) |
| missionStates | 640 (80 per campaign by unique compound key) |
| attempts      |                                        8,000 |
| evidence      |                                        2,000 |
| notes         |                                        1,000 |
| conceptEvents |                                       10,000 |
| verdicts      |                                           80 |

Other ceilings: **32 nesting levels**, **200,000 JSON value nodes**, **64 object properties**, **128-code-unit property keys**, generic nested arrays **2,000 items** (top-level collections have their own limits), generic strings **12,000 UTF-16 code units**, note `text` **8,000**, SQL **12,000**, tab IDs **256**, ASCII stable IDs **128**, app version **64**, content version **128**, engine version **32**. Seed is 8–16 lowercase hex; mission 001–080, act01–act10; completed IDs at most 80 unique; hints 0–4; seed variant 0–10,000. Schema also checks Unicode-code-point lengths; the independent code-unit guard is at least as strict. Timestamps use real canonical UTC ISO strings, hashes 64 lowercase hex. Record-specific required fields/provenance are explicit in the schema; bounded additive JSON fields remain preserved.

Reject `__proto__`, `constructor`, `prototype` recursively before schema/hash use. Reject duplicate primary keys, missing campaign foreign references and unsupported envelope/child versions. Object fields named `campaignId` or ending `CampaignId` are reserved structured campaign references at every depth, including extensions; arbitrary SQL/notes/typed JSONB remain strings, not text-replacement targets. Collection PKs and all referenced campaign IDs are validated before confirmation.

### Confirmed transaction and conflicts

`ProgressDb.importCaseFile(file, mode, confirmed)` detaches/rechecks schema/hash **before** opening the write transaction. It reads the latest seven canonical collections inside one strict readwrite transaction, computes the complete plan and validates aggregate limits before scheduling writes. Never await crypto, fetch or unrelated promises inside the transaction. Only `complete` reports committed; late constraint/quota errors roll back every store. Logical identity/capacity errors schedule no writes and do not falsely announce success. Native abort/quota pauses that connection's writers until reopened.

**Merge:** restore absent campaigns with original IDs; matching campaigns require identical seed/content/engine identity. Union solved IDs, keep existing active navigation/locale/creation metadata, never demote solved mission status or hint history. Drafts follow timestamp → tab ID → revision. Earlier first-solve time is retained. Existing immutable evidence, concept/attempt event payloads, notes and verdict/ending choices win same-ID conflicts; report every conflicting record instead of silently overwriting it. Original incoming bytes remain downloadable; choose New copy to preserve a different branch. Export current local work before merging, because the approved newest-draft policy can supersede an older saved draft.

**Copy:** create independent cryptographic campaign UUIDs, retain seeds and remap every reserved campaign reference consistently, including nested/cross-campaign references. Reject collision/incomplete maps. Mission/evidence/event/row IDs remain unchanged within their new campaign namespace, preserving provenance; never rewrite SQL, prose, query hashes or database PK strings. No existing campaign is deleted/replaced. The convenience save pointer changes only after confirmed commit, never on preview/error; denied localStorage cannot roll back an already committed canonical import.

### Navigation and unsupported recovery — T15

Root hash routes are `/#/home`, `/#/act/03`, `/#/mission/021`, `/#/casebook`, `/#/practice`, `/#/settings`. Bare `/` deliberately retains the historical foundation; separate feasibility/technical/native-durability proofs remain unchanged. No app-server rewrites/API or global bus/state package.

`AppStore` publishes recursively frozen detached snapshots and typed commands with explicit booting/ready/unsupported/storage-error states and focus IDs. The six screen routes are honest navigation surfaces: no mission registry is published, so every production mission deep link explains its lock instead of exposing fake play. No invented unlock graph, query execution or CodeMirror workspace is smuggled into T15; T16–T18/T28 own those integrations. The typed engine port cancels on navigation/state changes and generation-checks late results/errors, including leaving and returning to the same mission. Existing actual worker protocol correlation remains intact.

Startup checks surviving pointers and future logical/physical versions; stale startup completions cannot clear a versionchange recovery notice. Unsupported native records remain read-only, with recovery download; valid files can still be previewed but not confirmed into unsupported storage. File actions own focus ahead of an older startup callback; navigation/skip links have explicit focus destinations without destroying the hash. BFCache pagehide closes connections/cancels engine work while preserving selected original bytes; pageshow reopens canonical data. Automated lifecycle dispatch is not real Safari/OS certification.

The new desk uses English MVP copy and restores saved theme/motion; it does not claim complete L01 translation. The CP1a native desk's EN/ID preferences and existing saves remain compatible. Readable unsupported native JSON records use the separate recovery envelope, never a misleading v1 canonical export. Recovery is best-effort for inaccessible/exotic future records; no browser storage is cleared to recover.

## Verification and limits

See the [checkpoint review](../tasks/cp1a-review.md) for executed commands and exact pass counts. `npm run test:storage` builds a test-only ES module from the real repository, then routes it only inside isolated Playwright contexts. It is not a production HTML input, global test API or shipped reset path. Real native IndexedDB is used in Chromium, Firefox and WebKit; no fake-indexeddb dependency.

Faults inject DOMExceptions at native request boundaries or create real constraint/version conflicts. They do not exhaust the owner's disk or prove physical power-loss behavior. Native `durability: strict` remains a browser/OS hint; transaction completion is not an absolute hardware/eviction guarantee. Real Safari/iOS/Android, assistive-tech and hosting findings remain open, as does full M1/GATE-SAVE gameplay/update/worker-restart integration acceptance. CP1b's canonical interchange and navigation evidence is in [its review ledger](../tasks/cp1b-review.md).

Official references consulted: [IDBTransaction completion/abort/durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction), [versionchange](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event). No experimental `readwriteflush`, relaxed-durability workaround, storage reset or global configuration change.

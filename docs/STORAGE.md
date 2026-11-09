# Local durability — CP1a

Authority: [spec §12](spec/SPEC-001-The-Quiet-Index-v1.1.md), [approved D08/D13](adr/0001-contract-clarifications.md), [T10–T12](../tasks/todo.md), [review/evidence](../tasks/cp1a-review.md).

## Implemented boundary

`/storage.html` is a separate Lit/native-input review desk, not the T15 gameplay workspace. It performs actual local creation, draft saving, preference changes and recovery downloads. It does not execute SQL, grade, invent earned evidence, implement canonical import/export, or make an offline campaign available. The existing CodeMirror proof remains separate; T15 must bind its immediate current text/hidden flush to the draft service without stacking two 500ms debounces.

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
- Native `migrateCampaign()` reads all seven campaign collections in the same readwrite transaction, creates a whole-collection backup, writes transformed records and migration metadata together. Failure rolls all of them back. Backup key `migration-<from>-<target>` is immutable per campaign; no backups are silently pruned. Capacity/import ceilings remain T14; a backup quota failure must abort, not discard the original.
- A future logical save or physical DB version is read-only. A lower-version open falls back to opening the existing database **without requesting an upgrade**. An unexpected creation race is aborted. Future records/unknown fields remain intact and readable in the recovery copy; an old release never clears/downgrades the DB.
- Blocked opens reject with close-other-tabs guidance; eventual late connections are closed. Versionchange closes the old connection and tells the user to retain work/reopen a compatible release. Native schema upgrades are exercised in isolated tests through the version argument; production continues to request version 1.
- A surviving pointer with a missing campaign offers an import invitation, not a replacement campaign. There is no pretend working Import button: compatible canonical import/preview is T14. Complete origin eviction removes both pointer and DB and is indistinguishable from a first visit; the empty state says so and requires an explicit creation click.

### Recovery copy is not canonical interchange

“Download recovery copy” uses a local JSON Blob, with `format: the-quiet-index-recovery`, readable collections and current draft/state. It tries a fresh snapshot, retaining the last readable snapshot if the connection is unavailable. This is a **best-effort recovery copy**, not an assertion that every inaccessible record was recovered. Supported v1 records use JSON-compatible values; exotic future structured-clone values are not a promised interchange format. No download is uploaded or logged.

The canonical recursively-sorted SHA-256 case-file envelope, 5 MiB validation/count limits, original unsupported **import file bytes**, import preview/merge/copy and full round-trip acceptance are **T13–T14**, not implemented/claimed by CP1a. Keep the original export and use a compatible release. Do not confuse a cached shell, PG snapshot, browser persistence hint or server backup with a player save backup.

## Verification and limits

See the [checkpoint review](../tasks/cp1a-review.md) for executed commands and exact pass counts. `npm run test:storage` builds a test-only ES module from the real repository, then routes it only inside isolated Playwright contexts. It is not a production HTML input, global test API or shipped reset path. Real native IndexedDB is used in Chromium, Firefox and WebKit; no fake-indexeddb dependency.

Faults inject DOMExceptions at native request boundaries or create real constraint/version conflicts. They do not exhaust the owner's disk or prove physical power-loss behavior. Native `durability: strict` remains a browser/OS hint; transaction completion is not an absolute hardware/eviction guarantee. Real Safari/iOS/Android, assistive-tech and hosting findings remain open, as do full M1/GATE-SAVE export/import/update/worker-restart acceptance.

Official references consulted: [IDBTransaction completion/abort/durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction), [versionchange](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event). No experimental `readwriteflush`, relaxed-durability workaround, storage reset or global configuration change.

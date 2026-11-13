# Content authoring contract — CP2a / schema v1

## Scope and authority

The normative specification and accepted D02/D03/D05–D10 decisions govern. CP2a supplies deterministic baseline data, closed manifests and pure graph validation, not behavioral grading or playable missions. The published registry is deliberately empty. The 80-mission outline is planning metadata, not 80 finished levels. Never stage synthetic test packs as player content.

## Deterministic data

`content/datasets/base.sql` preserves the twelve baseline tables, keys, checks and indexes. `generateDataset` emits bounded parameterized INSERT batches for trusted identifiers only; it never accepts player SQL or creates an answer lookup table. It is consumed by isolated native PG18 fixtures, not the existing workbench or canonical save. All rows are rebuildable.

`hashSeed`, `mulberry32`, and `missionRng(seed, missionId, variant)` preserve the exact normative algorithm. Shared case IDs, role IDs, vehicle and core event timestamp derive from `contentVersion:campaignSeed:caseId`, independently of mission/variant. Role selection samples from an explicit sorted ID list without replacement. Local decoys alone consume mission RNG. Content versions must change if generation semantics change. All dates use explicit UTC; money is inserted as bounded decimal values, never user concatenation. No new snapshot strategy is selected.

## Manifest v1 (D09 freeze)

See `schemas/mission.schema.json` and `src/content/manifest-types.ts`. Unknown properties, including `x_*`, are rejected at every object boundary. Extensions require an explicit schema amendment; arbitrary predicates or executable expressions are never supported.

Required fields: schema/content/seed versions, stable three-digit ID, act/case IDs, concept/practice/capstone type, role/difficulty, locale keys, requires/teaches/reinforces/story dependencies, visible tables and columns, seed profile, explicit assessment identity, grade, evidence, exactly four hints, and fresh h4 follow-up. Comparison declares ordered vs unordered-multiset, alias policy, column names and OIDs-as-type-names, exact numeric tolerance and a separate ≤1000 full-result ceiling. Preview truncation is never a grading rule. Constraint `when` and `must` use finite approved AST predicates; concept-neutral challenges cannot require a particular AST construct.

A playable mission requires:

- `reference.sql` plus ≥2 independently authored alternatives, each referenced as `variants/<id>.sql`.
- Authored `variants.sql` blocks introduced by `-- variant: <id>`; IDs are unique lowercase ASCII identifiers. Nonempty blocks expand to generated `variants/<id>.sql` without changing SQL bytes (apart from surrounding whitespace). These generated paths are references, not authored duplicate files. Build staging in T33 will use the same expansion contract.
- ≥3 distinct individually named `wrong_<id>.sql` fixtures, each with a diagnostic locale key.
- All referenced SQL source files, `seed.sql`, locale keys, visible metadata, evidence source tables/row keys and fresh predicate follow-up. `itemId` stays stable across mere seed/text variants; h4 changes the task predicate and uses a different item ID and nonzero variant, without granting proficiency automatically.

Paths are ASCII relative paths with fixed naming, never URLs, absolute paths, backslashes, dot segments or encoded separators. The authoring reader also verifies resolved realpaths remain inside the selected content root. This is a build-time trusted-author boundary; no filesystem loader or Ajv compiler ships to the UI.

Editorial independence, SQL correctness, constraint implementation and ≥5-seed solution/negative execution remain T22–T27 gates. Metadata cannot prove an alternative is genuinely independent or that a fixture is wrong. Required production ledger per mission is one reference + two alternatives + three wrong queries + four hints; across MVP: 24/48/72/96 plus 6 interludes, 3 summaries and reviewed plot paths.

## Outline versus publication

`season.json` has exactly IDs 001–080 grouped into ten eight-mission acts, with the normative titles/objectives/constructs and concept IDs. `concepts.json` declares stable identifiers. `registry.json` lists only published manifests and case graphs; an outline entry never unlocks a mission. English keys are required for published metadata; additional locale files, when present, must have key parity. English-only CP2a is not completed Bahasa Indonesia translation.

The validator checks JSON schema, cross references, bounded identifiers, duplicate IDs, source paths, locale coverage, visible schema and content version consistency. Errors carry source filename + JSON pointer or SQL block location. The CLI rejects unknown arguments, unknown mission selectors and zero selected missions. An empty repository registry is explicitly reported as zero playable missions, not a fake fixture pass.

## Graph v1

`schemas/graph.schema.json` defines facts, evidence, conclusions, public starting nodes, dependencies, declared proof paths, resolution policy, mission metadata, practice items and synthesis goals. Facts are available only from declared public starting nodes; evidence is awarded only by reachable missions; conclusions are reached only through their declared resolution policy. Nodes cannot depend on themselves/cycles or a downstream conclusion.

Each load-bearing conclusion has ≥3 declared paths with distinct source sets and reasoning IDs. Paths name actual evidence nodes and their source IDs, not renamed copies of one query. Each path must independently reach its nodes from public facts without consuming another path's evidence. Two-high-confidence resolution additionally requires an explicit reachable reconciliation node. For every optional clue removed, both at least one full route and the actual chosen resolution policy must remain achievable; all-three policies cannot quietly call an essential clue optional.

Simulation follows taught concepts, story awards, A1/A2 fixed mission spine, and familiar concept requirements at synthesis. Practice items become available only once their concept is attempted, require their own prerequisites, and have distinct IDs/tasks; at least three genuinely distinct assessed items allow familiar (≥70% with ≥3 distinct items). Successful synthetic simulation assumes correct answers, not actual player learning. It rejects unknown/contradictory references, unreachable evidence, concept teach cycles, insufficient distinct-item coverage, adjacent spikes and missing rest within two missions. A synthesis exception needs nonempty reason + recorded playtest reference; a boolean bypass is not accepted. Runtime unlock/mastery services remain T28/T29.

## Commands and evidence

`rtk proxy npm run validate:content` validates the outline and published source contracts. `rtk proxy npm run validate:graphs` validates registered case graphs; zero authored cases is stated explicitly. `rtk proxy npm run test:unit -- tests/unit/content-validation.test.ts tests/unit/graph-validation.test.ts` exercises valid miniature/synthetic cases and adversarial failures. `test:fixtures` intentionally remains unavailable until the behavioral fixture harness exists. Never equate CP2a metadata validation with GATE-CONTENT for actual missions.

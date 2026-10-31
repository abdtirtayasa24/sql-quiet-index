# Graph Report - sql-quiet-index  (2026-10-31)

## Corpus Check
- Curated specification, planning, ADR and agent-rule corpus; excludes generated graph outputs.

## Summary
- 453 nodes · 950 edges · 15 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: unavailable (host usage not exposed; internal zero values are placeholders)

## Community Hubs (Navigation)
- SPEC-001-The-Quiet-Index-v1.1 / evidence
- plan / evidence
- 4. Authoritative mission inventory, Acts 4–10 (post-MVP / 062 — Pick latest valid version per device — PostgreSQL
- vps-deployment / Nginx
- Requirements / R-001 — Only PostgreSQL syntax and behavior; no SQLite 
- evidence / seed
- todo / SQLSTATE
- Design implications: what a new SQL detective game must / PGlite ships real PostgreSQL 18.6 to the browser for ~5
- 3. Authoritative mission inventory, Acts 1–3 (MVP) / 019 — Combine gate, vehicle and dispatch evidence
- CSP / PostgreSQL
- Nginx / T41 — Verify Ubuntu VPS / Nginx readiness
- Decision / 0002-ubuntu-vps-nginx
- Source of truth / AGENTS
- T42 — Rehearse the exact release artifact / snapshot
- Explicit mission checklist / counterexample

## God Nodes (most connected - your core abstractions)
1. `todo` - 83 edges
2. `4. Authoritative mission inventory, Acts 4–10 (post-MVP)` - 58 edges
3. `SPEC-001-The-Quiet-Index-v1.1` - 36 edges
4. `Requirements` - 35 edges
5. `evidence` - 32 edges
6. `3. Authoritative mission inventory, Acts 1–3 (MVP)` - 26 edges
7. `plan` - 26 edges
8. `7. Architecture decisions and dependency gate` - 23 edges
9. `evidence` - 22 edges
10. `PostgreSQL` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Ubuntu VPS / Nginx deployment implementation plan` --references--> `0002-ubuntu-vps-nginx`  [EXTRACTED]
  tasks/vps-deployment.md → docs/adr/0002-ubuntu-vps-nginx.md
- `Decision` --references--> `todo`  [EXTRACTED]
  docs/adr/0002-ubuntu-vps-nginx.md → tasks/todo.md
- `Decision` --references--> `vps-deployment`  [EXTRACTED]
  docs/adr/0002-ubuntu-vps-nginx.md → tasks/vps-deployment.md
- `2. Source precedence and approved clarification decisions` --references--> `vps-deployment`  [EXTRACTED]
  tasks/plan.md → tasks/vps-deployment.md
- `Offline and deployment` --references--> `vps-deployment`  [EXTRACTED]
  tasks/plan.md → tasks/vps-deployment.md

## Communities (15 total, 0 thin omitted)

### Community 0 - "SPEC-001-The-Quiet-Index-v1.1 / evidence"
Cohesion: 0.09
Nodes (77): SPEC-001-The-Quiet-Index-v1.1, 10. Content files / schema contracts, 11. Grading pipeline and feedback specification, 12. Durable progress, offline caching and recovery, 13. UI/UX and information design, 14. Threat model, limitations and privacy, 15. Quality gates and test matrix, 16. Reference sources and evidence limitations (+69 more)

### Community 1 - "plan / evidence"
Cohesion: 0.07
Nodes (64): plan, 10. Planning-session tooling and review handoff, 1. Overview and release boundaries, 2. Source precedence and approved clarification decisions, 3. Architecture decisions, 4. Content production and gameplay, 5. Dependency graph and checkpoints, 6. Verification strategy (+56 more)

### Community 2 - "4. Authoritative mission inventory, Acts 4–10 (post-MVP / 062 — Pick latest valid version per device — PostgreSQL"
Cohesion: 0.04
Nodes (57): 025 — Locate sensors with and without calibration entries — `LEFT JOIN`, 026 — Identify missing readings — `IS NULL` rather than `= NULL`, 027 — Recover a default alert threshold — `COALESCE`, 028 — Compare two sensor networks without dropping unmatched IDs — `FULL OUTER JOIN`, 029 — Identify missing required timestamps — `generate_series` + left anti-match (provided scaffold), 030 — Prove records are absent — `NOT EXISTS`, 031 — Explain why `NOT IN` and nullable subqueries can disagree — NULL three-valued logic, 032 — Synthesize the falsified monitoring gap — review and new accusation (+49 more)

### Community 3 - "vps-deployment / Nginx"
Cohesion: 0.15
Nodes (35): vps-deployment, 10. Acceptance evidence (V07, T42), 11. References and evidence limits, 1. Deployment topology and non-goals, 2. Inputs and authorization checklist (V01), 3. Filesystem and least-privilege model (V02, V04), 4. Old-client asset continuity — mandatory before atomic deployment, 5. Nginx virtual-host behavior and header contract (V02) (+27 more)

### Community 4 - "Requirements / R-001 — Only PostgreSQL syntax and behavior; no SQLite "
Cohesion: 0.07
Nodes (28): R-001 — Only PostgreSQL syntax and behavior; no SQLite fallback or dialect switch., R-003 — Static HTTPS deployment to `sql.thetirtayasa.my.id`, functioning without app-server execution or login., R-004 — Real local PostgreSQL engine running off the main UI thread and executable SQL result grid., R-005 — Query-level grading: syntax, result shape, row multiplicity, content, order when specified, and concept-specific AST rules. Never validate only a suspect string., R-006 — Explain SQLSTATE 42601, 42703, 42803, 42P01, 42702 with accessible actionable feedback; include grouping and Cartesian-product warnings., R-007 — 24-mission initial playable release with authored plot, tutorial, alternative-valid-query tests, clues, notes, hints and resolution of act 3., R-008 — Roadmap and content specification for all 80 missions / 10 acts, with a final multi-case mystery., R-010 — Versioned export/import JSON; ability to resume, replay, reset only a mission, and recover from missing/evicted browser storage where an export exists. (+20 more)

### Community 5 - "evidence / seed"
Cohesion: 0.10
Nodes (28): Checkpoint CP-VPSb — releasable static infrastructure, Checkpoint M3 — public MVP, Checkpoint MVP candidate, evidence, localStorage, mastery, rollback, seed (+20 more)

### Community 6 - "todo / SQLSTATE"
Cohesion: 0.08
Nodes (27): todo, Checkpoint CP0a — foundation, Checkpoint CP1a — local durability, Checkpoint CP1b — portable progress/navigation, Checkpoint CP2a — content foundations, Checkpoint CP2b — safe, faithful query semantics, Checkpoint CP3a — gameplay correctness, Checkpoint CP3b — content/offline integrity (+19 more)

### Community 7 - "Design implications: what a new SQL detective game must / PGlite ships real PostgreSQL 18.6 to the browser for ~5"
Cohesion: 0.17
Nodes (26): SQL-Game-Research-Reports, A Detective Game That Grades Queries, Not Names, Cache API, CodeMirror, evidence, export/import, IndexedDB, libpg-query (+18 more)

### Community 8 - "3. Authoritative mission inventory, Acts 1–3 (MVP) / 019 — Combine gate, vehicle and dispatch evidence"
Cohesion: 0.08
Nodes (25): 001 — Open the intake ledger and show every active incident, 002 — Show just the incident IDs, dates and location, 003 — Isolate harbor incidents, 004 — Identify reports filed after midnight on the relevant date, 005 — Compare official and informal descriptions, 006 — Find consignments with the recurring mark, 007 — Sort incoming deliveries and inspect latest few, 008 — Reconcile two incident facts to file the first dispatch memo (+17 more)

### Community 9 - "CSP / PostgreSQL"
Cohesion: 0.11
Nodes (22): Checkpoint CP0b — engine/input feasibility, Checkpoint M1 — reliable shell, CodeMirror, CSP, injectManifest, Lit, PGlite, Playwright (+14 more)

### Community 10 - "Nginx / T41 — Verify Ubuntu VPS / Nginx readiness"
Cohesion: 0.18
Nodes (19): Checkpoint CP-VPSa — secure static origin, Certbot, immutable, IndexedDB, Nginx, TLS, Ubuntu, VPS (+11 more)

### Community 11 - "Decision / 0002-ubuntu-vps-nginx"
Cohesion: 0.21
Nodes (17): 0002-ubuntu-vps-nginx, ADR-0002: Serve static releases from Ubuntu VPS with Nginx, Alternatives considered, Certbot, immutable, IndexedDB, Nginx, PostgreSQL (+9 more)

### Community 12 - "Source of truth / AGENTS"
Cohesion: 0.12
Nodes (16): AGENTS, Completion, CodeMirror, immutable, Lit, Nginx, PostgreSQL, rollback (+8 more)

### Community 13 - "T42 — Rehearse the exact release artifact / snapshot"
Cohesion: 0.25
Nodes (8): export/import, snapshot, WCAG, T08 — Select a measured boot strategy, T14 — Import with preview and explicit merge/copy, T33 — Download complete version-pinned offline acts, T36 — Audit keyboard, reflow and visual states, T42 — Rehearse the exact release artifact

### Community 14 - "Explicit mission checklist / counterexample"
Cohesion: 0.50
Nodes (4): counterexample, Explicit mission checklist, Packet B — misconception regression (`Cnnn-B`), T39 — Measure finished-campaign performance

## Knowledge Gaps
- **175 isolated node(s):** `Project working rules`, `Ubuntu`, `Nginx`, `TLS`, `VPS` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 175 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todo` connect `todo / SQLSTATE` to `plan / evidence`, `vps-deployment / Nginx`, `evidence / seed`, `CSP / PostgreSQL`, `Nginx / T41 — Verify Ubuntu VPS / Nginx readiness`, `Decision / 0002-ubuntu-vps-nginx`, `T42 — Rehearse the exact release artifact / snapshot`, `Explicit mission checklist / counterexample`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `SPEC-001-The-Quiet-Index-v1.1` connect `SPEC-001-The-Quiet-Index-v1.1 / evidence` to `3. Authoritative mission inventory, Acts 1–3 (MVP) / 019 — Combine gate, vehicle and dispatch evidence`, `4. Authoritative mission inventory, Acts 4–10 (post-MVP / 062 — Pick latest valid version per device — PostgreSQL`, `Requirements / R-001 — Only PostgreSQL syntax and behavior; no SQLite `?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `4. Authoritative mission inventory, Acts 4–10 (post-MVP)` connect `4. Authoritative mission inventory, Acts 4–10 (post-MVP / 062 — Pick latest valid version per device — PostgreSQL` to `SPEC-001-The-Quiet-Index-v1.1 / evidence`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `Project working rules`, `Ubuntu`, `Nginx` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SPEC-001-The-Quiet-Index-v1.1 / evidence` be split into smaller, more focused modules?**
  _Cohesion score 0.08954203691045796 - nodes in this community are weakly interconnected._
- **Should `plan / evidence` be split into smaller, more focused modules?**
  _Cohesion score 0.07242063492063493 - nodes in this community are weakly interconnected._
- **Should `4. Authoritative mission inventory, Acts 4–10 (post-MVP / 062 — Pick latest valid version per device — PostgreSQL` be split into smaller, more focused modules?**
  _Cohesion score 0.03508771929824561 - nodes in this community are weakly interconnected._
## Extraction provenance

Planning graph refreshed locally from specification documents, approved clarification/Ubuntu VPS plans, hosting ADR and agent rules; no application code exists. References are explicit textual mentions, not implemented dependencies. Token usage is unavailable from this host (zero values are placeholders, not a claim of zero model cost). No external extraction service was used. Refresh semantic relationships after document changes.

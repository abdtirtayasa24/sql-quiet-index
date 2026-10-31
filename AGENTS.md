# Project working rules

## Source of truth

- Read `docs/spec/SPEC-001-The-Quiet-Index-v1.1.md` before implementation. It is normative; the research report supplies rationale, not overriding implementation decisions.
- Read `tasks/plan.md`, `tasks/todo.md` and `tasks/vps-deployment.md`. The owner approved the full plan, D01–D13 dispositions and Ubuntu VPS/Nginx deployment design; do not request the same approvals again. The approved planning baseline was committed and pushed as `d2aab41`. Current authorized implementation scope is T01–T04 through CP0a, using TDD. Stop for owner review at this checkpoint; do not commit or push any implementation until explicitly requested. Apply the same review-before-commit workflow at subsequent checkpoints. Technical verification gates remain open; obtain operational access and authorization before live VPS/DNS/firewall/TLS changes.
- Preserve stable mission IDs and save compatibility. Follow the specification's required Lit/strict TypeScript/Vite/vanilla CSS/CodeMirror/PostgreSQL stack and separation boundaries.
- Production is static HTTPS on the owner's Ubuntu VPS via Nginx, not a Node/backend/PostgreSQL server. Follow `docs/adr/0002-ubuntu-vps-nginx.md`; retain old immutable assets during atomic releases and never clear browser storage as a deploy/rollback shortcut.

## RTK and Graphify

- Use RTK for every shell command in this repository. Prefer supported commands such as `rtk git status`, `rtk rg`, and `rtk npm run ...`; use `rtk proxy <program> <args>` for unsupported commands or when complete output is necessary. Use the agent's read/edit/write tools for file contents.
- Before answering architecture or relationship questions, query the existing graph: `rtk proxy graphify query "<question>" --budget 1800`. Expand terms using graph labels; verify important claims against the cited source text.
- `graphify-out/graph.json` is a derived navigation aid, never a substitute for the normative specification. Its initial graph describes planned requirements, NOT implemented application code.
- Graphify post-commit/post-checkout hooks are installed locally. Check with `rtk proxy graphify hook status`. Hooks and Git merge-driver configuration do not travel automatically with a clone; run `rtk proxy graphify hook install` in a new clone.
- Hooks update structural code relationships; documentation/semantic changes require explicit semantic refresh using the bundled Graphify skill. Do not send private repository content to external extraction services without permission; inline host-agent extraction is available.
- Do not commit, push, deploy, change global configuration, or replace approved dependencies without user authorization.

## Completion

Use test-first, small slices. Report changed files, actually executed verification, outstanding acceptance criteria, and browser/manual-test blockers. Never claim device, accessibility, performance, or learning outcomes from an unrun test.

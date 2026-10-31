# ADR-0002: Serve static releases from Ubuntu VPS with Nginx

## Status

**Accepted hosting choice**, explicitly selected by the project owner in the follow-up planning request approving D01–D13. Deployment has not been executed; the detailed operational design remains subject to VPS inventory and verification. Number 0001 remains reserved for the clarification-contract record in T01; this hosting record does not renumber the specification's embedded architecture decisions.

## Context

The specification requires a static HTTPS origin at `sql.thetirtayasa.my.id`, self-hosted workers/WASM/content, offline-safe updates and no required application server. The initial plan deliberately left the hosting provider unidentified. The owner now chooses their existing Ubuntu VPS and Nginx.

An Ubuntu delivery host does not change browser-local PostgreSQL execution, IndexedDB ownership, privacy defaults or the absence of login/backend services. Existing sites on the VPS must not be overwritten by a generic installation recipe.

## Decision

- Serve verified Vite dist artifacts using a dedicated Nginx HTTPS virtual host on the owner's Ubuntu VPS. Build/test in CI or locally, not as a production runtime dependency.
- Use Let's Encrypt/Certbot webroot TLS issuance/renewal after owner authorization and actual DNS/firewall validation. Respect existing certificate/package arrangements.
- Plan immutable release directories, atomic current-pointer promotion, retained additive hashed assets and pinned content release URLs so old pages do not lose dependencies after an update.
- Require compatibility-aware rollback: browser saves are never cleared, downgraded or silently reset to match an older server release.
- Keep Nginx worker filesystem access read-only; deployment account/project files separate from root-managed config/certificate keys. No private repository material in public web roots.
- Use [tasks/vps-deployment.md](../../tasks/vps-deployment.md) and V01–V07 in [tasks/todo.md](../../tasks/todo.md) for concrete implementation/acceptance work. T41 integrates those tasks; T42/T43 retain exact-artifact and public-release gates.

## Alternatives considered

- Managed static hosting (Pages/Netlify/etc.): compatible with the product but not the owner's selected operational environment; not required.
- Nginx reverse proxy to Node or server PostgreSQL: unnecessary for the specified static/local-only product; adds risk and operations without a requested feature.
- In-place overwrite of current dist with immediate old-asset deletion: rejected because live old tabs/service workers may still request uncached old chunks/content.

## Consequences

The owner operates Ubuntu/Nginx security updates, DNS, TLS renewal, disk/asset retention, backups and monitoring. No server database/accounts/sync are added. Host backups protect deployment/configuration, not players' unexported browser saves. A fixed secure origin is important for save continuity.

Selected hosting is approved, but VPS IP/Ubuntu version, existing sites, SSH/sudo/DNS permissions, certificate contact and capacity are still unknown. No live connection, package install, firewall edit, certificate issuance or deployment is authorized or claimed by this documentation update.

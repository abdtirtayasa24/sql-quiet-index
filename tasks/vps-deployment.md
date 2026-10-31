# Ubuntu VPS / Nginx deployment implementation plan

**Status:** Full deployment plan approved by the project owner alongside the implementation plan. Commit and push the planning baseline before implementation. Deployment configuration and verification remain unperformed; live VPS changes require operational access and authorization.

**Domain:** `sql.thetirtayasa.my.id`  
**Related:** [main plan](plan.md), [execution checklist](todo.md), [hosting ADR](../docs/adr/0002-ubuntu-vps-nginx.md).  
**Task ownership:** V01–V07 expand T41. V01–V03 can support early M0 HTTPS feasibility; V04–V07 depend on the finished release pipeline.

## 1. Deployment topology and non-goals

```text
Developer / CI (Node/npm + test/build tools)
   → verified dist archive + manifest + SHA-256 checksums
   → SSH upload to non-public staging directory
Ubuntu VPS
   → additive, versioned immutable assets
   → validated release directory
   → atomic current symlink switch
Nginx on TCP 443 (TLS termination + static files only)
   → browser downloads HTML/CSS/JS/workers/WASM/content
   → SQL runs locally in the browser, saves stay in IndexedDB
TCP 80: ACME HTTP-01 challenge + canonical HTTPS redirect
```

No production Node process, PM2, API, server PostgreSQL, public database port, runtime CDN, Docker requirement or cloud save store. A VPS is the static delivery host, **not** an exception to the local-only architecture. Build on CI/local machine rather than provisioning a build toolchain on production.

Recommended baseline is a currently security-supported Ubuntu LTS; confirm the actual installed release and package provenance first. Do not assume a particular Ubuntu/Nginx version, HTTP/2 syntax, Brotli module, IPv6 readiness or blank server. Existing unrelated websites must remain operational.

## 2. Inputs and authorization checklist (V01)

Obtain before live work:

- [ ] VPS hostname/IP, installed Ubuntu release, CPU/RAM/disk headroom, SSH port/user and recovery-console access.
- [ ] Existing Nginx/package/certificate/firewall setup and all virtual hosts; inspect `nginx -V`/effective config securely without publishing secrets.
- [ ] Domain DNS owner, current A/AAAA/CAA records, whether a proxy/CDN is enabled, and authority to change them. Start with direct DNS to Nginx; any existing proxy requires separate cache/TLS validation, not silent bypass.
- [ ] Approved SSH/sudo scope, deployment account, ACME certificate contact/terms consent and maintenance window.
- [ ] Existing UFW/provider-firewall rules and SSH access path; preserve SSH rules before any firewall changes. Do not reset UFW, disable other sites or blindly open ports.
- [ ] Disk/backup/log-retention budget, operational owner and alert destination. Proposed artifact retention below requires capacity review.

Only add AAAA if the host really serves HTTP/HTTPS over IPv6; a stale AAAA can break certificate validation and client boot despite a correct A record. Verify DNS propagation and inbound 80/443 on both advertised families. Restrict SSH to the owner's approved access policy without guessing an allowlisted IP. No DNS/firewall/package action is executed merely because this plan exists.

Remote verification commands will be documented with RTK on the operator workstation, for example `rtk proxy ssh <approved-host-alias> 'sudo nginx -t'`. RTK need not be installed globally on the VPS for this workflow. Use SSH keys/agent and verified host keys, not passwords/private keys in repository files or CI output.

## 3. Filesystem and least-privilege model (V02, V04)

Proposed layout:

```text
/srv/the-quiet-index/
  incoming/                     # uploads; never an Nginx web root
  releases/<release-id>/        # verified dist root, never edited after promotion
  current -> releases/<id>/     # atomic pointer for mutable entry URLs
  previous -> releases/<id>/    # known compatible rollback pointer
  shared/
    assets/<content-hash>...    # additive Vite worker/JS/CSS/WASM/data artifacts
    content/releases/<id>/...  # immutable versioned mission/locale/seed packs
/var/www/letsencrypt/           # ACME webroot; outside app releases
/etc/nginx/sites-available/the-quiet-index
/etc/nginx/sites-enabled/the-quiet-index -> ../sites-available/the-quiet-index
/etc/nginx/snippets/tqi-security-headers.conf
/etc/letsencrypt/               # certificates, private keys; root-managed, not uploaded
```

Release ID is validated (`<UTC-build-id>-<source-revision>` or another constrained collision-free value); reject slashes, traversal, shell metacharacters and reuse with different bytes. No assumption that source has already been committed. Release.json records source revision/dirty-build status, app/content/save/engine/parser versions, toolchain and artifact digests without secrets.

A dedicated deployment user owns only the project's upload/release/shared paths. Nginx worker account (normally www-data; verify actual service user) has traversal/read permissions, **no write permission**. Prefer project directories 0750 and files 0640 with a read-only web group; verify execute bits on each parent and no unrelated group member gains deploy access. Never use chmod 777 or make www-data own the repository. Certificate keys and /etc/nginx remain root-managed. Deployment scripts do not acquire unrestricted sudo; configuration/certificate maintenance is a separate approved operation, with any helper root-owned and narrowly scoped.

Never copy `.git`, `.env`, source specs, tests, node_modules, SSH material or save exports into web roots. Public source maps are excluded unless deliberately approved. Do not expose directory listings, internal incoming/releases listings or dotfiles; allow only the specific ACME challenge exception on HTTP.

## 4. Old-client asset continuity — mandatory before atomic deployment

**A symlink switch alone is insufficient:** a still-open old page can request an old hashed chunk or uncached mission after promotion. Pointing all requests only at current would make those requests 404.

Implement these URL contracts jointly with T33/T34:

| URL class | Filesystem source | Invariant |
|---|---|---|
| `/assets/<hash>...` | `shared/assets/` | Copy verified emitted assets additively; same path with different checksum aborts deploy |
| `/content/releases/<release-id>/...` | `shared/content/releases/<release-id>/` | Pin all content pack/SQL/locale/seed URLs to the page's release; never overwrite a release |
| `/`, `/index.html`, `/sw.js`, `/release.json`, manifest/icons | `current/` | Mutable entrypoints change only after required immutable objects exist |

The actual worker filename from vite-plugin-pwa must be recorded; do not assume `/sw.js` if build configuration emits another entrypoint. All worker imports/parser WASM/PGlite data/snapshot URLs must follow verified immutable/version-pinned paths; unhashed runtime binary URLs are not silently treated as immutable. Reference to `release.json` from an old page must not replace that page's pinned content/version mapping with the newest incompatible one. Versioned content stays under the spec's `/dist/content/` tree; the build/release manifest and offline-pack validator resolve the new subpaths consistently.

Deploy copies approved dist/assets and dist/content/releases payloads into shared storage **before** switching current. No `rsync --delete` against shared or active directories. Stage/validate in a unique directory and only then rename into the final release location on the same filesystem. This is additive object storage using Nginx files, not a new application server.

Initial retention proposal: keep at least the last three compatible releases and all immutable dependencies for releases younger than 30 days; never delete current, previous, in-flight staging or their dependency closure. Extend retention based on disk/use review and published support window. Time/count retention cannot prove no old/offline browser exists. Document that a client returning after the support window may need a safe app update; missing assets must return real 404s and a recoverable UI message, never incompatible replacement data. Browser Cache API retention is an additional client policy, not proof that server pruning is safe.

## 5. Nginx virtual-host behavior and header contract (V02)

Implement `deploy/nginx/the-quiet-index.conf` and reviewed snippet(s) during the corresponding task, not during this planning change. Use distro-provided MIME mappings; explicitly verify WASM, JS/module-worker, JSON and webmanifest responses. Avoid a types override that accidentally drops other MIME mappings.

### Routing

- Dedicated `server_name sql.thetirtayasa.my.id`, no catch-all takeover of existing sites.
- HTTP challenge location serves only the controlled ACME webroot; other HTTP traffic redirects to the literal canonical HTTPS hostname, not an untrusted Host-header-derived redirect target. Unknown hosts handled by the existing reviewed default-site policy.
- HTTPS static root uses current; exact/prefix locations serve the shared immutable namespaces above. Verify Nginx root/alias/try_files trailing-slash behavior and traversal/encoded-path cases with real files.
- Hash routing requires no `try_files ... /index.html` catch-all. `/` serves index; `/#/mission/021` requests `/`. Missing worker/WASM/JSON/JS and `/api/*` must return 404, not HTTP-200 HTML. Provide genuine 404 HTML for document navigation only; never mask missing binary/content errors.
- `autoindex off`; deny nonpublic paths/dotfiles and unsupported upload/write methods. Permit GET/HEAD; keep ACME reads working. No application upload endpoint needed for browser File API imports.

### MIME / cache / compression matrix

| Resource | Required response policy |
|---|---|
| HTML including root/index/404 | Correct text/html; `Cache-Control: no-cache` (must revalidate), no immutable flag |
| Stable service-worker entrypoint | JavaScript MIME; `Cache-Control: no-cache`; scope restricted to app origin root; avoid unnecessary Service-Worker-Allowed broadening |
| Stable release manifest, webmanifest, nonhashed icons/metadata | Correct MIME; no-cache until explicitly versioned; release fetch uses network-first + cached fallback in app |
| Existing hashed `/assets/` and pinned content release objects | `public, max-age=31536000, immutable` on successful static responses; bytes never change at those URLs |
| Missing/denied resources | Real 404/403/405 as appropriate, `Cache-Control: no-store`; never apply year-long caching to errors |
| `.wasm` | `Content-Type: application/wasm`; body is real WASM, not fallback HTML |
| Module/worker `.js`, `.json`, binary `.data`/snapshots | Correct actual MIME and byte integrity; application/octet-stream for opaque binary as needed |

Enable gzip for appropriate text/JSON/JS/CSS/SVG/WASM/data responses **after measuring**, with `Vary: Accept-Encoding`; do not double-compress already gzipped snapshots. On-the-fly gzip is sufficient for baseline Ubuntu packaging. Precompressed `.gz` via gzip_static is optional only if installed module and artifact checks prove support; Brotli is not a required module/package. Verify GET/decompressed content digest as well as HEAD metadata; binary corruption hidden by compression is a release blocker.

### Security headers

- Start from spec CSP: default-src self; script-src self + wasm-unsafe-eval; worker-src self; connect-src self; style-src self; img-src self data; font-src self; object-src none; base-uri self; form-action self. Add header-only `frame-ancestors 'none'`; no third-party origins, broad unsafe-eval or automatic unsafe-inline workaround.
- Test CSSStyleSheet/CodeMirror/Lit behavior and actual worker URLs under enforced CSP in real browsers. Use report-only temporarily for controlled staging diagnosis if needed, then require enforced production policy; no external reporting endpoint that leaks page/query details by default.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, and a conservative reviewed Permissions-Policy disabling unused sensitive APIs.
- HSTS on HTTPS only: start with short max-age (e.g. 300), raise after TLS/renewal/rollback validation. Do not add includeSubDomains/preload for a domain tree the owner has not approved.
- No COOP/COEP requirement introduced: PGlite feasibility must not assume SharedArrayBuffer/isolation. If evidence later requires it, review explicitly.

**Nginx inheritance pitfall:** location-level add_header can stop inheriting server headers on common Ubuntu Nginx versions. Include the complete approved security snippet in each location that declares headers, use `always` for security headers, and test 200/304/404/error responses explicitly. Successful immutable caching must not turn errors into immutable errors. Do not rely on newer add_header inheritance directives being present before version inspection. Review effective configuration with nginx -t and curl/browser header assertions; syntax validation alone does not prove header correctness.

## 6. TLS bootstrap and renewal (V03)

1. Back up relevant existing configs/certificate metadata securely; inventory existing Certbot installation to avoid competing snap/apt/manual installs.
2. With explicit authorization, use supported Ubuntu Nginx/Certbot packages for that host; do not blindly install a second server or replace the default virtual host.
3. Enable this site's **HTTP-only** ACME webroot configuration first; `nginx -t` before graceful reload. Do not reference certificate files that do not exist yet.
4. Prove the public challenge URL works over every advertised address. Obtain a Let's Encrypt certificate using `certbot certonly --webroot -w /var/www/letsencrypt -d sql.thetirtayasa.my.id` with owner-supplied email/terms consent and approved install method. Prefer staging/dry-run checks before live issuance; avoid issuance loops/rate limits.
5. Enable the TLS server with correct fullchain/key paths, TLS 1.2/1.3 as supported, then test and reload Nginx. HTTP/2 optional only with syntax supported by the installed build. Never stop Nginx unnecessarily for standalone issuance.
6. Verify certificate chain, hostname, expiry and HTTPS boot/WASM fetch from a clean browser; enable canonical HTTP redirect while preserving challenge route.
7. Confirm the installed Certbot renewal timer/schedule. Run a documented `certbot renew --dry-run`; successful-renewal deploy hook validates Nginx config and reloads it to read renewed certificates. Dry-run does **not** execute deploy hooks by default; test the hook separately or explicitly use the supported run-deploy-hooks option. Alert on renewal failure/expiry; a successful dry-run is not proof of timer scheduling or hook execution.

Certificate private keys never enter Git or app release archives. Do not disable certificate verification or use an IP URL as proof that the canonical secure origin works; PWA/IndexedDB saves are origin-bound.

## 7. Release procedure (V04, V05)

Future `tools/deploy-vps.sh` (or equally small reviewed SSH script) must implement:

1. Build/test once in clean CI/local environment using pinned lockfile. Produce dist archive, manifest and checksum file tied to release ID; verify no forbidden files/source maps and all manifest paths safe.
2. Serialize deployments with a project-specific lock. Upload into `incoming/<id>` using verified SSH host keys. Never execute archive-provided commands.
3. Validate archive entries against absolute paths, traversal, unsafe symlinks and unexpected file types before extraction; enforce disk headroom and verify checksums after upload. Do not build/npm install on VPS.
4. Populate shared immutable assets additively, rejecting same-URL/different-digest collisions. Stage mutable entrypoints and the complete verified dist tree in releases/<id>.tmp, then same-filesystem rename. Staging stays unreachable over public URL.
5. Check release/engine/content compatibility and all referenced immutable URLs. Configuration changes, if any, require root-approved nginx -t → graceful reload first; pure static release switches should not require Nginx reload. Validate symlink/open_file_cache behavior; keep entrypoint file caching disabled or proven safe for atomic switches.
6. Record previous target, then replace current by same-filesystem atomic symlink rename (not delete then create, not rsync into live root). Validate constrained release paths and use a checked idempotent activation procedure.
7. Run external HTTPS GET/header/hash/worker/parser/CodeMirror boot smoke tests and browser update/offline test. On failure, stop promotion and restore the prior **compatible** pointer; do not run cleanup as part of a failed promotion.
8. Record release manifest/digests/operator/test results; retain compatible rollback artifacts. Clean up only reviewed expired releases under retention policy, never while another deploy holds the lock.

T42 rehearses old/new/rollback artifacts; T43 is final public authorization. First deployment may expose a restricted staging/demo virtual host or an explicitly authorized staging period on the real domain. A staging hostname does not prove the final-domain service-worker scope, TLS or IndexedDB behavior; rerun those at the real origin. Do not accidentally ship staging authentication restrictions or credentials in public PWA assets.

## 8. Rollback and save-compatibility contract (V05)

- Server rollback restores a verified known-good release pointer and retains all immutable dependencies for both versions. Test rollback before public beta, including failure immediately after pointer switch and during a pack download.
- **Do not downgrade browser saves.** Before rollback, verify old app supports save/content versions written by the newer app. Prefer forward-compatible additive changes. If not compatible, retain/ship a recovery-capable shell or forward fix; old app must preserve unknown future-version bytes and offer export/read-only recovery rather than reset progress.
- A rollback does not instantly replace already-active service workers/pages or erase their caches. Rehearse N→N+1→N (or a recovery release), explicit update prompt, two tabs, paused old tab requesting a formerly uncached asset and offline reopen.
- Never clear IndexedDB, use Clear-Site-Data, force SW unregister/cache wipe, change origin to escape a problem, or silently regrade/revoke solved missions. Such operations can destroy the exact progress this product promises to preserve.
- Export reminders and user-held backups protect player progress; server snapshots back up **deployment/configuration only**, not browser data. Preserve HTTPS hostname permanently to avoid orphaning origin-local saves.

## 9. Operations, backups and privacy (V06)

- Monitor Nginx service health, HTTPS/certificate expiry, artifact/asset 404 rates, disk headroom and renewal timer outcomes. No in-game analytics or query/notes upload is introduced.
- Use log rotation and an owner-approved short retention period. Default combined logs may include IPs and query strings: choose a reviewed minimal per-site format (status, path without args, timestamp and duration; omit identifiers/unneeded referrers) or disable access logging if suitable. Hash-route state is not sent to server; do not claim ordinary HTTP delivery has no host metadata exposure.
- Back up Nginx configs, release manifests and known-good artifacts; protect certificate/account material with encrypted restricted backups if included. Document restore to a replacement VPS using the **same HTTPS origin**, DNS cutover and fresh TLS validation. No player export files should be requested/stored by deployment tooling.
- Establish Ubuntu security update ownership and a maintenance process preserving other sites; do not enable unattended reboot or replace host-wide settings without owner consent. Capacity requirements come from measured artifact traffic and retention, not a guessed need for a database server.
- Disaster restore procedure verifies config, certificates, assets and secure permissions before DNS cutover; DNS rollback is operationally slower than a current-pointer rollback and not the default release strategy.

## 10. Acceptance evidence (V07, T42)

| Check | Required evidence |
|---|---|
| Configuration isolation | nginx -t passes; relevant effective config reviewed securely; unrelated sites/SSH unaffected |
| DNS/TLS | A/AAAA/CAA checks, canonical HTTP redirect + challenge exception, valid chain/name/expiry; renewal dry-run + timer/hook proof |
| Static boundary | No Node/PG/API required; browser SQL executes in worker while server only serves artifacts |
| Header/MIME | GET/HEAD and 304/404 matrix for HTML, manifest, SW, JS, worker, WASM, data, content; no missing-asset HTML fallback or immutable error |
| Compression | Vary/Content-Encoding correct; decompressed hashes match; WASM stream compilation succeeds |
| Security | CSP enforced and all supported input/worker flows pass; no directory/dotfile/source/secret exposure; main/child error headers retained |
| Version continuity | Old uncached chunk and old pinned mission still load after promotion; mismatched digests fail deploy; no mixed PG/WASM/snapshot |
| PWA | First download/offline act completion; declined update; approved update after save; two-tab and rollback workflows; all at actual domain |
| Save integrity | Existing campaign/drafts/evidence/mastery/notes survive deploy/rollback/export-import; unsupported save preserved, not downgraded |
| Operations | Deployment locking/idempotence, disk/permissions, backups/restore, safe retention and monitoring documented/tested |

Application build/fixture/browser suites remain mandatory alongside infrastructure checks. nginx -t alone is not GATE-DEPLOY; no actual VPS verification is claimed in this planning update.

## 11. References and evidence limits

- [Ubuntu Server: install Nginx](https://ubuntu.com/server/docs/how-to/web-services/install-nginx/) — official installation/service baseline; actual installed version still requires preflight.
- [Nginx headers module](https://nginx.org/en/docs/http/ngx_http_headers_module.html), [core/root/alias/try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html), [gzip](https://nginx.org/en/docs/http/ngx_http_gzip_module.html). Direct nginx.org fetch was unavailable during planning; official nginx/nginx.org source documentation was retrieved instead: [headers XML](https://github.com/nginx/nginx.org/blob/master/xml/en/docs/http/ngx_http_headers_module.xml), [core XML](https://github.com/nginx/nginx.org/blob/master/xml/en/docs/http/ngx_http_core_module.xml), [gzip XML](https://github.com/nginx/nginx.org/blob/master/xml/en/docs/http/ngx_http_gzip_module.xml). Master documentation may describe directives newer than the VPS package; verify version support.
- [Certbot user guide](https://eff-certbot.readthedocs.io/en/stable/using.html) — webroot HTTP-01, renewal scheduling and deploy-hook/dry-run distinctions.

All paths, permissions and retention durations above are proposed deployment contracts to verify in V01–V07, not observations of the owner's VPS. No credentials, package installs, DNS changes or SSH connections were used to prepare this plan.

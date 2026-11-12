# Owner action checklist

**Assigned coordinator:** Abdul F. Tirtayasa (project owner), explicitly confirmed during CP0a implementation. Coordinate access and recruitment; you need not personally perform every audit. Never put passwords, SSH private keys, API tokens or participant personal data in this repository.

## CP0a assignment — complete

- [x] Accept coordination of VPS/DNS/SSH access.
- [x] Accept coordination of device and assistive-technology operators.
- [x] Accept coordination of silent-playtest recruitment.

Assignment is not a claim that the future checks below have passed. These facts are not required to render the CP0a local static foundation.

## Before V01–V03: VPS access and HTTPS proof

- [ ] Supply VPS address and Ubuntu version through an appropriate private channel.
- [ ] Inventory existing Nginx sites/services and confirm which must remain untouched.
- [ ] Confirm SSH/sudo access and authorized deployment account; do not share private keys in chat or Git.
- [ ] Confirm DNS control of `sql.thetirtayasa.my.id` and current A/AAAA records.
- [ ] Choose certificate contact and confirm any existing Certbot/TLS arrangement.
- [ ] Confirm backup/recovery access, disk capacity and firewall/SSH recovery method.
- [ ] Explicitly authorize the bounded live operations after reviewing the proposed commands.
- [ ] Review [VPS deployment plan](vps-deployment.md) preflight evidence before activation.

## Before T07/T08 and T36: device / assistive-tech access

- [ ] Nominate operators for actual Windows Chrome/Edge and Firefox, macOS Safari, iOS Safari and Android Chrome.
- [ ] Include a representative low-end Android device (~4 GB RAM); record versions and available memory, not only viewport emulation.
- [ ] Arrange NVDA, VoiceOver and TalkBack keyboard/editor audits with appropriate users/operators.
- [ ] Schedule local/deployed-CSP CodeMirror-versus-textarea checks, cold/warm/offline boots and real mobile keyboard checks.
- [ ] Keep a private operator/contact register and publish only consented, non-identifying findings in QA evidence.

## M0 evidence required after software review

CP0b's Android Chrome/Windows functional report is recorded and not requested again. These are **new M0-specific findings**, using the existing owner coordination assignment:

- [ ] Review the [M0 proof and file map](m0-review.md), local [90-trial measurements](../docs/benchmarks/m0-local.json) and [QA procedure](../docs/QA.md).
- [ ] Supply actual Android/iOS cold/repeat/offline P75, transferred bytes, total peak memory and editor/IME results; record build/device/OS/browser versions and a tested memory envelope.
- [ ] Supply named VoiceOver/TalkBack/NVDA findings; earlier general platform success is not inferred to include them.
- [ ] After separate deployment authorization, run native-install/offline/two-release and document/worker CSP/MIME/nosniff checks at the actual HTTPS test origin. Earlier Cloudflare proof lacked CSP/nosniff response headers; no host configuration was changed during M0 coding.
- [ ] Decide M0 go/no-go and the provisional initdb-versus-snapshot choice with that evidence. Do not infer approval of T10, commit, push or deployment from a software handoff.

M0 software was committed through `201ed3e` with hosted CI passing. The owner then explicitly authorized CP1a development; this does not fill the factual findings above.

## CP1a software review — approved for Git delivery

- [x] Owner approved [T10–T12 changes, TDD evidence and acceptance ledger](cp1a-review.md) and the [native storage contract](../docs/STORAGE.md).
- [ ] Build/preview `/storage.html`: explicit create, save/reload, preferences, truthful recovery messages and local recovery-copy download. The original proof pages remain separate; this desk does not execute player SQL.
- [x] Owner explicitly authorized staging/commit/push and remote CI monitoring. Delivered `26e89d8`; [hosted quality/browser CI passed](https://github.com/abdtirtayasa24/sql-quiet-index/actions/runs/42552847584). Real-device/AT/host gates above remain open; the native desk's recovery copy is not canonical interchange.

## CP1b software review — approved for Git delivery

- [x] Owner authorized T13–T15 using TDD, then stop without staging/commit/push.
- [x] Owner approved CP1b after functional review on the owner-updated `https://sql.abdtirtayasa24.workers.dev` staging build: `/storage.html` saving/recovery download and settings export/import/local recovery-copy download worked. [CP1b changes/evidence](cp1b-review.md) and [portable-file contracts](../docs/STORAGE.md) retain the detailed automated proof and limits. No device/browser versions or AT/header findings were supplied.
- [ ] Build/preview `/#/settings`: export, select, preview, explicit merge/new copy, original-file download and invalid/future recovery; visit `/#/mission/021` and back/forward navigation.
- [x] Owner explicitly requested commit/push with a one-line message. No T16 or further agent deployment is authorized; actual device/AT/hosting gates remain open.

## Before T38: silent act playtests

- [ ] Recruit 5–7 consenting participants per act, including true beginners, intermediate/advanced SQL users and mobile-only/keyboard/screen-reader perspectives.
- [ ] Assign an observer and schedule sessions; observers must not solve the puzzle for participants.
- [ ] Review consent, voluntary diagnostic-export/redaction and privacy arrangements before collection.
- [ ] Review confusion/hint/alternative-SQL findings and prioritize fixes; do not infer learning from XP.

## At each checkpoint

- [ ] Review the implementation diff and checkpoint evidence.
- [ ] Request changes or authorize a commit explicitly. No automatic checkpoint commits.
- [ ] Approve the next scope before expansion past the agreed checkpoint.

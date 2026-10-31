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

## Before T38: silent act playtests

- [ ] Recruit 5–7 consenting participants per act, including true beginners, intermediate/advanced SQL users and mobile-only/keyboard/screen-reader perspectives.
- [ ] Assign an observer and schedule sessions; observers must not solve the puzzle for participants.
- [ ] Review consent, voluntary diagnostic-export/redaction and privacy arrangements before collection.
- [ ] Review confusion/hint/alternative-SQL findings and prioritize fixes; do not infer learning from XP.

## At each checkpoint

- [ ] Review the implementation diff and checkpoint evidence.
- [ ] Request changes or authorize a commit explicitly. No automatic checkpoint commits.
- [ ] Approve the next scope before expansion past the agreed checkpoint.

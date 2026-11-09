# Foundation design system — token version 1

## Direction and scope

Spec §13 defines the visual identity: a charcoal/navy investigation desk, off-white paper, teal affordances and amber unresolved state, with system fonts and vanilla CSS. Preserve that approved direction rather than applying a generic landing-page palette. The physical scene is a learner reading municipal records on a laptop or phone, with long focused sessions; legibility and reduced visual fatigue take precedence over decorative effects. The light counterpart follows the OS preference.

CP0a is a quiet reading shell, not a simulated workspace. It has one main landmark, one h1, h2 sections, a native disclosure and a skip link. No pretend gameplay button, stock card grid, animation, external image/font or theme persistence has been added. Root shell uses Lit light DOM intentionally so landmarks, native disclosure, inherited tokens and the skip target share a document; future components must test any Shadow DOM boundaries explicitly.

## Authoritative tokens

`src/styles/tokens.css` is the source of truth; names and `--tokens-version: 1` are stable. Colors use OKLCH; browsers resolve to sRGB for the automated WCAG luminance check.

| Role                                              | Dark                    | Light                   |
| ------------------------------------------------- | ----------------------- | ----------------------- |
| Background                                        | `oklch(0.18 0.015 250)` | `oklch(0.97 0.003 250)` |
| Surface                                           | `oklch(0.23 0.015 250)` | `oklch(1 0 0)`          |
| Text                                              | `oklch(0.95 0.007 85)`  | `oklch(0.24 0.012 250)` |
| Muted                                             | `oklch(0.76 0.012 250)` | `oklch(0.43 0.02 250)`  |
| Accent / focus                                    | `oklch(0.82 0.105 180)` | `oklch(0.42 0.08 180)`  |
| Warning                                           | `oklch(0.85 0.13 80)`   | `oklch(0.44 0.09 80)`   |
| Danger                                            | `oklch(0.76 0.14 18)`   | `oklch(0.43 0.16 18)`   |
| Border                                            | `oklch(0.58 0.012 250)` | `oklch(0.5 0.012 250)`  |
| Paper (reserved; not a text-bearing CP0a surface) | `oklch(0.96 0.018 85)`  | Same                    |

Body is 1rem/1.65 system-ui; metadata is 0.875rem system monospace; headings are 2.5rem desktop / 2rem mobile, section headings 1.25rem. Prose is capped at 65ch. Spacing is 4px-derived; main interaction target is ≥44px. Focus uses a 2px outline with 4px offset. No colored state is the only indicator: all states have explicit text.

Motion defaults to **0 seconds**. Only `prefers-reduced-motion: no-preference` enables a 160ms color transition on the disclosure. No animation gates visibility. OS theme selection is implemented; user theme/settings storage is T10, not silently implemented now.

## Contrast and regression evidence

`tests/e2e/foundation.spec.ts` resolves actual CSS tokens through a canvas and computes the WCAG sRGB luminance ratio. In **each theme**, text, muted, accent, warning, danger and focus are checked against both background and surface (12 combinations per theme), each at ≥4.5:1, stronger than the non-text focus threshold. `paper` is reserved and not an approved future text pairing until separately tested.

The same built-app test also checks zero-duration reduced motion, native keyboard disclosure, visible focus, one main/heading and no page overflow at 320, 360, 768 and 1280px. Axe tests cover expanded disclosure and compatibility notices in both themes on Chromium, Firefox and WebKit. These checks do not replace manual screen-reader/real-device audits.

Four Windows/Chromium screenshot baselines live under `tests/e2e/__screenshots__/win32/chromium/`: dark/light ×360/1280px. Review baselines before updates; `npm run test:visual` compares them without accepting new images automatically. Different platforms/fonts require their own deliberate baseline review, never blanket tolerance increases. CI intentionally uses Windows to match this initial platform. CP0a's hosted run passed on `7882873`; hosted results for the uncommitted CP0b changes are not claimed.

## CP0b engineering input surface

`/feasibility.html` is a separate, plainly labeled proof desk, not the game workspace. It reuses the same tokens/system fonts and keeps the original foundation and its four baselines unchanged. No fake evidence, save or gameplay controls. The only actions are real syntax inspection, fixed PG probes and input-adapter switching.

The Lit editor uses Shadow DOM for local styles and label/help ownership, a ≥160px-high ≥16px editing surface, visible focus and ≥44px action buttons. CodeMirror compartments reconfigure SQL schema and dark/light appearance without replacing the view. A matching native textarea preserves in-page draft/history/selection, announces the switch and keeps Tab/keyboard inspection usable. Both explicitly state that reloading does not save a draft yet.

Default CodeMirror keyword purple failed dark contrast at 1.71:1. The custom syntax highlighter now uses the previously checked accent/warning/muted tokens for keywords, literals and comments, with bold/italic differentiation. Axe AA checks pass for both input modes/themes on all three automated browser engines; they are not human AT certification. Controls introduce no authored animation.

Four additional Windows/Chromium baselines (`feasibility-dark-360.png`, `feasibility-dark-1280.png`, `feasibility-light-360.png`, `feasibility-light-1280.png`) were visually inspected before a normal comparison pass. They show the initial editor/probe states, not an approved production gameplay screen or every error/result state. Behavioral failure paths and current manual gaps are documented in [QA](QA.md).

## CP1a local durability desk

`/storage.html` reuses the checked foundation tokens with a native draft field (minimum 160px, 16px monospace), labeled 44px preference controls, wrapped actions and explicit pending/committed/conflict/recovery text. Persisted dark/light overrides repeat the same checked palette, not a new theme. EN/ID review copy changes document language without changing SQL. The view emits intents; it never calls IndexedDB directly.

Keyboard creation moves focus to the newly available draft rather than losing it when the creation button disappears. Empty/ready axe and reduced-motion reflow checks cover three automated engines at 320/360/768/1280. Four new `storage-{dark|light}-{360|1280}.png` images are reviewed before comparison; only dynamic ID/seed are masked (pink is test masking, not UI). All previous twelve baselines remain intact. This is a review surface, not the T15 workspace or a human AT audit. See [storage](STORAGE.md) and [review](../tasks/cp1a-review.md).

## M0 technical desk

`/technical.html` deliberately extends the same restrained engineering desk, not the future campaign workspace. Shared proof selectors preserve existing foundation/CP0b appearance; technical-only spacing separates wrapped 44px buttons, long release IDs wrap, and labels remain native. No new theme, UI library, external art/font or motion. The install icon is an original three-line records-ledger glyph generated locally at 192/512px, not a stock brand asset.

Boot, opt-in offline download and update controls expose real operations and explicit loading/error/ready text. The editor's Inspect action is wired to the existing typed parser without executing arbitrary SQL; Worker construction failure leaves the editor usable. Update copy says that drafts are in-memory only and requires acknowledgment before an explicit reload; another tab is not automatically refreshed.

The four new `technical-{dark|light}-{360|1280}.png` baselines were inspected after implementation corrections, before ordinary comparison. Only the variable build-release label is masked (the magenta bar is a screenshot mask, not runtime UI); controls, layout and copy are not hidden. Previous eight images are unchanged. Keyboard skip-link and reflow at 320/360/768/1280 plus rich/native axe checks pass on Chromium/Firefox/WebKit. Explicit skip-link tabindex addresses the observed WebKit Tab behavior. These are automated/visual findings, not real mobile/AT certification.

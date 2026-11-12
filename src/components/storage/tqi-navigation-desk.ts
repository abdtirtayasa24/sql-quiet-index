import { html, LitElement } from 'lit';
import type { AppSnapshot } from '../../types/events';
import type { PortableState } from '../../app/portable-controller';
import { portableErrors } from '../../app/portable-copy';
export function routeTitle(view: AppSnapshot): string {
  if (view.phase === 'booting') return 'Opening local records';
  if (view.phase === 'unsupported') return 'Read-only compatibility notice';
  if (view.phase === 'storage-error') return 'Local records need attention';
  const route = view.route;
  switch (route.kind) {
    case 'home':
      return 'Your investigations';
    case 'settings':
      return 'Settings / safe storage';
    case 'casebook':
      return 'Casebook';
    case 'practice':
      return 'Cold case practice';
    case 'act':
      return `Act ${route.actId}`;
    case 'mission':
      return `Mission ${route.missionId} is locked`;
    default:
      return 'Page not found';
  }
}
export class TqiNavigationDesk extends LitElement {
  static override properties = {
    view: { attribute: false },
    portableView: { attribute: false },
    hasOriginal: { type: Boolean },
  };
  declare view: AppSnapshot | undefined;
  declare portableView: PortableState;
  declare hasOriginal: boolean;
  constructor() {
    super();
    this.view = undefined;
    this.portableView = { kind: 'idle' };
    this.hasOriginal = false;
  }
  protected override createRenderRoot() {
    return this;
  }
  protected override render() {
    const view = this.view;
    if (!view) return html`<p role="status">Opening local records…</p>`;
    const route = view.route;
    return html` <p class="build-label">
        Portable progress / navigation · CP1b
      </p>
      <h1 id="route-heading" tabindex="-1">${routeTitle(view)}</h1>
      <nav aria-label="Investigation navigation">
        ${[
          ['home', 'Home'],
          ['act/03', 'Act 03'],
          ['casebook', 'Casebook'],
          ['practice', 'Practice'],
          ['settings', 'Settings'],
        ].map(
          ([path, label]) =>
            html`<a
              href=${`#/${path}`}
              aria-current=${route.kind === path || (path === 'act/03' && route.kind === 'act' && route.actId === '03') ? 'page' : 'false'}
              >${label}</a
            >`,
        )}
      </nav>
      ${view.phase === 'booting' ? html`<p id="route-status" tabindex="-1" role="status">Opening local records… No investigation is created automatically.</p>` : ''}
      ${view.phase === 'unsupported' ? html`<p role="status">${view.reason === 'save-version' ? 'Newer local records remain read-only. Keep a recovery copy and reopen a compatible release.' : `This browser is missing: ${view.features.join(', ')}. You can still read this desk and preserve readable records. No case was reset.`}</p>` : ''}
      ${view.phase === 'storage-error' ? html`<p role="alert">${portableErrors[view.code]}</p>` : ''}
      ${
        view.phase === 'ready' && route.kind === 'home'
          ? html`<p>
                ${view.campaigns.length} local investigation(s). Use the local
                durability desk to create an investigation, or Settings to
                import a saved case file. Full mission play is not available at
                this checkpoint.
              </p>
              <ul>
                ${view.campaigns.map((campaign) => html`<li class="portable-id">${campaign.campaignId} · ${campaign.completedMissionIds.length} saved solved IDs</li>`)}
              </ul>`
          : ''
      }
      ${
        view.phase === 'ready' && route.kind === 'mission'
          ? html`<p>
                This mission is not published in this checkpoint. Imported
                solved IDs are retained, but cannot expose unpublished content.
                No progression was skipped and no SQL worker was started.
              </p>
              <p>
                Return to Home or keep a case-file backup in Settings. Published
                prerequisites and the full workspace arrive in later reviewed
                tasks.
              </p>`
          : ''
      }
      ${view.phase === 'ready' && route.kind === 'act' ? html`<p>This is the route for Act ${route.actId}, not a published playable act. Saved evidence remains local and can be exported from Settings.</p>` : ''}
      ${view.phase === 'ready' && route.kind === 'casebook' ? html`<p>${view.counts.evidence ?? 0} evidence record(s), ${view.counts.notes ?? 0} note(s). Their text and provenance are preserved in case-file exports. The interactive casebook is a later task; this route does not award or rewrite evidence.</p>` : ''}
      ${view.phase === 'ready' && route.kind === 'practice' ? html`<p>No practice packs are published yet. Saved concept events remain intact; navigating here does not grant mastery or completion credit.</p>` : ''}
      ${view.phase === 'ready' && (route.kind === 'home' || route.kind === 'practice') ? html`<p><a href="/workspace.html">Open local SQL workbench</a> — read-only sample records; no mission or mastery credit.</p>` : ''}
      ${route.kind === 'not-found' ? html`<p>This route is not recognized. Choose Home above; saved records have not been changed.</p>` : ''}
      ${route.kind === 'settings' ? html`<tqi-portable-desk .view=${this.portableView} .hasOriginal=${this.hasOriginal} .canExport=${view.phase === 'ready' && view.campaigns.length > 0} .canImport=${view.phase === 'ready' || (view.phase === 'storage-error' && (view.code === 'missing' || view.code === 'corrupt'))}></tqi-portable-desk>` : ''}
      <p>
        <a href="/storage.html">Local recovery desk</a> ·
        <a href="/">Foundation introduction</a>
      </p>`;
  }
}

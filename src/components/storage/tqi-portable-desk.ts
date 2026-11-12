import { html, LitElement } from 'lit';
import type { PropertyValues } from 'lit';
import type { PortableState } from '../../app/portable-controller';
import { portableErrors } from '../../app/portable-copy';
export type PortableIntent =
  | { type: 'SELECT'; file: File }
  | { type: 'CONFIRM'; mode: 'merge' | 'copy'; confirmed: boolean }
  | { type: 'EXPORT' | 'ORIGINAL' | 'RECOVERY' };
export class TqiPortableDesk extends LitElement {
  static override properties = {
    view: { attribute: false },
    hasOriginal: { type: Boolean },
    canExport: { type: Boolean },
    canImport: { type: Boolean },
    consent: { state: true },
    mode: { state: true },
  };
  declare view: PortableState;
  declare hasOriginal: boolean;
  declare canExport: boolean;
  declare canImport: boolean;
  declare consent: boolean;
  declare mode: 'merge' | 'copy';
  constructor() {
    super();
    this.view = { kind: 'idle' };
    this.hasOriginal = false;
    this.canExport = false;
    this.canImport = true;
    this.consent = false;
    this.mode = 'copy';
  }
  protected override createRenderRoot() {
    return this;
  }
  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('view') && this.view.kind === 'preview')
      this.consent = false;
  }
  private emit(detail: PortableIntent) {
    this.dispatchEvent(
      new CustomEvent<PortableIntent>('portable-intent', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
  protected override render() {
    const view = this.view;
    const busy = view.kind === 'reading' || view.kind === 'importing';
    return html` <section aria-labelledby="portable-export-heading">
        <h2 id="portable-export-heading">Keep a portable copy</h2>
        <p>
          Saved records stay on this device unless you download them. Export
          before merging, especially if another tab has a draft. Only committed
          records are included.
        </p>
        <div class="portable-actions">
          <button
            ?disabled=${!this.canExport || busy}
            @click=${() => this.emit({ type: 'EXPORT' })}
          >
            Export saved case file</button
          ><button
            ?disabled=${busy}
            @click=${() => this.emit({ type: 'RECOVERY' })}
          >
            Download local recovery copy
          </button>
        </div>
        <p class="portable-help">
          A recovery copy preserves readable local records, including
          unsupported versions. It is not canonical interchange. Browser storage
          and persistence are not backup guarantees.
        </p>
      </section>
      <section aria-labelledby="portable-import-heading">
        <h2 id="portable-import-heading">Bring a case file here</h2>
        <p id="portable-file-help">
          Choose a JSON export, up to 5 MiB. Validation and preview do not
          import anything. SHA-256 detects corruption, not authenticity. No file
          is uploaded.
        </p>
        <label for="portable-file">Choose case file</label>
        <input
          id="portable-file"
          type="file"
          accept=".json,application/json"
          aria-describedby="portable-file-help"
          ?disabled=${view.kind === 'importing'}
          @change=${(event: Event) => {
            if (event.target instanceof HTMLInputElement) {
              const file = event.target.files?.[0];
              if (file) this.emit({ type: 'SELECT', file });
              event.target.value = '';
            }
          }}
        />
        ${this.hasOriginal ? html`<p class="portable-id">Selected file: ${view.fileName ?? 'selected file'}</p>` : ''}
        ${busy ? html`<p role="status">${view.kind === 'reading' ? 'Checking file…' : 'Importing in one transaction…'}</p>` : ''}
        ${view.kind === 'error' ? html`<p id="portable-alert" tabindex="-1" role="alert">${portableErrors[view.code]}</p>` : ''}
        ${
          view.kind === 'unsupported'
            ? html`<section class="notice">
                <h3 id="portable-alert" tabindex="-1">
                  Unsupported save version
                </h3>
                <p>
                  This file is read-only in this release. Its original bytes are
                  preserved for download. No downgrade or import was attempted.
                </p>
              </section>`
            : ''
        }
        ${
          view.kind === 'preview' || view.kind === 'importing'
            ? html` <section
                class="portable-preview"
                aria-labelledby="portable-preview-heading"
              >
                <h3 id="portable-preview-heading" tabindex="-1">
                  Review before importing
                </h3>
                ${!this.canImport ? html`<p>Local records are read-only or unavailable in this release. Preview and download work, but import confirmation is disabled.</p>` : ''}
                <p>
                  Integrity checked. ${view.summary.solved} solved mission IDs
                  in this file. No records have been imported by this preview.
                </p>
                <dl class="portable-counts">
                  ${Object.entries(view.summary.counts).map(
                    ([name, count]) =>
                      html`<div>
                        <dt>${name}</dt>
                        <dd>${count}</dd>
                      </div>`,
                  )}
                </dl>
                <details>
                  <summary>Campaign IDs in this file</summary>
                  <ul>
                    ${view.summary.campaignIds.map((id) => html`<li class="portable-id">${id}</li>`)}
                  </ul>
                </details>
                <label for="portable-mode">Import mode</label>
                <select
                  id="portable-mode"
                  .value=${this.mode}
                  ?disabled=${busy}
                  @change=${(event: Event) => {
                    if (
                      event.target instanceof HTMLSelectElement &&
                      (event.target.value === 'merge' ||
                        event.target.value === 'copy')
                    ) {
                      this.mode = event.target.value;
                      this.consent = false;
                    }
                  }}
                >
                  <option value="copy">New copy — keep both branches</option>
                  <option value="merge">Merge — same campaign identity</option>
                </select>
                <p>
                  New copy gives each campaign a new identity and remaps its
                  references. Merge unions solved IDs, deduplicates
                  evidence/events and uses the newest stamped draft; existing
                  notes and story choices win conflicts. Conflicts are reported,
                  not silently overwritten. Export local work first.
                </p>
                <label class="portable-consent"
                  ><input
                    type="checkbox"
                    .checked=${this.consent}
                    ?disabled=${busy || !this.canImport}
                    @change=${(event: Event) => {
                      if (event.target instanceof HTMLInputElement)
                        this.consent = event.target.checked;
                    }}
                  />I reviewed this preview and confirm the selected import
                  mode.</label
                >
                <button
                  ?disabled=${!this.consent || busy || !this.canImport}
                  @click=${() => this.emit({ type: 'CONFIRM', mode: this.mode, confirmed: this.consent })}
                >
                  ${this.mode === 'merge' ? 'Confirm merge' : 'Confirm new copy'}
                </button>
              </section>`
            : ''
        }
        ${
          view.kind === 'done'
            ? html`<section>
                <p id="portable-result" tabindex="-1" role="status">
                  Import committed.
                </p>
                <p>
                  ${view.conflicts.length} record conflicts reported. Keep the
                  original file for the other branch. Local notes/choices and
                  immutable provenance were not overwritten; draft conflicts
                  follow timestamp, tab ID and revision.
                </p>
                <details>
                  <summary>Imported campaigns and conflicts</summary>
                  <ul>
                    ${view.campaignIds.map((id) => html`<li class="portable-id">${id}</li>`)}${view.conflicts.slice(0, 50).map((id) => html`<li class="portable-id">${id}</li>`)}
                  </ul>
                  ${view.conflicts.length > 50 ? html`<p>First 50 conflicts shown. Keep the original file for all incoming records.</p>` : ''}
                </details>
              </section>`
            : ''
        }
        ${this.hasOriginal ? html`<button ?disabled=${view.kind === 'importing'} @click=${() => this.emit({ type: 'ORIGINAL' })}>Download original file</button>` : ''}
      </section>`;
  }
}

import { html, LitElement } from 'lit';
import type { StorageController } from '../../app/storage-controller';
import { storageCopy } from '../../app/storage-copy';
import type { Settings } from '../../storage/local';

export class TqiStorageDesk extends LitElement {
  static override properties = {
    view: { attribute: false },
    downloadError: { type: Boolean },
  };
  declare view: StorageController['view'] | undefined;
  declare downloadError: boolean;
  constructor() {
    super();
    this.view = undefined;
    this.downloadError = false;
  }
  protected override createRenderRoot() {
    this.replaceChildren();
    return this;
  }
  private emit<T>(name: string, detail: T) {
    this.dispatchEvent(
      new CustomEvent<T>(name, { detail, bubbles: true, composed: true }),
    );
  }
  private settings = (event: Event) => {
    if (!(event.target instanceof HTMLSelectElement) || !this.view) return;
    const settings: Settings = { ...this.view.settings };
    const value = event.target.value;
    if (
      event.target.id === 'storage-locale' &&
      (value === 'en' || value === 'id')
    )
      settings.locale = value;
    if (
      event.target.id === 'storage-theme' &&
      (value === 'system' || value === 'dark' || value === 'light')
    )
      settings.theme = value;
    if (
      event.target.id === 'storage-motion' &&
      (value === 'system' || value === 'reduce')
    )
      settings.motion = value;
    this.emit('storage-settings', settings);
  };
  protected override render() {
    const view = this.view;
    if (!view)
      return html`<h1>Local durability desk</h1>
        <p role="status">Opening local records…</p>`;
    const copy = storageCopy[view.settings.locale];
    return html`
      <p class="build-label">${copy.lead}</p>
      <h1>${copy.title}</h1>
      <p>${copy.intro}</p>
      ${view.phase === 'loading' ? html`<p role="status">${copy.loading}</p>` : ''}
      ${view.issue ? html`<section class="notice" aria-label=${copy.recovery}><p role="status" data-storage-issue>${copy[view.issue]}</p></section>` : ''}
      ${
        view.phase === 'empty'
          ? html`<section>
              <p>${copy.empty}</p>
              <button @click=${() => this.emit('storage-create', null)}>
                ${copy.create}
              </button>
            </section>`
          : ''
      }
      ${
        view.campaignId
          ? html`<section aria-labelledby="file-heading">
              <h2 id="file-heading">${copy.identity}</h2>
              <p data-campaign data-variable>${view.campaignId}</p>
              <p>${copy.seed}: <span data-variable>${view.seed}</span></p>
              <label for="storage-draft">${copy.draft}</label>
              <p id="draft-help">${copy.help}</p>
              <textarea
                id="storage-draft"
                aria-describedby="draft-help"
                maxlength="12000"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                .value=${view.sql}
                ?readonly=${view.phase !== 'ready'}
                @input=${(event: Event) => {
                  if (event.target instanceof HTMLTextAreaElement)
                    this.emit('storage-draft', event.target.value);
                }}
              ></textarea>
              <p role="status" data-save-status>${copy[view.draftStatus]}</p>
              ${!view.pointerSaved ? html`<p>${copy.pointerFail}</p>` : ''}
            </section>`
          : ''
      }
      <section aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">${copy.settings}</h2>
        <div class="storage-preferences">
          <div>
            <label for="storage-locale">${copy.language}</label
            ><select
              id="storage-locale"
              .value=${view.settings.locale}
              @change=${this.settings}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>
          <div>
            <label for="storage-theme">${copy.theme}</label
            ><select
              id="storage-theme"
              .value=${view.settings.theme}
              @change=${this.settings}
            >
              <option value="system">${copy.system}</option>
              <option value="dark">${copy.dark}</option>
              <option value="light">${copy.light}</option>
            </select>
          </div>
          <div>
            <label for="storage-motion">${copy.motion}</label
            ><select
              id="storage-motion"
              .value=${view.settings.motion}
              @change=${this.settings}
            >
              <option value="system">${copy.system}</option>
              <option value="reduce">${copy.reduce}</option>
            </select>
          </div>
        </div>
        <p data-settings-status>
          ${view.settingsSaved ? copy.settingsOk : copy.settingsFail}
        </p>
      </section>
      <section aria-labelledby="recovery-heading">
        <h2 id="recovery-heading">${copy.recovery}</h2>
        <p>${copy.recoveryHelp}</p>
        <div class="storage-actions">
          <button @click=${() => this.emit('storage-download', null)}>
            ${copy.download}</button
          ><button
            ?disabled=${view.phase === 'loading'}
            @click=${() => this.emit('storage-retry', null)}
          >
            ${copy.retry}
          </button>
        </div>
        ${this.downloadError ? html`<p role="alert">${copy.downloadFailed}</p>` : ''}
      </section>
      <a href="/">${copy.back}</a>
    `;
  }
}

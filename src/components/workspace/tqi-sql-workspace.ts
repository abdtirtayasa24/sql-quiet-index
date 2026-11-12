import { html, LitElement } from 'lit';
import type { WorkspaceController } from '../../app/workspace-controller';
import type { VisibleTable } from '../editor/editor-contract';
import { TqiSqlEditor } from '../editor/tqi-sql-editor';
import { TqiDialog } from '../common/tqi-dialog';
import { TqiTabs } from '../common/tqi-tabs';
import '../common/tqi-status';
import './tqi-results';
import './tqi-schema-explorer';
import '../game/tqi-hints';
import '../game/tqi-query-history';
export type WorkspaceIntent =
  | { type: 'CREATE' | 'REBUILD' | 'RECOVERY' }
  | { type: 'RUN' | 'EDIT'; sql: string };
export class TqiSqlWorkspace extends LitElement {
  static override properties = {
    view: { attribute: false },
    tables: { attribute: false },
  };
  declare view: WorkspaceController['view'] | undefined;
  declare tables: readonly VisibleTable[];
  private restored = false;
  constructor() {
    super();
    this.tables = [];
  }
  override connectedCallback() {
    if (!this.hasUpdated) this.replaceChildren();
    super.connectedCallback();
  }
  protected override createRenderRoot() {
    return this;
  }
  private intent(detail: WorkspaceIntent) {
    this.dispatchEvent(
      new CustomEvent<WorkspaceIntent>('workspace-intent', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
  protected override updated() {
    const editor = this.querySelector('tqi-sql-editor');
    if (editor instanceof TqiSqlEditor && !this.restored) {
      editor.setText(
        this.view?.storage.sql ||
          'SELECT * FROM practice_records ORDER BY record_id LIMIT 5;',
      );
      this.restored = true;
    }
  }
  private reuse = (event: CustomEvent<string>) => {
    const editor = this.querySelector('tqi-sql-editor');
    if (editor instanceof TqiSqlEditor) {
      editor.setText(event.detail);
      const tabs = this.querySelector('tqi-tabs');
      if (tabs instanceof TqiTabs) {
        tabs.selected = 1;
        void tabs.updateComplete.then(() => editor.focusInput());
      }
    }
  };
  protected override render() {
    const v = this.view;
    return html`<header>
        <p class="workspace-mark">The Quiet Index / Records practice</p>
        <h1>SQL workbench</h1>
        <p>
          Real PostgreSQL, local to this tab. Sample records only — no missions,
          grading or evidence awards.
        </p>
        <nav aria-label="Workbench navigation">
          <a href="/#/home">Home</a> ·
          <a href="/#/settings">Export / import case file</a> ·
          <a href="/technical.html">Offline demo / updates</a>
        </nav>
      </header>
      ${!v || v.storage.phase === 'loading' ? html`<p>Opening local records…</p>` : ''}
      ${
        v?.storage.phase === 'empty'
          ? html`<section>
              <h2>Start a local practice file</h2>
              <p>
                This saves a campaign seed and draft on this browser. Export
                regularly; browser storage can be evicted.
              </p>
              <button
                type="button"
                @click=${() => this.intent({ type: 'CREATE' })}
              >
                Create local practice file
              </button>
            </section>`
          : ''
      }
      ${
        v?.storage.phase === 'recovery'
          ? html`<section role="alert">
              <h2>Local storage needs attention</h2>
              <p>
                Storage issue: ${v.storage.issue}. Writes are paused; no
                replacement campaign was created. Use settings to recover or
                import your case file.
              </p>
              <button
                type="button"
                @click=${() => this.intent({ type: 'RECOVERY' })}
              >
                Download recovery copy
              </button>
            </section>`
          : ''
      }
      ${v?.storage.campaignId ? html`<p data-save-status>Draft: ${v.unsavedDraft ? 'not saved — SQL exceeds 12,000 characters; shorten it or download a recovery copy' : v.storage.draftStatus}. ${!v.storage.pointerSaved ? 'Convenience pointer could not be saved; canonical records remain in IndexedDB.' : ''}</p>` : ''}
      ${v?.unsavedDraft || v?.storage.draftStatus === 'paused' ? html`<button type="button" @click=${() => this.intent({ type: 'RECOVERY' })}>Download recovery copy</button>` : ''}
      <tqi-status .message=${v?.message ?? ''}></tqi-status>
      ${v?.phase === 'recovering' || v?.phase === 'running' ? html`<p class="work-loading" aria-busy="true">${v.phase === 'running' ? 'Running query… Cancel by rebuilding the practice database.' : 'Rebuilding the same seeded practice database. This may take several seconds…'}</p>` : ''}
      ${v?.phase === 'recovery' ? html`<p><button type="button" @click=${() => this.intent({ type: 'REBUILD' })}>Rebuild practice database</button></p>` : ''}
      ${
        v?.storage.campaignId
          ? html`<tqi-tabs>
                <div slot="brief">
                  <h2>Inspect the ledger</h2>
                  <p>
                    Choose columns, filter records and compare totals. The
                    sample has 240 rows, repeated labels and missing values.
                  </p>
                  <p>
                    Inspect five records in ID order, then find the next five
                    with an ID greater than 10.
                  </p>
                  <tqi-schema-explorer
                    .tables=${this.tables}
                  ></tqi-schema-explorer>
                </div>
                <div slot="query">
                  <h2>PostgreSQL query</h2>
                  <tqi-sql-editor
                    .tables=${this.tables}
                    .executionMode=${true}
                    .disabled=${!v.canRun}
                    .dark=${v.storage.settings.theme === 'dark' || (v.storage.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)}
                    @sql-input=${(event: CustomEvent<{ sql: string }>) => this.intent({ type: 'EDIT', sql: event.detail.sql })}
                    @sql-run=${(event: CustomEvent<{ sql: string }>) => this.intent({ type: 'RUN', sql: event.detail.sql })}
                  ></tqi-sql-editor>
                  <p>
                    <button
                      type="button"
                      @click=${(event: Event) => {
                        const dialog = this.querySelector('tqi-dialog');
                        if (dialog instanceof TqiDialog)
                          void dialog.show(
                            event.currentTarget instanceof HTMLElement
                              ? event.currentTarget
                              : undefined,
                          );
                      }}
                    >
                      Reset practice database
                    </button>
                  </p>
                  <details>
                    <summary>Read-only practice limits</summary>
                    <p>
                      One SELECT over practice_records. Filters, joins, grouping
                      and selected pure functions are supported. CTEs,
                      subqueries, catalogs, other functions and writes are not
                      enabled. Maximum 12,000 SQL characters, 1,000 rows, 12
                      columns and 4,096 characters per cell. The worker stops
                      after 2.5 seconds; rebuilding may take longer. Browser
                      memory exhaustion can still affect this tab.
                    </p>
                  </details>
                </div>
                <div slot="results">
                  ${
                    v.feedback
                      ? html`<section aria-label="What happened">
                          <h2>What happened?</h2>
                          <p>${v.feedback.primary}</p>
                          <ul>
                            ${v.feedback.details.map((d) => html`<li>${d}</li>`)}
                          </ul>
                        </section>`
                      : ''
                  }<tqi-results .result=${v.result}></tqi-results>
                </div>
                <aside slot="evidence">
                  <h2>Evidence is not filed here</h2>
                  <p>
                    Practice changes no solved missions, evidence, rank or
                    mastery. Your current draft belongs to the active campaign's
                    mission draft.
                  </p>
                  <tqi-hints></tqi-hints
                  ><tqi-query-history
                    .queries=${v.queries}
                    @reuse-query=${this.reuse}
                  ></tqi-query-history>
                </aside> </tqi-tabs
              ><tqi-dialog
                heading="Reset practice database?"
                message="Your saved draft and case file will stay unchanged. The same sample data will be rebuilt; recovery may take several seconds."
                confirmLabel="Reset database"
                @dialog-confirm=${() => this.intent({ type: 'REBUILD' })}
              ></tqi-dialog>`
          : ''
      }`;
  }
}
customElements.define('tqi-sql-editor', TqiSqlEditor);
customElements.define('tqi-sql-workspace', TqiSqlWorkspace);

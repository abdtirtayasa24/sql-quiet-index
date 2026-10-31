import { css, html, LitElement } from 'lit';
import type { PropertyValues } from 'lit';
import { mountCodeMirror } from './codemirror-adapter';
import type { EditorAdapter } from './codemirror-adapter';
import { EditorModel } from './editor-contract';
import type { VisibleTable } from './editor-contract';
import { mountTextarea } from './textarea-fallback';

export interface SqlIntent {
  sql: string;
}
export class TqiSqlEditor extends LitElement {
  static override properties = {
    tables: { attribute: false },
    dark: { type: Boolean },
    notice: { state: true },
    nativeMode: { state: true },
  };
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    #editor-host {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-small, 4px);
      overflow: hidden;
    }
    #editor-host:focus-within {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
    textarea {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 160px;
      padding: 1rem;
      border: 0;
      resize: vertical;
      background: var(--color-surface);
      color: var(--color-text);
      font: 1rem/1.6 var(--font-mono);
    }
    p {
      line-height: 1.65;
      color: var(--color-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      background: var(--color-surface);
      color: var(--color-accent);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      background: var(--color-bg);
    }
    button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
    button:active {
      color: var(--color-text);
    }
  `;
  declare tables: readonly VisibleTable[];
  declare dark: boolean;
  declare private notice: string;
  declare private nativeMode: boolean;
  private readonly model = new EditorModel('SELECT 1;');
  private adapter: EditorAdapter | undefined;
  private changeTimer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    super();
    this.tables = [];
    this.dark = false;
    this.notice = 'CodeMirror active. Draft stays in this page only.';
    this.nativeMode = false;
  }
  get value(): string {
    return this.model.text;
  }
  get selection(): { anchor: number; head: number } {
    const { anchor, head } = this.model.state.selection.main;
    return { anchor, head };
  }
  override connectedCallback() {
    super.connectedCallback();
    void this.updateComplete.then(() => {
      if (this.isConnected) this.mount();
    });
  }
  override disconnectedCallback() {
    clearTimeout(this.changeTimer);
    this.adapter?.destroy();
    this.adapter = undefined;
    super.disconnectedCallback();
  }
  protected override updated(changed: PropertyValues<this>) {
    this.mount();
    if (changed.has('tables') || changed.has('dark'))
      this.adapter?.reconfigure(this.tables, this.dark);
  }
  private changed = () => {
    clearTimeout(this.changeTimer);
    this.changeTimer = setTimeout(
      () =>
        this.dispatchEvent(
          new CustomEvent<SqlIntent>('sql-change', {
            detail: { sql: this.value },
            bubbles: true,
            composed: true,
          }),
        ),
      500,
    );
  };
  private run = () => {
    this.dispatchEvent(
      new CustomEvent<SqlIntent>('sql-run', {
        detail: { sql: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  };
  private mount() {
    const host = this.renderRoot.querySelector<HTMLElement>('#editor-host');
    if (!host || this.adapter || !this.isConnected) return;
    const options = {
      tables: this.tables,
      dark: this.dark,
      changed: this.changed,
      run: this.run,
    };
    if (!this.nativeMode) {
      try {
        this.adapter = mountCodeMirror(host, this.model, options);
      } catch {
        host.replaceChildren();
        this.nativeMode = true;
        this.notice =
          'Native textarea active: CodeMirror could not mount. Draft and undo history are retained in this page.';
      }
    }
    if (this.nativeMode)
      this.adapter = mountTextarea(host, this.model, options);
  }
  private switchMode = () => {
    this.adapter?.destroy();
    this.adapter = undefined;
    this.nativeMode = !this.nativeMode;
    this.notice = this.nativeMode
      ? 'Native textarea active. Draft and undo history are retained in this page.'
      : 'CodeMirror active. Draft and undo history are retained in this page.';
    this.mount();
    queueMicrotask(() => this.adapter?.focus());
  };
  protected override render() {
    return html`
      <p id="sql-help">
        Ctrl+Enter or Command+Enter inspects syntax only; SQL is not executed.
        Tab leaves the editor. Drafts are not saved on reload.
      </p>
      <div id="editor-host"></div>
      <div class="actions">
        <button type="button" @click=${this.run}>Inspect SQL</button>
        <button type="button" @click=${this.switchMode}>
          ${this.nativeMode ? 'Use CodeMirror' : 'Use native editor'}
        </button>
      </div>
      <p role="status">${this.notice}</p>
    `;
  }
}

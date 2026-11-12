import { css, html, LitElement } from 'lit';
export class TqiQueryHistory extends LitElement {
  static override properties = { queries: { attribute: false } };
  declare queries: readonly string[];
  static override styles = css`
    ol {
      padding-left: 1.5rem;
    }
    li {
      margin-block: 0.75rem;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 0.875rem/1.6 var(--font-mono);
    }
    button {
      min-height: 44px;
      font: inherit;
      padding: 0.5rem 1rem;
      background: var(--color-surface);
      color: var(--color-accent);
      border: 1px solid var(--color-border);
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
  `;
  constructor() {
    super();
    this.queries = [];
  }
  protected override render() {
    return html`<h2>Recent queries</h2>
      <p>Last 10 runs in this page only. Only the current draft is saved.</p>
      <ol>
        ${this.queries.map(
          (sql, i) =>
            html`<li>
              <pre>${sql}</pre>
              <button
                type="button"
                @click=${() => this.dispatchEvent(new CustomEvent<string>('reuse-query', { detail: sql, bubbles: true, composed: true }))}
              >
                Reuse query ${i + 1}
              </button>
            </li>`,
        )}
      </ol>`;
  }
}
customElements.define('tqi-query-history', TqiQueryHistory);

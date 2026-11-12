import { css, html, LitElement } from 'lit';
import type { PracticeResult } from '../../engine/workspace-protocol';
export class TqiResults extends LitElement {
  static override properties = { result: { attribute: false } };
  declare result: PracticeResult | undefined;
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .scroll {
      overflow: auto;
      max-height: 32rem;
      border: 1px solid var(--color-border);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font: 0.9375rem/1.6 var(--font-mono);
    }
    caption {
      text-align: left;
      padding: 0.5rem;
    }
    th,
    td {
      text-align: left;
      vertical-align: top;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--color-border);
      max-width: 24rem;
      overflow-wrap: anywhere;
    }
    th {
      background: var(--color-bg);
    }
    small {
      display: block;
      font-weight: 400;
      color: var(--color-muted);
    }
    .null {
      color: var(--color-muted);
      font-style: italic;
    }
    .scroll:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
  `;
  protected override render() {
    const result = this.result;
    return html`<h2>Query results</h2>
      ${
        result
          ? html`<p>${result.rows.length} of ${result.rowCount} rows shown.</p>
              <div
                class="scroll"
                role="region"
                aria-label="Scrollable query results"
                tabindex="0"
              >
                <table>
                  <caption>
                    Returned PostgreSQL rows
                  </caption>
                  <thead>
                    <tr>
                      ${result.fields.map((f) => html`<th scope="col">${f.name}<small>OID ${f.typeOid}</small></th>`)}
                    </tr>
                  </thead>
                  <tbody>
                    ${result.rows.map(
                      (row) =>
                        html`<tr>
                          ${row.map((v) => html`<td>${v === null ? html`<span class="null">NULL</span>` : String(v)}</td>`)}
                        </tr>`,
                    )}
                  </tbody>
                </table>
              </div>
              ${result.rowCount === 0 ? html`<p>No rows matched. Check your filter; absence can be meaningful.</p>` : ''}`
          : html`<p>
              Run a query to inspect its rows. A successful run is not a mission
              solution or filed evidence.
            </p>`
      }`;
  }
}
customElements.define('tqi-results', TqiResults);

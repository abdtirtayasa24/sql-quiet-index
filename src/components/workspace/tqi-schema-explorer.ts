import { html, LitElement } from 'lit';
import type { VisibleTable } from '../editor/editor-contract';
export class TqiSchemaExplorer extends LitElement {
  static override properties = { tables: { attribute: false } };
  declare tables: readonly VisibleTable[];
  constructor() {
    super();
    this.tables = [];
  }
  protected override render() {
    return html`<h2>Visible schema</h2>
      ${this.tables
        .filter((t) => t.visible)
        .map(
          (t) =>
            html`<details open>
              <summary><code>${t.name}</code></summary>
              <ul>
                ${t.columns.filter((c) => c.visible).map((c) => html`<li><code>${c.name}</code></li>`)}
              </ul>
            </details>`,
        )}`;
  }
}
customElements.define('tqi-schema-explorer', TqiSchemaExplorer);

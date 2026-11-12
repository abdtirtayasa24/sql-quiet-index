import { css, html, LitElement } from 'lit';
const hints = [
  'Which columns would help you compare the sample records?',
  'SELECT chooses columns; FROM names the source. ORDER BY makes your inspection repeatable.',
  'Try SELECT record_id, label FROM practice_records. What ordering would make the earliest IDs appear first?',
  'SELECT record_id, label FROM practice_records ORDER BY record_id LIMIT 5; — show five records in ID order. Now change the task: find IDs greater than 10 and inspect the next five. This is practice, not a mastery assessment.',
];
export class TqiHints extends LitElement {
  static override properties = { shown: { state: true } };
  declare private shown: number;
  static override styles = css`
    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      background: var(--color-surface);
      color: var(--color-accent);
      border: 1px solid var(--color-border);
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
    li {
      margin-block: 1rem;
      overflow-wrap: anywhere;
    }
  `;
  constructor() {
    super();
    this.shown = 0;
  }
  protected override render() {
    return html`<h2>Practice hints</h2>
      <p>Four free steps. No penalty and no waiting.</p>
      <ol>
        ${hints.slice(0, this.shown).map((h) => html`<li>${h}</li>`)}
      </ol>
      ${
        this.shown < hints.length
          ? html`<button
              type="button"
              @click=${() => {
                this.shown++;
              }}
            >
              Show hint ${this.shown + 1}
            </button>`
          : html`<p>All four hints are open.</p>`
      }`;
  }
}
customElements.define('tqi-hints', TqiHints);

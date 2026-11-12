import { css, html, LitElement } from 'lit';
const labels = ['Brief', 'Query', 'Results', 'Evidence'] as const;
export class TqiTabs extends LitElement {
  static override properties = {
    selected: { type: Number },
    vertical: { state: true },
  };
  declare selected: number;
  declare private vertical: boolean;
  private readonly media = matchMedia('(max-width: 600px)');
  private readonly resize = () => {
    this.vertical = this.media.matches;
  };
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    [role='tablist'] {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-block: 1rem;
    }
    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      text-align: left;
      font: inherit;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-small);
      cursor: pointer;
    }
    button[aria-selected='true'] {
      color: var(--color-accent);
      font-weight: 700;
    }
    button:focus-visible,
    [role='tabpanel']:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
    section {
      min-width: 0;
    }
    [hidden] {
      display: none !important;
    }
    @media (min-width: 601px) {
      [role='tablist'] {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }
  `;
  constructor() {
    super();
    this.selected = 1;
    this.vertical = this.media.matches;
  }
  override connectedCallback() {
    super.connectedCallback();
    this.media.addEventListener('change', this.resize);
    this.resize();
  }
  override disconnectedCallback() {
    this.media.removeEventListener('change', this.resize);
    super.disconnectedCallback();
  }
  private select(index: number) {
    this.selected = index;
    void this.updateComplete.then(() =>
      this.renderRoot
        .querySelector<HTMLButtonElement>(`#tab-${index}`)
        ?.focus(),
    );
  }
  private key(event: KeyboardEvent, index: number) {
    let next: number;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      next = (index + 1) % labels.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
      next = (index + labels.length - 1) % labels.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = labels.length - 1;
    else return;
    event.preventDefault();
    this.select(next);
  }
  protected override render() {
    return html`<div
        role="tablist"
        aria-label="Workspace"
        aria-orientation=${this.vertical ? 'vertical' : 'horizontal'}
      >
        ${labels.map((label, i) => html`<button id=${`tab-${i}`} type="button" role="tab" aria-controls=${`panel-${i}`} aria-selected=${this.selected === i} tabindex=${this.selected === i ? 0 : -1} @click=${() => this.select(i)} @keydown=${(e: KeyboardEvent) => this.key(e, i)}>${label}</button>`)}
      </div>
      <div class="panels">
        ${labels.map((label, i) => html`<section id=${`panel-${i}`} role="tabpanel" aria-labelledby=${`tab-${i}`} tabindex="0" ?hidden=${this.selected !== i}><slot name=${label.toLowerCase()}></slot></section>`)}
      </div>`;
  }
}
customElements.define('tqi-tabs', TqiTabs);

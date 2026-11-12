import { css, html, LitElement } from 'lit';
function focused(): HTMLElement | undefined {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement)
    element = element.shadowRoot.activeElement;
  return element instanceof HTMLElement ? element : undefined;
}
export class TqiDialog extends LitElement {
  static override properties = {
    heading: { type: String },
    message: { type: String },
    confirmLabel: { type: String },
  };
  declare heading: string;
  declare message: string;
  declare confirmLabel: string;
  constructor() {
    super();
    this.heading = 'Confirm action';
    this.message = '';
    this.confirmLabel = 'Confirm';
  }
  static override styles = css`
    dialog {
      max-width: min(32rem, calc(100vw - 4rem));
      padding: 1.5rem;
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-small);
      font: inherit;
    }
    dialog::backdrop {
      background: rgb(0 0 0 / 65%);
    }
    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      font: inherit;
      background: var(--color-bg);
      color: var(--color-accent);
      border: 1px solid var(--color-border);
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
  `;
  private opener: HTMLElement | undefined;
  async show(opener = focused()) {
    this.opener = opener;
    await this.updateComplete;
    this.renderRoot.querySelector('dialog')?.showModal();
  }
  close() {
    this.renderRoot.querySelector('dialog')?.close();
  }
  private closed = () => {
    this.opener?.focus();
  };
  protected override render() {
    return html`<dialog aria-labelledby="dialog-heading" @close=${this.closed}>
      <h2 id="dialog-heading">${this.heading}</h2>
      <p>${this.message}</p>
      <button type="button" autofocus @click=${() => this.close()}>
        Keep working
      </button>
      <button
        type="button"
        @click=${() => {
          this.close();
          this.dispatchEvent(
            new CustomEvent('dialog-confirm', {
              bubbles: true,
              composed: true,
            }),
          );
        }}
      >
        ${this.confirmLabel}
      </button>
    </dialog>`;
  }
}
customElements.define('tqi-dialog', TqiDialog);

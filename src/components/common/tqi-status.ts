import { html, LitElement } from 'lit';
export class TqiStatus extends LitElement {
  static override properties = { message: { type: String } };
  declare message: string;
  constructor() {
    super();
    this.message = '';
  }
  protected override render() {
    return html`<p role="status" aria-live="polite" aria-atomic="true">
      ${this.message}
    </p>`;
  }
}
customElements.define('tqi-status', TqiStatus);

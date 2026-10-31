import { html, LitElement } from 'lit';

export class TqiApp extends LitElement {
  static override properties = {
    missingCapabilities: { attribute: false },
  };

  declare missingCapabilities: readonly string[];

  constructor() {
    super();
    this.missingCapabilities = [];
  }

  // The root shell shares document landmarks, skip-link target and token styles.
  // Gameplay components may use Shadow DOM with explicitly tested event/label boundaries.
  protected override createRenderRoot() {
    this.replaceChildren();
    return this;
  }

  protected override firstUpdated() {
    this.setAttribute('data-ready', 'true');
  }

  protected override render() {
    return html`
      <p class="build-label">Foundation checkpoint · CP0a</p>
      <h1>The Quiet Index</h1>
      <p class="tagline">
        Every record is a witness.<br />Every missing row is a lie.
      </p>
      <section class="introduction" aria-labelledby="introduction-heading">
        <h2 id="introduction-heading">
          Follow the records. Question the story.
        </h2>
        <p>
          Welcome to Port Meridian. A missing harbor clerk is the first thread
          in a city of contradictory records. The investigation will ask you to
          write real PostgreSQL and build a case from what the data can prove.
        </p>
      </section>
      ${
        this.missingCapabilities.length > 0
          ? html`
              <section class="notice" aria-labelledby="compatibility-heading">
                <h2 id="compatibility-heading">
                  This browser cannot run the planned game
                </h2>
                <p>
                  You can still read this introduction. The following are
                  unavailable:
                </p>
                <ul>
                  ${this.missingCapabilities.map((feature) => html`<li>${feature}</li>`)}
                </ul>
                <p>
                  Try an up-to-date browser over HTTPS. No case data has been
                  changed.
                </p>
              </section>
            `
          : html`
              <section class="notice" aria-labelledby="foundation-heading">
                <h2 id="foundation-heading" class="status-label">
                  The records desk is taking shape.
                </h2>
                <p role="status">
                  Foundation ready. SQL execution and saving are not available
                  in this build.
                </p>
                <p>
                  This checkpoint establishes the interface and its tests.
                  Investigations are not yet playable.
                </p>
              </section>
            `
      }
      <details>
        <summary>About this build</summary>
        <p>No case data is stored by this foundation.</p>
        <p>
          The planned game runs PostgreSQL on your device, without an account.
          Database execution, case files and offline downloads will arrive in
          later checkpoints, after their own verification.
        </p>
      </details>
    `;
  }
}

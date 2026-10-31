import { html, LitElement } from 'lit';
import { EngineClient } from '../engine/engine-client';
import type { SqlIntent } from '../components/editor/tqi-sql-editor';

export class TqiFeasibility extends LitElement {
  static override properties = {
    status: { state: true },
    output: { state: true },
    busy: { state: true },
    parseStatus: { state: true },
    ast: { state: true },
  };
  declare private status: string;
  declare private output: string;
  declare private busy: boolean;
  declare private parseStatus: string;
  declare private ast: string;
  private client: EngineClient | undefined;

  constructor() {
    super();
    this.status = 'Ready to test. Engine assets download only when requested.';
    this.output = '';
    this.busy = false;
    this.parseStatus = 'Ready to inspect SQL. No arbitrary SQL is executed.';
    this.ast = '';
  }
  protected override createRenderRoot() {
    this.replaceChildren();
    return this;
  }
  override disconnectedCallback() {
    this.client?.dispose();
    this.client = undefined;
    super.disconnectedCallback();
  }
  private async probe() {
    this.busy = true;
    this.status = 'Loading local PostgreSQL and running five fixed probes…';
    this.output = '';
    try {
      this.client ??= new EngineClient();
      const reply = await this.client.send({ type: 'PROBE' });
      if (reply.type !== 'PROBE_RESULT')
        throw new Error('Unexpected worker reply');
      this.output = JSON.stringify(reply.results, null, 2);
      this.status =
        'Five fixed PostgreSQL probes completed. This is not grading or saved progress.';
    } catch (error) {
      this.status =
        error instanceof Error ? error.message : 'Engine proof unavailable.';
      this.client?.dispose();
      this.client = undefined;
    } finally {
      this.busy = false;
    }
  }
  private async inspect(sql: string) {
    this.parseStatus = 'Loading PostgreSQL syntax inspector…';
    this.ast = '';
    try {
      this.client ??= new EngineClient();
      const reply = await this.client.send({ type: 'PARSE', sql });
      if (reply.type !== 'PARSE_RESULT')
        throw new Error('Unexpected parser reply');
      this.ast = JSON.stringify(reply.result, null, 2);
      this.parseStatus =
        'Syntax inspected, not executed. AST recognition is not read-only safety or correctness.';
    } catch (error) {
      this.parseStatus =
        error instanceof Error ? error.message : 'Parser unavailable.';
      this.client?.dispose();
      this.client = undefined;
    }
  }
  protected override render() {
    return html`
      <p class="build-label">Engineering proof · CP0b</p>
      <h1>Engine & input proof</h1>
      <p>
        A disposable local test desk. No missions, saving, offline readiness or
        general SQL execution are enabled.
      </p>
      <p><a href="/">Back to The Quiet Index</a></p>
      <section aria-labelledby="editor-heading">
        <h2 id="editor-heading">PostgreSQL query</h2>
        <p>
          Sample completion metadata: staff (staff_id, name). Hidden tables and
          private columns are excluded. This is not a connected case schema.
        </p>
        <tqi-sql-editor
          .dark=${matchMedia('(prefers-color-scheme: dark)').matches}
          .tables=${[
            {
              name: 'staff',
              visible: true,
              columns: [
                { name: 'staff_id', visible: true },
                { name: 'name', visible: true },
                { name: 'private_note', visible: false },
              ],
            },
            {
              name: 'answer_keys',
              visible: false,
              columns: [{ name: 'culprit', visible: true }],
            },
          ]}
          @sql-run=${(event: CustomEvent<SqlIntent>) => {
            void this.inspect(event.detail.sql);
          }}
        ></tqi-sql-editor>
        <p id="parse-status" role="status">${this.parseStatus}</p>
        <pre
          id="ast-output"
          tabindex="0"
          aria-label="PostgreSQL AST observations"
        >
${this.ast}</pre>
      </section>
      <section aria-labelledby="pg-heading">
        <h2 id="pg-heading">PostgreSQL 18 · dedicated worker</h2>
        <p>
          These five fixed statements test the pinned engine, not your
          investigation.
        </p>
        <button
          type="button"
          ?disabled=${this.busy}
          @click=${() => {
            void this.probe();
          }}
        >
          Run fixed PostgreSQL probes
        </button>
        <p role="status">${this.status}</p>
        <pre
          id="probe-output"
          tabindex="0"
          aria-label="PostgreSQL probe results"
        >
${this.output}</pre>
      </section>
    `;
  }
}

import { html, LitElement } from 'lit';
import { benchmarkBoot } from './boot-benchmark';
import type { BootTrial } from './boot-benchmark';
import type { BootStrategy } from '../engine/boot-benchmark';
import { percentile } from '../engine/boot-benchmark';
import { ProofController } from './proof-controller';
import { EngineClient } from '../engine/engine-client';
import type { SqlIntent } from '../components/editor/tqi-sql-editor';

declare const __M0_RELEASE__: string;

export class TqiTechnical extends LitElement {
  static override properties = {
    status: { state: true },
    trials: { state: true },
    busy: { state: true },
    inspection: { state: true },
    inspectionStatus: { state: true },
  };
  declare private status: string;
  declare private trials: BootTrial[];
  declare private busy: boolean;
  declare private inspection: string;
  declare private inspectionStatus: string;
  private parseClient: EngineClient | undefined;
  private abort = new AbortController();
  private proof: ProofController | undefined;
  constructor() {
    super();
    this.status = 'Choose a strategy. Engine assets download only on request.';
    this.trials = [];
    this.busy = false;
    this.inspection = '';
    this.inspectionStatus =
      'Ready to inspect syntax. No arbitrary SQL is executed.';
  }
  protected override createRenderRoot() {
    this.replaceChildren();
    return this;
  }
  override connectedCallback() {
    super.connectedCallback();
    if (this.abort.signal.aborted) this.abort = new AbortController();
    this.proof = new ProofController(() => this.requestUpdate());
    void this.proof.start();
  }
  override disconnectedCallback() {
    this.parseClient?.dispose();
    this.parseClient = undefined;
    this.proof?.dispose();
    this.abort.abort();
    super.disconnectedCallback();
  }
  private async run(strategy: BootStrategy) {
    this.busy = true;
    this.status = `Measuring ${strategy}. Input remains available while the worker loads…`;
    try {
      this.trials = [
        ...this.trials,
        await benchmarkBoot(strategy, this.abort.signal),
      ];
      this.status =
        'Trial complete. Repeat at least five times per strategy and condition; this is not device certification.';
    } catch (error) {
      this.status =
        error instanceof Error ? error.message : 'Benchmark unavailable.';
    } finally {
      this.busy = false;
    }
  }
  private async inspect(sql: string) {
    this.parseClient?.dispose();
    this.parseClient = undefined;
    let client: EngineClient | undefined;
    this.inspectionStatus = 'Inspecting PostgreSQL syntax…';
    this.inspection = '';
    try {
      client = new EngineClient();
      this.parseClient = client;
      const reply = await client.send({ type: 'PARSE', sql });
      if (client !== this.parseClient) return;
      if (reply.type !== 'PARSE_RESULT')
        throw new Error('Unexpected parser reply');
      this.inspection = JSON.stringify(reply.result, null, 2);
      this.inspectionStatus =
        'Syntax inspected, not executed. Recognition is not a query safety allowlist.';
    } catch {
      if (!client || client === this.parseClient)
        this.inspectionStatus =
          'Syntax inspection unavailable. Retry online or restore the offline proof.';
    } finally {
      client?.dispose();
      if (client === this.parseClient) this.parseClient = undefined;
    }
  }
  protected override render() {
    return html`
      <p class="build-label">Engineering proof · M0</p>
      <p id="proof-release">Release ${__M0_RELEASE__}</p>
      <h1>Technical proof desk</h1>
      <p>
        Measure before choosing. This desk compares a synthetic 5,000-row
        fixture, not a playable mission. No saves or general SQL execution.
      </p>
      <p>
        <a href="/">The Quiet Index</a> ·
        <a href="/feasibility.html">Engine & input proof</a>
      </p>
      <section aria-labelledby="boot-heading">
        <h2 id="boot-heading">Boot strategy trials</h2>
        <p>
          Keep this page foregrounded. Separate cold, warm and offline reports;
          cache state is not inferred. Fresh initdb remains the default until
          real-device evidence supports a change.
        </p>
        <button
          type="button"
          ?disabled=${this.busy}
          @click=${() => {
            void this.run('initdb');
          }}
        >
          Benchmark fresh initdb
        </button>
        <button
          type="button"
          ?disabled=${this.busy}
          @click=${() => {
            void this.run('snapshot');
          }}
        >
          Benchmark shared snapshot
        </button>
        <p id="benchmark-status" role="status">${this.status}</p>
        <p>
          Engine WASM allocation is not total peak process memory. Resource
          Timing sizes reflect this browser/host/cache, not a simulated mobile
          download.
        </p>
        ${(['initdb', 'snapshot'] as const).map((strategy) => {
          const samples = this.trials.filter(
            (trial) => trial.strategy === strategy,
          );
          return samples.length
            ? html`<p>
                ${strategy}: ${samples.length} trial(s), first-playable P75
                ${Math.round(
                  percentile(
                    samples.map((trial) => trial.firstPlayableMs),
                    0.75,
                  ),
                )}
                ms.
              </p>`
            : null;
        })}
        <pre
          id="benchmark-output"
          tabindex="0"
          aria-label="Boot benchmark JSON"
        >
${this.trials.length ? JSON.stringify(this.trials, null, 2) : ''}</pre>
      </section>
      <section aria-labelledby="offline-heading">
        <h2 id="offline-heading">Explicit offline download</h2>
        <p>
          The shell installs without large engine files. Download the complete
          PG/parser demo only if your connection and storage permit it; this
          also includes the single snapshot candidate. No act is claimed
          playable.
        </p>
        <p id="offline-status" role="status">${this.proof?.status}</p>
        <button
          type="button"
          ?disabled=${!this.proof?.available || this.proof.busy}
          @click=${() => {
            void this.proof?.download();
          }}
        >
          Download PG proof for offline
        </button>
        ${
          !this.proof?.available
            ? html`<button
                type="button"
                ?disabled=${this.proof?.starting}
                @click=${() => {
                  void this.proof?.start();
                }}
              >
                Retry offline setup
              </button>`
            : null
        }
      </section>
      <section aria-labelledby="update-heading">
        <h2 id="update-heading">Prompt-controlled updates</h2>
        <p>
          Updates never reload this desk automatically. This proof has no
          durable draft save: copy any draft you want to keep before approving.
          Approval affects the active worker for this origin, but does not force
          other tabs to reload.
        </p>
        <p id="update-status" role="status">
          Update ${this.proof?.update?.state ?? 'current'}
        </p>
        <button
          type="button"
          ?disabled=${!this.proof?.update || this.proof.update.state === 'applying'}
          @click=${() => {
            void this.proof?.update?.check();
          }}
        >
          Check for update
        </button>
        ${
          this.proof?.update && this.proof.update.state !== 'current'
            ? html`
                <label
                  ><input id="copy-confirmation" type="checkbox" /> I copied any
                  draft I want to keep and approve reloading this tab.</label
                >
                <button
                  type="button"
                  ?disabled=${this.busy || this.proof.busy || this.proof.update.state === 'applying'}
                  @click=${() => {
                    void this.proof?.update?.approve(
                      () =>
                        Promise.resolve(
                          !this.busy &&
                            !this.proof?.busy &&
                            this.querySelector<HTMLInputElement>(
                              '#copy-confirmation',
                            )?.checked === true,
                        ),
                      () => location.reload(),
                    );
                  }}
                >
                  Apply update
                </button>
                <button
                  type="button"
                  ?disabled=${this.proof.update.state === 'applying'}
                  @click=${() => this.proof?.update?.defer()}
                >
                  Not now
                </button>
              `
            : null
        }
      </section>
      <section aria-labelledby="input-heading">
        <h2 id="input-heading">Input while the engine starts</h2>
        <p>
          Compare typing, undo and selection in both adapters during trials.
          Inspect syntax here without executing or saving the input.
        </p>
        <tqi-sql-editor
          .dark=${matchMedia('(prefers-color-scheme: dark)').matches}
          @sql-run=${(event: CustomEvent<SqlIntent>) => {
            void this.inspect(event.detail.sql);
          }}
        ></tqi-sql-editor>
        <p id="inspection-status" role="status">${this.inspectionStatus}</p>
        <pre
          id="inspection-output"
          tabindex="0"
          aria-label="PostgreSQL syntax inspection"
        >
${this.inspection}</pre>
      </section>
    `;
  }
}

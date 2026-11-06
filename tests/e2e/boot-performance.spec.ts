import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { isBootResult, percentile } from '../../src/engine/boot-benchmark';
import type { BootResult } from '../../src/engine/boot-benchmark';
import { isRecord } from '../../src/engine/protocol';

interface Observation extends BootResult {
  firstPlayableMs: number;
  shellReadyMs: number;
  inputFrameMs: { rich: number[]; native: number[] };
  longTasks: number | null;
}
async function openDesk(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto('/technical.html');
  await expect
    .poll(() =>
      page.evaluate(
        () => performance.getEntriesByName('tqi-m0-shell-ready').length,
      ),
    )
    .toBe(1);
  return page;
}
async function trial(
  page: Page,
  strategy: 'initdb' | 'snapshot',
): Promise<Observation> {
  await page.evaluate(() => {
    document.addEventListener(
      'input',
      (event) => {
        const native = event
          .composedPath()
          .some((node) => node instanceof HTMLTextAreaElement);
        const start = performance.now();
        requestAnimationFrame(() =>
          performance.measure(native ? 'm0-input-native' : 'm0-input-rich', {
            start,
            end: performance.now(),
          }),
        );
      },
      { capture: true },
    );
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          performance.measure('m0-long-task', {
            start: entry.startTime,
            duration: entry.duration,
          });
      }).observe({ type: 'longtask' });
    }
  });
  await page
    .getByRole('button', {
      name:
        strategy === 'initdb'
          ? 'Benchmark fresh initdb'
          : 'Benchmark shared snapshot',
      exact: true,
    })
    .click();
  const editor = page.getByRole('textbox', {
    name: 'PostgreSQL query',
    exact: true,
  });
  await editor.click();
  await page.keyboard.type('SELECT 1;');
  await page
    .getByRole('button', { name: 'Use native editor', exact: true })
    .click();
  await page.locator('textarea').click();
  await page.keyboard.type('SELECT 2;');
  await expect(page.locator('#benchmark-status')).toContainText(
    'Trial complete',
    { timeout: 60_000 },
  );
  const output: unknown = JSON.parse(
    await page.locator('#benchmark-output').innerText(),
  );
  const result: unknown = Array.isArray(output) ? output.at(-1) : undefined;
  if (
    !isBootResult(result) ||
    !isRecord(result) ||
    typeof result.firstPlayableMs !== 'number'
  )
    throw new Error('Invalid benchmark metrics');
  const input = await page.evaluate(() => ({
    shellReadyMs:
      performance.getEntriesByName('tqi-m0-shell-ready')[0]!.startTime,
    inputFrameMs: {
      rich: performance
        .getEntriesByName('m0-input-rich')
        .map((entry) => entry.duration),
      native: performance
        .getEntriesByName('m0-input-native')
        .map((entry) => entry.duration),
    },
    longTasks: PerformanceObserver.supportedEntryTypes.includes('longtask')
      ? performance.getEntriesByName('m0-long-task').length
      : null,
  }));
  expect(input.inputFrameMs.rich.length).toBeGreaterThan(0);
  expect(input.inputFrameMs.native.length).toBeGreaterThan(0);
  return { ...result, firstPlayableMs: result.firstPlayableMs, ...input };
}
for (const condition of ['cold', 'warm', 'offline'] as const) {
  test(`five initdb/snapshot trials: ${condition}`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000);
    const observations: Observation[] = [];
    let shared: BrowserContext | undefined;
    try {
      if (condition !== 'cold')
        shared = await browser.newContext({
          serviceWorkers: condition === 'warm' ? 'block' : 'allow',
        });
      if (condition === 'offline') {
        const page = await openDesk(shared!);
        await expect(page.locator('#offline-status')).toContainText(
          'Shell installed',
          { timeout: 20_000 },
        );
        await page
          .getByRole('button', {
            name: 'Download PG proof for offline',
            exact: true,
          })
          .click();
        await expect(page.locator('#offline-status')).toContainText(
          'PG/parser proof available offline',
          { timeout: 60_000 },
        );
        await page.close();
        await shared!.setOffline(true);
      }
      for (const strategy of ['initdb', 'snapshot'] as const) {
        if (condition === 'warm') {
          const page = await openDesk(shared!);
          await trial(page, strategy); // Excluded warm-up; both strategies pay their own initial asset loading.
          await page.close();
        }
        for (let i = 0; i < 5; i++) {
          const context =
            shared ?? (await browser.newContext({ serviceWorkers: 'block' }));
          try {
            const page = await openDesk(context);
            observations.push(await trial(page, strategy));
            await page.close();
          } finally {
            if (!shared) await context.close();
          }
        }
      }
    } finally {
      await shared?.close();
      const report = {
        browser: testInfo.project.name,
        condition,
        complete: observations.length === 10,
        limitations:
          'Windows automation, synthetic seed, foreground loopback preview. Cold means fresh browser context, not cold OS/CPU. Warm uses actual preview HTTP revalidation. Input event-to-frame is not INP. WASM allocation is not total peak memory. No device/host certification.',
        summaries: (['initdb', 'snapshot'] as const).map((strategy) => {
          const samples = observations.filter(
            (item) => item.strategy === strategy,
          );
          return {
            strategy,
            completed: samples.length,
            p75FirstPlayableMs: samples.length
              ? percentile(
                  samples.map((item) => item.firstPlayableMs),
                  0.75,
                )
              : null,
          };
        }),
        observations,
      };
      const json = JSON.stringify(report, null, 2);
      writeFileSync(testInfo.outputPath('boot-performance.json'), json);
      await testInfo.attach('boot-performance', {
        body: json,
        contentType: 'application/json',
      });
    }
    expect(observations).toHaveLength(10);
  });
}

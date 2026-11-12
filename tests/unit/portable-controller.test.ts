import { expect, it } from 'vitest';
import { PortableController } from '../../src/app/portable-controller';
import type { PortablePort } from '../../src/app/portable-controller';
import { exportCaseFile } from '../../src/storage/export-import';
import { caseCollections } from '../fixtures/save-file';
function port() {
  let writes = 0;
  const repo: PortablePort = {
    futureSchema: false,
    close: () => {},
    snapshot: () => Promise.resolve(caseCollections()),
    importCaseFile: () => {
      writes++;
      return Promise.resolve({ campaignIds: ['c-test'], conflicts: [] });
    },
  };
  return { repo, writes: () => writes };
}
it('validates and previews without writes, requires explicit confirmation and captures original bytes', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  const text = ' \n' + (await exportCaseFile(caseCollections())) + '\n';
  await app.select(new Blob([text]));
  expect(app.view.kind).toBe('preview');
  expect(f.writes()).toBe(0);
  await app.confirm('merge', false);
  expect(f.writes()).toBe(0);
  await app.select(new Blob([text]));
  await app.confirm('merge', true);
  expect(f.writes()).toBe(1);
  expect(app.view.kind).toBe('done');
  expect(await app.original()?.text()).toBe(text);
  app.dispose();
});
it('future-version bytes are kept exactly, readonly/nonimportable, including whitespace and BOM', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  const bytes = new TextEncoder().encode(
    '\ufeff {"saveVersion":99,"future":"🌧"}\n',
  );
  await app.select(new Blob([bytes]));
  expect(app.view.kind).toBe('unsupported');
  await app.confirm('copy', true);
  expect(f.writes()).toBe(0);
  expect(new Uint8Array(await app.original()!.arrayBuffer())).toEqual(bytes);
  app.dispose();
});
it('retains the bytes actually read independently of a changing source file handle', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  const bytes = new TextEncoder().encode(' {"saveVersion":99}');
  class Changing extends Blob {
    override arrayBuffer() {
      return Promise.resolve(bytes.buffer);
    }
  }
  await app.select(new Changing(['different backing bytes']));
  expect(await app.original()?.text()).toBe(' {"saveVersion":99}');
  app.dispose();
});
it('rejects oversize before reading and rejects invalid UTF-8, retaining the original blob', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  let read = false;
  class Large extends Blob {
    override get size() {
      return 5 * 1024 * 1024 + 1;
    }
    override arrayBuffer() {
      read = true;
      return Promise.reject(new Error('must not read'));
    }
  }
  await app.select(new Large());
  expect(read).toBe(false);
  expect(app.view).toMatchObject({ kind: 'error', code: 'size' });
  await app.select(new Blob([new Uint8Array([255])]));
  expect(app.view).toMatchObject({ kind: 'error', code: 'json' });
  expect(f.writes()).toBe(0);
  app.dispose();
});
it('ignores stale validation completion after a new file selection', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  let release: ((buffer: ArrayBuffer) => void) | undefined;
  class Slow extends Blob {
    override arrayBuffer() {
      return new Promise<ArrayBuffer>((resolve) => {
        release = resolve;
      });
    }
  }
  const pending = app.select(new Slow());
  await app.select(new Blob(['bad']));
  release?.(
    new TextEncoder().encode(await exportCaseFile(caseCollections())).buffer,
  );
  await pending;
  expect(app.view).toMatchObject({ kind: 'error', code: 'json' });
  app.dispose();
});
it('exports a fresh native snapshot and keeps unsupported native records in recovery, not a downgraded v1 file', async () => {
  const f = port();
  const app = new PortableController(
    () => {},
    () => Promise.resolve(f.repo),
  );
  expect(JSON.parse(await (await app.exportLocal()).text())).toMatchObject({
    format: 'the-quiet-index-save',
    notes: caseCollections().notes,
  });
  const raw = {
    campaigns: [
      {
        ...caseCollections().campaigns[0],
        saveVersion: 99,
        privateFuture: 'retain',
      },
    ],
  };
  f.repo.snapshot = () => Promise.resolve(raw);
  await expect(app.exportLocal()).rejects.toThrow('future');
  expect(JSON.parse(await (await app.recoveryLocal()).text())).toMatchObject({
    format: 'the-quiet-index-recovery',
    records: raw,
  });
  app.dispose();
});

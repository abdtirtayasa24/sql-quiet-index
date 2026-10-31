import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveConfig } from 'vite';

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('foundation build contract', () => {
  it('retains exact PostgreSQL and parser pins', () => {
    const manifest = readFileSync('package.json', 'utf8');
    expect(manifest).toContain('"@electric-sql/pglite": "0.5.13"');
    expect(manifest).toContain('"libpg-query": "18.2.2"');
  });

  it('keeps app and tools strict with unchecked-index protection', () => {
    for (const flag of ['"strict": true', '"noUncheckedIndexedAccess": true']) {
      expect(readFileSync('tsconfig.json', 'utf8')).toContain(flag);
    }
    expect(readFileSync('tsconfig.tools.json', 'utf8')).toContain(
      '"extends": "./tsconfig.json"',
    );
  });

  it('resolves the actual Vite configuration to static root assets and ES workers', async () => {
    const config = await resolveConfig(
      { configFile: 'vite.config.ts' },
      'build',
    );
    expect(config.base).toBe('/');
    expect(config.worker.format).toBe('es');
    expect(config.optimizeDeps.exclude).toContain('@electric-sql/pglite');
    expect(config.build.outDir).toBe('dist');
  });

  it('accepts a static shell with emitted JavaScript and CSS', () => {
    const directory = mkdtempSync(join(tmpdir(), 'tqi-static-'));
    temporaryDirectories.push(directory);
    mkdirSync(join(directory, 'assets'));
    writeFileSync(
      join(directory, 'index.html'),
      '<script type="module" src="/assets/app.js"></script>',
    );
    writeFileSync(join(directory, 'assets/app.js'), 'console.log("static");');
    writeFileSync(join(directory, 'assets/app.css'), 'body { color: black; }');
    const result = spawnSync(
      process.execPath,
      [resolve('tools/verify-foundation.mjs'), directory],
      { encoding: 'utf8' },
    );
    expect(result.status, result.stderr).toBe(0);
  });

  it.each(['missing entry', 'missing emitted assets', 'private material'])(
    'rejects %s instead of certifying an incomplete build',
    (failure) => {
      const directory = mkdtempSync(join(tmpdir(), 'tqi-invalid-'));
      temporaryDirectories.push(directory);
      if (failure !== 'missing entry')
        writeFileSync(
          join(directory, 'index.html'),
          '<script type="module" src="/app.js"></script>',
        );
      if (failure === 'private material') {
        writeFileSync(join(directory, 'app.js'), 'console.log("static");');
        writeFileSync(join(directory, 'app.css'), 'body { color: black; }');
        writeFileSync(join(directory, '.env'), 'EXAMPLE=not-a-secret');
      }
      const result = spawnSync(
        process.execPath,
        [resolve('tools/verify-foundation.mjs'), directory],
        { encoding: 'utf8' },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Foundation artifact check failed');
      if (failure === 'private material')
        expect(result.stderr).toContain('Private material');
    },
  );
});

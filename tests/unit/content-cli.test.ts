import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, it } from 'vitest';
import { miniaturePack } from '../fixtures/content-pack';
import type { Registry } from '../../src/content/manifest-types';

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'tqi-cp2a-'));
  const pack = miniaturePack();
  const put = (path: string, data: unknown) => {
    const file = join(dir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data));
  };
  put('season.json', pack.season);
  put('registry.json', pack.registry);
  put('concepts.json', pack.concepts);
  for (const [locale, data] of Object.entries(pack.locales))
    put(`locales/${locale}.json`, data);
  for (const [path, data] of Object.entries({
    ...pack.manifests,
    ...pack.files,
    ...pack.graphs,
  }))
    put(path, data);
  return { dir, put, pack };
}
const run = (tool: string, ...args: string[]) =>
  spawnSync(process.execPath, [`tools/${tool}.mjs`, ...args], {
    encoding: 'utf8',
    timeout: 30000,
  });
it('validates the real 80-ID outline while reporting zero published missions/cases honestly', () => {
  const content = run('validate-content');
  expect(content.status, content.stderr).toBe(0);
  expect(content.stdout).toContain('80 outline');
  expect(content.stdout).toContain('0 playable');
  const graph = run('validate-graphs');
  expect(graph.status, graph.stderr).toBe(0);
  expect(graph.stdout).toContain('0 authored');
});
it('validates a complete miniature pack, graph and focused mission without executing arbitrary source SQL', () => {
  const f = fixture();
  try {
    for (const [tool, args] of [
      ['validate-content', []],
      ['validate-content', ['--mission', '003']],
      ['validate-graphs', []],
    ] as const) {
      const result = run(tool, '--root', f.dir, ...args);
      expect(result.status, result.stderr).toBe(0);
    }
    f.put('missions/003/mission.json', '{"bad":');
    const invalid = run('validate-content', '--root', f.dir);
    expect(invalid.status).not.toBe(0);
    expect(invalid.stderr).toContain('missions/003/mission.json');
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});
it('fails zero-match selectors, misspelled options and unsafe/missing input without filesystem escape', () => {
  for (const args of [
    ['--mission', '003'],
    ['--missions', '003'],
    ['--mission', ''],
    ['--root'],
    ['--root', 'missing-content'],
  ]) {
    expect(run('validate-content', ...args).status).not.toBe(0);
  }
  const f = fixture();
  try {
    (f.pack.registry as Registry).missions[0]!.manifest = '../outside.json';
    f.put('registry.json', f.pack.registry);
    const bad = run('validate-content', '--root', f.dir);
    expect(bad.status).not.toBe(0);
    expect(bad.stderr).toMatch(/path|manifest/i);
    f.put('registry.json', '{"__proto__":{"polluted":true}}');
    expect(run('validate-content', '--root', f.dir).status).not.toBe(0);
    f.put('registry.json', readFileSync('content/registry.json', 'utf8'));
    rmSync(join(f.dir, 'season.json'));
    symlinkSync(
      join(process.cwd(), 'package.json'),
      join(f.dir, 'season.json'),
      'file',
    );
    const escape = run('validate-content', '--root', f.dir);
    expect(escape.status).not.toBe(0);
    expect(escape.stderr).toMatch(/outside|escape|symlink/i);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

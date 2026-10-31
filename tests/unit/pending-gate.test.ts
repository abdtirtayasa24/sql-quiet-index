import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ownership = [
  ['verify:vendor', 'T05'],
  ['validate:content', 'T20'],
  ['test:fixtures', 'T25'],
] as const;

describe('unimplemented release gates', () => {
  it.each(ownership)(
    '%s fails with its assigned task rather than pretending success',
    (gate, task) => {
      const result = spawnSync(
        process.execPath,
        [resolve('tools/pending-gate.mjs'), gate],
        { encoding: 'utf8' },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`${gate} is not implemented`);
      expect(result.stderr).toContain(task);
      expect(result.stderr).toContain('CP0a');
    },
  );

  it('rejects unknown gate names', () => {
    const result = spawnSync(
      process.execPath,
      [resolve('tools/pending-gate.mjs'), 'typo'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unknown gate');
  });
});

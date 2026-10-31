import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('keeps text LF and PNG bytes unchanged even with Windows autocrlf enabled', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tqi-checkout-'));
  const source = "export const checkpoint = 'CP0a';\n";
  const image = readFileSync(
    'tests/e2e/__screenshots__/win32/chromium/foundation-dark-360.png',
  );
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      ['-C', directory, '-c', 'core.autocrlf=true', ...args],
      {
        stdio: 'pipe',
      },
    );

  try {
    git('init', '--quiet');
    writeFileSync(
      join(directory, '.gitattributes'),
      readFileSync('.gitattributes'),
    );
    writeFileSync(join(directory, 'example.ts'), source);
    writeFileSync(join(directory, 'example.png'), image);
    git('add', '.');
    // A fresh checkout must rewrite files, not reuse Git's up-to-date stat cache.
    rmSync(join(directory, 'example.ts'));
    rmSync(join(directory, 'example.png'));
    git('checkout-index', '--all', '--force');

    expect(readFileSync(join(directory, 'example.ts'), 'utf8')).toBe(source);
    expect(readFileSync(join(directory, 'example.png'))).toEqual(image);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

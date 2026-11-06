import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it.each([
  ['@electric-sql/pglite', 'PGlite'],
  ['libpg-query', 'parse'],
])(
  'rejects %s on the new UI entrypoint, not just the original main.ts',
  (name, symbol) => {
    // Native Node keeps typed ESLint outside Vitest's virtual module/compiler context.
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `import { ESLint } from 'eslint';
         let input = '';
         for await (const chunk of process.stdin) input += chunk;
         console.log(JSON.stringify(await new ESLint().lintText(input, {
           filePath: 'src/feasibility.ts',
         })));`,
      ],
      {
        input: `import { ${symbol} } from '${name}';\nconsole.log(${symbol});\n`,
        encoding: 'utf8',
        timeout: 20_000,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    const reports: unknown = JSON.parse(result.stdout);
    expect(reports).toMatchObject([
      { messages: [{ ruleId: 'no-restricted-imports' }] },
    ]);
  },
  25_000,
);

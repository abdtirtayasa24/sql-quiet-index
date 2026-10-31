import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

it.each([
  ['@electric-sql/pglite', 'PGlite'],
  ['libpg-query', 'parse'],
])(
  'rejects %s on the new UI entrypoint, not just the original main.ts',
  async (name, symbol) => {
    const results = await new ESLint().lintText(
      `import { ${symbol} } from '${name}';\nconsole.log(${symbol});\n`,
      { filePath: 'src/feasibility.ts' },
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain(
      'no-restricted-imports',
    );
  },
);

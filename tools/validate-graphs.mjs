import { validateRepository } from './validate-content.mjs';

try {
  await validateRepository(process.argv.slice(2), 'graphs');
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Graph validation failed',
  );
  process.exitCode = 1;
}

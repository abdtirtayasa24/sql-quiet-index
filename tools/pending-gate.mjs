const tasks = new Map([
  ['verify:vendor', 'T05: pinned artifact integrity and licensing proof'],
  ['validate:content', 'T20: mission, graph and locale validation'],
  ['test:fixtures', 'T25: PostgreSQL multi-seed grading harness'],
]);

const gate = process.argv[2];
const task = tasks.get(gate);
console.error(
  task
    ? `${gate} is not implemented at CP0a. Required before release: ${task}.`
    : `Unknown gate: ${gate ?? '(missing)'}. No check was performed.`,
);
process.exitCode = 1;

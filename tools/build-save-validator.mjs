import Ajv from 'ajv';
import standalone from 'ajv/dist/standalone/index.js';
import { build } from 'vite';
import ts from 'typescript';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync('schemas/save.schema.json', 'utf8'));
const ajv = new Ajv({ strict: true, allErrors: false, code: { source: true } });
mkdirSync('generated/save-source', { recursive: true });
writeFileSync(
  'generated/save-source/validator.cjs',
  standalone(ajv, ajv.compile(schema)),
);
await build({
  configFile: false,
  build: {
    outDir: 'generated/save',
    emptyOutDir: true,
    target: 'es2022',
    lib: {
      entry: 'generated/save-source/validator.cjs',
      formats: ['es'],
      fileName: () => 'validator.mjs',
    },
  },
});
const output = readFileSync('generated/save/validator.mjs', 'utf8');
const source = ts.createSourceFile(
  'validator.mjs',
  output,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
function check(node) {
  if (
    ts.isImportDeclaration(node) ||
    ((ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      ts.isIdentifier(node.expression) &&
      ['require', 'eval', 'Function'].includes(node.expression.text))
  )
    throw new Error('Validator must be isolated, without runtime compilation.');
  ts.forEachChild(node, check);
}
check(source);
writeFileSync(
  'generated/save/validator.d.mts',
  'export default function validate(value: unknown): boolean;\n',
);
console.log(
  'Compiled strict save schema to isolated ESM (bundled Ajv length/equality helpers, no runtime compilation).',
);

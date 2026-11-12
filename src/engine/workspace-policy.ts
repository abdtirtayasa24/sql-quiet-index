import { parse } from 'libpg-query';
import { isRecord } from './protocol';
export type PolicyResult = { ok: true } | { ok: false; code: string };
const nodes = new Set([
  'SelectStmt',
  'ResTarget',
  'ColumnRef',
  'String',
  'A_Star',
  'A_Const',
  'A_Expr',
  'BoolExpr',
  'NullTest',
  'BooleanTest',
  'SortBy',
  'RangeVar',
  'JoinExpr',
  'FuncCall',
  'TypeCast',
  'TypeName',
  'CoalesceExpr',
  'CaseExpr',
  'CaseWhen',
]);
const functions = new Set([
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'lower',
  'upper',
  'length',
  'abs',
  'round',
]);
const types = new Set([
  'int2',
  'int4',
  'int8',
  'numeric',
  'text',
  'bool',
  'date',
  'timestamptz',
]);
const operators = new Set([
  '=',
  '<>',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '~~',
  '~~*',
  '!~~',
  '!~~*',
]);
function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((part: unknown) =>
    isRecord(part) &&
    isRecord(part.String) &&
    typeof part.String.sval === 'string'
      ? part.String.sval
      : '',
  );
}
function allowed(value: unknown, depth = 0): boolean {
  if (depth > 80) return false;
  if (Array.isArray(value))
    return value.every((v: unknown) => allowed(v, depth + 1));
  if (!isRecord(value)) return true;
  for (const [key, child] of Object.entries(value)) {
    if (/^[A-Z]/.test(key) && !nodes.has(key)) return false;
    if (
      key === 'SelectStmt' &&
      isRecord(child) &&
      (child.intoClause ||
        child.lockingClause ||
        child.withClause ||
        child.valuesLists ||
        child.op !== 'SETOP_NONE')
    )
      return false;
    if (
      key === 'RangeVar' &&
      (!isRecord(child) ||
        child.schemaname ||
        child.catalogname ||
        child.relname !== 'practice_records')
    )
      return false;
    if (
      key === 'FuncCall' &&
      (!isRecord(child) ||
        names(child.funcname).length !== 1 ||
        !functions.has(names(child.funcname)[0] ?? ''))
    )
      return false;
    if (key === 'TypeName' || key === 'typeName') {
      if (!isRecord(child)) return false;
      const parts = names(child.names);
      if (
        parts.length > 2 ||
        (parts.length === 2 && parts[0] !== 'pg_catalog') ||
        !types.has(parts.at(-1) ?? '') ||
        child.arrayBounds
      )
        return false;
    }
    if (
      key === 'A_Expr' &&
      (!isRecord(child) ||
        names(child.name).length !== 1 ||
        !operators.has(names(child.name)[0] ?? ''))
    )
      return false;
    if (!allowed(child, depth + 1)) return false;
  }
  return true;
}
// Deliberately smaller than future mission SQL: unsupported constructs never execute.
export async function practicePolicy(sql: string): Promise<PolicyResult> {
  if (sql.length > 12000) return { ok: false, code: 'LIMIT' };
  try {
    const ast = await parse(sql);
    const statement: unknown = ast.stmts?.[0]?.stmt;
    if (
      typeof ast.version !== 'number' ||
      Math.floor(ast.version / 10000) !== 18 ||
      ast.stmts?.length !== 1 ||
      !isRecord(statement) ||
      !statement.SelectStmt ||
      !allowed(statement)
    )
      return { ok: false, code: 'POLICY' };
    return { ok: true };
  } catch {
    return { ok: false, code: '42601' };
  }
}

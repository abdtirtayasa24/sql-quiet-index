import { hasSqlDetails, parse } from 'libpg-query';
import { isRecord } from './protocol';
import type { AstObservation, ParseOutcome } from './protocol';

// These are observations of the PG18 parse tree, NOT an execution allowlist.
const observed = new Set([
  'SelectStmt',
  'InsertStmt',
  'UpdateStmt',
  'DeleteStmt',
  'MergeStmt',
  'JoinExpr',
  'FuncCall',
  'ColumnRef',
  'RangeVar',
  'RangeSubselect',
  'CommonTableExpr',
  'withClause',
  'groupClause',
]);
function observe(
  value: unknown,
  path: string,
  output: AstObservation[],
  depth = 0,
): void {
  if (depth > 200)
    throw new Error('AST nesting exceeds the feasibility inspector limit.');
  if (Array.isArray(value)) {
    value.forEach((child: unknown, index) =>
      observe(child, `${path}[${index}]`, output, depth + 1),
    );
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      const next = `${path}.${key}`;
      if (observed.has(key)) output.push({ kind: key, path: next });
      if (key === 'jointype' && typeof child === 'string')
        output.push({ kind: child, path: next });
      if (key === 'recursive' && child === true)
        output.push({ kind: 'recursive', path: next });
      if (
        key === 'FuncCall' &&
        isRecord(child) &&
        Array.isArray(child.funcname)
      ) {
        const name = child.funcname
          .map((part: unknown) =>
            isRecord(part) &&
            isRecord(part.String) &&
            typeof part.String.sval === 'string'
              ? part.String.sval
              : '',
          )
          .join('.');
        output.push({ kind: `FuncCall:${name}`, path: next });
      }
      observe(child, next, output, depth + 1);
    }
  }
}

export async function parseSql(sql: string): Promise<ParseOutcome> {
  if (sql.length > 12_000)
    return { ok: false, message: 'SQL exceeds 12,000 characters.' };
  try {
    const ast = await parse(sql);
    if (
      typeof ast.version !== 'number' ||
      Math.floor(ast.version / 10_000) !== 18 ||
      !Array.isArray(ast.stmts)
    )
      return { ok: false, message: 'Unsupported PostgreSQL parser output.' };
    const statements: string[] = [];
    for (const statement of ast.stmts) {
      if (!statement.stmt)
        return { ok: false, message: 'Missing PostgreSQL statement node.' };
      statements.push(Object.keys(statement.stmt)[0] ?? 'Unknown');
    }
    const observations: AstObservation[] = [];
    observe(ast, '$', observations);
    return { ok: true, version: ast.version, statements, observations };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'PostgreSQL parser unavailable.';
    const cursorPosition = hasSqlDetails(error)
      ? error.sqlDetails?.cursorPosition
      : undefined;
    return {
      ok: false,
      message,
      ...(cursorPosition !== undefined && cursorPosition >= 0
        ? { cursorPosition }
        : {}),
    };
  }
}

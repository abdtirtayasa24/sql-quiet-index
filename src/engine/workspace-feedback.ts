export interface QueryFeedback {
  readonly primary: string;
  readonly details: readonly string[];
}
const diagnoses: Record<string, readonly [string, string]> = {
  '42601': [
    'PostgreSQL could not parse this query.',
    'Try SELECT columns FROM practice_records WHERE condition. Check commas and parentheses.',
  ],
  '42703': [
    'A selected column is not available here.',
    'Inspect the visible schema and check column spelling and alias scope.',
  ],
  '42803': [
    'A selected column needs aggregation or GROUP BY.',
    'List every non-aggregated selected column in GROUP BY, or remove it.',
  ],
  '42P01': [
    'A table or alias is missing from FROM.',
    'Introduce practice_records in FROM and use its declared alias consistently.',
  ],
  '42702': [
    'A column name is ambiguous between joined tables.',
    'Qualify it with its table alias, for example a.record_id.',
  ],
  '22012': [
    'This expression divides by zero.',
    'Check the denominator before dividing.',
  ],
  '57014': [
    'The query exceeded its execution budget.',
    'Use a smaller join or a selective WHERE condition, then run again.',
  ],
  POLICY: [
    'This query is outside the read-only practice subset.',
    'Use SELECT over practice_records: comparisons, joins, grouping and count/sum/avg/min/max/lower/upper/length/abs/round. CTEs, subqueries, catalogs and other functions are not enabled yet.',
  ],
  LIMIT: [
    'The query or result exceeds a practice limit.',
    'Use at most 12,000 SQL characters, 1,000 returned rows, 12 columns and 4,096 characters per cell; aggregate or filter large results.',
  ],
  ENGINE_RESET: [
    'The query worker stopped; your draft is retained.',
    'Rebuild the practice database before running again. This can take several seconds.',
  ],
};
export function queryFeedback(code: string): QueryFeedback {
  const [primary, detail] = diagnoses[code] ?? [
    'The query could not finish.',
    'Revise the query or rebuild the practice database. No case evidence was awarded.',
  ];
  return { primary, details: [detail] };
}

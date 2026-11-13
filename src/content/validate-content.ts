// Authoring-only module. No Ajv compiler or filesystem reader is imported by the UI.
import { Ajv } from 'ajv';
import { validateGraph } from '../gameplay/case-graph.ts';
import type { CaseGraph, GraphMission } from '../gameplay/case-graph.ts';
import type {
  ContentIssue,
  ContentPack,
  MissionManifest,
  Registry,
  Season,
} from './manifest-types.ts';

export const BASE_COLUMNS: Record<string, readonly string[]> = {
  staff: ['staff_id', 'full_name', 'department', 'supervisor_id', 'active'],
  incident_reports: [
    'incident_id',
    'incident_type',
    'neighborhood',
    'reported_at',
    'description',
    'status',
    'filed_by',
  ],
  harbor_shipments: [
    'shipment_id',
    'manifest_code',
    'destination',
    'received_at',
    'declared_weight_kg',
    'incident_id',
  ],
  dispatch_orders: [
    'order_id',
    'shipment_id',
    'requested_at',
    'released_at',
    'assigned_staff_id',
    'status',
  ],
  badge_scans: [
    'scan_id',
    'staff_id',
    'badge_code',
    'gate_code',
    'scanned_at',
    'scan_result',
  ],
  shift_roster: [
    'roster_id',
    'staff_id',
    'shift_date',
    'shift_start',
    'shift_end',
    'role',
  ],
  payroll_entries: [
    'entry_id',
    'staff_id',
    'shift_date',
    'overtime_hours',
    'pay_amount',
    'revised_at',
    'correction_note',
  ],
  vehicle_registry: ['vehicle_id', 'plate_no', 'category', 'owner_org'],
  vehicle_assignments: [
    'assignment_id',
    'vehicle_id',
    'staff_id',
    'valid_from',
    'valid_to',
  ],
  gate_events: ['event_id', 'vehicle_id', 'gate_code', 'event_at', 'direction'],
  cctv_observations: [
    'observation_id',
    'gate_event_id',
    'observed_at',
    'staff_id',
    'reliability',
  ],
  delivery_signatures: [
    'signature_id',
    'order_id',
    'staff_id',
    'signed_at',
    'witness_code',
  ],
};

export function expandVariants(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  let id = '';
  let lines: string[] = [];
  const flush = () => {
    if (!id) {
      if (lines.join('').trim())
        throw new Error('SQL before first variant marker');
      return;
    }
    const sql = lines.join('\n').trim();
    const path = `variants/${id}.sql`;
    if (!sql || path in result)
      throw new Error(`Empty or duplicate variant: ${id}`);
    result[path] = sql;
  };
  for (const line of source.split(/\r?\n/)) {
    const marker = /^-- variant: ([a-z][a-z0-9_]{0,39})$/.exec(line);
    if (marker) {
      flush();
      id = marker[1]!;
      lines = [];
    } else {
      if (/^--\s*variant:/i.test(line.trim()))
        throw new Error('Invalid variant marker');
      lines.push(line);
    }
  }
  flush();
  if (Object.keys(result).length < 2)
    throw new Error('At least two named variants required');
  return result;
}

const id = { type: 'string', pattern: '^[a-z][a-z0-9_]{0,63}$' };
const missionId = { type: 'string', pattern: '^(00[1-9]|0[1-7][0-9]|080)$' };
const actId = { type: 'string', pattern: '^act(0[1-9]|10)$' };
const text = { type: 'string', minLength: 1, maxLength: 12000 };
const version = { type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9.-]{0,39}$' };
const array = (items: object, minItems = 0, maxItems = 100) => ({
  type: 'array',
  minItems,
  maxItems,
  items,
});
const object = (properties: Record<string, object>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

export function validateContent(
  pack: ContentPack,
  missionSchema: object,
  graphSchema: object,
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const error = (source: string, pointer: string, message: string) => {
    issues.push({ source, pointer: pointer || '/', message });
  };
  const ajv = new Ajv({ allErrors: true, strict: true });
  const check = <T>(
    source: string,
    schema: object,
    input: unknown,
  ): input is T => {
    const validate = ajv.compile<T>(schema);
    if (validate(input)) return true;
    for (const e of validate.errors ?? [])
      error(source, e.instancePath, e.message ?? 'Invalid value');
    return false;
  };
  const seasonSchema = object({
    schemaVersion: { const: 1 },
    contentVersion: version,
    acts: array(object({ id: actId, title: text, arc: text }), 10, 10),
    missions: array(
      object({
        id: missionId,
        actId,
        title: text,
        objective: text,
        construct: text,
        concepts: array(id, 1, 20),
      }),
      80,
      80,
    ),
  });
  const registrySchema = object({
    schemaVersion: { const: 1 },
    contentVersion: version,
    missions: array(
      object({
        id: missionId,
        manifest: {
          type: 'string',
          pattern: '^missions/(00[1-9]|0[1-7][0-9]|080)/mission\\.json$',
        },
      }),
      0,
      80,
    ),
    graphs: array(
      object({
        actId,
        path: { type: 'string', pattern: '^graph/act(0[1-9]|10)\\.json$' },
      }),
      0,
      10,
    ),
  });
  const conceptSchema = object({
    schemaVersion: { const: 1 },
    concepts: array(object({ id }), 1, 200),
  });
  const validSeason = check<Season>('season.json', seasonSchema, pack.season);
  const validRegistry = check<Registry>(
    'registry.json',
    registrySchema,
    pack.registry,
  );
  const validConcepts = check<{ schemaVersion: 1; concepts: { id: string }[] }>(
    'concepts.json',
    conceptSchema,
    pack.concepts,
  );
  if (!validSeason || !validRegistry || !validConcepts) return issues;
  const season = pack.season as Season;
  const registry = pack.registry as Registry;
  const concepts = (
    pack.concepts as { concepts: { id: string }[] }
  ).concepts.map((c) => c.id);
  const unique = (source: string, pointer: string, values: string[]) => {
    if (new Set(values).size !== values.length)
      error(source, pointer, 'Duplicate IDs');
  };
  unique('concepts.json', '/concepts', concepts);
  unique(
    'season.json',
    '/missions',
    season.missions.map((m) => m.id),
  );
  unique(
    'season.json',
    '/acts',
    season.acts.map((a) => a.id),
  );
  unique(
    'registry.json',
    '/missions',
    registry.missions.map((m) => m.id),
  );
  unique(
    'registry.json',
    '/graphs',
    registry.graphs.map((g) => g.actId),
  );
  for (let i = 0; i < 80; i++) {
    const m = season.missions[i];
    const expected = String(i + 1).padStart(3, '0');
    if (
      m?.id !== expected ||
      m.actId !== `act${String(Math.floor(i / 8) + 1).padStart(2, '0')}`
    )
      error(
        'season.json',
        `/missions/${i}`,
        'Expected ordered 001–080 inventory with eight missions per act',
      );
    for (const c of m?.concepts ?? [])
      if (!concepts.includes(c))
        error('season.json', `/missions/${i}/concepts`, `Unknown concept ${c}`);
  }
  season.acts.forEach((a, i) => {
    if (a.id !== `act${String(i + 1).padStart(2, '0')}`)
      error('season.json', `/acts/${i}`, 'Invalid act inventory');
  });
  if (registry.contentVersion !== season.contentVersion)
    error('registry.json', '/contentVersion', 'Content version mismatch');
  const localeSchema = {
    type: 'object',
    maxProperties: 20000,
    propertyNames: { type: 'string', pattern: '^[a-z][a-z0-9_.]{0,95}$' },
    additionalProperties: text,
  };
  const locales: Record<string, Record<string, string>> = {};
  for (const [locale, raw] of Object.entries(pack.locales)) {
    if (
      check<Record<string, string>>(`locales/${locale}.json`, localeSchema, raw)
    )
      locales[locale] = raw;
  }
  if (!locales.en) error('locales/en.json', '/', 'English locale required');
  const englishKeys = Object.keys(locales.en ?? {})
    .sort()
    .join('|');
  for (const [locale, values] of Object.entries(locales))
    if (Object.keys(values).sort().join('|') !== englishKeys)
      error(`locales/${locale}.json`, '/', 'Locale key parity mismatch');
  const nodes = new Map<
    string,
    { kind: string; sourceId?: string; actId: string }
  >();
  const graphMissions = new Map<string, GraphMission>();
  for (const graph of registry.graphs) {
    const raw = pack.graphs[graph.path];
    if (!check<CaseGraph>(graph.path, graphSchema, raw)) continue;
    if (raw.actId !== graph.actId || graph.path !== `graph/${graph.actId}.json`)
      error(graph.path, '/actId', 'Graph registry/path/act mismatch');
    for (const problem of validateGraph(raw)) {
      const split = problem.indexOf(':');
      error(
        graph.path,
        problem.slice(0, split),
        problem.slice(split + 1).trim(),
      );
    }
    for (const c of raw.concepts)
      if (!concepts.includes(c))
        error(graph.path, '/concepts', `Unknown concept ${c}`);
    if (raw.actId === 'act01' && raw.initialTaught.length)
      error(
        graph.path,
        '/initialTaught',
        'New campaign cannot start with taught concepts',
      );
    for (const c of raw.initialTaught) {
      if (
        !registry.missions.some((e) => {
          const m = pack.manifests[e.manifest];
          return (
            m &&
            typeof m === 'object' &&
            'actId' in m &&
            typeof m.actId === 'string' &&
            m.actId < raw.actId &&
            'teaches' in m &&
            Array.isArray(m.teaches) &&
            m.teaches.includes(c)
          );
        })
      )
        error(
          graph.path,
          '/initialTaught',
          `No earlier published teacher for ${c}`,
        );
    }
    for (const n of raw.nodes) {
      if (nodes.has(n.id))
        error(graph.path, '/nodes', `Duplicate cross-case node ${n.id}`);
      if (n.sourceId && !Object.hasOwn(BASE_COLUMNS, n.sourceId))
        error(graph.path, '/nodes', `Unknown baseline source ${n.sourceId}`);
      nodes.set(n.id, {
        kind: n.kind,
        actId: raw.actId,
        ...(n.sourceId ? { sourceId: n.sourceId } : {}),
      });
    }
    for (const m of raw.missions) {
      if (!registry.missions.some((e) => e.id === m.id))
        error(
          graph.path,
          '/missions',
          `Unpublished mission ${m.id} cannot award evidence`,
        );
      graphMissions.set(m.id, m);
    }
  }
  const usedNodes: string[] = [];
  for (const entry of registry.missions) {
    const source = entry.manifest;
    const raw = pack.manifests[source];
    if (!check<MissionManifest>(source, missionSchema, raw)) continue;
    const m = raw;
    const report = (pointer: string, message: string) =>
      error(source, pointer, message);
    const prefix = `missions/${m.id}/`;
    if (source !== `${prefix}mission.json` || m.id !== entry.id)
      report('/id', 'Registry/path ID mismatch');
    if (m.contentVersion !== season.contentVersion)
      report('/contentVersion', 'Content version mismatch');
    if (
      m.actId !== season.missions.find((x) => x.id === m.id)?.actId ||
      m.caseId !== m.actId ||
      m.availableFrom !== m.actId
    )
      report('/actId', 'Act/case/availability mismatch');
    if (!registry.graphs.some((g) => g.actId === m.actId))
      report('/caseId', 'Published mission needs registered case graph');
    for (const key of [...m.requires, ...m.teaches, ...m.reinforces])
      if (!concepts.includes(key))
        report('/requires', `Unknown concept ${key}`);
    for (const key of m.storyRequires)
      if (!nodes.has(key)) report('/storyRequires', `Unknown node ${key}`);
    if (nodes.get(m.evidence.nodeId)?.kind !== 'evidence')
      report('/evidence/nodeId', 'Unknown evidence node');
    usedNodes.push(m.evidence.nodeId);
    const gm = graphMissions.get(m.id);
    if (!gm) report('/id', 'Missing graph mission contract');
    else {
      for (const field of [
        'type',
        'role',
        'difficulty',
        'requires',
        'teaches',
        'reinforces',
        'storyRequires',
      ] as const) {
        if (JSON.stringify(gm[field]) !== JSON.stringify(m[field]))
          report(`/${field}`, 'Graph/manifest mission mismatch');
      }
      if (
        gm.item.id !== m.assessment.itemId ||
        !gm.awards.includes(m.evidence.nodeId)
      )
        report('/assessment', 'Graph assessment/award mismatch');
    }
    const evidenceNode = nodes.get(m.evidence.nodeId);
    if (
      evidenceNode?.actId !== m.actId ||
      !evidenceNode.sourceId ||
      !m.evidence.sourceTables.includes(evidenceNode.sourceId)
    )
      report(
        '/evidence/sourceTables',
        'Graph/manifest evidence source mismatch',
      );
    for (const nodeId of m.storyRequires)
      if (nodes.get(nodeId)?.actId !== m.actId)
        report(
          '/storyRequires',
          'Cross-case prerequisite must be an explicit public case fact',
        );
    for (const table of m.visibleTables) {
      if (!Object.hasOwn(BASE_COLUMNS, table))
        report('/visibleTables', `Unknown baseline table ${table}`);
      if (!m.visibleColumns[table])
        report('/visibleColumns', `Missing columns for ${table}`);
    }
    for (const [table, columns] of Object.entries(m.visibleColumns)) {
      if (
        !m.visibleTables.includes(table) ||
        !Object.hasOwn(BASE_COLUMNS, table) ||
        columns.some((c) => !BASE_COLUMNS[table]?.includes(c))
      )
        report('/visibleColumns', `Unknown/hidden table or column ${table}`);
    }
    if (m.evidence.sourceTables.some((t) => !m.visibleTables.includes(t)))
      report('/evidence/sourceTables', 'Evidence source must be visible');
    if (
      m.evidence.rowKeyColumns.some(
        (c) => !m.grade.comparison.columnNames.includes(c),
      )
    )
      report('/evidence/rowKeyColumns', 'Evidence key must be in result');
    if (
      m.grade.comparison.columnNames.length !== m.grade.comparison.types.length
    )
      report('/grade/comparison', 'Column/type arity mismatch');
    if (m.type !== 'concept' && m.grade.constraints.length)
      report(
        '/grade/constraints',
        'Concept-neutral challenge cannot enforce AST construct',
      );
    unique(
      source,
      '/grade/constraints',
      m.grade.constraints.map((c) => c.id),
    );
    unique(
      source,
      '/grade/wrongFixtures',
      m.grade.wrongFixtures.map((w) => w.id),
    );
    unique(
      source,
      '/grade/wrongFixtures',
      m.grade.wrongFixtures.map((w) => w.sql),
    );
    if (m.followUp.itemId === m.assessment.itemId)
      report(
        '/followUp/itemId',
        'Fresh task needs distinct assessment item ID',
      );
    const keys = [
      ...Object.values(m.i18n),
      ...m.hints,
      m.followUp.objectiveKey,
      m.followUp.predicateKey,
      ...m.grade.constraints.map((c) => c.feedback),
      ...m.grade.wrongFixtures.map((w) => w.diagnostic),
    ];
    for (const key of keys)
      if (!locales.en?.[key]) report('/i18n', `Missing English key ${key}`);
    const requireFile = (path: string) => {
      if (!pack.files[prefix + path]?.trim())
        report('/grade', `Missing/empty source ${prefix + path}`);
    };
    requireFile('reference.sql');
    requireFile('seed.sql');
    requireFile('variants.sql');
    if (!m.grade.referenceQueries.includes('reference.sql'))
      report('/grade/referenceQueries', 'reference.sql is required');
    for (const w of m.grade.wrongFixtures) requireFile(w.sql);
    try {
      const variants = expandVariants(
        pack.files[prefix + 'variants.sql'] ?? '',
      );
      const refs = m.grade.referenceQueries.filter(
        (p) => p !== 'reference.sql',
      );
      if (
        refs.length !== Object.keys(variants).length ||
        refs.some((r) => !variants[r])
      )
        report('/grade/referenceQueries', 'Named variant/reference mismatch');
    } catch (e) {
      report(
        '/grade/referenceQueries',
        e instanceof Error ? e.message : 'Invalid variants.sql',
      );
    }
  }
  unique('registry.json', '/missions/evidence', usedNodes);
  return issues;
}

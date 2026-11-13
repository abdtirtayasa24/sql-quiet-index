import { syntheticGraph } from './case-graph';
import type {
  ContentPack,
  MissionManifest,
  Registry,
  Season,
} from '../../src/content/manifest-types';

export function miniaturePack(): ContentPack {
  const season: Season = {
    schemaVersion: 1,
    contentVersion: '2026.10.1',
    acts: Array.from({ length: 10 }, (_, i) => ({
      id: `act${String(i + 1).padStart(2, '0')}`,
      title: `Synthetic act ${i + 1}`,
      arc: 'Synthetic validation only',
    })),
    missions: Array.from({ length: 80 }, (_, i) => ({
      id: String(i + 1).padStart(3, '0'),
      actId: `act${String(Math.floor(i / 8) + 1).padStart(2, '0')}`,
      title: `Synthetic ${i + 1}`,
      objective: 'Validate metadata, not player content',
      construct: 'SELECT',
      concepts: ['filter_eq'],
    })),
  };
  const manifest: MissionManifest = {
    schemaVersion: 1,
    contentVersion: season.contentVersion,
    seedVersion: 1,
    id: '003',
    actId: 'act01',
    caseId: 'act01',
    type: 'concept',
    role: 'teach',
    difficulty: 1,
    i18n: {
      title: 'mission.003.title',
      brief: 'mission.003.brief',
      success: 'mission.003.success',
    },
    requires: [],
    teaches: ['filter_eq'],
    reinforces: [],
    storyRequires: ['a1.public'],
    visibleTables: ['incident_reports'],
    visibleColumns: { incident_reports: ['incident_id', 'neighborhood'] },
    seedProfile: 'harbor_v1',
    assessment: { itemId: 'item.003', packId: 'act01' },
    grade: {
      resultKind: 'table',
      referenceQueries: [
        'reference.sql',
        'variants/equality.sql',
        'variants/membership.sql',
      ],
      comparison: {
        columnNames: ['incident_id'],
        columnNamePolicy: 'exact',
        order: 'unordered_multiset',
        types: ['int4'],
        numericTolerance: 'exact',
        maxRows: 1000,
      },
      constraints: [
        {
          id: 'filter',
          when: 'always',
          must: 'ast.filter',
          feedback: 'diag.filter',
        },
      ],
      wrongFixtures: [
        { id: 'missing', sql: 'wrong_missing.sql', diagnostic: 'diag.filter' },
        { id: 'other', sql: 'wrong_other.sql', diagnostic: 'diag.filter' },
        { id: 'null', sql: 'wrong_null.sql', diagnostic: 'diag.filter' },
      ],
    },
    evidence: {
      nodeId: 'a1.harbor',
      selection: 'at_least_one_valid_row',
      requiresQueryProof: true,
      sourceTables: ['incident_reports'],
      rowKeyColumns: ['incident_id'],
    },
    hints: ['hint.003.1', 'hint.003.2', 'hint.003.3', 'hint.003.4'],
    followUp: {
      itemId: 'item.003.followup',
      variant: 1,
      objectiveKey: 'follow.003.objective',
      predicateKey: 'follow.003.predicate',
    },
    availableFrom: 'act01',
  };
  const keys = [
    ...Object.values(manifest.i18n),
    ...manifest.hints,
    'diag.filter',
    'follow.003.objective',
    'follow.003.predicate',
  ];
  const registry: Registry = {
    schemaVersion: 1,
    contentVersion: season.contentVersion,
    missions: [],
    graphs: [{ actId: 'act01', path: 'graph/act01.json' }],
  };
  const pack: ContentPack = {
    season,
    registry,
    concepts: { schemaVersion: 1, concepts: [{ id: 'filter_eq' }] },
    locales: {
      en: Object.fromEntries(keys.map((key) => [key, `Synthetic ${key}`])),
    },
    manifests: {},
    files: {},
    graphs: {},
  };
  const graph = syntheticGraph();
  graph.nodes.push({
    id: 'a.memo',
    kind: 'evidence',
    requires: ['a.public'],
    mandatory: true,
    sourceId: 'incident_reports',
  });
  graph.missions[3]!.awards.push('a.memo');
  pack.graphs['graph/act01.json'] = graph;
  const tables = [
    'gate_events',
    'shift_roster',
    'delivery_signatures',
    'incident_reports',
  ];
  const columns = ['event_id', 'roster_id', 'signature_id', 'incident_id'];
  for (const [index, gm] of graph.missions.entries()) {
    const copy = structuredClone(manifest);
    Object.assign(copy, {
      id: gm.id,
      type: gm.type,
      role: gm.role,
      difficulty: gm.difficulty,
      requires: gm.requires,
      teaches: gm.teaches,
      reinforces: gm.reinforces,
      storyRequires: gm.storyRequires,
      assessment: { itemId: gm.item.id, packId: gm.actId },
    });
    copy.visibleTables = [tables[index]!];
    copy.visibleColumns = { [tables[index]!]: [columns[index]!] };
    copy.grade.comparison.columnNames = [columns[index]!];
    if (gm.type !== 'concept') copy.grade.constraints = [];
    copy.evidence = {
      ...copy.evidence,
      nodeId: gm.awards[0]!,
      sourceTables: [tables[index]!],
      rowKeyColumns: [columns[index]!],
    };
    copy.followUp.itemId = `${gm.item.id}.followup`;
    registry.missions.push({
      id: copy.id,
      manifest: `missions/${copy.id}/mission.json`,
    });
    pack.manifests[`missions/${copy.id}/mission.json`] = copy;
    for (const [path, sql] of Object.entries({
      'reference.sql': 'SELECT 1;',
      'variants.sql':
        '-- variant: equality\nSELECT 1 AS first;\n-- variant: membership\nSELECT 1 AS second;',
      'seed.sql': 'SELECT 1;',
      'wrong_missing.sql': 'SELECT 2;',
      'wrong_other.sql': 'SELECT 3;',
      'wrong_null.sql': 'SELECT NULL;',
    }))
      pack.files[`missions/${copy.id}/${path}`] = sql;
  }
  return pack;
}

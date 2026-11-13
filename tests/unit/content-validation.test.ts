import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { miniaturePack } from '../fixtures/content-pack';
import type { CaseGraph } from '../../src/gameplay/case-graph';
import type {
  MissionManifest,
  Registry,
  Season,
} from '../../src/content/manifest-types';
import {
  expandVariants,
  validateContent,
} from '../../src/content/validate-content';
const schema = JSON.parse(
  readFileSync('schemas/mission.schema.json', 'utf8'),
) as object;
const graphSchema = JSON.parse(
  readFileSync('schemas/graph.schema.json', 'utf8'),
) as object;
const check = (
  mutate: (
    pack: ReturnType<typeof miniaturePack>,
    mission: MissionManifest,
  ) => void,
) => {
  const pack = miniaturePack();
  mutate(pack, pack.manifests['missions/003/mission.json'] as MissionManifest);
  const errors = validateContent(pack, schema, graphSchema);
  expect(errors.length).toBeGreaterThan(0);
  expect(
    errors.every((e) => e.source.length > 0 && e.pointer.startsWith('/')),
  ).toBe(true);
  return errors.map((e) => `${e.source}${e.pointer}: ${e.message}`).join('\n');
};
it('accepts a complete miniature source pack and expands two named alternatives', () => {
  expect(validateContent(miniaturePack(), schema, graphSchema)).toEqual([]);
  expect(
    Object.keys(
      expandVariants('-- variant: a\nSELECT 1;\n-- variant: b\nSELECT 2;'),
    ),
  ).toEqual(['variants/a.sql', 'variants/b.sql']);
});
it('rejects closed-schema typos, unsafe paths and arbitrary constraint expressions', () => {
  expect(check((_p, m) => Object.assign(m, { x_eval: 'bad' }))).toContain(
    'additional',
  );
  expect(
    check((_p, m) => {
      m.grade.referenceQueries[1] = '../reference.sql';
    }),
  ).toContain('referenceQueries');
  expect(
    check((_p, m) =>
      Object.assign(m.grade.constraints[0]!, { must: 'eval(playerSQL)' }),
    ),
  ).toContain('must');
  expect(
    check((_p, m) => Object.assign(m.followUp, { unused: true })),
  ).toContain('followUp');
});
it('rejects invalid IDs, versions, metadata, concepts, locale coverage and publication references', () => {
  check((_p, m) => {
    m.id = '081';
  });
  check((_p, m) => {
    m.contentVersion = 'other';
  });
  check((_p, m) => {
    m.caseId = 'act03';
  });
  check((_p, m) => {
    m.visibleColumns.incident_reports = ['not_a_column'];
  });
  check((_p, m) => {
    m.teaches = ['unregistered'];
  });
  check((_p, m) => {
    m.storyRequires = ['a1.missing'];
  });
  check((_p, m) => {
    m.evidence.nodeId = 'a1.missing';
  });
  check((_p, m) => {
    m.evidence.rowKeyColumns = ['not_returned'];
  });
  check((_p, m) => {
    m.followUp.itemId = m.assessment.itemId;
  });
  check((p) => {
    delete (p.locales.en as Record<string, string>)['hint.003.4'];
  });
  check((p) => {
    p.locales.id = {};
  });
  check((p) => {
    (p.registry as Registry).missions[0]!.manifest = '../../secret.json';
  });
  check((p) => {
    (p.season as Season).missions.pop();
  });
  check((p) => {
    (p.season as Season).missions[0]!.id = '002';
  });
  check((p) => {
    (p.season as Season).missions[0]!.actId = 'act02';
  });
  check((p) => {
    p.concepts = {
      schemaVersion: 1,
      concepts: [{ id: 'filter_eq' }, { id: 'filter_eq' }],
    };
  });
});
it('binds graph source/mission contracts to the actual published manifests', () => {
  check((p) => {
    (p.graphs['graph/act01.json'] as CaseGraph).missions[0]!.teaches = [];
  });
  check((p) => {
    (p.graphs['graph/act01.json'] as CaseGraph).missions[0]!.item.id =
      'other.item';
  });
  check((p) => {
    (p.graphs['graph/act01.json'] as CaseGraph).actId = 'act03';
  });
  check((p) => {
    (p.registry as Registry).missions.shift();
  });
  check((_p, m) => {
    m.evidence.sourceTables = ['incident_reports'];
    m.visibleTables.push('incident_reports');
    m.visibleColumns.incident_reports = ['incident_id'];
  });
});
it('rejects inherited object-property names as baseline table/column metadata', () => {
  check((_p, m) => {
    m.visibleTables = ['constructor'];
    m.visibleColumns = { constructor: ['prototype'] };
  });
  check((p) => {
    const g = p.graphs['graph/act01.json'] as CaseGraph;
    g.nodes[1]!.sourceId = 'constructor';
    g.paths[0]!.sourceIds = ['constructor'];
  });
});
it('requires the real source ledger and concept-neutral alternative fairness', () => {
  check((p) => {
    delete p.files['missions/003/reference.sql'];
  });
  check((_p, m) => {
    m.grade.referenceQueries = [
      'variants/equality.sql',
      'variants/membership.sql',
      'variants/absent.sql',
    ];
  });
  check((_p, m) => {
    m.grade.wrongFixtures[1]!.id = m.grade.wrongFixtures[0]!.id;
  });
  check((_p, m) => {
    m.type = 'capstone';
  });
  check((_p, m) => {
    m.grade.comparison.types = [];
  });
  check((p) => {
    p.files['missions/003/variants.sql'] = '-- variant: equality\nSELECT 1;';
  });
  check((p) => {
    p.files['missions/003/variants.sql'] =
      '-- variant: a\nSELECT 1;\n-- variant: a\nSELECT 2;';
  });
  check((p) => {
    p.files['missions/003/seed.sql'] = '';
  });
  expect(() =>
    expandVariants('-- variant: a\n\n-- variant: b\nSELECT 1;'),
  ).toThrow();
  expect(() => expandVariants('SELECT 0;\n-- variant: a\nSELECT 1;')).toThrow();
  expect(() =>
    expandVariants(
      '-- variant: a\nSELECT 1;\n-- variant: b\nSELECT 2;\n-- variant: ../escape\nSELECT 3;',
    ),
  ).toThrow();
});

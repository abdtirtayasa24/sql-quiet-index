import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { expect, it } from 'vitest';
import { syntheticGraph } from '../fixtures/case-graph';
import {
  simulateProgression,
  validateGraph,
} from '../../src/gameplay/case-graph';
import type { CaseGraph } from '../../src/gameplay/case-graph';
const schema = JSON.parse(
  readFileSync('schemas/graph.schema.json', 'utf8'),
) as object;
const validateSchema = new Ajv({ strict: true, allErrors: true }).compile(
  schema,
);
const reject = (change: (g: CaseGraph) => void, pattern: RegExp) => {
  const g = syntheticGraph();
  change(g);
  expect(validateGraph(g).join('\n')).toMatch(pattern);
};
it.each([1, 2, 3])(
  'demonstrates a novice reaching synthetic act %s synthesis with three real distinct assessed items',
  (act) => {
    const g = syntheticGraph(act);
    expect(validateSchema(g)).toBe(true);
    expect(validateGraph(g)).toEqual([]);
    expect(simulateProgression(g).completed.has(g.goals[0]!)).toBe(true);
    expect(simulateProgression(g).familiar.has('filter_eq')).toBe(true);
  },
);
it('rejects dangling/cyclic nodes, conclusion-dependent clues and unreachable public facts', () => {
  reject((g) => {
    g.nodes[1]!.requires = ['unknown'];
  }, /unknown/i);
  reject((g) => {
    g.nodes[1]!.requires = ['a.people'];
    g.nodes[2]!.requires = ['a.vehicle'];
  }, /cycle/i);
  reject((g) => {
    g.nodes[1]!.requires = ['a.conclusion'];
  }, /conclusion/i);
  reject((g) => {
    g.publicFacts = [];
  }, /unreachable|deadlock/i);
  reject((g) => {
    g.nodes.push({ ...g.nodes[1]! });
  }, /duplicate/i);
});
it('rejects disguised duplicate paths/sources and circular cross-path dependencies', () => {
  reject((g) => {
    g.paths[1]!.reasoningId = g.paths[0]!.reasoningId;
  }, /distinct|duplicate/i);
  reject((g) => {
    g.paths[1]!.sourceIds = g.paths[0]!.sourceIds;
  }, /source/i);
  reject((g) => {
    g.paths[1]!.nodeIds = g.paths[0]!.nodeIds;
  }, /distinct|source/i);
  reject((g) => {
    g.missions[1]!.storyRequires = ['a.vehicle'];
  }, /independent/i);
  reject((g) => {
    g.paths.pop();
  }, /three/i);
  reject((g) => {
    g.paths[0]!.nodeIds = ['a.public'];
  }, /evidence/i);
});
it('checks actual resolution feasibility after every optional clue removal', () => {
  reject((g) => {
    g.nodes[1]!.mandatory = false;
  }, /optional.*resolution/i);
  const g = syntheticGraph();
  g.nodes[1]!.mandatory = false;
  g.nodes.push({
    id: 'a.reconcile',
    kind: 'reconciliation',
    requires: ['a.public'],
    mandatory: true,
  });
  g.missions[2]!.awards.push('a.reconcile');
  g.resolutions = [
    {
      conclusionId: 'a.conclusion',
      policy: 'two_high_reconciled',
      reconciliationNodeId: 'a.reconcile',
    },
  ];
  expect(validateGraph(g)).toEqual([]);
  g.paths[1]!.confidence = 'supporting';
  expect(validateGraph(g).join('\n')).toMatch(/optional.*resolution/i);
});
it('prevents seed-variant farming, unknown concepts and impossible taught/familiar/story prerequisites', () => {
  reject((g) => {
    g.practice = [];
    g.missions[1]!.item.concepts = [];
    g.missions[2]!.item.concepts = [];
  }, /familiar|deadlock/i);
  reject((g) => {
    g.practice[1]!.id = g.practice[0]!.id;
  }, /duplicate/i);
  reject((g) => {
    g.practice[1]!.taskId = g.practice[0]!.taskId;
  }, /distinct|duplicate/i);
  reject((g) => {
    g.missions[0]!.requires = ['filter_eq'];
  }, /deadlock|taught/i);
  reject((g) => {
    g.missions[0]!.requires = ['missing_concept'];
  }, /unknown/i);
  reject((g) => {
    g.missions[0]!.storyRequires = ['unknown'];
  }, /unknown/i);
  reject((g) => {
    g.nodes.push({
      id: 'a.post_synthesis',
      kind: 'reconciliation',
      requires: [],
      mandatory: true,
    });
    g.missions[3]!.awards.push('a.post_synthesis');
    g.practice.forEach((p) => {
      p.storyRequires = ['a.post_synthesis'];
    });
    g.missions[1]!.item.concepts = [];
    g.missions[2]!.item.concepts = [];
  }, /deadlock|familiar/i);
});
it('honors A1/A2 spine but allows A3 spokes and validates sawtooth exceptions', () => {
  reject((g) => {
    g.missions[0]!.storyRequires = ['a.people'];
  }, /deadlock|independent/i);
  reject((g) => {
    g.missions[0]!.role = 'spike';
    g.missions[1]!.role = 'spike';
  }, /adjacent/i);
  reject((g) => {
    g.missions[2]!.role = 'spike';
  }, /rest/i);
  const g = syntheticGraph();
  g.missions[2]!.role = 'spike';
  g.missions[3]!.synthesisException = {
    reason: 'Synthetic exception only',
    playtestRef: 'test.synthetic',
  };
  expect(validateGraph(g)).toEqual([]);
  const spoke = syntheticGraph(3);
  spoke.missions[0]!.storyRequires = ['a.people'];
  spoke.missions[1]!.requires = [];
  expect(simulateProgression(spoke).completed.has(spoke.goals[0]!)).toBe(true);
});
it('checks optional non-evidence clues and requires non-vacuous, actually taught synthesis gates', () => {
  reject((g) => {
    g.nodes[0]!.mandatory = false;
  }, /optional/i);
  reject((g) => {
    g.missions[3]!.criticalConcepts = [];
  }, /critical|synthesis/i);
  reject((g) => {
    g.missions[0]!.teaches = [];
  }, /taught|deadlock/i);
  reject((g) => {
    g.missions[1]!.item.concepts = ['filter_eq'];
    g.missions[1]!.reinforces = [];
  }, /assess|concept/i);
});
it('schema rejects typo/extension keys, invalid roles, unsafe IDs and empty exceptions', () => {
  for (const change of [
    (g: CaseGraph) => Object.assign(g, { x_eval: 'bad' }),
    (g: CaseGraph) => Object.assign(g.missions[0]!, { role: 'skip' }),
    (g: CaseGraph) => {
      g.nodes[0]!.id = '../node';
    },
    (g: CaseGraph) => {
      g.missions[3]!.synthesisException = { reason: '', playtestRef: '' };
    },
  ]) {
    const g = syntheticGraph();
    change(g);
    expect(validateSchema(g)).toBe(false);
  }
});

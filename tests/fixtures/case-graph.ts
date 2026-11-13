import type { CaseGraph } from '../../src/gameplay/case-graph';

export function syntheticGraph(act = 1): CaseGraph {
  const actId = `act${String(act).padStart(2, '0')}`;
  const ids = [1, 2, 3, 8].map((i) =>
    String((act - 1) * 8 + i).padStart(3, '0'),
  );
  return {
    schemaVersion: 1,
    actId,
    concepts: ['filter_eq'],
    initialTaught: [],
    publicFacts: ['a.public'],
    nodes: [
      { id: 'a.public', kind: 'fact', requires: [], mandatory: true },
      {
        id: 'a.vehicle',
        kind: 'evidence',
        requires: ['a.public'],
        mandatory: true,
        sourceId: 'gate_events',
      },
      {
        id: 'a.people',
        kind: 'evidence',
        requires: ['a.public'],
        mandatory: true,
        sourceId: 'shift_roster',
      },
      {
        id: 'a.artifacts',
        kind: 'evidence',
        requires: ['a.public'],
        mandatory: true,
        sourceId: 'delivery_signatures',
      },
      { id: 'a.conclusion', kind: 'conclusion', requires: [], mandatory: true },
    ],
    paths: ['vehicle', 'people', 'artifacts'].map((name, i) => ({
      id: `path.${name}`,
      conclusionId: 'a.conclusion',
      nodeIds: [`a.${name}`],
      sourceIds: [['gate_events', 'shift_roster', 'delivery_signatures'][i]!],
      reasoningId: `reason.${name}`,
      confidence: 'high' as const,
    })),
    resolutions: [{ conclusionId: 'a.conclusion', policy: 'all_three' }],
    missions: ids.map((id, i) => ({
      id,
      actId,
      type: i === 3 ? ('capstone' as const) : ('concept' as const),
      role:
        i === 0
          ? ('teach' as const)
          : i === 2
            ? ('rest' as const)
            : ('drill' as const),
      difficulty: i + 1,
      requires: i === 0 ? [] : ['filter_eq'],
      teaches: i === 0 ? ['filter_eq'] : [],
      reinforces: i === 0 ? [] : ['filter_eq'],
      storyRequires: i === 3 ? ['a.conclusion'] : ['a.public'],
      awards: i < 3 ? [['a.vehicle', 'a.people', 'a.artifacts'][i]!] : [],
      criticalConcepts: i === 3 ? ['filter_eq'] : [],
      synthesis: i === 3,
      item: { id: `item.${id}`, taskId: `task.${id}`, concepts: ['filter_eq'] },
    })),
    practice: [
      {
        id: 'practice.one',
        taskId: 'task.practice.one',
        conceptId: 'filter_eq',
        requires: [],
        storyRequires: [],
        packId: 'practice.a',
      },
      {
        id: 'practice.two',
        taskId: 'task.practice.two',
        conceptId: 'filter_eq',
        requires: [],
        storyRequires: [],
        packId: 'practice.b',
      },
    ],
    goals: [ids[3]!],
  };
}

export interface GraphNode {
  id: string;
  kind: 'fact' | 'evidence' | 'conclusion' | 'reconciliation';
  requires: string[];
  mandatory: boolean;
  sourceId?: string;
}
export interface GraphMission {
  id: string;
  actId: string;
  type: 'concept' | 'practice' | 'capstone';
  role: 'teach' | 'drill' | 'spike' | 'rest' | 'mastery';
  difficulty: number;
  requires: string[];
  teaches: string[];
  reinforces: string[];
  storyRequires: string[];
  awards: string[];
  criticalConcepts: string[];
  synthesis: boolean;
  item: { id: string; taskId: string; concepts: string[] };
  synthesisException?: { reason: string; playtestRef: string };
}
export interface CaseGraph {
  schemaVersion: 1;
  actId: string;
  concepts: string[];
  initialTaught: string[];
  publicFacts: string[];
  nodes: GraphNode[];
  paths: {
    id: string;
    conclusionId: string;
    nodeIds: string[];
    sourceIds: string[];
    reasoningId: string;
    confidence: 'high' | 'supporting';
  }[];
  resolutions: {
    conclusionId: string;
    policy: 'all_three' | 'two_high_reconciled';
    reconciliationNodeId?: string;
  }[];
  missions: GraphMission[];
  practice: {
    id: string;
    taskId: string;
    conceptId: string;
    requires: string[];
    storyRequires: string[];
    packId: string;
  }[];
  goals: string[];
}

function resolved(
  graph: CaseGraph,
  conclusionId: string,
  available: Set<string>,
): boolean {
  const policy = graph.resolutions.find((r) => r.conclusionId === conclusionId);
  const complete = graph.paths.filter(
    (p) =>
      p.conclusionId === conclusionId &&
      p.nodeIds.every((n) => available.has(n)),
  );
  if (policy?.policy === 'all_three') return complete.length >= 3;
  return (
    policy?.policy === 'two_high_reconciled' &&
    complete.filter((p) => p.confidence === 'high').length >= 2 &&
    available.has(policy.reconciliationNodeId ?? '')
  );
}

// Validation-only optimistic simulation: every assessed response is correct.
// Runtime mastery, failed attempts and h4 qualification remain T28/T29.
export function simulateProgression(
  graph: CaseGraph,
  removed = '',
  allowedEvidence?: ReadonlySet<string>,
) {
  const available = new Set(graph.publicFacts.filter((n) => n !== removed));
  const taught = new Set(graph.initialTaught);
  const attempted = new Set<string>();
  const familiar = new Set<string>();
  const completed = new Set<string>();
  const practiced = new Set<string>();
  const observations = new Map<string, Set<string>>();
  const pendingAwards = new Set<string>();
  const ordered = [...graph.missions].sort((a, b) => a.id.localeCompare(b.id));
  const assess = (concepts: string[], taskId: string) => {
    for (const c of concepts) {
      attempted.add(c);
      const items = observations.get(c) ?? new Set<string>();
      items.add(taskId);
      observations.set(c, items);
      if (items.size >= 3) familiar.add(c);
    }
  };
  const stateSize = () =>
    available.size +
    taught.size +
    attempted.size +
    familiar.size +
    completed.size +
    practiced.size;
  let previous = -1;
  while (previous !== stateSize()) {
    previous = stateSize();
    for (const m of ordered) {
      if (completed.has(m.id)) continue;
      const earlier = ordered.filter(
        (p) => p.id < m.id && (p.actId === 'act01' || p.actId === 'act02'),
      );
      if (
        (m.actId === 'act01' || m.actId === 'act02') &&
        earlier.some((p) => !completed.has(p.id))
      )
        continue;
      if (
        !m.requires.every((c) => taught.has(c)) ||
        !m.storyRequires.every((n) => available.has(n))
      )
        continue;
      if (m.synthesis && !m.criticalConcepts.every((c) => familiar.has(c)))
        continue;
      completed.add(m.id);
      m.teaches.forEach((c) => taught.add(c));
      assess(m.item.concepts, m.item.taskId);
      m.awards.forEach((n) => pendingAwards.add(n));
    }
    for (const p of graph.practice) {
      if (
        practiced.has(p.id) ||
        !attempted.has(p.conceptId) ||
        !p.requires.every((c) => taught.has(c)) ||
        !p.storyRequires.every((n) => available.has(n))
      )
        continue;
      practiced.add(p.id);
      assess([p.conceptId], p.taskId);
    }
    for (const n of graph.nodes) {
      if (
        n.id === removed ||
        available.has(n.id) ||
        !n.requires.every((d) => available.has(d))
      )
        continue;
      if (n.kind === 'conclusion') {
        if (resolved(graph, n.id, available)) available.add(n.id);
      } else if (
        pendingAwards.has(n.id) &&
        (n.kind !== 'evidence' || !allowedEvidence || allowedEvidence.has(n.id))
      )
        available.add(n.id);
    }
  }
  return { available, taught, attempted, familiar, completed };
}

export function validateGraph(graph: CaseGraph): string[] {
  const errors: string[] = [];
  const report = (pointer: string, message: string) =>
    errors.push(`${pointer}: ${message}`);
  const unique = (pointer: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length)
      report(pointer, 'Duplicate IDs or tasks must be distinct');
  };
  unique(
    '/nodes',
    graph.nodes.map((n) => n.id),
  );
  unique(
    '/paths',
    graph.paths.map((p) => p.id),
  );
  unique(
    '/missions',
    graph.missions.map((m) => m.id),
  );
  unique('/concepts', graph.concepts);
  unique(
    '/resolutions',
    graph.resolutions.map((r) => r.conclusionId),
  );
  unique('/assessment/items', [
    ...graph.missions.map((m) => m.item.id),
    ...graph.practice.map((p) => p.id),
  ]);
  unique('/assessment/tasks', [
    ...graph.missions.map((m) => m.item.taskId),
    ...graph.practice.map((p) => p.taskId),
  ]);
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const missionIds = new Set(graph.missions.map((m) => m.id));
  const knownNodes = (pointer: string, ids: string[]) => {
    for (const id of ids)
      if (!nodes.has(id)) report(pointer, `Unknown node ${id}`);
  };
  const knownConcepts = (pointer: string, ids: string[]) => {
    for (const id of ids)
      if (!graph.concepts.includes(id))
        report(pointer, `Unknown concept ${id}`);
  };
  knownNodes('/publicFacts', graph.publicFacts);
  knownConcepts('/initialTaught', graph.initialTaught);
  for (const id of graph.publicFacts)
    if (nodes.get(id)?.kind !== 'fact' || nodes.get(id)?.requires.length)
      report('/publicFacts', 'Public starts must be dependency-free facts');
  for (const [i, n] of graph.nodes.entries()) {
    knownNodes(`/nodes/${i}/requires`, n.requires);
    if (n.kind === 'evidence' && !n.sourceId)
      report(`/nodes/${i}/sourceId`, 'Evidence needs source ID');
    if (n.kind !== 'evidence' && n.sourceId)
      report(`/nodes/${i}/sourceId`, 'Only evidence has a source ID');
    if (
      n.kind === 'conclusion' &&
      !graph.resolutions.some((r) => r.conclusionId === n.id)
    )
      report(`/nodes/${i}`, 'Conclusion needs resolution policy');
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string, fromEvidence: boolean) => {
    if (active.has(id)) {
      report('/nodes', 'Dependency cycle');
      return;
    }
    const n = nodes.get(id);
    if (!n) return;
    if (fromEvidence && n.kind === 'conclusion') {
      report('/nodes', 'Clue depends on conclusion');
      return;
    }
    const key = `${id}:${fromEvidence}`;
    if (visited.has(key)) return;
    active.add(id);
    n.requires.forEach((d) => visit(d, fromEvidence || n.kind === 'evidence'));
    active.delete(id);
    visited.add(key);
  };
  graph.nodes.forEach((n) => visit(n.id, false));
  for (const [i, m] of graph.missions.entries()) {
    const ptr = `/missions/${i}`;
    if (m.actId !== graph.actId) report(ptr, 'Mission act differs from case');
    const expectedAct = `act${String(Math.ceil(Number(m.id) / 8)).padStart(2, '0')}`;
    if (m.actId !== expectedAct) report(ptr, 'Mission ID/act mismatch');
    knownConcepts(ptr, [
      ...m.requires,
      ...m.teaches,
      ...m.reinforces,
      ...m.criticalConcepts,
      ...m.item.concepts,
    ]);
    knownNodes(ptr, [...m.storyRequires, ...m.awards]);
    if (
      m.awards.some(
        (n) =>
          !['evidence', 'reconciliation'].includes(nodes.get(n)?.kind ?? ''),
      )
    )
      report(ptr, 'Only evidence/reconciliation can be awarded');
    if (m.teaches.some((c) => m.requires.includes(c)))
      report(
        ptr,
        'Concept must be taught before it is required (taught deadlock)',
      );
    if (
      m.item.concepts.some(
        (c) => !m.teaches.includes(c) && !m.reinforces.includes(c),
      )
    )
      report(ptr, 'Assessed concept must be taught or reinforced by this task');
    if (m.synthesis && (!m.criticalConcepts.length || m.type !== 'capstone'))
      report(ptr, 'Synthesis must be capstone with nonempty critical concepts');
    if (!m.synthesis && m.criticalConcepts.length)
      report(ptr, 'Familiar gates belong to synthesis');
  }
  for (const [i, p] of graph.practice.entries()) {
    knownConcepts(`/practice/${i}`, [p.conceptId, ...p.requires]);
    knownNodes(`/practice/${i}`, p.storyRequires);
  }
  for (const id of graph.goals)
    if (
      !missionIds.has(id) ||
      !graph.missions.find((m) => m.id === id)?.synthesis
    )
      report('/goals', `Unknown/non-synthesis goal ${id}`);
  for (const [i, p] of graph.paths.entries()) {
    const ptr = `/paths/${i}`;
    knownNodes(ptr, [p.conclusionId, ...p.nodeIds]);
    if (nodes.get(p.conclusionId)?.kind !== 'conclusion')
      report(ptr, 'Path target must be conclusion');
    if (
      !p.nodeIds.length ||
      p.nodeIds.some((n) => nodes.get(n)?.kind !== 'evidence')
    )
      report(ptr, 'Path must contain evidence nodes');
    const sources = [...new Set(p.nodeIds.map((n) => nodes.get(n)?.sourceId))]
      .sort()
      .join('|');
    if (sources !== [...p.sourceIds].sort().join('|'))
      report(ptr, 'Declared sources differ from actual evidence sources');
  }
  for (const [i, r] of graph.resolutions.entries()) {
    if (nodes.get(r.conclusionId)?.kind !== 'conclusion')
      report(`/resolutions/${i}`, 'Unknown conclusion');
    const paths = graph.paths.filter((p) => p.conclusionId === r.conclusionId);
    if (paths.length < 3)
      report(`/resolutions/${i}`, 'At least three proof paths required');
    unique(
      `/resolutions/${i}/reasoning`,
      paths.map((p) => p.reasoningId),
    );
    unique(
      `/resolutions/${i}/sources`,
      paths.map((p) => [...p.sourceIds].sort().join('|')),
    );
    unique(
      `/resolutions/${i}/paths`,
      paths.map((p) => [...p.nodeIds].sort().join('|')),
    );
    if (
      r.policy === 'two_high_reconciled' &&
      nodes.get(r.reconciliationNodeId ?? '')?.kind !== 'reconciliation'
    )
      report(`/resolutions/${i}`, 'Reconciliation node required');
    if (r.policy === 'all_three' && r.reconciliationNodeId)
      report(
        `/resolutions/${i}`,
        'Unexpected reconciliation for all-three policy',
      );
  }
  const ordered = [...graph.missions].sort((a, b) => a.id.localeCompare(b.id));
  for (const [i, m] of ordered.entries())
    if (m.role === 'spike') {
      if (ordered[i + 1]?.role === 'spike')
        report('/missions', 'Adjacent spikes');
      const next = ordered.slice(i + 1, i + 3);
      const exception = next.find((p) => p.synthesis)?.synthesisException;
      if (
        !next.some((p) => p.role === 'rest') &&
        !(exception?.reason.trim() && exception.playtestRef.trim())
      )
        report(
          '/missions',
          'Spike needs rest within two missions or explicit playtested synthesis exception',
        );
    }
  // No traversal on malformed references/cycles; prevents misleading partial success.
  if (errors.length) return errors;
  const baseline = simulateProgression(graph);
  for (const goal of graph.goals)
    if (!baseline.completed.has(goal))
      report('/goals', `Progression deadlock/familiar gate: ${goal}`);
  for (const n of graph.nodes)
    if (!baseline.available.has(n.id))
      report('/nodes', `Unreachable node ${n.id}`);
  for (const p of graph.paths) {
    const independent = simulateProgression(graph, '', new Set(p.nodeIds));
    if (!p.nodeIds.every((id) => independent.available.has(id)))
      report('/paths', `Path ${p.id} is not independently reachable`);
  }
  for (const n of graph.nodes.filter(
    (n) => n.kind !== 'conclusion' && !n.mandatory,
  )) {
    const state = simulateProgression(graph, n.id);
    for (const r of graph.resolutions) {
      const surviving = graph.paths.filter(
        (p) =>
          p.conclusionId === r.conclusionId &&
          p.nodeIds.every((id) => state.available.has(id)),
      );
      if (!surviving.length)
        report('/nodes', `Optional ${n.id} removal leaves no complete route`);
      if (
        !state.available.has(r.conclusionId) ||
        graph.goals.some((id) => !state.completed.has(id))
      )
        report(
          '/nodes',
          `Optional ${n.id} removal violates resolution/progression policy`,
        );
    }
  }
  return errors;
}

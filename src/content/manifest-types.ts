export interface MissionManifest {
  schemaVersion: 1;
  contentVersion: string;
  seedVersion: 1;
  id: string;
  actId: string;
  caseId: string;
  type: 'concept' | 'practice' | 'capstone';
  role: 'teach' | 'drill' | 'spike' | 'rest' | 'mastery';
  difficulty: number;
  i18n: { title: string; brief: string; success: string };
  requires: string[];
  teaches: string[];
  reinforces: string[];
  storyRequires: string[];
  visibleTables: string[];
  visibleColumns: Record<string, string[]>;
  seedProfile: string;
  assessment: { itemId: string; packId: string };
  grade: {
    resultKind: 'table';
    referenceQueries: string[];
    comparison: {
      columnNames: string[];
      columnNamePolicy: 'exact' | 'aliases_allowed';
      order: 'ordered' | 'unordered_multiset';
      types: string[];
      numericTolerance: 'exact';
      maxRows: number;
    };
    constraints: {
      id: string;
      when: 'always' | 'ast.outerJoin';
      must:
        | 'ast.outerJoin'
        | 'ast.nullAntiMatch'
        | 'ast.selfJoin'
        | 'ast.groupBy'
        | 'ast.orderBy'
        | 'ast.filter'
        | 'ast.join';
      feedback: string;
    }[];
    wrongFixtures: { id: string; sql: string; diagnostic: string }[];
  };
  evidence: {
    nodeId: string;
    selection: 'at_least_one_valid_row';
    requiresQueryProof: true;
    sourceTables: string[];
    rowKeyColumns: string[];
  };
  hints: string[];
  followUp: {
    itemId: string;
    variant: number;
    objectiveKey: string;
    predicateKey: string;
  };
  availableFrom: string;
}

export interface Season {
  schemaVersion: 1;
  contentVersion: string;
  acts: { id: string; title: string; arc: string }[];
  missions: {
    id: string;
    actId: string;
    title: string;
    objective: string;
    construct: string;
    concepts: string[];
  }[];
}
export interface Registry {
  schemaVersion: 1;
  contentVersion: string;
  missions: { id: string; manifest: string }[];
  graphs: { actId: string; path: string }[];
}
export interface ContentPack {
  season: unknown;
  registry: unknown;
  concepts: unknown;
  locales: Record<string, unknown>;
  manifests: Record<string, unknown>;
  files: Record<string, string>;
  graphs: Record<string, unknown>;
}
export interface ContentIssue {
  source: string;
  pointer: string;
  message: string;
}

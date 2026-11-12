import { expect, it } from 'vitest';
import {
  isWorkspaceRequest,
  isWorkspaceReply,
} from '../../src/engine/workspace-protocol';
const identity = { sessionId: 'session', requestId: 1 };
it('requires identity and bounded dataset/query contracts', () => {
  expect(
    isWorkspaceRequest({ ...identity, type: 'LOAD', seed: '1234abcd' }),
  ).toBe(true);
  expect(
    isWorkspaceRequest({ ...identity, type: 'RUN', sql: 'SELECT 1' }),
  ).toBe(true);
  for (const invalid of [
    { type: 'RUN', sql: 'SELECT 1' },
    { ...identity, type: 'RUN', sql: 'x'.repeat(12001) },
    { ...identity, type: 'LOAD', seed: '../bad' },
  ])
    expect(isWorkspaceRequest(invalid)).toBe(false);
});
it('rejects malformed, oversized and non-array result payloads', () => {
  const result = {
    fields: [{ name: 'id', typeOid: 23 }],
    rows: [[null]],
    rowCount: 1,
  };
  expect(isWorkspaceReply({ ...identity, type: 'RESULT', result })).toBe(true);
  for (const bad of [
    { ...result, rows: [{}] },
    { ...result, rows: [[1, 2]] },
    { ...result, rows: Array(201).fill([1]) },
    { ...result, fields: [{ name: 'x', typeOid: '23' }] },
    { ...result, rows: [['x'.repeat(4097)]] },
  ])
    expect(isWorkspaceReply({ ...identity, type: 'RESULT', result: bad })).toBe(
      false,
    );
});

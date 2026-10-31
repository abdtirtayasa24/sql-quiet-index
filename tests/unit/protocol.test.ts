import { describe, expect, it } from 'vitest';
import { isEngineRequest, isEngineResponse } from '../../src/engine/protocol';

const identity = { sessionId: 'test-session', requestId: 1 };

describe('feasibility worker boundary', () => {
  it('accepts fixed probes and bounded parser input', () => {
    expect(isEngineRequest({ ...identity, type: 'PROBE' })).toBe(true);
    expect(
      isEngineRequest({ ...identity, type: 'PARSE', sql: 'SELECT 1' }),
    ).toBe(true);
  });

  it.each([
    null,
    {},
    { ...identity, type: 'EXEC', sql: 'DROP TABLE staff' },
    { ...identity, type: 'PARSE', sql: 'x'.repeat(12_001) },
    { ...identity, type: 'PARSE', sql: 42 },
    { ...identity, type: 'PROBE', requestId: 0 },
    { ...identity, type: 'PROBE', requestId: 1.5 },
    { ...identity, type: 'PROBE', sessionId: '' },
  ])('rejects malformed, unsupported or oversize requests: %j', (input) => {
    expect(isEngineRequest(input)).toBe(false);
  });

  it('validates reply payloads rather than trusting the discriminant', () => {
    expect(
      isEngineResponse({ ...identity, type: 'PROBE_RESULT', results: [] }),
    ).toBe(true);
    expect(
      isEngineResponse({ ...identity, type: 'PROBE_RESULT', results: [{}] }),
    ).toBe(false);
    expect(
      isEngineResponse({
        ...identity,
        type: 'PARSE_RESULT',
        result: { ok: false, message: 'syntax error', cursorPosition: 3 },
      }),
    ).toBe(true);
    expect(
      isEngineResponse({
        ...identity,
        type: 'PARSE_RESULT',
        result: { ok: true },
      }),
    ).toBe(false);
    expect(
      isEngineResponse({
        ...identity,
        type: 'ERROR',
        message: 'Engine unavailable',
      }),
    ).toBe(true);
    expect(isEngineResponse({ ...identity, type: 'ERROR', message: {} })).toBe(
      false,
    );
  });
});

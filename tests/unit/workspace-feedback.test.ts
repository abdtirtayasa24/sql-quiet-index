import { expect, it } from 'vitest';
import { queryFeedback } from '../../src/engine/workspace-feedback';
it.each([
  '42601',
  '42703',
  '42803',
  '42P01',
  '42702',
  'POLICY',
  'LIMIT',
  'ENGINE_RESET',
])('gives one primary actionable diagnosis for %s', (code) => {
  const feedback = queryFeedback(code);
  expect(feedback.primary.length).toBeGreaterThan(15);
  expect(feedback.details.length).toBeLessThanOrEqual(2);
  expect(feedback.details.length).toBeGreaterThan(0);
});
it('does not echo raw database payloads', () => {
  expect(JSON.stringify(queryFeedback('<script>'))).not.toContain('<script>');
});

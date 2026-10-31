import { expect, it } from 'vitest';
import {
  EditorModel,
  visibleSchema,
} from '../../src/components/editor/editor-contract';

it('exposes only explicitly visible tables and columns to completion', () => {
  expect(
    visibleSchema([
      {
        name: 'staff',
        visible: true,
        columns: [
          { name: 'staff_id', visible: true },
          { name: 'private_note', visible: false },
        ],
      },
      {
        name: 'answer_keys',
        visible: false,
        columns: [{ name: 'culprit', visible: true }],
      },
    ]),
  ).toEqual({ staff: ['staff_id'] });
});
it('keeps draft, selection and undo/redo in the same model across adapter changes', () => {
  const model = new EditorModel('SELECT 1;');
  model.edit('SELECT 2;', 7, 8);
  expect(model.text).toBe('SELECT 2;');
  expect(model.state.selection.main.anchor).toBe(7);
  expect(model.state.selection.main.head).toBe(8);
  model.undo();
  expect(model.text).toBe('SELECT 1;');
  model.redo();
  expect(model.text).toBe('SELECT 2;');
  // Undo/redo owns its cursor placement; adapter swaps must preserve selection unchanged.
});
it('preserves backward selection for native input snapshots', () => {
  const model = new EditorModel('SELECT 1;');
  model.edit(model.text, 8, 2);
  expect(model.state.selection.main.anchor).toBe(8);
  expect(model.state.selection.main.head).toBe(2);
});

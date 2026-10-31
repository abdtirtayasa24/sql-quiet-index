import type { EditorAdapter, EditorOptions } from './codemirror-adapter';
import type { EditorModel } from './editor-contract';

export function mountTextarea(
  host: HTMLElement,
  model: EditorModel,
  options: EditorOptions,
): EditorAdapter {
  const input = document.createElement('textarea');
  input.setAttribute('aria-label', 'PostgreSQL query');
  input.setAttribute('aria-describedby', 'sql-help');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocomplete', 'off');
  input.value = model.text;
  const snapshot = () => {
    const backward = input.selectionDirection === 'backward';
    model.edit(
      input.value,
      backward ? input.selectionEnd : input.selectionStart,
      backward ? input.selectionStart : input.selectionEnd,
    );
  };
  const sync = () => {
    input.value = model.text;
    const { anchor, head } = model.state.selection.main;
    input.setSelectionRange(
      Math.min(anchor, head),
      Math.max(anchor, head),
      anchor > head ? 'backward' : 'forward',
    );
  };
  input.addEventListener('input', () => {
    snapshot();
    options.changed();
  });
  input.addEventListener('select', snapshot);
  input.addEventListener('blur', snapshot);
  input.addEventListener('keydown', (event) => {
    if (event.isComposing || (!event.ctrlKey && !event.metaKey) || event.altKey)
      return;
    if (event.key === 'Enter') {
      event.preventDefault();
      snapshot();
      options.run();
    } else if (
      event.key.toLowerCase() === 'z' ||
      event.key.toLowerCase() === 'y'
    ) {
      event.preventDefault();
      snapshot();
      if (event.shiftKey || event.key.toLowerCase() === 'y') model.redo();
      else model.undo();
      sync();
      options.changed();
    }
  });
  host.append(input);
  sync();
  return {
    focus: () => input.focus(),
    destroy() {
      snapshot();
      input.remove();
    },
    reconfigure() {
      /* No syntax/completion extensions in the native fallback. */
    },
  };
}

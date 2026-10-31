import { basicSetup } from 'codemirror';
import { Compartment, Prec, StateEffect } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { visibleSchema } from './editor-contract';
import type { EditorModel, VisibleTable } from './editor-contract';

export interface EditorAdapter {
  focus(): void;
  destroy(): void;
  reconfigure(tables: readonly VisibleTable[], dark: boolean): void;
}
export interface EditorOptions {
  tables: readonly VisibleTable[];
  dark: boolean;
  changed(): void;
  run(): void;
}
function theme(dark: boolean) {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontSize: '1rem',
      },
      '.cm-content': {
        fontFamily: 'var(--font-mono)',
        minHeight: '160px',
        caretColor: 'var(--color-accent)',
      },
      '.cm-scroller': { overflow: 'auto' },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-muted)',
        borderColor: 'var(--color-border)',
      },
      '.cm-activeLine, .cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
        backgroundColor: 'var(--color-border)',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-accent)',
      },
    },
    { dark },
  );
}
export function mountCodeMirror(
  host: HTMLElement,
  model: EditorModel,
  options: EditorOptions,
): EditorAdapter {
  const language = new Compartment();
  const appearance = new Compartment();
  const run = () => {
    options.run();
    return true;
  };
  model.state = model.state.update({
    effects: StateEffect.reconfigure.of([
      basicSetup,
      syntaxHighlighting(
        HighlightStyle.define([
          {
            tag: tags.keyword,
            color: 'var(--color-accent)',
            fontWeight: '600',
          },
          {
            tag: [tags.string, tags.number, tags.bool, tags.null],
            color: 'var(--color-warning)',
          },
          {
            tag: tags.comment,
            color: 'var(--color-muted)',
            fontStyle: 'italic',
          },
        ]),
      ),
      EditorView.lineWrapping,
      language.of(
        sql({ dialect: PostgreSQL, schema: visibleSchema(options.tables) }),
      ),
      appearance.of(theme(options.dark)),
      EditorView.contentAttributes.of({
        'aria-label': 'PostgreSQL query',
        'aria-describedby': 'sql-help',
        'aria-multiline': 'true',
        role: 'textbox',
        spellcheck: 'false',
        autocapitalize: 'off',
        autocomplete: 'off',
      }),
      Prec.highest(
        keymap.of([
          { key: 'Ctrl-Enter', run },
          { key: 'Meta-Enter', run },
        ]),
      ),
      EditorView.updateListener.of((update) => {
        model.state = update.state;
        if (update.docChanged) options.changed();
      }),
    ]),
  }).state;
  const view = new EditorView({ state: model.state, parent: host });
  return {
    focus: () => view.focus(),
    destroy() {
      model.state = view.state;
      view.destroy();
    },
    reconfigure(tables, dark) {
      view.dispatch({
        effects: [
          language.reconfigure(
            sql({ dialect: PostgreSQL, schema: visibleSchema(tables) }),
          ),
          appearance.reconfigure(theme(dark)),
        ],
      });
    },
  };
}

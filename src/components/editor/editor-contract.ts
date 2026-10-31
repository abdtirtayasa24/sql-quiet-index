import { EditorSelection, EditorState, Transaction } from '@codemirror/state';
import { history, redo, undo } from '@codemirror/commands';

export interface VisibleTable {
  name: string;
  visible: boolean;
  columns: readonly { name: string; visible: boolean }[];
}
export function visibleSchema(
  tables: readonly VisibleTable[],
): Record<string, string[]> {
  return Object.fromEntries(
    tables
      .filter((table) => table.visible)
      .map((table) => [
        table.name,
        table.columns
          .filter((column) => column.visible)
          .map((column) => column.name),
      ]),
  );
}

// One in-memory editing model survives either view; this is NOT durable saving.
export class EditorModel {
  state: EditorState;
  constructor(text: string) {
    this.state = EditorState.create({ doc: text, extensions: [history()] });
  }
  get text(): string {
    return this.state.doc.toString();
  }
  edit(text: string, anchor: number, head: number): void {
    const changes =
      text === this.text
        ? []
        : { from: 0, to: this.state.doc.length, insert: text };
    this.state = this.state.update({
      changes,
      selection: EditorSelection.single(anchor, head),
      annotations: Transaction.userEvent.of('input.type'),
    }).state;
  }
  undo(): void {
    undo({
      state: this.state,
      dispatch: (transaction) => {
        this.state = transaction.state;
      },
    });
  }
  redo(): void {
    redo({
      state: this.state,
      dispatch: (transaction) => {
        this.state = transaction.state;
      },
    });
  }
}

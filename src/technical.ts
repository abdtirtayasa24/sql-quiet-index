import './styles/tokens.css';
import './styles/global.css';
import './styles/feasibility.css';
import { TqiTechnical } from './app/technical';
import { TqiSqlEditor } from './components/editor/tqi-sql-editor';

customElements.define('tqi-sql-editor', TqiSqlEditor);
customElements.define('tqi-technical', TqiTechnical);

const shell = document.querySelector<TqiTechnical>('tqi-technical');
void shell?.updateComplete.then(async () => {
  await shell.querySelector<TqiSqlEditor>('tqi-sql-editor')?.updateComplete;
  requestAnimationFrame(() => performance.mark('tqi-m0-shell-ready'));
});

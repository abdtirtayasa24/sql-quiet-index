import './styles/tokens.css';
import './styles/global.css';
import './styles/feasibility.css';
import { TqiFeasibility } from './app/feasibility';
import { TqiSqlEditor } from './components/editor/tqi-sql-editor';

customElements.define('tqi-sql-editor', TqiSqlEditor);
customElements.define('tqi-feasibility', TqiFeasibility);

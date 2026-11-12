import './styles/tokens.css';
import './styles/global.css';
import './styles/storage.css';
import './styles/workspace.css';
import './components/workspace/tqi-sql-workspace';
import { WorkspaceController } from './app/workspace-controller';
import type {
  TqiSqlWorkspace,
  WorkspaceIntent,
} from './components/workspace/tqi-sql-workspace';
const desk = document.querySelector<TqiSqlWorkspace>('tqi-sql-workspace');
if (!desk) throw new Error('Missing workspace');
const app = new WorkspaceController(() => {
  desk.view = app.view;
  document.documentElement.dataset.storageTheme = app.storage.settings.theme;
  document.documentElement.dataset.storageMotion = app.storage.settings.motion;
});
desk.tables = [
  {
    name: 'practice_records',
    visible: true,
    columns: ['record_id', 'label', 'amount', 'recorded_on'].map((name) => ({
      name,
      visible: true,
    })),
  },
];
function download(text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quiet-index-recovery.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
desk.addEventListener('workspace-intent', (event) => {
  if (!(event instanceof CustomEvent)) return;
  const intent = (event as CustomEvent<WorkspaceIntent>).detail;
  void (async () => {
    if (intent.type === 'CREATE') await app.create();
    else if (intent.type === 'RUN') await app.run(intent.sql);
    else if (intent.type === 'EDIT') app.edit(intent.sql);
    else if (intent.type === 'REBUILD') await app.rebuild();
    else download(await app.recovery());
  })();
});
const visibility = () => {
  if (document.hidden) void app.flush();
};
document.addEventListener('visibilitychange', visibility);
document.addEventListener('click', (event) => {
  const target = event.target;
  const link = target instanceof Element ? target.closest('a') : null;
  if (
    !link ||
    event.defaultPrevented ||
    (event instanceof MouseEvent &&
      (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) ||
    link.target ||
    link.origin !== location.origin
  )
    return;
  event.preventDefault();
  if (link.hash === '#main-content' && link.pathname === location.pathname) {
    document.getElementById('main-content')?.focus();
    return;
  }
  app.cancel();
  void app.flush().then(() => location.assign(link.href));
});
window.addEventListener('pagehide', (event) => {
  app.cancel();
  void app.flush().finally(() => {
    if (!event.persisted) app.dispose();
  });
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) void app.rebuild();
});
void app.start();

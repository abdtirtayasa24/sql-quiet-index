import type { ImportCode } from '../types/case-file';
import type { StorageCode } from '../types/save';
export const portableErrors: Record<ImportCode | StorageCode, string> = {
  size: 'This file exceeds 5 MiB. Choose a smaller case file; nothing was imported.',
  json: 'This is not valid UTF-8 JSON. Keep the original and choose a supported case file.',
  complexity:
    'This file is too deeply nested or complex. Nothing was imported.',
  pollution: 'This file contains an unsafe object key. Nothing was imported.',
  schema:
    'The file or combined local records do not match the supported save schema and limits. Nothing was imported.',
  future:
    'A newer save version needs a compatible release. Use original-file or local recovery download; never reset the records.',
  integrity:
    'The integrity check failed. Keep the original and try an undamaged export. Nothing was imported.',
  references:
    'Duplicate IDs or missing campaign references make this file unsafe to import.',
  identity:
    'The campaign seed, content or engine identity differs. Keep both branches with New copy instead of merging.',
  confirmation: 'Review the file and explicitly confirm before importing.',
  capacity:
    'The combined records exceed the supported portable-file capacity. Export your existing work before continuing.',
  unavailable:
    'Local records are unavailable. Keep your original file and use the local recovery desk. Reload to reopen storage; do not clear it.',
  blocked:
    'Another tab is blocking local storage. Close that tab, then reload. No reset is needed.',
  versionchange:
    'Another tab changed the database version. Download your original file, then reopen a compatible release.',
  quota:
    'Storage is full; the import did not commit. Download your original file and local recovery copy. Writes are paused until you reopen storage.',
  aborted:
    'The import did not commit. All writes rolled back. Download your original file; reload to reopen paused storage.',
  missing:
    'The saved campaign is missing. Import a saved case file after preview; no replacement investigation was created.',
  corrupt:
    'Local records need recovery. Export a local recovery copy before using a compatible release.',
};

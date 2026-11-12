import type { Route } from '../app/router';
import type { Campaign, Collections, StorageCode } from './save';
import type { EngineResponse } from '../engine/protocol';
export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
export type AppCommand =
  | { type: 'NAVIGATE'; route: Route }
  | { type: 'RECORDS'; records: Collections }
  | {
      type: 'UNSUPPORTED';
      features: string[];
      reason?: 'capabilities' | 'save-version';
    }
  | { type: 'STORAGE_ERROR'; code: StorageCode };
type Base = { route: Route; focusId: 'route-status' | 'route-heading' };
export type AppSnapshot = DeepReadonly<
  Base &
    (
      | { phase: 'booting' }
      | {
          phase: 'unsupported';
          reason: 'capabilities' | 'save-version';
          features: string[];
        }
      | { phase: 'storage-error'; code: StorageCode }
      | {
          phase: 'ready';
          campaigns: Campaign[];
          counts: Record<string, number>;
          access: 'open' | 'locked' | 'unpublished' | null;
          busy: boolean;
          result: EngineResponse | null;
          requestError: 'engine-unavailable' | null;
        }
    )
>;

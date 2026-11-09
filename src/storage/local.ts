import { isObject } from '../types/save';
import type { Locale } from '../types/save';
export interface Settings {
  locale: Locale;
  theme: 'system' | 'dark' | 'light';
  motion: 'system' | 'reduce';
}
export interface SavePointer {
  campaignId: string;
  updatedAt: string;
}
type Pointer =
  | { kind: 'present'; value: SavePointer }
  | { kind: 'missing' | 'invalid' | 'unavailable' };
const defaults: Settings = { locale: 'en', theme: 'system', motion: 'system' };
export class LocalStore {
  constructor(
    private readonly get: () => Pick<Storage, 'getItem' | 'setItem'> = () =>
      localStorage,
  ) {}
  settings(): Settings {
    try {
      const raw: unknown = JSON.parse(
        this.get().getItem('tqi.v1.settings') ?? 'null',
      );
      if (
        isObject(raw) &&
        (raw.locale === 'en' || raw.locale === 'id') &&
        (raw.theme === 'system' ||
          raw.theme === 'dark' ||
          raw.theme === 'light') &&
        (raw.motion === 'system' || raw.motion === 'reduce')
      )
        return { locale: raw.locale, theme: raw.theme, motion: raw.motion };
    } catch {
      /* Convenience storage can be denied; canonical data is separate. */
    }
    return { ...defaults };
  }
  saveSettings(settings: Settings): boolean {
    return this.save('tqi.v1.settings', settings);
  }
  savePointer(pointer: SavePointer): boolean {
    return this.save('tqi.v1.savePointer', pointer);
  }
  private save(key: string, value: Settings | SavePointer): boolean {
    try {
      this.get().setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  pointer(): Pointer {
    let text: string | null;
    try {
      text = this.get().getItem('tqi.v1.savePointer');
    } catch {
      return { kind: 'unavailable' };
    }
    if (text === null) return { kind: 'missing' };
    try {
      const raw: unknown = JSON.parse(text);
      if (
        isObject(raw) &&
        typeof raw.campaignId === 'string' &&
        raw.campaignId.length > 0 &&
        raw.campaignId.length <= 256 &&
        typeof raw.updatedAt === 'string' &&
        Number.isFinite(Date.parse(raw.updatedAt))
      )
        return {
          kind: 'present',
          value: { campaignId: raw.campaignId, updatedAt: raw.updatedAt },
        };
    } catch {
      /* Retain the original value for recovery rather than deleting it. */
    }
    return { kind: 'invalid' };
  }
}

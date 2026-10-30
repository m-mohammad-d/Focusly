import { DailyRecord } from '../types/tracking';
import { UserSettings, TimeLimit, BlockedItem, GracePeriodMap, AlertStateMap, AlertStateItem } from '../types/settings';
import { ActiveSession } from '../types/tracking';
import { getLocalDateString } from '../utils/time';

const STORAGE_KEYS = {
  DAYS: 'focus_tracker_days',
  SETTINGS: 'focus_tracker_settings',
  LIMITS: 'focus_tracker_limits',
  BLOCKLIST: 'focus_tracker_blocklist',
  GRACE_PERIODS: 'focus_tracker_grace_periods',
  ALERT_STATES: 'focus_tracker_alert_states',
  ACTIVE_SESSION: 'focus_tracker_active_session',
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
  trackingEnabled: true,
  idleThresholdSeconds: 60,
  globalDailyLimitMinutes: null,
  globalBlockOnLimit: false,
  notificationsEnabled: true,
  defaultGracePeriodMinutes: 5,
  theme: 'dark',
};

// Safe wrapper around chrome.storage.local with localStorage fallback for dev/testing
const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

async function rawGet<T>(key: string, defaultValue: T): Promise<T> {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage get error:', chrome.runtime.lastError);
          resolve(defaultValue);
        } else {
          resolve(result[key] !== undefined ? (result[key] as T) : defaultValue);
        }
      });
    });
  } else {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

async function rawSet<T>(key: string, value: T): Promise<void> {
  if (hasChromeStorage) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage set item failed:', e);
    }
  }
}

export const storage = {
  async getSettings(): Promise<UserSettings> {
    const s = await rawGet<Partial<UserSettings>>(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...s };
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await rawSet(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  async getAllDailyRecords(): Promise<Record<string, DailyRecord>> {
    return await rawGet<Record<string, DailyRecord>>(STORAGE_KEYS.DAYS, {});
  },

  async getDailyRecord(date: string = getLocalDateString()): Promise<DailyRecord> {
    const all = await this.getAllDailyRecords();
    return all[date] || { date, totalSeconds: 0, domains: {} };
  },

  async recordDomainTime(
    date: string,
    domain: string,
    seconds: number,
    faviconUrl?: string,
    isNewVisit: boolean = false
  ): Promise<DailyRecord> {
    if (seconds <= 0) {
      return await this.getDailyRecord(date);
    }

    const all = await this.getAllDailyRecords();
    const day = all[date] || { date, totalSeconds: 0, domains: {} };

    day.totalSeconds += seconds;

    const existing = day.domains[domain] || {
      domain,
      seconds: 0,
      visits: 0,
      lastActive: Date.now(),
      faviconUrl,
    };

    existing.seconds += seconds;
    existing.lastActive = Date.now();
    if (faviconUrl && !existing.faviconUrl) {
      existing.faviconUrl = faviconUrl;
    }
    if (isNewVisit) {
      existing.visits += 1;
    }

    day.domains[domain] = existing;
    all[date] = day;

    await rawSet(STORAGE_KEYS.DAYS, all);
    return day;
  },

  async getTimeLimits(): Promise<TimeLimit[]> {
    return await rawGet<TimeLimit[]>(STORAGE_KEYS.LIMITS, []);
  },

  async saveTimeLimit(limit: TimeLimit): Promise<TimeLimit[]> {
    const limits = await this.getTimeLimits();
    const index = limits.findIndex(l => l.id === limit.id);
    if (index >= 0) {
      limits[index] = limit;
    } else {
      limits.push(limit);
    }
    await rawSet(STORAGE_KEYS.LIMITS, limits);
    return limits;
  },

  async deleteTimeLimit(id: string): Promise<TimeLimit[]> {
    const limits = await this.getTimeLimits();
    const filtered = limits.filter(l => l.id !== id);
    await rawSet(STORAGE_KEYS.LIMITS, filtered);
    return filtered;
  },

  async getBlocklist(): Promise<BlockedItem[]> {
    return await rawGet<BlockedItem[]>(STORAGE_KEYS.BLOCKLIST, []);
  },

  async saveBlocklistItem(item: BlockedItem): Promise<BlockedItem[]> {
    const list = await this.getBlocklist();
    const idx = list.findIndex(b => b.id === item.id || b.domain === item.domain);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    await rawSet(STORAGE_KEYS.BLOCKLIST, list);
    return list;
  },

  async deleteBlocklistItem(idOrDomain: string): Promise<BlockedItem[]> {
    const list = await this.getBlocklist();
    const filtered = list.filter(b => b.id !== idOrDomain && b.domain !== idOrDomain);
    await rawSet(STORAGE_KEYS.BLOCKLIST, filtered);
    return filtered;
  },

  async getGracePeriods(): Promise<GracePeriodMap> {
    const map = await rawGet<GracePeriodMap>(STORAGE_KEYS.GRACE_PERIODS, {});
    const now = Date.now();
    let changed = false;
    const clean: GracePeriodMap = {};

    for (const [dom, exp] of Object.entries(map)) {
      if (exp > now) {
        clean[dom] = exp;
      } else {
        changed = true;
      }
    }

    if (changed) {
      await rawSet(STORAGE_KEYS.GRACE_PERIODS, clean);
    }
    return clean;
  },

  async clearExpiredGracePeriods(): Promise<GracePeriodMap> {
    return await this.getGracePeriods();
  },

  async setGracePeriod(domain: string, minutes: number): Promise<GracePeriodMap> {
    const map = await this.getGracePeriods();
    const expiresAt = Date.now() + Math.max(1, minutes) * 60 * 1000;
    map[domain] = expiresAt;
    await rawSet(STORAGE_KEYS.GRACE_PERIODS, map);
    return map;
  },

  async cancelGracePeriod(domain: string): Promise<GracePeriodMap> {
    const map = await this.getGracePeriods();
    delete map[domain];
    await rawSet(STORAGE_KEYS.GRACE_PERIODS, map);
    return map;
  },

  async getAlertStates(): Promise<AlertStateMap> {
    return await rawGet<AlertStateMap>(STORAGE_KEYS.ALERT_STATES, {});
  },

  async setAlertState(key: string, state: AlertStateItem): Promise<void> {
    const all = await this.getAlertStates();
    all[key] = state;
    await rawSet(STORAGE_KEYS.ALERT_STATES, all);
  },

  async getActiveSession(): Promise<ActiveSession | null> {
    return await rawGet<ActiveSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
  },

  async saveActiveSession(session: ActiveSession | null): Promise<void> {
    await rawSet(STORAGE_KEYS.ACTIVE_SESSION, session);
  },

  async clearAllData(): Promise<void> {
    if (hasChromeStorage) {
      await new Promise<void>((resolve) => chrome.storage.local.clear(resolve));
    } else {
      localStorage.clear();
    }
  },

  async exportData(): Promise<string> {
    const all = {
      version: 1,
      exportedAt: new Date().toISOString(),
      days: await this.getAllDailyRecords(),
      settings: await this.getSettings(),
      limits: await this.getTimeLimits(),
      blocklist: await this.getBlocklist(),
    };
    return JSON.stringify(all, null, 2);
  },

  async importData(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        if (parsed.days) await rawSet(STORAGE_KEYS.DAYS, parsed.days);
        if (parsed.settings) await rawSet(STORAGE_KEYS.SETTINGS, parsed.settings);
        if (parsed.limits) await rawSet(STORAGE_KEYS.LIMITS, parsed.limits);
        if (parsed.blocklist) await rawSet(STORAGE_KEYS.BLOCKLIST, parsed.blocklist);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

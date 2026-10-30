export interface TimeLimit {
  id: string;
  domain: string; // domain or '*' for global
  limitMinutes: number;
  enabled: boolean;
  blockOnLimit: boolean;
  warningThresholdPercent: number; // default 80
}

export interface BlockedItem {
  id: string;
  domain: string;
  enabled: boolean;
  addedAt: number;
  category?: string;
}

export interface UserSettings {
  trackingEnabled: boolean;
  idleThresholdSeconds: number; // e.g. 60
  globalDailyLimitMinutes: number | null; // e.g. 180 or null
  globalBlockOnLimit: boolean;
  notificationsEnabled: boolean;
  defaultGracePeriodMinutes: number; // e.g. 5
  theme: 'dark' | 'light';
}

export interface AlertStateItem {
  warned80: boolean;
  warned100: boolean;
}

export type AlertStateMap = Record<string, AlertStateItem>;
export type GracePeriodMap = Record<string, number>; // domain -> timestamp

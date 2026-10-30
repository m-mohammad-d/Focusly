export interface DomainUsage {
  domain: string;
  seconds: number;
  visits: number;
  lastActive: number;
  faviconUrl?: string;
}

export interface DailyRecord {
  date: string; // Format: "YYYY-MM-DD"
  totalSeconds: number;
  domains: Record<string, DomainUsage>;
}

export interface ActiveSession {
  domain: string | null;
  startTime: number;
  lastHeartbeat: number;
  windowId: number | null;
  tabId: number | null;
  isPaused: boolean;
}

export type TrackingStatus = 'active' | 'idle' | 'paused' | 'inactive';

export interface TrackerState {
  status: TrackingStatus;
  currentDomain: string | null;
  currentTabTitle?: string;
  currentFaviconUrl?: string;
  todayTotalSeconds: number;
  todayDomainSeconds: number;
}

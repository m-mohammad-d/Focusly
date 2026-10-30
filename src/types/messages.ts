import { TrackerState } from './tracking';

export type BackgroundMessage =
  | { type: 'GET_TRACKER_STATE' }
  | { type: 'TOGGLE_TRACKING'; payload: { enabled: boolean } }
  | { type: 'GRANT_GRACE_PERIOD'; payload: { domain: string; minutes?: number } }
  | { type: 'EXTEND_LIMIT'; payload: { domain: string; additionalMinutes: number } }
  | { type: 'FLUSH_TIME' }
  | { type: 'RESET_DAY_DATA'; payload?: { date?: string } };

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type TrackerStateResponse = MessageResponse<TrackerState>;

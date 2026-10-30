import { storage } from '../storage/chromeStorage';
import { ActiveSession, TrackerState, TrackingStatus } from '../types/tracking';
import { getDomainFromUrl } from '../utils/domain';
import { getLocalDateString, splitTimeAcrossMidnight } from '../utils/time';
import { enforceTabBlock } from './blocker';
import { checkAndSendThresholdNotification, checkGlobalLimitNotification } from './notification';

const MAX_HEARTBEAT_GAP_SECONDS = 120; // 2 minutes max gap to protect against machine sleep

type TabChangeInfoType = Parameters<Parameters<typeof chrome.tabs.onUpdated.addListener>[0]>[1];
type IdleStateType = Parameters<Parameters<typeof chrome.idle.onStateChanged.addListener>[0]>[0];

class TrackingEngine {
  private activeSession: ActiveSession | null = null;
  private isIdle = false;
  private isWindowFocused = true;
  private currentTitle?: string;
  private currentFaviconUrl?: string;

  constructor() {
    this.init();
  }

  private async init() {
    // Restore session state from storage
    const saved = await storage.getActiveSession();
    if (saved) {
      this.activeSession = saved;
    }
  }

  /**
   * Commits any pending elapsed time for the current active domain.
   */
  public async flush(now = Date.now()): Promise<void> {
    if (!this.activeSession || !this.activeSession.domain || this.activeSession.isPaused) {
      if (this.activeSession) {
        this.activeSession.lastHeartbeat = now;
        await storage.saveActiveSession(this.activeSession);
      }
      return;
    }

    const { domain, lastHeartbeat, tabId } = this.activeSession;
    const elapsedSeconds = Math.floor((now - lastHeartbeat) / 1000);

    if (elapsedSeconds <= 0) {
      return;
    }

    // Check if machine slept or long gap occurred while inactive
    const effectiveSeconds = Math.min(elapsedSeconds, MAX_HEARTBEAT_GAP_SECONDS);

    // Split across midnight if the boundary was crossed
    const chunks = splitTimeAcrossMidnight(now - (effectiveSeconds * 1000), now);

    for (const chunk of chunks) {
      const record = await storage.recordDomainTime(
        chunk.date,
        domain,
        chunk.seconds,
        this.currentFaviconUrl
      );

      // Check limits & notifications
      const domainUsage = record.domains[domain]?.seconds || 0;
      const limits = await storage.getTimeLimits();
      const limit = limits.find(l => l.domain === domain && l.enabled);

      if (limit) {
        await checkAndSendThresholdNotification(
          domain,
          domainUsage,
          limit.limitMinutes,
          limit.warningThresholdPercent || 80
        );

        if (limit.blockOnLimit && domainUsage >= limit.limitMinutes * 60 && tabId) {
          await enforceTabBlock(tabId, domain);
        }
      }

      // Check global limit
      const settings = await storage.getSettings();
      await checkGlobalLimitNotification(record.totalSeconds, settings.globalDailyLimitMinutes);
    }

    // Advance session timestamp
    this.activeSession.lastHeartbeat = now;
    await storage.saveActiveSession(this.activeSession);
  }

  /**
   * Transitions active tracking to a new tab/domain or pauses if invalid.
   */
  public async handleTabFocus(tabId: number, windowId: number): Promise<void> {
    const now = Date.now();
    await this.flush(now);

    const settings = await storage.getSettings();
    if (!settings.trackingEnabled || this.isIdle || !this.isWindowFocused) {
      await this.pause(now);
      return;
    }

    try {
      const tab = await chrome.tabs.get(tabId);
      const domain = getDomainFromUrl(tab.url);

      if (!domain) {
        // Tab is internal (chrome:// etc.) or empty
        this.activeSession = {
          domain: null,
          startTime: now,
          lastHeartbeat: now,
          windowId,
          tabId,
          isPaused: true,
        };
        this.currentTitle = tab.title;
        this.currentFaviconUrl = undefined;
        await storage.saveActiveSession(this.activeSession);
        return;
      }

      // Check if domain is blocked immediately
      const blocked = await enforceTabBlock(tabId, domain);
      if (blocked) {
        this.activeSession = {
          domain: null,
          startTime: now,
          lastHeartbeat: now,
          windowId,
          tabId,
          isPaused: true,
        };
        await storage.saveActiveSession(this.activeSession);
        return;
      }

      // Record a visit increment if starting a new domain
      const isNewDomain = !this.activeSession || this.activeSession.domain !== domain;
      if (isNewDomain) {
        const today = getLocalDateString();
        await storage.recordDomainTime(today, domain, 0, tab.favIconUrl, true);
      }

      this.activeSession = {
        domain,
        startTime: now,
        lastHeartbeat: now,
        windowId,
        tabId,
        isPaused: false,
      };
      this.currentTitle = tab.title;
      this.currentFaviconUrl = tab.favIconUrl;
      await storage.saveActiveSession(this.activeSession);
    } catch (e) {
      console.warn('Error reading tab for focus:', e);
    }
  }

  /**
   * Handles tab URL update (e.g., in-page navigation or domain change).
   */
  public async handleTabUpdated(
    tabId: number,
    changeInfo: TabChangeInfoType,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (!tab.active) return;

    if (changeInfo.url || changeInfo.favIconUrl || changeInfo.title) {
      if (changeInfo.title) this.currentTitle = changeInfo.title;
      if (changeInfo.favIconUrl) this.currentFaviconUrl = changeInfo.favIconUrl;

      if (changeInfo.url) {
        const newDomain = getDomainFromUrl(changeInfo.url);
        if (newDomain !== this.activeSession?.domain) {
          await this.handleTabFocus(tabId, tab.windowId);
        }
      }
    }
  }

  /**
   * Handles browser window focus changes (e.g., minimization, switching to other apps).
   */
  public async handleWindowFocusChanged(windowId: number): Promise<void> {
    const now = Date.now();
    await this.flush(now);

    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // All Chrome windows lost focus or browser minimized
      this.isWindowFocused = false;
      await this.pause(now);
      return;
    }

    this.isWindowFocused = true;
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, windowId });
      if (activeTab && activeTab.id !== undefined) {
        await this.handleTabFocus(activeTab.id, windowId);
      }
    } catch (e) {
      console.warn('Failed querying active tab on window focus:', e);
    }
  }

  /**
   * Handles user idle/locked status.
   */
  public async handleIdleStateChanged(state: IdleStateType): Promise<void> {
    const now = Date.now();
    await this.flush(now);

    if (state === 'idle' || state === 'locked') {
      this.isIdle = true;
      await this.pause(now);
    } else {
      this.isIdle = false;
      // Resumed active state, query current window and tab
      try {
        const [currentTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (currentTab && currentTab.id !== undefined) {
          await this.handleTabFocus(currentTab.id, currentTab.windowId);
        }
      } catch (e) {
        console.warn('Failed querying tab after idle resume:', e);
      }
    }
  }

  /**
   * Pauses tracking state without discarding session context.
   */
  public async pause(now = Date.now()): Promise<void> {
    if (this.activeSession) {
      this.activeSession.isPaused = true;
      this.activeSession.lastHeartbeat = now;
      await storage.saveActiveSession(this.activeSession);
    }
  }

  /**
   * Toggles tracking on/off globally.
   */
  public async setTrackingEnabled(enabled: boolean): Promise<void> {
    await this.flush();
    await storage.saveSettings({ trackingEnabled: enabled });

    if (!enabled) {
      await this.pause();
    } else {
      try {
        const [currentTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (currentTab && currentTab.id !== undefined) {
          await this.handleTabFocus(currentTab.id, currentTab.windowId);
        }
      } catch (e) {
        console.warn('Failed resuming tracking after enable:', e);
      }
    }
  }

  /**
   * Returns current real-time tracking status, including current domain usage.
   */
  public async getTrackerState(): Promise<TrackerState> {
    await this.flush();

    const settings = await storage.getSettings();
    const today = getLocalDateString();
    const dailyRecord = await storage.getDailyRecord(today);

    let status: TrackingStatus = 'active';
    if (!settings.trackingEnabled) {
      status = 'paused';
    } else if (this.isIdle) {
      status = 'idle';
    } else if (!this.isWindowFocused || !this.activeSession?.domain || this.activeSession.isPaused) {
      status = 'inactive';
    }

    const currentDomain = this.activeSession?.domain || null;
    const todayDomainSeconds = currentDomain ? (dailyRecord.domains[currentDomain]?.seconds || 0) : 0;

    return {
      status,
      currentDomain,
      currentTabTitle: this.currentTitle,
      currentFaviconUrl: this.currentFaviconUrl,
      todayTotalSeconds: dailyRecord.totalSeconds,
      todayDomainSeconds,
    };
  }
}

export const tracker = new TrackingEngine();

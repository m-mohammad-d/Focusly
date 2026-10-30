import { tracker } from './tracker';
import { storage } from '../storage/chromeStorage';
import { BackgroundMessage } from '../types/messages';
import { enforceTabBlock } from './blocker';

const HEARTBEAT_ALARM_NAME = 'focus_tracker_heartbeat';

// Initialize extension on install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Focus Tracker installed / updated:', details.reason);

  const settings = await storage.getSettings();
  chrome.idle.setDetectionInterval(settings.idleThresholdSeconds || 60);

  // Setup periodic alarm for heartbeat flushing
  chrome.alarms.create(HEARTBEAT_ALARM_NAME, {
    periodInMinutes: 1,
  });

  // Check currently active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.id !== undefined && tab.windowId !== undefined) {
      await tracker.handleTabFocus(tab.id, tab.windowId);
    }
  } catch (e) {
    console.warn('Initial tab focus check error:', e);
  }
});

// Browser startup listener
chrome.runtime.onStartup.addListener(async () => {
  const settings = await storage.getSettings();
  chrome.idle.setDetectionInterval(settings.idleThresholdSeconds || 60);

  chrome.alarms.get(HEARTBEAT_ALARM_NAME, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(HEARTBEAT_ALARM_NAME, { periodInMinutes: 1 });
    }
  });

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.id !== undefined && tab.windowId !== undefined) {
      await tracker.handleTabFocus(tab.id, tab.windowId);
    }
  } catch (e) {
    console.warn('Startup tab focus check error:', e);
  }
});

// Periodic alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === HEARTBEAT_ALARM_NAME) {
    await tracker.flush();
    await storage.clearExpiredGracePeriods();

    // Re-verify if current active tab is blocked
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab && tab.id !== undefined && tab.url) {
        const url = new URL(tab.url);
        let hostname = url.hostname.toLowerCase();
        if (hostname.startsWith('www.')) hostname = hostname.substring(4);
        if (hostname) {
          await enforceTabBlock(tab.id, hostname);
        }
      }
    } catch {
      // Ignore URL parse or query errors
    }
  }
});

// Tab switched / activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await tracker.handleTabFocus(activeInfo.tabId, activeInfo.windowId);
});

// Tab navigated or updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  await tracker.handleTabUpdated(tabId, changeInfo, tab);
});

// Window focus changed (minimized, switched to desktop, or switched back)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await tracker.handleWindowFocusChanged(windowId);
});

// Idle / Lock state changed
chrome.idle.onStateChanged.addListener(async (newState) => {
  await tracker.handleIdleStateChanged(newState);
});

// Inter-process messaging
chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_TRACKER_STATE': {
          const state = await tracker.getTrackerState();
          sendResponse({ success: true, data: state });
          break;
        }

        case 'TOGGLE_TRACKING': {
          await tracker.setTrackingEnabled(message.payload.enabled);
          const state = await tracker.getTrackerState();
          sendResponse({ success: true, data: state });
          break;
        }

        case 'GRANT_GRACE_PERIOD': {
          const { domain, minutes = 5 } = message.payload;
          const updated = await storage.setGracePeriod(domain, minutes);
          sendResponse({ success: true, data: updated });
          break;
        }

        case 'EXTEND_LIMIT': {
          const { domain, additionalMinutes } = message.payload;
          const limits = await storage.getTimeLimits();
          const target = limits.find(l => l.domain === domain);
          if (target) {
            target.limitMinutes += additionalMinutes;
            await storage.saveTimeLimit(target);
          }
          sendResponse({ success: true, data: limits });
          break;
        }

        case 'FLUSH_TIME': {
          await tracker.flush();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
          break;
      }
    } catch (err: unknown) {
      console.error('Service worker message handling error:', err);
      sendResponse({ success: false, error: (err as Error).message });
    }
  })();

  return true; // Keep channel open for async response
});

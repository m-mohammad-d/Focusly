import { storage } from '../storage/chromeStorage';
import { getLocalDateString, formatDuration } from '../utils/time';
import { getDomainInfo } from '../utils/domain';

export async function checkAndSendThresholdNotification(
  domain: string,
  currentSeconds: number,
  limitMinutes: number,
  warningPercent = 80
): Promise<void> {
  const settings = await storage.getSettings();
  if (!settings.notificationsEnabled) return;

  const today = getLocalDateString();
  const alertKey = `${today}:${domain}`;
  const alertStates = await storage.getAlertStates();
  const state = alertStates[alertKey] || { warned80: false, warned100: false };

  const limitSeconds = limitMinutes * 60;
  const warningSeconds = Math.floor(limitSeconds * (warningPercent / 100));

  const domainInfo = getDomainInfo(domain);
  const siteName = domainInfo.name || domain;

  // Check 100% threshold
  if (currentSeconds >= limitSeconds && !state.warned100) {
    state.warned100 = true;
    state.warned80 = true; // also mark 80 as satisfied
    await storage.setAlertState(alertKey, state);

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create(`limit_100_${domain}_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Focus Tracker: Limit Reached',
        message: `You have reached your daily limit of ${formatDuration(limitSeconds)} on ${siteName}. Time to take a break!`,
        priority: 2,
      });
    }
    return;
  }

  // Check warning threshold (e.g. 80%)
  if (currentSeconds >= warningSeconds && currentSeconds < limitSeconds && !state.warned80) {
    state.warned80 = true;
    await storage.setAlertState(alertKey, state);

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create(`limit_80_${domain}_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `Focus Tracker: ${warningPercent}% Limit Warning`,
        message: `You've used ${formatDuration(currentSeconds)} out of ${formatDuration(limitSeconds)} allowed on ${siteName}.`,
        priority: 1,
      });
    }
  }
}

export async function checkGlobalLimitNotification(
  totalSeconds: number,
  globalLimitMinutes: number | null
): Promise<void> {
  if (!globalLimitMinutes || globalLimitMinutes <= 0) return;

  const settings = await storage.getSettings();
  if (!settings.notificationsEnabled) return;

  const today = getLocalDateString();
  const alertKey = `${today}:__global__`;
  const alertStates = await storage.getAlertStates();
  const state = alertStates[alertKey] || { warned80: false, warned100: false };

  const limitSeconds = globalLimitMinutes * 60;
  const warningSeconds = Math.floor(limitSeconds * 0.8);

  if (totalSeconds >= limitSeconds && !state.warned100) {
    state.warned100 = true;
    state.warned80 = true;
    await storage.setAlertState(alertKey, state);

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create(`global_100_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily Browsing Limit Reached',
        message: `You have reached your total daily browsing limit of ${formatDuration(limitSeconds)}. Consider closing your browser.`,
        priority: 2,
      });
    }
    return;
  }

  if (totalSeconds >= warningSeconds && totalSeconds < limitSeconds && !state.warned80) {
    state.warned80 = true;
    await storage.setAlertState(alertKey, state);

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create(`global_80_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '80% Total Browsing Limit Warning',
        message: `You've used 80% (${formatDuration(totalSeconds)}) of your total daily browsing limit.`,
        priority: 1,
      });
    }
  }
}

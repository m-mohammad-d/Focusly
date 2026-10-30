import { storage } from '../storage/chromeStorage';
import { getLocalDateString, formatDuration } from '../utils/time';

export interface BlockCheckResult {
  blocked: boolean;
  reason?: string;
  limitMinutes?: number;
  usedSeconds?: number;
}

/**
 * Evaluates whether a domain should currently be blocked.
 */
export async function evaluateDomainBlock(domain: string): Promise<BlockCheckResult> {
  const settings = await storage.getSettings();

  // 1. Check if user is in an active grace period for this domain
  const gracePeriods = await storage.getGracePeriods();
  const graceExpires = gracePeriods[domain];
  if (graceExpires && graceExpires > Date.now()) {
    return { blocked: false };
  }

  const today = getLocalDateString();
  const dailyRecord = await storage.getDailyRecord(today);
  const currentDomainUsage = dailyRecord.domains[domain]?.seconds || 0;
  const totalDailySeconds = dailyRecord.totalSeconds || 0;

  // 2. Check individual website time limits
  const limits = await storage.getTimeLimits();
  const activeLimit = limits.find(l => l.domain === domain && l.enabled);

  if (activeLimit && activeLimit.blockOnLimit) {
    const limitSeconds = activeLimit.limitMinutes * 60;
    if (currentDomainUsage >= limitSeconds) {
      return {
        blocked: true,
        reason: `Daily time limit of ${formatDuration(limitSeconds)} reached`,
        limitMinutes: activeLimit.limitMinutes,
        usedSeconds: currentDomainUsage,
      };
    }
  }

  // 3. Check explicit Blocklist
  const blocklist = await storage.getBlocklist();
  const isBlocklisted = blocklist.some(b => b.domain === domain && b.enabled);
  if (isBlocklisted) {
    return {
      blocked: true,
      reason: 'This website is on your Focus Blocklist',
    };
  }

  // 4. Check global browsing limit
  if (
    settings.globalDailyLimitMinutes &&
    settings.globalDailyLimitMinutes > 0 &&
    settings.globalBlockOnLimit
  ) {
    const globalLimitSec = settings.globalDailyLimitMinutes * 60;
    if (totalDailySeconds >= globalLimitSec) {
      return {
        blocked: true,
        reason: `Total daily browsing limit of ${formatDuration(globalLimitSec)} reached`,
        limitMinutes: settings.globalDailyLimitMinutes,
        usedSeconds: totalDailySeconds,
      };
    }
  }

  return { blocked: false };
}

/**
 * Inspects a tab and redirects to the blocking page if restricted.
 */
export async function enforceTabBlock(tabId: number, domain: string): Promise<boolean> {
  const result = await evaluateDomainBlock(domain);

  if (result.blocked) {
    const blockedUrl = chrome.runtime.getURL(
      `blocked.html?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(result.reason || 'Restricted')}`
    );

    try {
      const tab = await chrome.tabs.get(tabId);
      // Avoid redirecting if tab is already on blocked page or closed
      if (tab && tab.url && !tab.url.startsWith(chrome.runtime.getURL('blocked.html'))) {
        await chrome.tabs.update(tabId, { url: blockedUrl });
        return true;
      }
    } catch (e) {
      console.warn('Could not redirect tab for blocking:', e);
    }
  }

  return false;
}

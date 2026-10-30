import { DailyRecord, DomainUsage } from '../types/tracking';
import { getDateOffsetString, getLocalDateString } from './time';

export interface DomainStatItem extends DomainUsage {
  percentageOfTotal: number;
}

export interface DayComparison {
  todaySeconds: number;
  yesterdaySeconds: number;
  diffSeconds: number;
  percentChange: number; // e.g. +15 or -20
  isIncrease: boolean;
}

export interface WeeklySummary {
  totalSeconds: number;
  dailyAverageSeconds: number;
  activeDaysCount: number;
  topDomain: { domain: string; seconds: number } | null;
  dayRecords: Array<{ date: string; seconds: number; isToday: boolean }>;
}

/**
 * Calculates sorted list of domains with percentages for a given daily record.
 */
export function getSortedDomainStats(record: DailyRecord | null | undefined): DomainStatItem[] {
  if (!record || !record.domains) return [];

  const total = record.totalSeconds > 0 ? record.totalSeconds : 1;
  const list = Object.values(record.domains);

  list.sort((a, b) => b.seconds - a.seconds);

  return list.map(item => ({
    ...item,
    percentageOfTotal: Math.round((item.seconds / total) * 100),
  }));
}

/**
 * Calculates day-over-day comparison (Today vs Yesterday).
 */
export function calculateDayComparison(
  records: Record<string, DailyRecord>,
  todayDate = getLocalDateString()
): DayComparison {
  const yesterdayDate = getDateOffsetString(-1);

  const todaySec = records[todayDate]?.totalSeconds || 0;
  const yesterdaySec = records[yesterdayDate]?.totalSeconds || 0;
  const diffSec = todaySec - yesterdaySec;

  let percentChange = 0;
  if (yesterdaySec > 0) {
    percentChange = Math.round(((todaySec - yesterdaySec) / yesterdaySec) * 100);
  } else if (todaySec > 0) {
    percentChange = 100;
  }

  return {
    todaySeconds: todaySec,
    yesterdaySeconds: yesterdaySec,
    diffSeconds: diffSec,
    percentChange: Math.abs(percentChange),
    isIncrease: diffSec > 0,
  };
}

/**
 * Aggregates statistics for the past 7 days.
 */
export function calculateWeeklySummary(
  records: Record<string, DailyRecord>,
  pastNDays = 7
): WeeklySummary {
  const todayDate = getLocalDateString();
  const dayRecords: Array<{ date: string; seconds: number; isToday: boolean }> = [];
  const domainTotals: Record<string, number> = {};

  let totalSeconds = 0;
  let activeDaysCount = 0;

  for (let i = pastNDays - 1; i >= 0; i--) {
    const dateStr = getDateOffsetString(-i);
    const day = records[dateStr];
    const sec = day?.totalSeconds || 0;

    totalSeconds += sec;
    if (sec > 0) activeDaysCount++;

    if (day && day.domains) {
      for (const [dom, item] of Object.entries(day.domains)) {
        domainTotals[dom] = (domainTotals[dom] || 0) + item.seconds;
      }
    }

    dayRecords.push({
      date: dateStr,
      seconds: sec,
      isToday: dateStr === todayDate,
    });
  }

  let topDomain: { domain: string; seconds: number } | null = null;
  let maxSec = 0;
  for (const [dom, sec] of Object.entries(domainTotals)) {
    if (sec > maxSec) {
      maxSec = sec;
      topDomain = { domain: dom, seconds: sec };
    }
  }

  const dailyAverageSeconds = activeDaysCount > 0 ? Math.round(totalSeconds / activeDaysCount) : 0;

  return {
    totalSeconds,
    dailyAverageSeconds,
    activeDaysCount,
    topDomain,
    dayRecords,
  };
}

/**
 * Aggregates all records over a given custom date range into a single combined domain list.
 */
export function aggregateRecordsByRange(
  records: Record<string, DailyRecord>,
  dateKeys: string[]
): { totalSeconds: number; domains: DomainStatItem[] } {
  let totalSeconds = 0;
  const mergedDomains: Record<string, DomainUsage> = {};

  for (const dateKey of dateKeys) {
    const day = records[dateKey];
    if (!day) continue;

    totalSeconds += day.totalSeconds || 0;
    for (const [dom, item] of Object.entries(day.domains || {})) {
      if (!mergedDomains[dom]) {
        mergedDomains[dom] = {
          domain: dom,
          seconds: item.seconds,
          visits: item.visits,
          lastActive: item.lastActive,
          faviconUrl: item.faviconUrl,
        };
      } else {
        mergedDomains[dom].seconds += item.seconds;
        mergedDomains[dom].visits += item.visits;
        mergedDomains[dom].lastActive = Math.max(mergedDomains[dom].lastActive, item.lastActive);
        if (!mergedDomains[dom].faviconUrl && item.faviconUrl) {
          mergedDomains[dom].faviconUrl = item.faviconUrl;
        }
      }
    }
  }

  const denominator = totalSeconds > 0 ? totalSeconds : 1;
  const domainList = Object.values(mergedDomains)
    .sort((a, b) => b.seconds - a.seconds)
    .map(item => ({
      ...item,
      percentageOfTotal: Math.round((item.seconds / denominator) * 100),
    }));

  return {
    totalSeconds,
    domains: domainList,
  };
}

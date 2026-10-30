import React from 'react';
import {
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Shield,
  Hourglass,
} from 'lucide-react';
import { DailyRecord } from '../../types/tracking';
import { UserSettings, TimeLimit } from '../../types/settings';
import { formatDuration, getLocalDateString } from '../../utils/time';
import { calculateDayComparison, calculateWeeklySummary, getSortedDomainStats } from '../../utils/stats';
import { getDomainInfo, getFaviconUrl } from '../../utils/domain';
import { BarChart } from '../../components/BarChart';
import { DonutChart } from '../../components/DonutChart';
import { Button } from '../../components/Button';

interface OverviewViewProps {
  records: Record<string, DailyRecord>;
  settings: UserSettings;
  limits: TimeLimit[];
  onNavigateTab: (tabId: string, prefillDomain?: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  records,
  limits,
  onNavigateTab,
}) => {
  const today = getLocalDateString();
  const todayRecord = records[today] || { date: today, totalSeconds: 0, domains: {} };
  const domainStats = getSortedDomainStats(todayRecord);

  const dayComparison = calculateDayComparison(records);
  const weeklySummary = calculateWeeklySummary(records, 7);

  const topSiteToday = domainStats[0] || null;
  const topSiteInfo = topSiteToday ? getDomainInfo(topSiteToday.domain) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Time */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg relative overflow-hidden group hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium">Total Browsing Today</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {formatDuration(todayRecord.totalSeconds)}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {dayComparison.yesterdaySeconds === 0 ? (
              <span className="text-xs text-gray-500">First recorded day</span>
            ) : dayComparison.isIncrease ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                <TrendingUp size={13} />
                +{dayComparison.percentChange}% vs yesterday
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown size={13} />
                -{dayComparison.percentChange}% vs yesterday
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Yesterday's Time */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg group hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium">Yesterday's Total</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {formatDuration(dayComparison.yesterdaySeconds)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Previous day benchmark</p>
        </div>

        {/* Card 3: Top Website Today */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg group hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium">Most Visited Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-white mt-2 truncate flex items-center gap-2">
            {topSiteToday ? (
              <>
                <img
                  src={topSiteToday.faviconUrl || getFaviconUrl(topSiteToday.domain)}
                  alt=""
                  className="w-5 h-5 rounded object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="truncate">{topSiteInfo?.name || topSiteToday.domain}</span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">None</span>
            )}
          </div>
          <p className="text-xs text-indigo-400 font-semibold mt-2 font-mono">
            {topSiteToday ? formatDuration(topSiteToday.seconds) : 'No browsing yet'}
          </p>
        </div>

        {/* Card 4: 7-Day Daily Average */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg group hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium">7-Day Daily Average</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Hourglass size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {formatDuration(weeklySummary.dailyAverageSeconds)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {weeklySummary.activeDaysCount} active days recorded
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 7-Day Trend */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100">7-Day Usage Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily browsing time over the past week</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
              Total: {formatDuration(weeklySummary.totalSeconds)}
            </span>
          </div>
          <BarChart data={weeklySummary.dayRecords} height={190} />
        </div>

        {/* Chart 2: Today's Distribution */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Today's Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5">Top websites by percentage of total time</p>
            </div>
            <span className="text-xs text-gray-400">
              {domainStats.length} {domainStats.length === 1 ? 'site' : 'sites'}
            </span>
          </div>
          <DonutChart domains={domainStats} totalSeconds={todayRecord.totalSeconds} size={170} />
        </div>
      </div>

      {/* Today's Websites Table */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-100">Today's Activity Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Time spent on individual websites today
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowUpRight size={14} />}
            iconPosition="right"
            onClick={() => onNavigateTab('stats')}
          >
            All Statistics
          </Button>
        </div>

        {domainStats.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No activity tracked yet today. Open some websites to start tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800/80 text-gray-400 font-semibold">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Website</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3">Visits</th>
                  <th className="pb-3 w-1/3">Share of Day</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {domainStats.map((site, index) => {
                  const info = getDomainInfo(site.domain);
                  const limit = limits.find((l) => l.domain === site.domain && l.enabled);
                  const limitExceeded = limit && site.seconds >= limit.limitMinutes * 60;

                  return (
                    <tr
                      key={site.domain}
                      className="hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="py-3 pl-2 font-mono text-gray-500">{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={site.faviconUrl || getFaviconUrl(site.domain)}
                            alt=""
                            className="w-5 h-5 rounded object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                              {info.name}
                              {limitExceeded && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Limit Exceeded
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[11px]">{site.domain}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-gray-200">
                        {formatDuration(site.seconds)}
                      </td>
                      <td className="py-3 font-mono text-gray-400">{site.visits}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              style={{
                                width: `${site.percentageOfTotal}%`,
                                backgroundColor: info.color,
                              }}
                              className="h-full rounded-full transition-all duration-300"
                            />
                          </div>
                          <span className="text-gray-400 font-mono w-8 text-right">
                            {site.percentageOfTotal}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onNavigateTab('limits', site.domain)}
                          >
                            Set Limit
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Shield size={13} />}
                            onClick={() => onNavigateTab('blocklist', site.domain)}
                          >
                            Block
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

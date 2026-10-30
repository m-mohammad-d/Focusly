import React, { useState, useMemo } from 'react';
import {
  Search,
  Clock,
  Layers,
  ArrowUpDown,
  Shield,
  Sliders,
  Calendar,
} from 'lucide-react';
import { DailyRecord } from '../../types/tracking';
import { TimeLimit } from '../../types/settings';
import {
  formatDuration,
  getLocalDateString,
  getDateOffsetString,
  getLastNDays,
} from '../../utils/time';
import { aggregateRecordsByRange, getSortedDomainStats } from '../../utils/stats';
import { getDomainInfo, getFaviconUrl } from '../../utils/domain';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

interface StatsViewProps {
  records: Record<string, DailyRecord>;
  limits: TimeLimit[];
  onNavigateTab: (tabId: string, prefillDomain?: string) => void;
}

type PeriodOption = 'today' | 'yesterday' | 'week' | 'month';
type SortOption = 'time' | 'visits' | 'name';

export const StatsView: React.FC<StatsViewProps> = ({
  records,
  limits,
  onNavigateTab,
}) => {
  const [period, setPeriod] = useState<PeriodOption>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time');

  // Compute records for selected period
  const { totalSeconds, domains } = useMemo(() => {
    if (period === 'today') {
      const today = getLocalDateString();
      const rec = records[today];
      return {
        totalSeconds: rec?.totalSeconds || 0,
        domains: getSortedDomainStats(rec),
      };
    }

    if (period === 'yesterday') {
      const yesterday = getDateOffsetString(-1);
      const rec = records[yesterday];
      return {
        totalSeconds: rec?.totalSeconds || 0,
        domains: getSortedDomainStats(rec),
      };
    }

    if (period === 'week') {
      const dates = getLastNDays(7);
      return aggregateRecordsByRange(records, dates);
    }

    // month: 30 days
    const dates = getLastNDays(30);
    return aggregateRecordsByRange(records, dates);
  }, [records, period]);

  // Filter & Sort
  const filteredDomains = useMemo(() => {
    let list = domains.filter((d) => {
      const info = getDomainInfo(d.domain);
      const q = searchQuery.toLowerCase().trim();
      return (
        d.domain.toLowerCase().includes(q) ||
        info.name.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'time') {
      list.sort((a, b) => b.seconds - a.seconds);
    } else if (sortBy === 'visits') {
      list.sort((a, b) => b.visits - a.visits);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.domain.localeCompare(b.domain));
    }

    return list;
  }, [domains, searchQuery, sortBy]);

  const totalVisits = useMemo(() => {
    return filteredDomains.reduce((acc, d) => acc + d.visits, 0);
  }, [filteredDomains]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800/80">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Website Statistics</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Detailed breakdown and history of tracked websites
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-gray-900 border border-gray-800/90 text-xs font-semibold">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats for Period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Total Browsing Time</span>
            <div className="text-xl font-black text-white font-mono mt-1">
              {formatDuration(totalSeconds)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Unique Websites</span>
            <div className="text-xl font-black text-white font-mono mt-1">
              {filteredDomains.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Total Visits / Sessions</span>
            <div className="text-xl font-black text-white font-mono mt-1">
              {totalVisits}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by website or domain (e.g. youtube, x.com)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="time">Time Spent</option>
            <option value="visits">Number of Visits</option>
            <option value="name">Domain Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      {filteredDomains.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/30">
          No websites matched your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDomains.map((site) => {
            const info = getDomainInfo(site.domain);
            const limit = limits.find((l) => l.domain === site.domain && l.enabled);
            const limitExceeded = limit && site.seconds >= limit.limitMinutes * 60;

            return (
              <div
                key={site.domain}
                className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 hover:border-gray-700/80 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={site.faviconUrl || getFaviconUrl(site.domain)}
                      alt=""
                      className="w-7 h-7 rounded-lg object-contain shrink-0 bg-gray-800/60 p-0.5"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-100 truncate flex items-center gap-2">
                        {info.name}
                        {limitExceeded && (
                          <Badge variant="rose" className="text-[9px]">
                            Limit Reached
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono truncate block">
                        {site.domain}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-100 font-mono">
                      {formatDuration(site.seconds)}
                    </div>
                    <span className="text-xs text-gray-400">
                      {site.percentageOfTotal}% of total
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    style={{
                      width: `${site.percentageOfTotal}%`,
                      backgroundColor: info.color,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>

                {/* Footer details & Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-800/40 text-xs">
                  <span className="text-gray-500 font-medium">
                    {site.visits} {site.visits === 1 ? 'visit' : 'visits'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={<Sliders size={12} />}
                      onClick={() => onNavigateTab('limits', site.domain)}
                    >
                      Limit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Shield size={12} />}
                      onClick={() => onNavigateTab('blocklist', site.domain)}
                    >
                      Block
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

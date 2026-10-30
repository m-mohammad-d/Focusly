import React, { useEffect, useState } from 'react';
import {
  Clock,
  ExternalLink,
  Pause,
  Play,
  TrendingDown,
  TrendingUp,
  Shield,
  Layers,
  Flame,
} from 'lucide-react';
import { storage } from '../storage/chromeStorage';
import { DailyRecord, TrackerState } from '../types/tracking';
import { UserSettings, TimeLimit } from '../types/settings';
import { formatDuration, getLocalDateString } from '../utils/time';
import { getDomainInfo, getFaviconUrl } from '../utils/domain';
import { calculateDayComparison, getSortedDomainStats } from '../utils/stats';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ProgressRing } from '../components/ProgressRing';

export const PopupApp: React.FC = () => {
  const [trackerState, setTrackerState] = useState<TrackerState | null>(null);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [allRecords, setAllRecords] = useState<Record<string, DailyRecord>>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [limits, setLimits] = useState<TimeLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      // Send message to background to flush and get tracker state
      chrome.runtime.sendMessage({ type: 'GET_TRACKER_STATE' }, (res) => {
        if (res && res.success) {
          setTrackerState(res.data);
        }
      });

      const today = getLocalDateString();
      const [todayData, allData, userSettings, timeLimits] = await Promise.all([
        storage.getDailyRecord(today),
        storage.getAllDailyRecords(),
        storage.getSettings(),
        storage.getTimeLimits(),
      ]);

      setTodayRecord(todayData);
      setAllRecords(allData);
      setSettings(userSettings);
      setLimits(timeLimits);
    } catch (e) {
      console.warn('Error loading popup data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Live refresh every 1 second while popup is actively open
    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'GET_TRACKER_STATE' }, (res) => {
        if (res && res.success) {
          setTrackerState(res.data);
        }
      });
      storage.getDailyRecord().then(setTodayRecord);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTracking = () => {
    if (!settings) return;
    const nextState = !settings.trackingEnabled;
    chrome.runtime.sendMessage(
      { type: 'TOGGLE_TRACKING', payload: { enabled: nextState } },
      (res) => {
        if (res && res.success) {
          setTrackerState(res.data);
          setSettings((prev) => (prev ? { ...prev, trackingEnabled: nextState } : null));
        }
      }
    );
  };

  const openDashboard = (view?: string) => {
    const url = chrome.runtime.getURL(`dashboard.html${view ? `?view=${view}` : ''}`);
    chrome.tabs.create({ url });
    window.close();
  };

  const topSites = getSortedDomainStats(todayRecord).slice(0, 3);
  const dayComparison = calculateDayComparison(allRecords);

  const globalLimitMinutes = settings?.globalDailyLimitMinutes || null;
  const todayTotalSeconds = todayRecord?.totalSeconds || 0;
  const globalProgress = globalLimitMinutes
    ? Math.round((todayTotalSeconds / (globalLimitMinutes * 60)) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="w-[380px] h-[520px] flex items-center justify-center bg-[#0a0e17]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[380px] min-h-[520px] bg-[#0a0e17] text-gray-100 flex flex-col justify-between p-4">
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Focus Tracker
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">Local & Private</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTracking}
              title={settings?.trackingEnabled ? 'Pause Tracking' : 'Resume Tracking'}
              className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50 cursor-pointer transition-colors"
            >
              {settings?.trackingEnabled ? <Pause size={14} /> : <Play size={14} className="text-emerald-400" />}
            </button>
            <button
              onClick={() => openDashboard()}
              title="Open Full Dashboard"
              className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 cursor-pointer transition-colors"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800/90 text-xs">
          <div className="flex items-center gap-2 truncate">
            {trackerState?.status === 'active' && (
              <Badge variant="emerald" dot pulse>
                Active
              </Badge>
            )}
            {trackerState?.status === 'idle' && (
              <Badge variant="amber" dot>
                Idle
              </Badge>
            )}
            {trackerState?.status === 'paused' && (
              <Badge variant="rose" dot>
                Paused
              </Badge>
            )}
            {trackerState?.status === 'inactive' && (
              <Badge variant="gray" dot>
                Inactive
              </Badge>
            )}

            <span className="text-gray-300 font-medium truncate">
              {trackerState?.currentDomain || 'No active website'}
            </span>
          </div>

          {trackerState?.currentDomain && trackerState.todayDomainSeconds > 0 && (
            <span className="text-indigo-400 font-mono text-[11px] font-semibold shrink-0">
              {formatDuration(trackerState.todayDomainSeconds)}
            </span>
          )}
        </div>

        {/* Hero Card: Today's Time & Comparison */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-900/40 border border-gray-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-400">Total Browsing Today</span>
              <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
                {formatDuration(todayTotalSeconds)}
              </div>

              {/* Comparison vs Yesterday */}
              <div className="flex items-center gap-1.5 mt-2">
                {dayComparison.yesterdaySeconds === 0 ? (
                  <span className="text-[11px] text-gray-500">First recorded day</span>
                ) : dayComparison.isIncrease ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                    <TrendingUp size={12} />
                    +{dayComparison.percentChange}% vs yesterday
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <TrendingDown size={12} />
                    -{dayComparison.percentChange}% vs yesterday
                  </span>
                )}
              </div>
            </div>

            {/* Circular Progress if Global Limit is configured */}
            {globalLimitMinutes ? (
              <div className="shrink-0">
                <ProgressRing
                  progress={globalProgress}
                  size={68}
                  strokeWidth={6}
                  centerText={`${globalProgress}%`}
                  subText="of limit"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Flame size={22} />
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Websites Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-gray-400 font-semibold flex items-center gap-1">
              <Layers size={13} className="text-indigo-400" /> Top Websites Today
            </span>
            <button
              onClick={() => openDashboard('stats')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              View all
            </button>
          </div>

          {topSites.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
              No websites visited yet today.
            </div>
          ) : (
            <div className="space-y-1.5">
              {topSites.map((site, index) => {
                const info = getDomainInfo(site.domain);
                const limit = limits.find((l) => l.domain === site.domain && l.enabled);
                const limitExceeded = limit && site.seconds >= limit.limitMinutes * 60;

                return (
                  <div
                    key={site.domain}
                    className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-gray-700/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono text-gray-500 w-3 text-right">
                        {index + 1}
                      </span>
                      <img
                        src={site.faviconUrl || getFaviconUrl(site.domain)}
                        alt=""
                        className="w-5 h-5 rounded shrink-0 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-200 truncate flex items-center gap-1.5">
                          {info.name}
                          {limitExceeded && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Limit
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {site.domain}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-gray-200 font-mono">
                        {formatDuration(site.seconds)}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {site.percentageOfTotal}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="pt-3 mt-2 border-t border-gray-800/80 flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          icon={<Shield size={14} />}
          onClick={() => openDashboard()}
        >
          Open Dashboard
        </Button>
      </div>
    </div>
  );
};

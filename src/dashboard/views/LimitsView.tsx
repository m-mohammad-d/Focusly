import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ShieldAlert,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { TimeLimit, UserSettings } from '../../types/settings';
import { DailyRecord } from '../../types/tracking';
import { storage } from '../../storage/chromeStorage';
import { formatDuration, getLocalDateString } from '../../utils/time';
import { getDomainInfo, getFaviconUrl } from '../../utils/domain';
import { SITE_PRESETS } from '../../utils/presets';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

interface LimitsViewProps {
  limits: TimeLimit[];
  settings: UserSettings;
  records: Record<string, DailyRecord>;
  onLimitsUpdated: (limits: TimeLimit[]) => void;
  onSettingsUpdated: (settings: UserSettings) => void;
  initialDomain?: string;
}

export const LimitsView: React.FC<LimitsViewProps> = ({
  limits,
  settings,
  records,
  onLimitsUpdated,
  onSettingsUpdated,
  initialDomain,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(Boolean(initialDomain));
  const [domainInput, setDomainInput] = useState(initialDomain || '');
  const [limitMinutesInput, setLimitMinutesInput] = useState<number>(30);
  const [warningThresholdInput, setWarningThresholdInput] = useState<number>(80);
  const [blockOnLimitInput, setBlockOnLimitInput] = useState<boolean>(true);

  // Global Limit local state
  const [globalLimitMinutes, setGlobalLimitMinutes] = useState<number>(
    settings.globalDailyLimitMinutes || 180
  );
  const [globalLimitEnabled, setGlobalLimitEnabled] = useState<boolean>(
    Boolean(settings.globalDailyLimitMinutes && settings.globalDailyLimitMinutes > 0)
  );
  const [globalBlockOnLimit, setGlobalBlockOnLimit] = useState<boolean>(
    settings.globalBlockOnLimit
  );

  const today = getLocalDateString();
  const todayRecord = records[today] || { date: today, totalSeconds: 0, domains: {} };

  const handleSaveGlobalLimit = async () => {
    const updated = await storage.saveSettings({
      globalDailyLimitMinutes: globalLimitEnabled ? globalLimitMinutes : null,
      globalBlockOnLimit: globalBlockOnLimit,
    });
    onSettingsUpdated(updated);
  };

  const handleCreateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanDomain = domainInput.trim().toLowerCase();
    if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
      try {
        cleanDomain = new URL(cleanDomain).hostname;
      } catch {
        // ignore
      }
    }
    if (cleanDomain.startsWith('www.')) {
      cleanDomain = cleanDomain.substring(4);
    }

    if (!cleanDomain) return;

    const newLimit: TimeLimit = {
      id: `limit_${cleanDomain}_${Date.now()}`,
      domain: cleanDomain,
      limitMinutes: Math.max(1, limitMinutesInput),
      enabled: true,
      blockOnLimit: blockOnLimitInput,
      warningThresholdPercent: warningThresholdInput,
    };

    const updated = await storage.saveTimeLimit(newLimit);
    onLimitsUpdated(updated);

    setIsAddModalOpen(false);
    setDomainInput('');
  };

  const handleToggleLimit = async (limit: TimeLimit) => {
    const updated = await storage.saveTimeLimit({
      ...limit,
      enabled: !limit.enabled,
    });
    onLimitsUpdated(updated);
  };

  const handleDeleteLimit = async (id: string) => {
    const updated = await storage.deleteTimeLimit(id);
    onLimitsUpdated(updated);
  };

  const handleExtendLimit = async (domain: string, minutes: number) => {
    chrome.runtime.sendMessage(
      { type: 'EXTEND_LIMIT', payload: { domain, additionalMinutes: minutes } },
      (res) => {
        if (res && res.success) {
          onLimitsUpdated(res.data);
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800/80">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Time Limits</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Set daily allowances and warning thresholds for websites
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => {
            setDomainInput('');
            setIsAddModalOpen(true);
          }}
        >
          Add Time Limit
        </Button>
      </div>

      {/* Global Limit Configuration Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80 border border-gray-800/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                Overall Daily Browsing Limit
                {globalLimitEnabled && (
                  <Badge variant="emerald" dot>
                    Active
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Cap your total combined browsing time across all websites per day
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={globalLimitEnabled}
              onChange={(e) => setGlobalLimitEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {globalLimitEnabled && (
          <div className="pt-4 border-t border-gray-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Total Allowed Time (minutes)
              </label>
              <input
                type="number"
                min="10"
                step="15"
                value={globalLimitMinutes}
                onChange={(e) => setGlobalLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                = {formatDuration(globalLimitMinutes * 60)} per day
              </span>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={globalBlockOnLimit}
                  onChange={(e) => setGlobalBlockOnLimit(e.target.checked)}
                  className="rounded border-gray-700 text-indigo-600 focus:ring-0"
                />
                Block browsing when limit is reached
              </label>
              <span className="text-[11px] text-gray-500 block">
                Redirects to focus screen when limit is hit
              </span>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleSaveGlobalLimit}>
                Save Global Limit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Website Limits Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-300">Individual Website Limits</h3>

        {limits.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/30">
            No website limits configured yet. Click "Add Time Limit" above to set your first limit!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {limits.map((limit) => {
              const info = getDomainInfo(limit.domain);
              const usedSeconds = todayRecord.domains[limit.domain]?.seconds || 0;
              const limitSeconds = limit.limitMinutes * 60;
              const progressPercent = Math.min(
                100,
                Math.round((usedSeconds / limitSeconds) * 100)
              );
              const warningSeconds = limitSeconds * ((limit.warningThresholdPercent || 80) / 100);

              const isReached = usedSeconds >= limitSeconds;
              const isWarning = usedSeconds >= warningSeconds && !isReached;

              return (
                <div
                  key={limit.id}
                  className={`p-5 rounded-2xl bg-gray-900/60 border transition-all space-y-4 ${
                    !limit.enabled
                      ? 'border-gray-800/40 opacity-60'
                      : isReached
                      ? 'border-rose-500/40 shadow-lg shadow-rose-500/5'
                      : isWarning
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'border-gray-800/80 hover:border-gray-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getFaviconUrl(limit.domain)}
                        alt=""
                        className="w-7 h-7 rounded-lg object-contain shrink-0 bg-gray-800/60 p-0.5"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-100 flex items-center gap-2 truncate">
                          {info.name}
                          {isReached && (
                            <Badge variant="rose" dot pulse>
                              Limit Reached
                            </Badge>
                          )}
                          {isWarning && (
                            <Badge variant="amber" dot>
                              {limit.warningThresholdPercent}% Warning
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono truncate block">
                          {limit.domain}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleLimit(limit)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-colors ${
                          limit.enabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}
                      >
                        {limit.enabled ? 'Enabled' : 'Paused'}
                      </button>

                      <button
                        onClick={() => handleDeleteLimit(limit.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Limit"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Numbers */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">
                        Today: <strong className="text-gray-200">{formatDuration(usedSeconds)}</strong>
                      </span>
                      <span className="text-gray-400">
                        Limit: <strong className="text-gray-200">{formatDuration(limitSeconds)}</strong>
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        style={{ width: `${progressPercent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isReached
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Actions & Auto-block Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      {limit.blockOnLimit ? (
                        <ShieldAlert size={13} className="text-rose-400" />
                      ) : (
                        <CheckCircle size={13} className="text-emerald-400" />
                      )}
                      {limit.blockOnLimit ? 'Blocks on limit' : 'Warns on limit'}
                    </span>

                    {/* Temporary limit extensions */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-gray-500 mr-1">Extend:</span>
                      <button
                        onClick={() => handleExtendLimit(limit.domain, 5)}
                        className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => handleExtendLimit(limit.domain, 15)}
                        className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        +15m
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Limit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Set Website Time Limit"
        description="Choose a website and how much active time you want to allow per day."
      >
        <form onSubmit={handleCreateLimit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Website Domain
            </label>
            <input
              type="text"
              required
              placeholder="e.g. youtube.com, reddit.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />

            {/* Quick Presets Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-gray-500 py-0.5">Presets:</span>
              {SITE_PRESETS.slice(0, 5).map((preset) => (
                <button
                  type="button"
                  key={preset.domain}
                  onClick={() => {
                    setDomainInput(preset.domain);
                    setLimitMinutesInput(preset.suggestedLimitMinutes);
                  }}
                  className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-300 transition-colors cursor-pointer"
                >
                  {preset.name} ({preset.suggestedLimitMinutes}m)
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Daily Limit (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setLimitMinutesInput(mins)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    limitMinutesInput === mins
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={limitMinutesInput}
              onChange={(e) => setLimitMinutesInput(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Warning Threshold ({warningThresholdInput}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={warningThresholdInput}
              onChange={(e) => setWarningThresholdInput(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              You will receive a notification when you reach{' '}
              {Math.round((limitMinutesInput * warningThresholdInput) / 100)} minutes.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200 block">
                Block Access on Limit
              </span>
              <span className="text-[11px] text-gray-400">
                Redirect to calm focus page when limit is reached
              </span>
            </div>
            <input
              type="checkbox"
              checked={blockOnLimitInput}
              onChange={(e) => setBlockOnLimitInput(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

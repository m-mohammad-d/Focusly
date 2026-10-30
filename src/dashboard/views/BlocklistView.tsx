import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Coffee,
  Check,
  XCircle,
} from 'lucide-react';
import { BlockedItem, GracePeriodMap, UserSettings } from '../../types/settings';
import { storage } from '../../storage/chromeStorage';
import { SITE_PRESETS } from '../../utils/presets';
import { getDomainInfo, getFaviconUrl } from '../../utils/domain';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

interface BlocklistViewProps {
  blocklist: BlockedItem[];
  settings: UserSettings;
  onBlocklistUpdated: (list: BlockedItem[]) => void;
  onSettingsUpdated: (settings: UserSettings) => void;
  initialDomain?: string;
}

export const BlocklistView: React.FC<BlocklistViewProps> = ({
  blocklist,
  settings,
  onBlocklistUpdated,
  onSettingsUpdated,
  initialDomain,
}) => {
  const [domainInput, setDomainInput] = useState(initialDomain || '');
  const [gracePeriods, setGracePeriods] = useState<GracePeriodMap>({});
  const [selectedGraceMinutes, setSelectedGraceMinutes] = useState<number>(
    settings.defaultGracePeriodMinutes || 5
  );

  const loadGracePeriods = async () => {
    const map = await storage.getGracePeriods();
    setGracePeriods(map);
  };

  useEffect(() => {
    loadGracePeriods();
    const interval = setInterval(loadGracePeriods, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDomain = async (domainToAdd: string) => {
    let clean = domainToAdd.trim().toLowerCase();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        clean = new URL(clean).hostname;
      } catch {
        // ignore
      }
    }
    if (clean.startsWith('www.')) {
      clean = clean.substring(4);
    }
    if (!clean) return;

    const newItem: BlockedItem = {
      id: `block_${clean}_${Date.now()}`,
      domain: clean,
      enabled: true,
      addedAt: Date.now(),
    };

    const updated = await storage.saveBlocklistItem(newItem);
    onBlocklistUpdated(updated);
    setDomainInput('');
  };

  const handleToggleItem = async (item: BlockedItem) => {
    const updated = await storage.saveBlocklistItem({
      ...item,
      enabled: !item.enabled,
    });
    onBlocklistUpdated(updated);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = await storage.deleteBlocklistItem(id);
    onBlocklistUpdated(updated);
  };

  const handleUpdateGracePeriod = async (mins: number) => {
    setSelectedGraceMinutes(mins);
    const updated = await storage.saveSettings({ defaultGracePeriodMinutes: mins });
    onSettingsUpdated(updated);
  };

  const handleCancelGrace = async (domain: string) => {
    const updated = await storage.cancelGracePeriod(domain);
    setGracePeriods(updated);
  };

  const activeGraceEntries = Object.entries(gracePeriods).filter(
    ([, exp]) => exp > Date.now()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800/80">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Focus Blocklist</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Completely restrict distracting websites with emergency break support
          </p>
        </div>
      </div>

      {/* Grace Period Configuration Banner */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Coffee size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">Configurable Grace Period</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Duration allowed when clicking "Take a Break" on the restricted page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[1, 3, 5, 10, 15].map((mins) => (
            <button
              key={mins}
              onClick={() => handleUpdateGracePeriod(mins)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedGraceMinutes === mins
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {mins} min{mins > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Active Grace Periods (if any) */}
      {activeGraceEntries.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Coffee size={15} />
            <span>Active Temporary Grace Periods</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeGraceEntries.map(([dom, exp]) => {
              const remainingSec = Math.max(0, Math.round((exp - Date.now()) / 1000));
              const m = Math.floor(remainingSec / 60);
              const s = remainingSec % 60;

              return (
                <div
                  key={dom}
                  className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-xs font-semibold text-gray-200 block truncate">
                      {dom}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400">
                      {m}m {s}s remaining
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<XCircle size={13} />}
                    onClick={() => handleCancelGrace(dom)}
                  >
                    Re-block
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Distracting Presets */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          One-Click Presets for Common Distractions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {SITE_PRESETS.map((preset) => {
            const isAdded = blocklist.some((b) => b.domain === preset.domain);
            return (
              <button
                key={preset.domain}
                onClick={() => {
                  if (isAdded) {
                    const item = blocklist.find((b) => b.domain === preset.domain);
                    if (item) handleDeleteItem(item.id);
                  } else {
                    handleAddDomain(preset.domain);
                  }
                }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium transition-all cursor-pointer text-left ${
                  isAdded
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <img
                    src={getFaviconUrl(preset.domain)}
                    alt=""
                    className="w-4 h-4 rounded shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="truncate">{preset.name}</span>
                </div>
                {isAdded ? (
                  <Check size={14} className="text-rose-400 shrink-0" />
                ) : (
                  <Plus size={14} className="text-gray-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Domain Form */}
      <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Add Custom Website to Blocklist
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddDomain(domainInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            required
            placeholder="Enter domain name (e.g. twitter.com, tiktok.com)..."
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <Button variant="primary" size="md" icon={<Plus size={16} />} type="submit">
            Add to Blocklist
          </Button>
        </form>
      </div>

      {/* Blocklist Table / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-200">
            Blocked Websites ({blocklist.length})
          </h3>
          <span className="text-xs text-gray-500">
            {blocklist.filter((b) => b.enabled).length} active
          </span>
        </div>

        {blocklist.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/30">
            No websites in blocklist. Choose from presets above or add custom websites.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocklist.map((item) => {
              const info = getDomainInfo(item.domain);
              const hasGrace = (gracePeriods[item.domain] || 0) > Date.now();

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl bg-gray-900/60 border flex items-center justify-between gap-3 transition-all ${
                    !item.enabled
                      ? 'border-gray-800/40 opacity-50'
                      : 'border-gray-800/80 hover:border-gray-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getFaviconUrl(item.domain)}
                      alt=""
                      className="w-6 h-6 rounded object-contain shrink-0 bg-gray-800/60 p-0.5"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-100 flex items-center gap-2 truncate">
                        {info.name}
                        {hasGrace && (
                          <Badge variant="amber" className="text-[9px]">
                            Grace Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-mono truncate block">
                        {item.domain}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleItem(item)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-colors ${
                        item.enabled
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      {item.enabled ? 'Blocking' : 'Paused'}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove from Blocklist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Clock,
  LayoutDashboard,
  BarChart3,
  Sliders,
  Shield,
  Settings,
  Sparkles,
} from 'lucide-react';
import { DailyRecord } from '../types/tracking';
import { UserSettings, TimeLimit, BlockedItem } from '../types/settings';
import { storage } from '../storage/chromeStorage';
import { OverviewView } from './views/OverviewView';
import { StatsView } from './views/StatsView';
import { LimitsView } from './views/LimitsView';
import { BlocklistView } from './views/BlocklistView';
import { SettingsView } from './views/SettingsView';

export type DashboardTab = 'overview' | 'stats' | 'limits' | 'blocklist' | 'settings';

export const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [prefilledDomain, setPrefilledDomain] = useState<string | undefined>(undefined);

  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [limits, setLimits] = useState<TimeLimit[]>([]);
  const [blocklist, setBlocklist] = useState<BlockedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    try {
      // Ask background to flush latest time
      chrome.runtime.sendMessage({ type: 'FLUSH_TIME' });

      const [allRecords, userSettings, timeLimits, blocklistItems] = await Promise.all([
        storage.getAllDailyRecords(),
        storage.getSettings(),
        storage.getTimeLimits(),
        storage.getBlocklist(),
      ]);

      setRecords(allRecords);
      setSettings(userSettings);
      setLimits(timeLimits);
      setBlocklist(blocklistItems);
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check URL search params for initial tab
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as DashboardTab | null;
    if (viewParam && ['overview', 'stats', 'limits', 'blocklist', 'settings'].includes(viewParam)) {
      setActiveTab(viewParam);
    }

    loadAllData();

    // Refresh every 10 seconds while dashboard is open
    const interval = setInterval(() => {
      storage.getAllDailyRecords().then(setRecords);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigateTab = (tabId: string, prefillDomain?: string) => {
    setActiveTab(tabId as DashboardTab);
    setPrefilledDomain(prefillDomain);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'stats', label: 'Website Statistics', icon: <BarChart3 size={18} /> },
    { id: 'limits', label: 'Time Limits', icon: <Sliders size={18} /> },
    { id: 'blocklist', label: 'Blocklist', icon: <Shield size={18} /> },
    { id: 'settings', label: 'Settings & Privacy', icon: <Settings size={18} /> },
  ];

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Focus Tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 flex flex-col md:flex-row">
      {/* Left Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-950/80 border-b md:border-b-0 md:border-r border-gray-800/80 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Focus Tracker
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">Private Dashboard</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as DashboardTab);
                    setPrefilledDomain(undefined);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-400' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-gray-800/60 hidden md:block">
          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <Sparkles size={14} />
              <span>Stay Focused</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Track habits without external trackers. All data is kept strictly on your device.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {activeTab === 'overview' && (
          <OverviewView
            records={records}
            settings={settings}
            limits={limits}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            records={records}
            limits={limits}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'limits' && (
          <LimitsView
            limits={limits}
            settings={settings}
            records={records}
            onLimitsUpdated={setLimits}
            onSettingsUpdated={setSettings}
            initialDomain={prefilledDomain}
          />
        )}

        {activeTab === 'blocklist' && (
          <BlocklistView
            blocklist={blocklist}
            settings={settings}
            onBlocklistUpdated={setBlocklist}
            onSettingsUpdated={setSettings}
            initialDomain={prefilledDomain}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSettingsUpdated={setSettings}
            onDataReset={loadAllData}
          />
        )}
      </main>
    </div>
  );
};

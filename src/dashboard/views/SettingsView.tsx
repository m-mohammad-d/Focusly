import React, { useState } from 'react';
import {
  Shield,
  Download,
  Upload,
  Trash2,
  Bell,
  Eye,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';
import { UserSettings } from '../../types/settings';
import { storage } from '../../storage/chromeStorage';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

interface SettingsViewProps {
  settings: UserSettings;
  onSettingsUpdated: (settings: UserSettings) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
  onDataReset,
}) => {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleTracking = async (enabled: boolean) => {
    chrome.runtime.sendMessage(
      { type: 'TOGGLE_TRACKING', payload: { enabled } },
      async () => {
        const updated = await storage.saveSettings({ trackingEnabled: enabled });
        onSettingsUpdated(updated);
      }
    );
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    const updated = await storage.saveSettings({ notificationsEnabled: enabled });
    onSettingsUpdated(updated);
  };

  const handleIdleThresholdChange = async (seconds: number) => {
    const updated = await storage.saveSettings({ idleThresholdSeconds: seconds });
    if (typeof chrome !== 'undefined' && chrome.idle) {
      chrome.idle.setDetectionInterval(seconds);
    }
    onSettingsUpdated(updated);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const json = await storage.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focus_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await storage.importData(text);
      if (success) {
        setImportStatus('Data successfully imported!');
        setTimeout(() => {
          setImportStatus(null);
          onDataReset();
        }, 1500);
      } else {
        setImportStatus('Invalid backup file format.');
      }
    } catch {
      setImportStatus('Failed reading import file.');
    }
  };

  const handleConfirmClearAll = async () => {
    await storage.clearAllData();
    setIsClearModalOpen(false);
    onDataReset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="pb-2 border-b border-gray-800/80">
        <h2 className="text-xl font-black text-white tracking-tight">Settings & Privacy</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your tracking preferences, permissions, and data integrity
        </p>
      </div>

      {/* Privacy Pledge Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/30 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
          <Shield size={18} />
          <span>100% Local & Privacy-First Architecture</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
          Focus Tracker operates completely on your machine. Your browsing activity never leaves
          your browser. No user accounts, no cloud sync, no tracking telemetry, and no cookies or
          passwords collected. Only domain hostnames and durations are logged locally in{' '}
          <code className="text-indigo-400 font-mono">chrome.storage.local</code>.
        </p>
      </div>

      {/* General Tracking Configuration */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-5">
        <h3 className="text-sm font-bold text-gray-200">Tracking Behavior</h3>

        {/* Master Tracking Switch */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800/60">
          <div>
            <span className="text-xs font-semibold text-gray-100 block">
              Enable Website Tracking
            </span>
            <span className="text-[11px] text-gray-400">
              When disabled, time recording will pause immediately across all tabs
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.trackingEnabled}
              onChange={(e) => handleToggleTracking(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Idle Detection Threshold */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800/60">
          <div>
            <span className="text-xs font-semibold text-gray-100 block">
              Idle Inactivity Threshold
            </span>
            <span className="text-[11px] text-gray-400">
              Pause tracking when there is no mouse or keyboard input for this duration
            </span>
          </div>

          <select
            value={settings.idleThresholdSeconds}
            onChange={(e) => handleIdleThresholdChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds (Recommended)</option>
            <option value={120}>2 minutes</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>

        {/* Notifications Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-100 block">
                Chrome Desktop Notifications
              </span>
              <span className="text-[11px] text-gray-400">
                Receive alerts when approaching (80%) or reaching (100%) your time limits
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* Permissions Explanation Card */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
          <Eye size={16} className="text-indigo-400" />
          <span>Chrome Permissions Explained</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-1">
            <strong className="text-indigo-400 block font-mono">storage</strong>
            <p className="text-gray-400">
              Persists your daily usage logs, custom time limits, and blocklists safely inside Chrome's local database.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-1">
            <strong className="text-indigo-400 block font-mono">tabs</strong>
            <p className="text-gray-400">
              Queries the hostname and title of the active tab to know which website to record time for.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-1">
            <strong className="text-indigo-400 block font-mono">alarms</strong>
            <p className="text-gray-400">
              Schedules periodic 1-minute heartbeats to ensure time is persisted even during uninterrupted browsing sessions.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-1">
            <strong className="text-indigo-400 block font-mono">idle</strong>
            <p className="text-gray-400">
              Detects when you step away from your keyboard or lock your machine so idle time is never counted.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management (Export / Import / Clear) */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-gray-200">Data Management</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Button */}
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={16} />}
            isLoading={isExporting}
            onClick={handleExportData}
            className="w-full justify-center"
          >
            Export All Data (JSON)
          </Button>

          {/* Import File Input */}
          <label className="inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none gap-2 px-4 py-2 text-sm rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/60">
            <Upload size={16} />
            <span>Import Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
            <CheckCircle size={14} />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Clear Data Danger Zone */}
        <div className="pt-4 border-t border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-rose-400 block">
              Danger Zone: Delete All Collected Data
            </span>
            <span className="text-[11px] text-gray-400">
              Permanently purges all daily logs, limits, and blocklists
            </span>
          </div>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => setIsClearModalOpen(true)}
          >
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Reset All Data"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertOctagon size={20} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 leading-relaxed">
              Are you sure you want to delete all browsing history, time limits, and configuration?
              You may want to export a backup first.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmClearAll}
            >
              Yes, Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

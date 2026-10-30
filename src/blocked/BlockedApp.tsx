import React, { useEffect, useState } from 'react';
import { ShieldAlert, Coffee, LayoutDashboard, X, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { getDomainInfo } from '../utils/domain';
import { storage } from '../storage/chromeStorage';

const MOTIVATIONAL_QUOTES = [
  "Small daily disciplines lead to massive long-term results.",
  "Focus is not saying yes to what you want to do; it is saying no to a hundred other good ideas.",
  "Your future self will thank you for the focus you show right now.",
  "Attention is the rarest and purest form of generosity.",
  "The secret of getting ahead is getting started.",
];

export const BlockedApp: React.FC = () => {
  const [domain, setDomain] = useState<string>('');
  const [reason, setReason] = useState<string>('Website restricted');
  const [graceMinutes, setGraceMinutes] = useState<number>(5);
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetDomain = params.get('domain') || 'unknown';
    const blockReason = params.get('reason') || 'Website is restricted';

    setDomain(targetDomain);
    setReason(blockReason);

    // Pick random quote
    const randomQuote =
      MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);

    // Read default grace period from settings
    storage.getSettings().then((s) => {
      if (s.defaultGracePeriodMinutes) {
        setGraceMinutes(s.defaultGracePeriodMinutes);
      }
    });
  }, []);

  const handleTakeBreak = () => {
    if (!domain) return;
    setIsGranting(true);

    chrome.runtime.sendMessage(
      {
        type: 'GRANT_GRACE_PERIOD',
        payload: { domain, minutes: graceMinutes },
      },
      () => {
        // Redirect back to target domain
        window.location.href = `https://${domain}`;
      }
    );
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  const handleCloseTab = () => {
    window.close();
  };

  const domainInfo = getDomainInfo(domain);

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-gray-900/90 border border-gray-800 shadow-2xl backdrop-blur-xl text-center space-y-6">
      {/* Icon Badge */}
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
        <ShieldAlert size={40} />
      </div>

      {/* Main Title & Site */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-white">
          Pause & Reflect
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/80 border border-gray-700/80 text-sm font-semibold text-gray-200">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: domainInfo.color }}
          />
          <span>{domainInfo.name || domain}</span>
        </div>
        <p className="text-sm text-gray-400 max-w-md mx-auto">{reason}</p>
      </div>

      {/* Motivational Quote */}
      <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800/60 text-xs italic text-gray-300 relative">
        <Sparkles size={14} className="text-indigo-400 inline-block mr-1 mb-0.5" />
        "{quote}"
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          icon={<Coffee size={18} />}
          isLoading={isGranting}
          onClick={handleTakeBreak}
        >
          Take a {graceMinutes}-minute Break
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<LayoutDashboard size={16} />}
            onClick={handleOpenDashboard}
          >
            Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<X size={16} />}
            onClick={handleCloseTab}
          >
            Close Tab
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        You can adjust or disable time limits anytime in the extension dashboard.
      </p>
    </div>
  );
};

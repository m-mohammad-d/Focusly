export interface SitePreset {
  domain: string;
  name: string;
  category: 'social' | 'entertainment' | 'work' | 'other';
  suggestedLimitMinutes: number;
}

export const SITE_PRESETS: SitePreset[] = [
  { domain: 'youtube.com', name: 'YouTube', category: 'entertainment', suggestedLimitMinutes: 45 },
  { domain: 'web.telegram.org', name: 'Telegram Web', category: 'social', suggestedLimitMinutes: 30 },
  { domain: 'instagram.com', name: 'Instagram', category: 'social', suggestedLimitMinutes: 30 },
  { domain: 'x.com', name: 'X / Twitter', category: 'social', suggestedLimitMinutes: 30 },
  { domain: 'reddit.com', name: 'Reddit', category: 'social', suggestedLimitMinutes: 30 },
  { domain: 'tiktok.com', name: 'TikTok', category: 'entertainment', suggestedLimitMinutes: 20 },
  { domain: 'facebook.com', name: 'Facebook', category: 'social', suggestedLimitMinutes: 30 },
  { domain: 'netflix.com', name: 'Netflix', category: 'entertainment', suggestedLimitMinutes: 60 },
  { domain: 'twitch.tv', name: 'Twitch', category: 'entertainment', suggestedLimitMinutes: 45 },
];

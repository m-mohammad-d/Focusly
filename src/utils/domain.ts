export interface DomainInfo {
  domain: string;
  name: string;
  color: string;
  category: 'social' | 'entertainment' | 'work' | 'news' | 'other';
}

const KNOWN_DOMAINS: Record<string, { name: string; color: string; category: DomainInfo['category'] }> = {
  'youtube.com': { name: 'YouTube', color: '#FF0000', category: 'entertainment' },
  'web.telegram.org': { name: 'Telegram Web', color: '#26A5E4', category: 'social' },
  'telegram.org': { name: 'Telegram', color: '#26A5E4', category: 'social' },
  'instagram.com': { name: 'Instagram', color: '#E4405F', category: 'social' },
  'x.com': { name: 'X / Twitter', color: '#1DA1F2', category: 'social' },
  'twitter.com': { name: 'Twitter', color: '#1DA1F2', category: 'social' },
  'reddit.com': { name: 'Reddit', color: '#FF4500', category: 'social' },
  'tiktok.com': { name: 'TikTok', color: '#FE2C55', category: 'entertainment' },
  'facebook.com': { name: 'Facebook', color: '#1877F2', category: 'social' },
  'netflix.com': { name: 'Netflix', color: '#E50914', category: 'entertainment' },
  'github.com': { name: 'GitHub', color: '#8b5cf6', category: 'work' },
  'linkedin.com': { name: 'LinkedIn', color: '#0A66C2', category: 'social' },
  'twitch.tv': { name: 'Twitch', color: '#9146FF', category: 'entertainment' },
  'wikipedia.org': { name: 'Wikipedia', color: '#71717A', category: 'work' },
};

const IGNORED_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'edge:',
  'about:',
  'file:',
  'devtools:',
  'view-source:',
]);

/**
 * Extracts and normalizes domain from any URL string.
 * Returns null if the URL is internal, non-http, or invalid.
 */
export function getDomainFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (IGNORED_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    let hostname = parsed.hostname.toLowerCase();

    // Strip leading www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Ignore empty or localhost/loopback if unwanted
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * Returns metadata (brand name, color, category) for a given domain.
 */
export function getDomainInfo(domain: string): DomainInfo {
  const known = KNOWN_DOMAINS[domain];
  if (known) {
    return {
      domain,
      name: known.name,
      color: known.color,
      category: known.category,
    };
  }

  // Capitalize main domain label
  const parts = domain.split('.');
  const baseName = parts.length >= 2 ? parts[parts.length - 2] : domain;
  const name = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  // Derive stable consistent color based on domain string hash
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const color = `hsl(${hue}, 70%, 55%)`;

  return {
    domain,
    name,
    color,
    category: 'other',
  };
}

/**
 * Helper to get clean favicon URL (using Google's reliable favicon service).
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

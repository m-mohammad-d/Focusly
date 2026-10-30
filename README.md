# Focusly (Chrome Extension)

A complete, production-quality, privacy-first website usage tracker and focus manager for Google Chrome (Manifest V3), built with **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **Vite**.

Works 100% locally on your machine with zero external network tracking, zero backend dependencies, and zero accounts.

---

## 🌟 Key Features

### 1. High-Accuracy Website Usage Tracking

- **Timestamp & Event-Driven Engine**: Doesn't rely on fragile JavaScript intervals in the background service worker. Tracks sessions via monotonic timestamp state transitions and commits elapsed time on events.
- **Chrome Lifecycle Resilient**: Seamlessly handles service worker suspension/reactivation, browser restarts, tab switches, and window minimization.
- **Sleep & Inactivity Guard**: Automatically clamps gaps larger than 2 minutes caused by system sleep or hibernation.
- **Multi-Window & Focus-Only**: Only tracks time when the browser window is focused and the tab is actively visible.
- **Idle Detection**: Automatically pauses time counting when mouse/keyboard inactivity exceeds the configurable threshold (default: 60s).
- **Midnight Boundary Rollover**: If a session spans midnight (e.g. 23:58 to 00:03), time is split across the exact 00:00:00 boundary into the respective days.
- **Domain Normalization**: Strips `www.`, handles subdomains cleanly, and ignores internal browser schemes (`chrome://`, `chrome-extension://`, `about:`, `devtools://`, `file://`).

### 2. Modern Dark-First User Interface

- **Compact Popup (`popup.html`)**:
  - Live tracking status badge (`Active`, `Idle`, `Paused`, `Inactive`).
  - Total browsing time today with day-over-day comparison (`-18% vs yesterday`).
  - Progress towards daily goal with radial progress ring.
  - Top 3 most-used websites with icons, percentages, and duration.
  - One-click button to open the full-page dashboard.
- **Comprehensive Full-Page Dashboard (`dashboard.html`)**:
  - **Overview**: High-level KPIs, interactive 7-Day Usage Trend Bar Chart, and Today's Domain Distribution Donut Chart.
  - **Website Statistics**: Filter by date range (Today, Yesterday, Last 7 Days, Last 30 Days), search by domain, sort by time/visits/name, and perform quick actions.
  - **Time Limits**: Set individual daily website limits with 80% & 100% warning thresholds, overall browsing limit, auto-block toggle, and temporary limit extension (+5m, +15m).
  - **Blocklist**: Master blocking toggle, 1-click presets for distracting platforms (YouTube, X, Reddit, Instagram, Telegram Web, TikTok, etc.), custom domain input, and configurable grace periods (1m to 15m) with live countdowns.
  - **Settings & Privacy**: Idle timeout selector, Chrome permissions breakdown, complete data export/import as JSON, and a secure "Clear All Data" danger zone.
- **Distraction-Free Block Page (`blocked.html`)**:
  - Calming, modern focus page when a restricted website is navigated to.
  - Shows why the site was restricted (Time limit reached or In Blocklist).
  - Motivational focus reminders.
  - "Take a 5-minute Break" temporary emergency grace period button, "Open Dashboard", and "Close Tab" buttons.

### 3. Absolute Privacy Guarantee

- **100% On-Device**: All data is stored in `chrome.storage.local`.
- **No Analytics / Telemetry**: Zero network requests or telemetry endpoints.
- **No Browsing History Snooping**: Only domain hostnames and durations are recorded. Page titles, URLs, form values, and passwords are never collected.

---

## 📁 Project Structure

```
Focusly/
├── public/
│   ├── manifest.json              # Chrome Manifest V3 configuration
│   └── icons/                     # Generated extension icons (16, 32, 48, 128px)
├── popup.html                     # Popup HTML entry point
├── dashboard.html                 # Full-page Dashboard HTML entry point
├── blocked.html                   # Site restriction intervention HTML entry point
├── src/
│   ├── background/
│   │   ├── serviceWorker.ts       # Manifest V3 service worker entry point
│   │   ├── tracker.ts             # Timestamp tracking engine & focus state machine
│   │   ├── blocker.ts             # Domain restriction and tab redirection logic
│   │   └── notification.ts        # 80% & 100% limit thresholds and Chrome alerts
│   ├── components/
│   │   ├── Badge.tsx              # Pill badges with status indicators
│   │   ├── Button.tsx             # Modern dark buttons with variants & loading state
│   │   ├── Modal.tsx              # Accessible dialog with blur backdrop
│   │   ├── BarChart.tsx           # SVG 7-day usage chart with hover tooltips
│   │   ├── DonutChart.tsx         # SVG domain distribution donut with legend
│   │   └── ProgressRing.tsx       # SVG radial progress ring
│   ├── dashboard/
│   │   ├── index.tsx              # React DOM dashboard mount
│   │   ├── DashboardApp.tsx       # Dashboard layout & sidebar navigation
│   │   └── views/
│   │       ├── OverviewView.tsx   # KPIs, 7-day chart, donut chart, today's breakdown
│   │       ├── StatsView.tsx      # Date filters, domain search, sorting, detailed cards
│   │       ├── LimitsView.tsx     # Daily limits, warning alerts, auto-block, extensions
│   │       ├── BlocklistView.tsx  # Distraction presets, custom domains, grace periods
│   │       └── SettingsView.tsx   # Idle setting, permissions explainer, export/import/clear
│   ├── popup/
│   │   ├── index.tsx              # Popup mount
│   │   └── PopupApp.tsx           # Compact quick-access view with live stats
│   ├── blocked/
│   │   ├── index.tsx              # Blocked page mount
│   │   └── BlockedApp.tsx         # Calm intervention UI with grace period activation
│   ├── storage/
│   │   └── chromeStorage.ts       # Strongly-typed chrome.storage.local abstraction
│   ├── styles/
│   │   └── globals.css            # Tailwind CSS v4 & custom glassmorphism styles
│   ├── types/
│   │   ├── tracking.ts            # DailyRecord, DomainUsage, ActiveSession types
│   │   ├── settings.ts            # UserSettings, TimeLimit, BlockedItem types
│   │   └── messages.ts            # Inter-process messaging protocols
│   └── utils/
│       ├── domain.ts              # Hostname parsing, sanitization, presets metadata
│       ├── time.ts                # Duration formatting, date offsets, midnight split
│       ├── stats.ts               # Aggregations, comparisons, top-ranked calculations
│       └── presets.ts             # Distraction presets (YouTube, X, Telegram, Reddit, etc.)
├── tests/
│   └── core.test.ts               # Verification test suite
├── dist/                          # Production build output
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Installation & Loading into Chrome

### Option A: Load Pre-Built Production Build Directly

The production build is already compiled and ready inside the `dist/` directory!

1. Open Google Chrome.
2. In the URL bar, navigate to: `chrome://extensions`
3. Toggle the **"Developer mode"** switch in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select the `dist/` folder inside this repository:
   ```
   F:\project\Focusly\dist
   ```
6. The **Focusly** extension is now installed! Pin it to your Chrome toolbar to test.

---

### Option B: Build From Source

1. Clone or open the project directory:
   ```bash
   cd "F:\project\Focusly"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run verification tests:
   ```bash
   npm test
   ```
4. Run production build:
   ```bash
   npm run build
   ```
5. Follow the steps in Option A to load the resulting `dist/` directory into Chrome.

---

## 🔒 Permissions Rationale

| Permission                                       | Reason                                                                                                    |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `storage`                                        | Stores your daily browsing logs, website time limits, and blocklists safely on your machine.              |
| `tabs`                                           | Reads the hostname and title of the currently focused tab to accurately record time.                      |
| `alarms`                                         | Runs a 1-minute periodic heartbeat flush so time is persisted reliably even across long viewing sessions. |
| `idle`                                           | Detects when you step away from the keyboard or lock your computer so idle time is never counted.         |
| `notifications`                                  | Displays desktop notifications when you reach 80% or 100% of your configured website limit.               |
| `host_permissions` (`http://*/*`, `https://*/*`) | Allows the extension to inspect active web tabs and redirect restricted tabs to `blocked.html`.           |

---

## 🧪 Testing & Verification Guide

1. **Verify Tracking Accuracy**:
   - Open any website (e.g. `youtube.com` or `reddit.com`).
   - Click the Focusly icon in the Chrome toolbar.
   - Observe the live tracking badge: it displays **"Active"** with the current domain and seconds accumulating in real time.
   - Switch to another tab: the previous domain flushes its time, and the new domain starts tracking.
   - Minimize Chrome or switch to another desktop app: the status transitions to **"Inactive"** and time ceases counting.

2. **Verify Time Limits**:
   - In the popup, click **"Open Dashboard"** -> **"Time Limits"**.
   - Click **"Add Time Limit"**, select `youtube.com` (or any domain you're on), set the limit to `1` minute, check "Block Access on Limit", and save.
   - Spend 1 minute on that site.
   - At 80% (48s), a desktop notification appears warning you.
   - At 100% (60s), a notification fires and the tab redirects to the **"Pause & Reflect"** block screen.

3. **Verify Grace Period**:
   - On the blocked page, click **"Take a 5-minute Break"**.
   - Notice you are instantly redirected back to the website with an active temporary grace period.
   - Return to the dashboard: the **"Blocklist"** tab highlights the active grace period with a live countdown and an immediate "Re-block" button.

4. **Verify Data Export / Import**:
   - In the dashboard, open **"Settings & Privacy"**.
   - Click **"Export All Data (JSON)"** to download your backup.
   - Click **"Clear All Data"** to reset your database.
   - Click **"Import Backup (JSON)"** to restore your data completely.

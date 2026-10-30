# Focusly

A privacy-first Chrome extension for tracking website usage, managing screen time, and staying focused.

Built with **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS v4**, and **Vite**, using Chrome Manifest V3.

Focusly works entirely on your device. No accounts, no backend, no cloud storage, and no external tracking.

## ✨ Features

### 1. Website Usage Tracking

- **Event-Driven Tracking:** Tracks browsing sessions using timestamp-based state transitions instead of fragile background intervals.
- **Chrome Lifecycle Resilience:** Handles service worker suspension, browser restarts, tab switching, and window minimization.
- **Idle Detection:** Automatically pauses tracking when keyboard and mouse inactivity exceeds the configured threshold (60 seconds by default).
- **Sleep Protection:** Prevents system sleep and hibernation time from being incorrectly counted.
- **Multi-Window Support:** Tracks time only when Chrome is focused and the active tab is visible.
- **Midnight Rollover:** Automatically splits sessions across calendar days.
- **Domain Normalization:** Handles subdomains and removes `www.` prefixes while ignoring internal browser pages.

### 2. Dashboard & Analytics

A comprehensive dashboard provides:

- Total browsing time and daily comparisons.
- Interactive 7-day usage trend chart.
- Website distribution donut chart.
- Top websites and their usage percentages.
- Detailed website statistics.
- Date filters: Today, Yesterday, Last 7 Days, and Last 30 Days.
- Search and sorting by domain, time, visits, and name.

### 3. Website Time Limits

Take control of how much time you spend on individual websites.

- Set daily time limits for specific websites.
- Receive notifications at 80% and 100% of the configured limit.
- Automatically block websites when their time limit is reached.
- Configure temporary extensions (+5 minutes and +15 minutes).
- Manage an overall browsing time limit.

### 4. Website Blocklist

Block distracting websites and reduce unnecessary browsing.

- Enable or disable website blocking globally.
- Use predefined blocking presets for popular platforms:
  - YouTube
  - X
  - Reddit
  - Instagram
  - Telegram Web
  - TikTok
- Add custom domains to your blocklist.
- Configure grace periods from 1 to 15 minutes.
- Monitor active temporary access periods with live countdowns.

### 5. Distraction-Free Block Page

When you attempt to access a restricted website, Focusly displays a dedicated intervention page.

- Clearly explains why the website was blocked.
- Displays motivational focus reminders.
- Provides a temporary 5-minute break option.
- Allows direct access to the dashboard.
- Offers a quick option to close the tab.

### 6. Settings & Privacy

- Configure the idle detection threshold.
- Review Chrome permissions.
- Export all application data as JSON.
- Import previously exported backups.
- Clear all locally stored data.

## 🔒 Privacy First

Your browsing data belongs to you.

Focusly is designed around local-first privacy:

- **100% On-Device:** All application data is stored using `chrome.storage.local`.
- **No Backend:** No external servers or backend dependencies.
- **No Accounts:** No registration or login required.
- **No Analytics:** No telemetry or external tracking endpoints.
- **Minimal Data Collection:** Focusly records website domains and usage durations, not page content.
- **No Sensitive Input Collection:** Page titles, full URLs, form values, and passwords are never collected.

Your browsing statistics never leave your device.

## 🚀 Installation

### For Regular Users (Recommended)

You do not need Node.js, programming knowledge, or any development tools to install Focusly.

**Step 1 — Download the latest release**

Visit the [Latest Release](https://github.com/m-mohammad-d/Focusly/releases/latest) page.

Under the **Assets** section, download the latest `extension-x.x.x.zip` file.

**Step 2 — Extract the ZIP file**

Extract the downloaded archive into a folder on your computer.

**Step 3 — Open Chrome Extensions**

Open Google Chrome and navigate to:

`chrome://extensions`

**Step 4 — Enable Developer Mode**

Enable **Developer mode** using the toggle in the top-right corner.

**Step 5 — Load Focusly**

Click **Load unpacked** and select the extracted Focusly folder containing `manifest.json`.

<details>
<summary>Installation troubleshooting</summary>

Make sure you select the extracted folder containing `manifest.json`, not the ZIP file itself or a parent folder.

If Chrome does not recognize the extension, check that the selected folder contains the production build files.

</details>

**That's it!** Focusly is now installed.

<details>
<summary>How to update Focusly</summary>

1. Visit the [Latest Release](https://github.com/m-mohammad-d/Focusly/releases/latest) page.
2. Download the newest ZIP archive.
3. Extract it, replacing the previous extracted build files.
4. Open `chrome://extensions`.
5. Click the Reload icon on the Focusly extension card.

Export your data from Settings & Privacy before updating as a precaution.

</details>

### For Developers (Build From Source)

**Prerequisites**

- Node.js 22 or later
- npm
- Google Chrome

**1. Clone the repository**

```bash
git clone <repository-url>
cd Focusly
```

**2. Install dependencies**

```bash
npm install
```

**3. Build the extension**

```bash
npm run build
```

**4. Load the production build**

After the build completes, a `dist/` directory will be generated.

Follow the regular installation instructions above and select the generated `dist/` directory.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| TypeScript | Type safety and maintainability |
| Tailwind CSS v4 | Styling |
| Vite | Build tooling |
| Chrome Manifest V3 | Browser extension platform |
| Chrome Storage API | Local data persistence |
| Chrome Alarms API | Periodic tracking persistence |
| Chrome Tabs API | Active tab tracking |
| Chrome Idle API | Inactivity detection |

## 📁 Project Structure

```text
Focusly/
├── public/
│   ├── manifest.json
│   └── icons/
│
├── popup.html
├── dashboard.html
├── blocked.html
│
├── src/
│   ├── background/
│   │   ├── serviceWorker.ts
│   │   ├── tracker.ts
│   │   ├── blocker.ts
│   │   └── notification.ts
│   │
│   ├── components/
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── BarChart.tsx
│   │   ├── DonutChart.tsx
│   │   └── ProgressRing.tsx
│   │
│   ├── dashboard/
│   │   ├── index.tsx
│   │   ├── DashboardApp.tsx
│   │   └── views/
│   │       ├── OverviewView.tsx
│   │       ├── StatsView.tsx
│   │       ├── LimitsView.tsx
│   │       ├── BlocklistView.tsx
│   │       └── SettingsView.tsx
│   │
│   ├── popup/
│   │   ├── index.tsx
│   │   └── PopupApp.tsx
│   │
│   ├── blocked/
│   │   ├── index.tsx
│   │   └── BlockedApp.tsx
│   │
│   ├── storage/
│   │   └── chromeStorage.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── types/
│   │   ├── tracking.ts
│   │   ├── settings.ts
│   │   └── messages.ts
│   │
│   └── utils/
│       ├── domain.ts
│       ├── time.ts
│       ├── stats.ts
│       └── presets.ts
│
├── dist/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔐 Permissions

Focusly requests the following Chrome permissions:

| Permission | Purpose |
|---|---|
| `storage` | Store browsing statistics, settings, time limits, and blocklists locally. |
| `tabs` | Identify the active browser tab and track website usage. |
| `alarms` | Schedule periodic persistence operations. |
| `idle` | Detect inactivity and prevent idle time from being counted. |
| `notifications` | Notify users when website usage reaches configured thresholds. |
| `host_permissions` | Monitor active web pages and enforce website restrictions. |

Focusly uses these permissions only for its core functionality.

## 🧪 Manual Verification

You can manually verify the main features after installation.

### 1. Verify Tracking Accuracy

1. Open a website such as YouTube or Reddit.
2. Click the Focusly icon in the Chrome toolbar.
3. Observe the tracking status and elapsed time.
4. Switch to another tab and verify that tracking switches to the new website.
5. Minimize Chrome and verify that tracking stops.

### 2. Verify Time Limits

1. Open the dashboard.
2. Navigate to **Time Limits**.
3. Add a time limit of one minute for a website.
4. Enable automatic blocking.
5. Spend one minute on that website.
6. Verify that notifications appear at the configured thresholds and the website is blocked when the limit is reached.

### 3. Verify Grace Period

1. Open a blocked website.
2. Click **Take a 5-minute Break**.
3. Verify that temporary access is granted.
4. Return to the dashboard and check the active grace period countdown.

### 4. Verify Data Export & Import

1. Open **Settings & Privacy**.
2. Click **Export All Data (JSON)**.
3. Clear the application data.
4. Import your previously exported JSON backup.
5. Verify that your settings and browsing data have been restored.

## 📦 Releases

Focusly releases are distributed through GitHub Releases.

Each release includes a ready-to-install ZIP archive containing the production build.

You do not need to build the project yourself.

[View All Releases](https://github.com/m-mohammad-d/Focusly/releases)

[Download Latest Release](https://github.com/m-mohammad-d/Focusly/releases/latest)

---

## 📄 License

See the [LICENSE](LICENSE) file for licensing information.

---

**Focusly** — Take control of your time. Stay focused.

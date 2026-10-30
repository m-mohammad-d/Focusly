import assert from "assert";
import { getDomainFromUrl, getDomainInfo } from "../src/utils/domain.js";
import { formatDuration, splitTimeAcrossMidnight } from "../src/utils/time.js";
import {
  calculateDayComparison,
  calculateWeeklySummary,
} from "../src/utils/stats.js";

console.log("--- Starting Focusly Verification Tests ---");

// 1. Domain normalization tests
console.log("Testing domain normalization...");
assert.strictEqual(
  getDomainFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  "youtube.com",
);
assert.strictEqual(
  getDomainFromUrl("https://web.telegram.org/k/"),
  "web.telegram.org",
);
assert.strictEqual(
  getDomainFromUrl("http://reddit.com/r/technology/"),
  "reddit.com",
);
assert.strictEqual(getDomainFromUrl("https://x.com/explore"), "x.com");
assert.strictEqual(
  getDomainFromUrl("https://www.instagram.com/"),
  "instagram.com",
);
assert.strictEqual(getDomainFromUrl("chrome://extensions/"), null);
assert.strictEqual(
  getDomainFromUrl("chrome-extension://abcdef/popup.html"),
  null,
);
assert.strictEqual(getDomainFromUrl("about:blank"), null);
assert.strictEqual(getDomainFromUrl(""), null);
assert.strictEqual(getDomainFromUrl(null), null);
console.log("✓ Domain normalization tests passed.");

// 2. Domain info tests
console.log("Testing domain metadata...");
const ytInfo = getDomainInfo("youtube.com");
assert.strictEqual(ytInfo.name, "YouTube");
assert.strictEqual(ytInfo.category, "entertainment");

const tgInfo = getDomainInfo("web.telegram.org");
assert.strictEqual(tgInfo.name, "Telegram Web");
assert.strictEqual(tgInfo.category, "social");
console.log("✓ Domain metadata tests passed.");

// 3. Time duration formatting tests
console.log("Testing time duration formatting...");
assert.strictEqual(formatDuration(45), "45s");
assert.strictEqual(formatDuration(60), "1m");
assert.strictEqual(formatDuration(125), "2m");
assert.strictEqual(formatDuration(125, { showSeconds: true }), "2m 5s");
assert.strictEqual(formatDuration(3600), "1h 0m");
assert.strictEqual(formatDuration(3665), "1h 1m");
assert.strictEqual(formatDuration(3665, { showSeconds: true }), "1h 1m 5s");
console.log("✓ Time duration formatting tests passed.");

// 4. Midnight split tests
console.log("Testing midnight boundary splitting...");
// Session starting 10 seconds before midnight and ending 15 seconds after midnight
const d1 = new Date("2026-10-30T23:59:50.000").getTime();
const d2 = new Date("2026-10-31T00:00:15.000").getTime();
const chunks = splitTimeAcrossMidnight(d1, d2);
assert.strictEqual(chunks.length, 2);
assert.strictEqual(chunks[0].seconds, 10);
assert.strictEqual(chunks[1].seconds, 15);
console.log("✓ Midnight boundary splitting tests passed.");

// 5. Day comparison stats tests
console.log("Testing day comparison calculation...");
const mockRecords = {
  "2026-10-29": {
    date: "2026-10-29",
    totalSeconds: 3600, // 1 hour
    domains: {
      "youtube.com": {
        domain: "youtube.com",
        seconds: 3600,
        visits: 3,
        lastActive: 0,
      },
    },
  },
  "2026-10-30": {
    date: "2026-10-30",
    totalSeconds: 5400, // 1.5 hours (+50%)
    domains: {
      "youtube.com": {
        domain: "youtube.com",
        seconds: 5400,
        visits: 5,
        lastActive: 0,
      },
    },
  },
};
const comp = calculateDayComparison(mockRecords, "2026-10-30");
assert.strictEqual(comp.todaySeconds, 5400);
assert.strictEqual(comp.yesterdaySeconds, 3600);
assert.strictEqual(comp.diffSeconds, 1800);
assert.strictEqual(comp.percentChange, 50);
assert.strictEqual(comp.isIncrease, true);
console.log("✓ Day comparison stats tests passed.");

// 6. Weekly summary tests
console.log("Testing weekly summary...");
const weekSummary = calculateWeeklySummary(mockRecords, 7);
assert.ok(weekSummary.totalSeconds >= 5400);
assert.strictEqual(weekSummary.topDomain?.domain, "youtube.com");
console.log("✓ Weekly summary tests passed.");

console.log("--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---");

/**
 * Formats seconds into clean human-readable strings.
 * e.g., 3665 -> "1h 1m", 120 -> "2m", 45 -> "45s"
 */
export function formatDuration(seconds: number, options?: { showSeconds?: boolean; short?: boolean }): string {
  const sec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (options?.short) {
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }

  if (h > 0) {
    return options?.showSeconds && s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }

  if (m > 0) {
    return options?.showSeconds && s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  return `${s}s`;
}

/**
 * Returns date in local 'YYYY-MM-DD' format.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date string for N days relative to today (-1 = yesterday, +1 = tomorrow).
 */
export function getDateOffsetString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateString(d);
}

/**
 * Formats YYYY-MM-DD into a friendly label (e.g. "Today", "Yesterday", "Mon, Oct 30").
 */
export function formatDisplayDate(dateStr: string): string {
  const today = getLocalDateString();
  const yesterday = getDateOffsetString(-1);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return dateStr;
}

/**
 * Generates an array of date strings for the past N days up to today.
 */
export function getLastNDays(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(getDateOffsetString(-i));
  }
  return result;
}

/**
 * Splits a time session across midnight boundaries if needed.
 * Guarantees that time is credited to the exact date it occurred on.
 */
export function splitTimeAcrossMidnight(
  startTime: number,
  endTime: number
): Array<{ date: string; seconds: number }> {
  if (endTime <= startTime) return [];

  const chunks: Array<{ date: string; seconds: number }> = [];
  let currentStart = startTime;

  while (currentStart < endTime) {
    const startDate = new Date(currentStart);
    // Midnight at end of current start day
    const nextMidnight = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + 1,
      0, 0, 0, 0
    ).getTime();

    const currentEnd = Math.min(endTime, nextMidnight);
    const elapsedMs = currentEnd - currentStart;
    const elapsedSec = Math.floor(elapsedMs / 1000);

    if (elapsedSec > 0) {
      chunks.push({
        date: getLocalDateString(startDate),
        seconds: elapsedSec,
      });
    }

    currentStart = currentEnd;
  }

  return chunks;
}

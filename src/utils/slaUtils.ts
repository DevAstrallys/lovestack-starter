/**
 * SLA calculation utilities — business hours only (excludes weekends & French public holidays)
 */

const FRENCH_HOLIDAYS_2025 = [
  '2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08',
  '2025-05-29', '2025-06-09', '2025-07-14', '2025-08-15',
  '2025-11-01', '2025-11-11', '2025-12-25',
];
const FRENCH_HOLIDAYS_2026 = [
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08',
  '2026-05-14', '2026-05-25', '2026-07-14', '2026-08-15',
  '2026-11-01', '2026-11-11', '2026-12-25',
];

const ALL_HOLIDAYS = new Set([...FRENCH_HOLIDAYS_2025, ...FRENCH_HOLIDAYS_2026]);

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const iso = date.toISOString().slice(0, 10);
  return !ALL_HOLIDAYS.has(iso);
}

/**
 * Calculate business hours between two dates.
 * Business hours: 9h-18h (9 hours/day), Mon-Fri, excluding French public holidays.
 */
export function businessHoursBetween(start: Date, end: Date): number {
  if (end <= start) return 0;

  let hours = 0;
  const cursor = new Date(start);

  while (cursor < end) {
    if (isBusinessDay(cursor)) {
      const dayStart = new Date(cursor);
      dayStart.setHours(9, 0, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(18, 0, 0, 0);

      const effectiveStart = cursor > dayStart ? cursor : dayStart;
      const effectiveEnd = end < dayEnd ? end : dayEnd;

      if (effectiveStart < effectiveEnd) {
        hours += (effectiveEnd.getTime() - effectiveStart.getTime()) / 3600000;
      }
    }

    // Move to next day 9:00
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(9, 0, 0, 0);
  }

  return Math.round(hours * 10) / 10;
}

/**
 * Calculate SLA score (0-100%).
 * 100% if response < 24 business hours, 0% if > 15 business days (135h).
 */
export function slaScore(businessHours: number): number {
  if (businessHours <= 24) return 100;
  if (businessHours >= 135) return 0;
  // Linear interpolation between 24h (100%) and 135h (0%)
  return Math.round(((135 - businessHours) / (135 - 24)) * 100);
}

export function slaColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function formatBusinessHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min ouvrées`;
  if (hours < 24) return `${hours}h ouvrées`;
  const days = Math.floor(hours / 9);
  const rem = Math.round(hours % 9);
  return rem > 0 ? `${days}j ${rem}h ouvrés` : `${days}j ouvrés`;
}

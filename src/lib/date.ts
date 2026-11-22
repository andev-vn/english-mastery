/** Local-date helpers. Days are keyed as YYYY-MM-DD in the learner's local time zone. */

export function toDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The last `count` day keys ending today, oldest first. */
export function lastDays(count: number, today: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => toDayKey(addDays(today, i - count + 1)));
}

const dayDiff = (a: string, b: string) =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);

/** Current and best streak from a set of active day keys. */
export function computeStreaks(activeDays: Iterable<string>, today: Date = new Date()): { current: number; best: number } {
  const days = new Set(activeDays);
  if (days.size === 0) return { current: 0, best: 0 };

  const sorted = [...days].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = dayDiff(sorted[i - 1]!, sorted[i]!) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  // The current streak survives until the end of the day after the last active day.
  let cursor = days.has(toDayKey(today)) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(toDayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, best: Math.max(best, current) };
}

/** Whole seconds elapsed since a timestamp. Call from event handlers, not during render. */
export function secondsSince(startMs: number): number {
  return Math.round((Date.now() - startMs) / 1000);
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMin = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return 'Hôm qua';
  return `${diffD} ngày trước`;
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const WEEKDAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export function weekdayShort(dayKey: string): string {
  return WEEKDAY_VI[new Date(`${dayKey}T00:00:00`).getDay()] ?? '';
}

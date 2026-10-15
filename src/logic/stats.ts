/** Måndag 00:00 lokal tid för veckan som `ms` ligger i */
export function weekStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

function addDays(ms: number, n: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** Antal veckor i rad med minst ett avslutat pass. Pågående vecka utan pass bryter inte serien. */
export function weekStreak(sessionTimes: number[], now: number): number {
  const weeks = new Set(sessionTimes.map(weekStart));
  let w = weekStart(now);
  if (!weeks.has(w)) w = addDays(w, -7);
  let n = 0;
  while (weeks.has(w)) {
    n++;
    w = addDays(w, -7);
  }
  return n;
}

export interface WeekDay {
  start: number;
  today: boolean;
  /** Passtyp för första avslutade passet den dagen */
  dayId?: string;
}

/** Måndag till söndag för veckan som `now` ligger i, med avslutade pass utplacerade */
export function weekDays(sessions: { startedAt: number; dayId: string }[], now: number): WeekDay[] {
  const ws = weekStart(now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const start = addDays(ws, i);
    const end = addDays(start, 1);
    const hit = sessions
      .filter((s) => s.startedAt >= start && s.startedAt < end)
      .sort((a, b) => a.startedAt - b.startedAt)[0];
    return { start, today: start === todayStart.getTime(), dayId: hit?.dayId };
  });
}

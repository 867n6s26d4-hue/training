import type { HiitSpec } from '../types';

export type SoundId = 'tick' | 'go' | 'rest' | 'warn' | 'final';
export interface TimerEvent {
  at: number;
  sound: SoundId;
}
export type SegmentKind = 'leadin' | 'work' | 'rest' | 'minute' | 'amrap';
export interface Segment {
  start: number;
  end: number;
  kind: SegmentKind;
  title: string;
  detail?: string;
  next?: string;
}
export interface Plan {
  kind: 'rest' | 'emom' | 'intervals' | 'amrap';
  totalMs: number;
  events: TimerEvent[];
  segments: Segment[];
}

/** Nedräkning: tick 3, 2, 1 sekund före `boundary` */
function ticksBefore(boundary: number, minStart: number): TimerEvent[] {
  const out: TimerEvent[] = [];
  for (const s of [3000, 2000, 1000]) {
    const at = boundary - s;
    if (at > minStart) out.push({ at, sound: 'tick' });
  }
  return out;
}

function sortEvents(e: TimerEvent[]): TimerEvent[] {
  return e.sort((a, b) => a.at - b.at);
}

export function buildRestPlan(seconds: number): Plan {
  const total = Math.max(1, seconds) * 1000;
  const events: TimerEvent[] = [];
  if (seconds >= 6) events.push(...ticksBefore(total, 0));
  events.push({ at: total, sound: 'go' });
  return {
    kind: 'rest',
    totalMs: total,
    events: sortEvents(events),
    segments: [{ start: 0, end: total, kind: 'rest', title: 'Vila' }],
  };
}

export function buildEmomPlan(minutes: number, items: string[], leadInSec = 5): Plan {
  const L = leadInSec * 1000;
  const total = L + minutes * 60000;
  const segments: Segment[] = [];
  const events: TimerEvent[] = [];
  if (L > 0) {
    segments.push({ start: 0, end: L, kind: 'leadin', title: 'Gör dig redo', next: items[0] });
    events.push(...ticksBefore(L, 0));
  }
  events.push({ at: L, sound: 'go' });
  for (let i = 0; i < minutes; i++) {
    const start = L + i * 60000;
    segments.push({
      start,
      end: start + 60000,
      kind: 'minute',
      title: items[i % items.length],
      detail: `Minut ${i + 1} av ${minutes}`,
      next: i + 1 < minutes ? items[(i + 1) % items.length] : 'Klart',
    });
    if (i >= 1) {
      events.push(...ticksBefore(start, L));
      events.push({ at: start, sound: 'go' });
    }
  }
  events.push(...ticksBefore(total, L));
  events.push({ at: total, sound: 'final' });
  return { kind: 'emom', totalMs: total, events: sortEvents(events), segments };
}

export function buildIntervalPlan(
  workSec: number,
  restSec: number,
  rounds: number,
  items: string[],
  leadInSec = 5,
): Plan {
  const L = leadInSec * 1000;
  const segments: Segment[] = [];
  const events: TimerEvent[] = [];
  const seq: { kind: 'work' | 'rest'; title: string; detail: string; dur: number; next: string }[] = [];
  for (let r = 0; r < rounds; r++) {
    for (let j = 0; j < items.length; j++) {
      const last = r === rounds - 1 && j === items.length - 1;
      seq.push({
        kind: 'work',
        title: items[j],
        detail: `Varv ${r + 1} av ${rounds} · övning ${j + 1} av ${items.length}`,
        dur: workSec * 1000,
        next: last ? 'Klart' : restSec > 0 ? 'Vila' : items[(j + 1) % items.length],
      });
      if (!last && restSec > 0) {
        seq.push({
          kind: 'rest',
          title: 'Vila',
          detail: `Varv ${r + 1} av ${rounds}`,
          dur: restSec * 1000,
          next: items[(j + 1) % items.length],
        });
      }
    }
  }
  if (L > 0) {
    segments.push({ start: 0, end: L, kind: 'leadin', title: 'Gör dig redo', next: items[0] });
    events.push(...ticksBefore(L, 0));
  }
  let t = L;
  seq.forEach((s, i) => {
    segments.push({ start: t, end: t + s.dur, kind: s.kind, title: s.title, detail: s.detail, next: s.next });
    if (i > 0) events.push(...ticksBefore(t, t - seq[i - 1].dur));
    events.push({ at: t, sound: s.kind === 'work' ? 'go' : 'rest' });
    t += s.dur;
  });
  events.push(...ticksBefore(t, t - seq[seq.length - 1].dur));
  events.push({ at: t, sound: 'final' });
  return { kind: 'intervals', totalMs: t, events: sortEvents(events), segments };
}

export function buildAmrapPlan(minutes: number, items: string[], leadInSec = 5): Plan {
  const L = leadInSec * 1000;
  const dur = minutes * 60000;
  const total = L + dur;
  const segments: Segment[] = [];
  const events: TimerEvent[] = [];
  if (L > 0) {
    segments.push({ start: 0, end: L, kind: 'leadin', title: 'Gör dig redo', next: items[0] });
    events.push(...ticksBefore(L, 0));
  }
  events.push({ at: L, sound: 'go' });
  segments.push({
    start: L,
    end: total,
    kind: 'amrap',
    title: 'Så många varv som möjligt',
    detail: items.join(' → '),
    next: 'Klart',
  });
  if (minutes >= 6) events.push({ at: L + dur / 2, sound: 'warn' });
  if (minutes >= 3) events.push({ at: total - 60000, sound: 'warn' });
  events.push(...ticksBefore(total, L));
  events.push({ at: total, sound: 'final' });
  return { kind: 'amrap', totalMs: total, events: sortEvents(events), segments };
}

export function buildHiitPlan(spec: HiitSpec, leadInSec = 5): Plan {
  switch (spec.kind) {
    case 'emom':
      return buildEmomPlan(spec.minutes, spec.items, leadInSec);
    case 'intervals':
      return buildIntervalPlan(spec.workSec, spec.restSec, spec.rounds, spec.items, leadInSec);
    case 'amrap':
      return buildAmrapPlan(spec.minutes, spec.items, leadInSec);
  }
}

export interface PlanState {
  done: boolean;
  segIndex: number;
  segment: Segment;
  segRemainingMs: number;
  totalRemainingMs: number;
  /** 0..1 över hela planen */
  progress: number;
}

export function stateAt(plan: Plan, elapsedMs: number): PlanState {
  const e = Math.max(0, elapsedMs);
  const done = e >= plan.totalMs;
  let idx = plan.segments.findIndex((s) => e >= s.start && e < s.end);
  if (idx < 0) idx = plan.segments.length - 1;
  const seg = plan.segments[idx];
  return {
    done,
    segIndex: idx,
    segment: seg,
    segRemainingMs: Math.max(0, seg.end - e),
    totalRemainingMs: Math.max(0, plan.totalMs - e),
    progress: Math.min(1, e / plan.totalMs),
  };
}

export function fmtClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

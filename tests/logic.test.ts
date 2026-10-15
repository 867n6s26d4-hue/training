import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { evaluateProgression, plannedReps, deloadSets, fmtKg } from '../src/logic/progression';
import { platesPerSide, parsePlates } from '../src/logic/plates';
import {
  buildEmomPlan,
  buildIntervalPlan,
  buildAmrapPlan,
  buildE2momPlan,
  buildFortimePlan,
  fmtElapsed,
  buildRestPlan,
  stateAt,
  fmtClock,
} from '../src/logic/timerPlan';
import { TimerEngine } from '../src/logic/timerEngine';
import type { SoundId } from '../src/logic/timerPlan';
import type { SetLog, StrengthItem } from '../src/types';
import { DAYS, EXERCISES, hiitMinutes, hiitPool, hiitResultText, hiitTitleFor, restText, targetText } from '../src/data/program';
import { METCONS } from '../src/data/metcons';

const squat: StrengthItem = {
  exerciseId: 'squat', sets: 4, repsMin: 5, repsMax: 5, restSec: 150, progression: { kind: 'weight', inc: 5 },
};
const incline: StrengthItem = {
  exerciseId: 'inclinepress', sets: 3, repsMin: 8, repsMax: 10, restSec: 120, progression: { kind: 'weight', inc: 2.5 },
};
const ring: StrengthItem = {
  exerciseId: 'ringrow', sets: 3, repsMin: 8, repsMax: 10, restSec: 90, progression: { kind: 'reps' },
};
const mk = (w: number | null, reps: number[], done = true): SetLog[] => reps.map((r) => ({ weight: w, reps: r, done }));

describe('progression', () => {
  it('höjer vikten när alla set når topp-reps', () => {
    const r = evaluateProgression(squat, { weight: 100, failStreak: 0 }, mk(100, [5, 5, 5, 5]));
    expect(r.weight).toBe(105);
    expect(r.change.reason).toBe('up');
  });
  it('första passet utan sparad vikt använder loggad vikt', () => {
    const r = evaluateProgression(squat, undefined, mk(60, [5, 5, 5, 5]));
    expect(r.weight).toBe(65);
  });
  it('behåller vikten vid missade reps första gången och sänker 10 % andra gången', () => {
    const a = evaluateProgression(squat, { weight: 100, failStreak: 0 }, mk(100, [5, 5, 4, 3]));
    expect(a.weight).toBe(100);
    expect(a.failStreak).toBe(1);
    const b = evaluateProgression(squat, { weight: 100, failStreak: 1 }, mk(100, [5, 4, 4, 3]));
    expect(b.weight).toBe(90);
    expect(b.change.reason).toBe('down');
    expect(b.failStreak).toBe(0);
  });
  it('ofullständigt pass ändrar ingenting och räknas inte som misslyckande', () => {
    const r = evaluateProgression(squat, { weight: 100, failStreak: 1 }, mk(100, [5, 5]));
    expect(r.weight).toBe(100);
    expect(r.failStreak).toBe(1);
    expect(r.change.reason).toBe('hold');
  });
  it('rep-intervall: behåll inom intervallet, höj vid topp', () => {
    expect(evaluateProgression(incline, { weight: 20, failStreak: 0 }, mk(20, [10, 9, 8])).weight).toBe(20);
    expect(evaluateProgression(incline, { weight: 20, failStreak: 0 }, mk(20, [10, 10, 10])).weight).toBe(22.5);
  });
  it('kroppsvikt: föreslår svårare variant vid topp-reps', () => {
    const r = evaluateProgression(ring, undefined, mk(null, [10, 10, 10]));
    expect(r.change.harder).toBe(true);
    expect(r.weight).toBeNull();
  });
  it('inga gjorda set => hoppas över', () => {
    const r = evaluateProgression(squat, { weight: 100, failStreak: 0 }, mk(100, [5, 5], false));
    expect(r.change.reason).toBe('skipped');
  });
  it('planerade reps och deload', () => {
    expect(plannedReps(squat, 100, undefined)).toBe(5);
    expect(plannedReps(incline, 20, undefined)).toBe(8);
    expect(plannedReps(incline, 20, { weight: 20, reps: 9, done: true })).toBe(9);
    expect(plannedReps(incline, 22.5, { weight: 20, reps: 10, done: true })).toBe(8);
    expect(deloadSets(4)).toBe(2);
    expect(deloadSets(3)).toBe(2);
    expect(deloadSets(1)).toBe(1);
    expect(fmtKg(22.5)).toBe('22,5');
  });
});

describe('skivräknare', () => {
  it('räknar skivor per sida', () => {
    expect(platesPerSide(100, 20, [25, 20, 15, 10, 5, 2.5, 1.25])).toEqual({ perSide: [25, 15], remainder: 0 });
    expect(platesPerSide(20, 20, [25])).toEqual({ perSide: [], remainder: 0 });
    expect(platesPerSide(62.5, 20, [20, 1.25]).perSide).toEqual([20, 1.25]);
  });
  it('rapporterar rest när vikten inte går att bygga', () => {
    expect(platesPerSide(61, 20, [20, 10, 5, 2.5]).remainder).toBeCloseTo(1);
  });
  it('tolkar skivlista', () => {
    expect(parsePlates('20, 10  5;2,5')).toEqual([20, 10, 5, 2.5]);
  });
});

describe('timerplaner', () => {
  it('EMOM 10 min: längd, segment och signaler', () => {
    const p = buildEmomPlan(10, ['a', 'b'], 5);
    expect(p.totalMs).toBe(605000);
    expect(p.segments.filter((s) => s.kind === 'minute')).toHaveLength(10);
    expect(p.segments[1].title).toBe('a');
    expect(p.segments[2].title).toBe('b');
    const gos = p.events.filter((e) => e.sound === 'go');
    expect(gos).toHaveLength(10);
    expect(p.events.filter((e) => e.sound === 'final')).toHaveLength(1);
    expect(p.events.filter((e) => e.sound === 'tick')).toHaveLength(3 + 9 * 3 + 3);
    expect(p.events[0].at).toBe(2000);
    for (let i = 1; i < p.events.length; i++) expect(p.events[i].at).toBeGreaterThanOrEqual(p.events[i - 1].at);
  });
  it('intervall 5 varv x 3 övningar 40/20 = 15 min plus lead-in, ingen vila efter sista', () => {
    const p = buildIntervalPlan(40, 20, 5, ['x', 'y', 'z'], 5);
    expect(p.totalMs).toBe(5000 + 15 * 40000 + 14 * 20000);
    expect(p.segments.filter((s) => s.kind === 'work')).toHaveLength(15);
    expect(p.segments.filter((s) => s.kind === 'rest')).toHaveLength(14);
    expect(p.segments[p.segments.length - 1].kind).toBe('work');
    expect(p.events.filter((e) => e.sound === 'go')).toHaveLength(15);
    expect(p.events.filter((e) => e.sound === 'rest')).toHaveLength(14);
    const atCounts = new Map<string, number>();
    p.events.forEach((e) => atCounts.set(e.at + e.sound, (atCounts.get(e.at + e.sound) ?? 0) + 1));
    expect([...atCounts.values()].every((c) => c === 1)).toBe(true);
  });
  it('AMRAP: halvtid, en minut kvar, nedräkning och slut', () => {
    const p = buildAmrapPlan(10, ['a'], 5);
    expect(p.totalMs).toBe(605000);
    expect(p.events.filter((e) => e.sound === 'warn').map((e) => e.at)).toEqual([305000, 545000]);
    expect(p.events[p.events.length - 1]).toEqual({ at: 605000, sound: 'final' });
  });
  it('vila: nedräkning bara om vilan är längre än 6 s', () => {
    expect(buildRestPlan(90).events.map((e) => e.sound)).toEqual(['tick', 'tick', 'tick', 'go']);
    expect(buildRestPlan(4).events.map((e) => e.sound)).toEqual(['go']);
  });
  it('stateAt och klocka', () => {
    const p = buildEmomPlan(2, ['a', 'b'], 5);
    expect(stateAt(p, 0).segment.kind).toBe('leadin');
    const s = stateAt(p, 5000 + 61000);
    expect(s.segment.title).toBe('b');
    expect(s.segRemainingMs).toBe(59000);
    expect(stateAt(p, 10 ** 9).done).toBe(true);
    expect(fmtClock(59001)).toBe('1:00');
    expect(fmtClock(0)).toBe('0:00');
  });
  it('programmet: baslyft och komplement är konsekventa', () => {
    for (const d of DAYS) {
      for (const slot of d.slots) {
        expect(slot.options.length).toBeGreaterThanOrEqual(2);
        for (const o of slot.options) expect(EXERCISES[o.exerciseId]).toBeDefined();
      }
      expect(d.slots.some((x) => x.role === 'main')).toBe(true);
    }
    // varje övnings-id används bara på ett ställe
    const all = DAYS.flatMap((d) => d.slots.flatMap((s) => s.options.map((o) => o.exerciseId)));
    expect(new Set(all).size).toBe(all.length);
    expect(targetText(4, 5, 5)).toBe('4 × 5');
    expect(targetText(3, 8, 10)).toBe('3 × 8–10');
    expect(restText(150)).toBe('2–3 min');
    expect(restText(90)).toBe('90 s');
    expect(restText(120)).toBe('2 min');
  });
});

describe('TimerEngine', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('spelar signaler i tid och avslutar', () => {
    const played: [number, SoundId][] = [];
    const t0 = Date.now();
    const eng = new TimerEngine((s) => played.push([Date.now() - t0, s]));
    let finished = false;
    eng.onFinish = () => (finished = true);
    eng.start(buildRestPlan(10));
    vi.advanceTimersByTime(10500);
    expect(played.map((p) => p[1])).toEqual(['tick', 'tick', 'tick', 'go']);
    expect(played.map((p) => p[0])).toEqual([7000, 8000, 9000, 10000]);
    expect(finished).toBe(true);
  });
  it('paus stoppar klockan och signalerna och återupptar rätt', () => {
    const played: SoundId[] = [];
    const eng = new TimerEngine((s) => played.push(s));
    eng.start(buildRestPlan(10));
    vi.advanceTimersByTime(5000);
    eng.pause();
    vi.advanceTimersByTime(60000);
    expect(played).toEqual([]);
    expect(eng.elapsed()).toBe(5000);
    eng.resume();
    vi.advanceTimersByTime(1900);
    expect(played).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(played).toEqual(['tick']);
    vi.advanceTimersByTime(3600);
    expect(played).toEqual(['tick', 'tick', 'tick', 'go']);
  });
  it('hoppar över signaler som blivit gamla (t.ex. efter bakgrundsläge)', () => {
    const played: SoundId[] = [];
    const eng = new TimerEngine((s) => played.push(s));
    eng.start(buildRestPlan(20));
    // simulera att JS fryst i 17,6 s: flytta klockan utan att köra timers
    vi.setSystemTime(Date.now() + 17600);
    vi.advanceTimersByTime(100);
    // tick vid 17 s är 0,7 s gammal och hoppas över, resten spelas
    vi.advanceTimersByTime(3000);
    expect(played).toEqual(['tick', 'tick', 'go']);
  });
  it('stop avbryter allt', () => {
    const played: SoundId[] = [];
    const eng = new TimerEngine((s) => played.push(s));
    eng.start(buildRestPlan(10));
    vi.advanceTimersByTime(6900);
    eng.stop();
    vi.advanceTimersByTime(20000);
    expect(played).toEqual([]);
  });
});

import { estimateMinutes } from '../src/data/program';
describe('metcon-banken', () => {
  it('har unika id:n och minst 20 pass i alla fem format', () => {
    const ids = METCONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(METCONS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(METCONS.map((m) => m.spec.kind))).toEqual(new Set(['fortime', 'amrap', 'emom', 'e2mom', 'intervals']));
  });
  it('varje pass har längd 8–20 min, jämn E2MOM och rader', () => {
    for (const m of METCONS) {
      const mins = hiitMinutes(m.spec);
      expect(mins, m.id).toBeGreaterThanOrEqual(8);
      expect(mins, m.id).toBeLessThanOrEqual(20);
      expect(m.spec.items.length, m.id).toBeGreaterThan(0);
      expect(m.spec.name, m.id).toBeTruthy();
      if (m.spec.kind === 'e2mom') expect(m.spec.minutes % (2 * m.spec.items.length), m.id).toBe(0);
    }
  });
  it('passar utrustningen: inga lyft över huvudet, ingen löpning eller maskin', () => {
    const forbidden = /thruster|över huvud|överhuvud|snatch|handstå|löp|hopprep|double under|box jump|wall ball|roddmaskin|\bpress över\b|pistol/i;
    for (const m of METCONS) for (const it of m.spec.items) expect(it, m.id).not.toMatch(forbidden);
  });
  it('varje passdag får en pool med minst 8 pass och blandade format, och undviker krockar', () => {
    for (const d of DAYS) {
      const pool = hiitPool(d.id);
      expect(pool.length, d.id).toBeGreaterThanOrEqual(8);
      expect(new Set(pool.map((p) => p.kind)).size, d.id).toBe(5);
      // de första fem passen har fem olika format
      expect(new Set(pool.slice(0, 5).map((p) => p.kind)).size, d.id).toBe(5);
      for (const m of METCONS) if (m.avoid?.includes(d.id)) expect(pool, m.id).not.toContain(m.spec);
    }
  });
  it('titlar och resultattext', () => {
    expect(hiitTitleFor({ kind: 'e2mom', minutes: 16, items: ['x'] })).toBe('E2MOM 16 min');
    expect(hiitTitleFor({ kind: 'fortime', capMinutes: 10, items: ['x'] })).toBe('På tid · max 10 min');
    expect(hiitResultText({ timeSec: 522 })).toBe('8:42');
    expect(hiitResultText({ timeSec: 600, capped: true, rounds: 2 })).toBe('10:00 (tidsgräns) 2 varv');
    expect(hiitResultText({ rounds: 7 })).toBe('7 varv');
  });
});

describe('E2MOM och På tid', () => {
  it('E2MOM 8 min: fyra block om två minuter, raderna växlar, signal vid varje blockstart', () => {
    const p = buildE2momPlan(8, ['a', 'b'], 5);
    expect(p.totalMs).toBe(5000 + 8 * 60000);
    const blocks = p.segments.filter((x) => x.kind === 'minute');
    expect(blocks.map((x) => x.title)).toEqual(['a', 'b', 'a', 'b']);
    expect(blocks.every((x) => x.end - x.start === 120000)).toBe(true);
    const go = p.events.filter((e) => e.sound === 'go').map((e) => e.at);
    expect(go).toEqual([5000, 125000, 245000, 365000]);
    expect(p.events.filter((e) => e.sound === 'final').map((e) => e.at)).toEqual([p.totalMs]);
    expect(stateAt(p, 130000).segment.detail).toContain('Block 2 av 4');
  });
  it('På tid: ett segment med tidsgräns, varning halvvägs och en minut kvar', () => {
    const p = buildFortimePlan(10, ['a', 'b'], 'Fran', 5);
    expect(p.kind).toBe('fortime');
    expect(p.totalMs).toBe(5000 + 600000);
    const seg = p.segments.find((x) => x.kind === 'fortime')!;
    expect(seg.lines).toEqual(['a', 'b']);
    expect(seg.title).toBe('Fran');
    expect(p.events.filter((e) => e.sound === 'warn').map((e) => e.at)).toEqual([305000, 545000]);
    expect(p.events.at(-1)).toEqual({ at: p.totalMs, sound: 'final' });
  });
  it('fmtElapsed avrundar nedåt', () => {
    expect(fmtElapsed(59999)).toBe('0:59');
    expect(fmtElapsed(61000)).toBe('1:01');
    expect(fmtElapsed(-5)).toBe('0:00');
  });
});

describe('passlängd', () => {
  it('räknar 3 min uppvärmning + 22 min styrka + HIIT-passets längd', () => {
    const [A] = DAYS;
    expect(estimateMinutes(A, { kind: 'emom', minutes: 10, items: ['x'] })).toBe(35);
    expect(estimateMinutes(A, { kind: 'intervals', workSec: 40, restSec: 20, rounds: 5, items: ['a', 'b', 'c'] })).toBe(40);
    expect(estimateMinutes(A, { kind: 'fortime', capMinutes: 15, items: ['x'] })).toBe(37);
    for (const d of DAYS) expect(estimateMinutes(d)).toBeGreaterThanOrEqual(30);
  });
});

import { weekStart, weekStreak, weekDays } from '../src/logic/stats';
import { describeItem } from '../src/logic/preview';
import type { PlanItem } from '../src/types';

describe('veckostatistik', () => {
  const d = (y: number, m: number, day: number, h = 12) => new Date(y, m - 1, day, h).getTime();
  it('veckan börjar på måndag', () => {
    expect(weekStart(d(2026, 10, 15))).toBe(d(2026, 10, 12, 0));
    expect(weekStart(d(2026, 10, 18, 23))).toBe(d(2026, 10, 12, 0));
    expect(weekStart(d(2026, 10, 19, 0))).toBe(d(2026, 10, 19, 0));
  });
  it('serie: räknar veckor i rad, pågående vecka utan pass bryter inte', () => {
    const times = [d(2026, 9, 29), d(2026, 10, 6), d(2026, 10, 8), d(2026, 10, 13)];
    expect(weekStreak(times, d(2026, 10, 15))).toBe(3);
    expect(weekStreak([d(2026, 10, 6)], d(2026, 10, 15))).toBe(1);
    expect(weekStreak([d(2026, 9, 22)], d(2026, 10, 15))).toBe(0);
    expect(weekStreak([], d(2026, 10, 15))).toBe(0);
  });
  it('veckodagar med pass och idag', () => {
    const days = weekDays(
      [
        { startedAt: d(2026, 10, 12, 18), dayId: 'A' },
        { startedAt: d(2026, 10, 14, 7), dayId: 'B' },
      ],
      d(2026, 10, 15),
    );
    expect(days).toHaveLength(7);
    expect(days.map((x) => x.dayId)).toEqual(['A', undefined, 'B', undefined, undefined, undefined, undefined]);
    expect(days.findIndex((x) => x.today)).toBe(3);
  });
});

describe('förhandsvisning', () => {
  const squat: PlanItem = { exerciseId: 'squat', sets: 4, repsMin: 5, repsMax: 5, restSec: 150, progression: { kind: 'weight', inc: 5 }, slot: 'squat', role: 'main' };
  const log = (w: number | null) => ({ exerciseId: 'squat', sets: [{ weight: w, reps: 5, done: false }] });
  it('visar uppgång mot förra passet', () => {
    expect(describeItem(squat, log(85), { sets: [{ weight: 80, reps: 5, done: true }] })).toMatchObject({ weight: '80 → 85 kg', up: true });
    expect(describeItem(squat, log(85), { sets: [{ weight: 85, reps: 5, done: true }] })).toMatchObject({ weight: '85 kg', up: false });
    expect(describeItem(squat, log(null), undefined)).toMatchObject({ weight: 'ange vikt' });
  });
});

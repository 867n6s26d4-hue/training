import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { evaluateProgression, plannedReps, deloadSets, fmtKg } from '../src/logic/progression';
import { platesPerSide, parsePlates } from '../src/logic/plates';
import {
  buildEmomPlan,
  buildIntervalPlan,
  buildAmrapPlan,
  buildRestPlan,
  stateAt,
  fmtClock,
} from '../src/logic/timerPlan';
import { TimerEngine } from '../src/logic/timerEngine';
import type { SoundId } from '../src/logic/timerPlan';
import type { SetLog, StrengthItem } from '../src/types';
import { DAYS, restText, targetText } from '../src/data/program';

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
  it('programmet: totaltid per pass ryms i 30–40 min inkl. uppvärmning', () => {
    for (const d of DAYS) {
      const h = d.hiit;
      const mins =
        h.kind === 'intervals' ? (h.items.length * h.rounds * (h.workSec + h.restSec) - h.restSec) / 60 : h.minutes;
      expect(mins).toBeGreaterThanOrEqual(10);
      expect(mins).toBeLessThanOrEqual(15);
    }
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
describe('passlängd', () => {
  it('uppskattar A=35, B=40, C=35 min', () => {
    expect(DAYS.map(estimateMinutes)).toEqual([35, 40, 35]);
  });
});

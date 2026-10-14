import type { ExerciseState, ProgressionChange, SetLog, StrengthItem } from '../types';

export function roundTo(x: number, step: number): number {
  return Math.round(x / step) * step;
}

export function fmtKg(w: number | null | undefined): string {
  if (w === null || w === undefined || Number.isNaN(w)) return '–';
  const r = Math.round(w * 100) / 100;
  return String(r).replace('.', ',');
}

export interface EvalResult {
  /** Vikten som ska vara förvald nästa gång */
  weight: number | null;
  failStreak: number;
  change: ProgressionChange;
}

/**
 * Dubbel progression:
 * - Alla planerade set klarade topp-reps => höj vikten (eller föreslå svårare variant för kroppsvikt).
 * - Något set under lägsta reps två pass i rad => sänk 10 %.
 * - Annars behåll.
 * Ofullständiga pass (färre set än planerat) ändrar ingenting.
 */
export function evaluateProgression(
  item: StrengthItem,
  state: Pick<ExerciseState, 'weight' | 'failStreak'> | undefined,
  sets: SetLog[],
): EvalResult {
  const prevWeight = state?.weight ?? null;
  const prevFail = state?.failStreak ?? 0;
  const done = sets.filter((s) => s.done && s.reps !== null);
  const hold = (reason: ProgressionChange['reason'], weight = prevWeight, failStreak = prevFail): EvalResult => ({
    weight,
    failStreak,
    change: { exerciseId: item.exerciseId, from: prevWeight, to: weight, reason },
  });

  if (done.length === 0) return hold('skipped');

  const complete = done.length >= item.sets;
  const allTop = complete && done.every((s) => (s.reps ?? 0) >= item.repsMax);
  const anyFail = done.some((s) => (s.reps ?? 0) < item.repsMin);

  if (item.progression.kind === 'reps') {
    const r = hold(allTop ? 'up' : 'hold', prevWeight, 0);
    if (allTop) r.change.harder = true;
    return r;
  }

  const used = done[0].weight ?? prevWeight;
  if (used === null) return hold('hold');

  if (allTop) {
    const w = used + item.progression.inc;
    return { weight: w, failStreak: 0, change: { exerciseId: item.exerciseId, from: used, to: w, reason: 'up' } };
  }
  if (anyFail && complete) {
    const streak = prevFail + 1;
    if (streak >= 2 && used > 0) {
      let w = roundTo(used * 0.9, 2.5);
      if (w >= used) w = used - 2.5;
      return { weight: w, failStreak: 0, change: { exerciseId: item.exerciseId, from: used, to: w, reason: 'down' } };
    }
    return { weight: used, failStreak: streak, change: { exerciseId: item.exerciseId, from: used, to: used, reason: 'hold' } };
  }
  return { weight: used, failStreak: complete ? 0 : prevFail, change: { exerciseId: item.exerciseId, from: used, to: used, reason: 'hold' } };
}

export function deloadSets(sets: number): number {
  return Math.max(1, Math.round(sets * 0.6));
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Förvalda reps för set i: samma som förra passet om vikten är oförändrad, annars lägsta i intervallet */
export function plannedReps(item: StrengthItem, weight: number | null, last: SetLog | undefined): number {
  if (item.repsMin === item.repsMax) return item.repsMax;
  if (last && last.reps !== null && last.weight === weight) return clamp(last.reps, item.repsMin, item.repsMax);
  return item.repsMin;
}

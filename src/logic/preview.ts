import type { ExerciseLog, PlanItem, SetLog } from '../types';
import { getExercise, targetText } from '../data/program';
import { fmtKg } from './progression';

export interface PreviewRow {
  name: string;
  target: string;
  /** Vikttext, t.ex. "55 kg" eller "50 → 55 kg" */
  weight?: string;
  up: boolean;
}

/** Beskriver en planerad övning för hemskärmen: mål och vikt, med uppgång jämfört med förra passet */
export function describeItem(
  item: PlanItem,
  log: ExerciseLog,
  last: { sets: SetLog[] } | undefined,
): PreviewRow {
  const def = getExercise(item.exerciseId);
  const target = targetText(item.sets, item.repsMin, item.repsMax, item.targetLabel);
  const row: PreviewRow = { name: def.name, target, up: false };
  if (def.kind === 'bodyweight') return row;
  const w = log.sets[0]?.weight ?? null;
  if (w === null) {
    row.weight = 'ange vikt';
    return row;
  }
  const prev = last?.sets.find((s) => s.done)?.weight ?? null;
  const unit = def.kind === 'dumbbell' ? 'kg/hantel' : 'kg';
  if (def.kind === 'weighted-bodyweight') {
    const label = w === 0 ? 'kroppsvikt' : `${w > 0 ? '+' : ''}${fmtKg(w)} kg`;
    row.weight = label;
    row.up = prev !== null && w > prev;
    return row;
  }
  if (prev !== null && prev !== w) {
    row.weight = `${fmtKg(prev)} → ${fmtKg(w)} ${unit}`;
    row.up = w > prev;
  } else {
    row.weight = `${fmtKg(w)} ${unit}`;
  }
  return row;
}

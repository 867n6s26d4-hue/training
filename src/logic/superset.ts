import type { ExerciseLog } from '../types';

/** Index (i passets övningslista) för de två övningarna som körs som superset, eller null */
export function supersetPair(items: { slot: string }[], pair?: [string, string]): [number, number] | null {
  if (!pair) return null;
  const a = items.findIndex((x) => x.slot === pair[0]);
  const b = items.findIndex((x) => x.slot === pair[1]);
  if (a < 0 || b < 0) return null;
  return a < b ? [a, b] : [b, a];
}

/**
 * Vila i sekunder efter att set `j` av övning `i` markerats klart. 0 = ingen vila, fortsätt med partnern.
 * Superset: ingen vila efter första övningen, efter andra övningen vilar man den längre av de två.
 * Har den ena övningen färre set (t.ex. deload) vilar man som vanligt när partnern saknar set.
 */
export function restAfterSet(
  items: { restSec: number }[],
  setCounts: number[],
  pair: [number, number] | null,
  i: number,
  j: number,
): number {
  if (!pair || (i !== pair[0] && i !== pair[1])) return items[i].restSec;
  const [first, second] = pair;
  if (i === first) return setCounts[second] > j ? 0 : items[i].restSec;
  return setCounts[first] > j ? Math.max(items[first].restSec, items[second].restSec) : items[i].restSec;
}

/** Nästa set att göra i supersetet: första ej klara set, varv för varv */
export function nextInSuperset(strength: ExerciseLog[], pair: [number, number] | null): { i: number; j: number } | null {
  if (!pair) return null;
  const rounds = Math.max(strength[pair[0]].sets.length, strength[pair[1]].sets.length);
  for (let j = 0; j < rounds; j++)
    for (const i of pair) if (j < strength[i].sets.length && !strength[i].sets[j].done) return { i, j };
  return null;
}

import type { ExerciseLog } from '../types';

export type Pair = [number, number];

/** Index (i passets övningslista) för varje superset-par, sorterade efter plats i passet */
export function supersetPairs(items: { slot: string }[], pairs?: [string, string][]): Pair[] {
  const out: Pair[] = [];
  for (const [x, y] of pairs ?? []) {
    const a = items.findIndex((it) => it.slot === x);
    const b = items.findIndex((it) => it.slot === y);
    if (a < 0 || b < 0) continue;
    out.push(a < b ? [a, b] : [b, a]);
  }
  return out.sort((p, q) => p[0] - q[0]);
}

function pairOf(pairs: Pair[], i: number): Pair | undefined {
  return pairs.find((p) => p[0] === i || p[1] === i);
}

/**
 * Vila i sekunder efter att set `j` av övning `i` markerats klart. 0 = ingen vila, fortsätt med partnern.
 * Superset: ingen vila efter första övningen, efter andra övningen vilar man den längre av de två.
 * Har den ena övningen färre set (t.ex. deload) vilar man som vanligt när partnern saknar set.
 */
export function restAfterSet(
  items: { restSec: number }[],
  setCounts: number[],
  pairs: Pair[],
  i: number,
  j: number,
): number {
  const pair = pairOf(pairs, i);
  if (!pair) return items[i].restSec;
  const [first, second] = pair;
  if (i === first) return setCounts[second] > j ? 0 : items[i].restSec;
  return setCounts[first] > j ? Math.max(items[first].restSec, items[second].restSec) : items[i].restSec;
}

/**
 * Nästa set att göra i hela styrkedelen: övningarna i ordning, och i ett superset varv för varv.
 * Returnerar null när allt är klart.
 */
export function nextSet(strength: ExerciseLog[], pairs: Pair[]): { i: number; j: number } | null {
  for (let i = 0; i < strength.length; i++) {
    const pair = pairOf(pairs, i);
    if (pair) {
      if (i !== pair[0]) continue;
      const rounds = Math.max(strength[pair[0]].sets.length, strength[pair[1]].sets.length);
      for (let j = 0; j < rounds; j++)
        for (const k of pair) if (j < strength[k].sets.length && !strength[k].sets[j].done) return { i: k, j };
      continue;
    }
    const j = strength[i].sets.findIndex((s) => !s.done);
    if (j >= 0) return { i, j };
  }
  return null;
}

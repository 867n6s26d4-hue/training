import type { ExerciseDef, SlotDef, StrengthItem } from '../types';

/**
 * L, Tyngdlyftning: ett lyftpass med tyngdlyftningens dragmoment, anpassat till garaget.
 * Takhöjden är ca 2 m och det finns inget ställ, så inget lyft går över huvudet. Passet använder därför
 * hela dragdelen (power clean, hang clean, drag, hopp) plus frontböj, där stången alltid slutar vid axlarna.
 * Ryck och stöt (jerk) ingår medvetet inte. Tekniken tränas först när man är fräsch och vikterna är måttliga.
 */
const w = (inc: number) => ({ kind: 'weight', inc }) as const;
const reps = { kind: 'reps' } as const;

function item(
  exerciseId: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec: number,
  progression: StrengthItem['progression'],
): StrengthItem {
  return { exerciseId, sets, repsMin, repsMax, restSec, progression };
}

export const LIFT_EXERCISES: Record<string, ExerciseDef> = {
  jumpshrug: {
    id: 'jumpshrug',
    name: 'Hoppande axelryckning',
    note: 'Stången hängande vid låren, hoppa explosivt och rycka axlarna upp. Armarna är raka. Lätt vikt',
    kind: 'barbell',
  },
  dbclean: {
    id: 'dbclean',
    name: 'Hantel power clean',
    note: 'En hantel från golvet till axeln i en rörelse. Tänk höfter, inte armar. Vikt per hantel',
    kind: 'dumbbell',
    repsSuffix: '/arm',
  },
  benchjump: {
    id: 'benchjump',
    name: 'Hopp upp på bänk',
    note: 'Explosivt hopp upp på stabil bänk, landa mjukt och kliv ner. Skriv extra vikt som plus',
    kind: 'weighted-bodyweight',
  },
  pclean: {
    id: 'pclean',
    name: 'Power clean från golvet',
    note: 'Stång från golvet, fånga på axlarna högt över knäböjsdjup. Stången går aldrig över huvudet. Släpp bara om skivorna och golvet tål det',
    kind: 'barbell',
  },
  hangclean: {
    id: 'hangclean',
    name: 'Hang power clean',
    note: 'Starta med stången strax ovanför knäna, fånga på axlarna. Stången går aldrig över huvudet',
    kind: 'barbell',
  },
  cleanpull: {
    id: 'cleanpull',
    name: 'Clean pull',
    note: 'Som power clean utan att fånga: sträck hela kroppen och rycka axlarna, sänk kontrollerat. Får vara tyngre än clean',
    kind: 'barbell',
  },
  snatchpull: {
    id: 'snatchpull',
    name: 'Ryckdrag (bred grepp)',
    note: 'Brett grepp, dra till bröstet med armbågarna ut och sänk igen. Ingen fångst, stången går aldrig över huvudet',
    kind: 'barbell',
  },
  fsquat: {
    id: 'fsquat',
    name: 'Frontböj',
    note: 'Clean (eller power clean) upp till axlarna, böj med högt armbågsläge, sänk stången kontrollerat efteråt',
    kind: 'barbell',
  },
  pausefsquat: {
    id: 'pausefsquat',
    name: 'Frontböj med paus',
    note: 'Som frontböj men 2 s paus i botten. Lättare vikt än vanlig frontböj',
    kind: 'barbell',
  },
};

export const LIFT_SLOTS: SlotDef[] = [
  {
    slot: 'jump',
    role: 'accessory',
    options: [item('jumpshrug', 3, 5, 5, 60, w(2.5)), item('dbclean', 3, 5, 6, 60, w(2.5)), item('benchjump', 3, 5, 6, 60, w(2.5))],
  },
  { slot: 'clean', role: 'main', options: [item('pclean', 5, 3, 3, 90, w(2.5)), item('hangclean', 5, 3, 3, 90, w(2.5))] },
  { slot: 'pull', role: 'main', options: [item('cleanpull', 4, 3, 3, 90, w(5)), item('snatchpull', 4, 3, 3, 90, w(2.5))] },
  { slot: 'squat', role: 'main', options: [item('fsquat', 3, 4, 5, 120, w(2.5)), item('pausefsquat', 3, 4, 5, 120, w(2.5))] },
  { slot: 'post', role: 'accessory', options: [item('rdl', 3, 6, 8, 90, w(5)), item('singlerdl', 3, 6, 8, 90, w(2.5))] },
  {
    slot: 'core',
    role: 'accessory',
    options: [item('hangleg', 3, 8, 12, 60, reps), item('hangknee', 3, 10, 15, 60, reps), item('hollow', 3, 20, 40, 60, reps)],
  },
];

export const LIFT_PAIRS: [string, string][] = [['post', 'core']];

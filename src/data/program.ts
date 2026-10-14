import type { DayDef, DayId, ExerciseDef } from '../types';

export const EXERCISES: Record<string, ExerciseDef> = {
  squat: { id: 'squat', name: 'Knäböj', note: 'Frontböj (clean till axlarna) eller bakböj', kind: 'barbell' },
  bench: { id: 'bench', name: 'Bänkpress', note: 'Skivstång. Utan spotter: kör hantelpress', kind: 'barbell' },
  ringrow: {
    id: 'ringrow',
    name: 'Ringrodd',
    note: 'Fötterna framför kroppen, svårare = mer horisontell',
    kind: 'bodyweight',
  },
  deadlift: { id: 'deadlift', name: 'Marklyft', note: 'Skivstång från golv, neutral rygg', kind: 'barbell' },
  inclinepress: {
    id: 'inclinepress',
    name: 'Lutande hantelpress',
    note: 'Bänken uppställd ca 30–45°. Vikt per hantel',
    kind: 'dumbbell',
  },
  bulgarian: {
    id: 'bulgarian',
    name: 'Bulgarisk utfallsböj',
    note: 'Hantlar, bakre foten på bänken. Vikt per hantel',
    kind: 'dumbbell',
    repsSuffix: 'per ben',
  },
  chins: {
    id: 'chins',
    name: 'Chins',
    note: 'Mål 3–6 reps per set. Minus = bandassistans, plus = extra vikt',
    kind: 'weighted-bodyweight',
  },
  rdl: { id: 'rdl', name: 'Rumänskt marklyft', note: 'Skivstång, lätt böjda knän, rak rygg', kind: 'barbell' },
  dips: { id: 'dips', name: 'Dips', note: 'Ringar eller bänkdips', kind: 'bodyweight' },
};

export const DAYS: DayDef[] = [
  {
    id: 'A',
    title: 'Ben + bröst + rygg',
    focus: 'Knäböj, bänkpress, ringrodd',
    warmup: 'Lätta set av knäböjen (t.ex. 2×5 med tom stång och 50 %), armcirklar, några bandrodd.',
    strength: [
      { exerciseId: 'squat', sets: 4, repsMin: 5, repsMax: 5, restSec: 150, progression: { kind: 'weight', inc: 5 } },
      { exerciseId: 'bench', sets: 4, repsMin: 5, repsMax: 5, restSec: 150, progression: { kind: 'weight', inc: 2.5 } },
      { exerciseId: 'ringrow', sets: 3, repsMin: 8, repsMax: 10, restSec: 90, progression: { kind: 'reps' } },
    ],
    hiitTitle: 'EMOM 10 min',
    hiit: {
      kind: 'emom',
      minutes: 10,
      items: ['12 hantelsvingar (en hantel, båda händer)', '10 armhävningar på ringarna (eller i golvet)'],
    },
  },
  {
    id: 'B',
    title: 'Marklyft + ben + press',
    focus: 'Marklyft, lutande press, bulgarisk böj',
    warmup: 'Lätta set marklyft (tom stång, sedan 50 %), höftmobilitet, 10 gobletböj med lätt hantel.',
    strength: [
      { exerciseId: 'deadlift', sets: 4, repsMin: 5, repsMax: 5, restSec: 150, progression: { kind: 'weight', inc: 5 } },
      { exerciseId: 'inclinepress', sets: 3, repsMin: 8, repsMax: 10, restSec: 120, progression: { kind: 'weight', inc: 2.5 } },
      { exerciseId: 'bulgarian', sets: 3, repsMin: 8, repsMax: 8, restSec: 90, progression: { kind: 'weight', inc: 2.5 } },
    ],
    hiitTitle: '5 varv · 40 s arbete / 20 s vila',
    hiit: {
      kind: 'intervals',
      workSec: 40,
      restSec: 20,
      rounds: 5,
      items: ['Gobletböj (en hantel mot bröstet)', 'Gummibandsrodd (bandet fäst i dörren)', 'Burpees'],
    },
  },
  {
    id: 'C',
    title: 'Drag + baksida lår + triceps',
    focus: 'Chins, rumänskt marklyft, dips',
    warmup: 'Hänga i stången 2×20 s, 8 skulderblads-chins (scapula pull), lätta set rumänskt marklyft.',
    strength: [
      {
        exerciseId: 'chins',
        sets: 4,
        repsMin: 3,
        repsMax: 6,
        restSec: 150,
        progression: { kind: 'weight', inc: 2.5 },
        targetLabel: '4 × max',
      },
      { exerciseId: 'rdl', sets: 3, repsMin: 8, repsMax: 8, restSec: 120, progression: { kind: 'weight', inc: 5 } },
      { exerciseId: 'dips', sets: 3, repsMin: 8, repsMax: 10, restSec: 90, progression: { kind: 'reps' } },
    ],
    hiitTitle: 'AMRAP 10 min',
    hiit: {
      kind: 'amrap',
      minutes: 10,
      items: [
        '8 hantelrodd per arm',
        '10 hopp-utfall (eller utfall med hantlar)',
        '12 bandpress från dörren',
        '30 s plankan',
      ],
    },
  },
];

export function getDay(id: DayId): DayDef {
  const d = DAYS.find((x) => x.id === id);
  if (!d) throw new Error('Okänt pass: ' + id);
  return d;
}

export function getExercise(id: string): ExerciseDef {
  const e = EXERCISES[id];
  if (!e) throw new Error('Okänd övning: ' + id);
  return e;
}

export function targetText(sets: number, repsMin: number, repsMax: number, label?: string): string {
  if (label) return label;
  return repsMin === repsMax ? `${sets} × ${repsMax}` : `${sets} × ${repsMin}–${repsMax}`;
}

export function restText(sec: number): string {
  if (sec >= 120 && sec % 60 === 30) return `${Math.floor(sec / 60)}–${Math.floor(sec / 60) + 1} min`;
  if (sec >= 120) return `${Math.round(sec / 60)} min`;
  return `${sec} s`;
}

/** Uppskattad passlängd i minuter: uppvärmning + styrka (ca 22 min enligt programmet) + HIIT */
export function estimateMinutes(day: DayDef): number {
  const h = day.hiit;
  const hiit =
    h.kind === 'intervals' ? (h.items.length * h.rounds * (h.workSec + h.restSec) - h.restSec) / 60 : h.minutes;
  return Math.round(3 + 22 + hiit);
}

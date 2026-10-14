import type { DayDef, DayId, ExerciseDef, HiitSpec, SlotDef, StrengthItem } from '../types';

export const EXERCISES: Record<string, ExerciseDef> = {
  // Baslyft
  squat: { id: 'squat', name: 'Knäböj', note: 'Frontböj (clean till axlarna) eller bakböj', kind: 'barbell' },
  dbsquat: {
    id: 'dbsquat',
    name: 'Hantelknäböj',
    note: 'En hantel per axel, eller hantlar hållna vid axlarna. Vikt per hantel',
    kind: 'dumbbell',
  },
  bench: { id: 'bench', name: 'Bänkpress', note: 'Skivstång. Utan spotter: kör hantelpress', kind: 'barbell' },
  dbbench: { id: 'dbbench', name: 'Hantelbänkpress', note: 'Vikt per hantel', kind: 'dumbbell' },
  deadlift: { id: 'deadlift', name: 'Marklyft', note: 'Skivstång från golv, neutral rygg', kind: 'barbell' },
  sumo: { id: 'sumo', name: 'Sumomarklyft', note: 'Bred stans, tårna utåt, skivstång från golv', kind: 'barbell' },
  chins: {
    id: 'chins',
    name: 'Chins',
    note: 'Mål 3–6 reps per set. Minus = bandassistans, plus = extra vikt',
    kind: 'weighted-bodyweight',
  },
  supchins: {
    id: 'supchins',
    name: 'Chins underhandsgrepp',
    note: 'Handflatorna mot dig. Minus = bandassistans, plus = extra vikt',
    kind: 'weighted-bodyweight',
  },
  ringchins: {
    id: 'ringchins',
    name: 'Ringchins',
    note: 'Ringarna i stången, vrid handlederna utåt i toppen. Minus = band, plus = vikt',
    kind: 'weighted-bodyweight',
  },
  rdl: { id: 'rdl', name: 'Rumänskt marklyft', note: 'Skivstång, lätt böjda knän, rak rygg', kind: 'barbell' },
  singlerdl: {
    id: 'singlerdl',
    name: 'Enbens rumänskt marklyft',
    note: 'Hantlar, stöd med fingrarna mot något vid behov. Vikt per hantel',
    kind: 'dumbbell',
    repsSuffix: '/ben',
  },
  // Komplement: rygg
  ringrow: {
    id: 'ringrow',
    name: 'Ringrodd',
    note: 'Fötterna framför kroppen, svårare = mer horisontell',
    kind: 'bodyweight',
  },
  dbrow: { id: 'dbrow', name: 'Hantelrodd, en arm', note: 'Stöd mot bänken. Vikt per hantel', kind: 'dumbbell', repsSuffix: '/arm' },
  bandrow: { id: 'bandrow', name: 'Bandrodd', note: 'Bandet fäst i dörren. Skriv bandfärg', kind: 'bodyweight' },
  // Komplement: press
  inclinepress: {
    id: 'inclinepress',
    name: 'Lutande hantelpress',
    note: 'Bänken uppställd ca 30–45°. Vikt per hantel',
    kind: 'dumbbell',
  },
  floorpress: { id: 'floorpress', name: 'Hantelpress på golvet', note: 'Ligg på golvet, armbågar mot golvet. Vikt per hantel', kind: 'dumbbell' },
  ringpushup: { id: 'ringpushup', name: 'Armhävningar på ringar', note: 'Lägre ringar eller fötterna högre = svårare', kind: 'bodyweight' },
  // Komplement: ben
  bulgarian: {
    id: 'bulgarian',
    name: 'Bulgarisk utfallsböj',
    note: 'Hantlar, bakre foten på bänken. Vikt per hantel',
    kind: 'dumbbell',
    repsSuffix: '/ben',
  },
  lunge: { id: 'lunge', name: 'Baklänges utfall', note: 'Hantlar. Vikt per hantel', kind: 'dumbbell', repsSuffix: '/ben' },
  stepup: { id: 'stepup', name: 'Step-up på bänk', note: 'Hantlar, tryck med främre benet. Vikt per hantel', kind: 'dumbbell', repsSuffix: '/ben' },
  // Komplement: triceps
  dips: { id: 'dips', name: 'Dips', note: 'Ringar eller bänkdips', kind: 'bodyweight' },
  bandpushdown: { id: 'bandpushdown', name: 'Triceps-pushdown med band', note: 'Bandet fäst högt i dörren. Skriv bandfärg', kind: 'bodyweight' },
  skull: { id: 'skull', name: 'Liggande tricepspress', note: 'Hantlar, liggande på bänken. Vikt per hantel', kind: 'dumbbell' },
};

const w = (inc: number) => ({ kind: 'weight', inc }) as const;
const reps = { kind: 'reps' } as const;

function item(
  exerciseId: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec: number,
  progression: StrengthItem['progression'],
  targetLabel?: string,
): StrengthItem {
  return { exerciseId, sets, repsMin, repsMax, restSec, progression, targetLabel };
}

const chinItem = (id: string) => item(id, 4, 3, 6, 150, w(2.5), '4 × max');

const slotsA: SlotDef[] = [
  { slot: 'squat', role: 'main', options: [item('squat', 4, 5, 5, 150, w(5)), item('dbsquat', 4, 8, 8, 120, w(2.5))] },
  { slot: 'bench', role: 'main', options: [item('bench', 4, 5, 5, 150, w(2.5)), item('dbbench', 4, 6, 8, 150, w(2.5))] },
  {
    slot: 'row',
    role: 'accessory',
    options: [item('ringrow', 3, 8, 10, 90, reps), item('dbrow', 3, 8, 10, 90, w(2.5)), item('bandrow', 3, 12, 15, 90, reps)],
  },
];
const slotsB: SlotDef[] = [
  { slot: 'deadlift', role: 'main', options: [item('deadlift', 4, 5, 5, 150, w(5)), item('sumo', 4, 5, 5, 150, w(5))] },
  {
    slot: 'press',
    role: 'accessory',
    options: [item('inclinepress', 3, 8, 10, 120, w(2.5)), item('floorpress', 3, 8, 10, 120, w(2.5)), item('ringpushup', 3, 8, 12, 90, reps)],
  },
  {
    slot: 'legs',
    role: 'accessory',
    options: [item('bulgarian', 3, 8, 8, 90, w(2.5)), item('lunge', 3, 8, 8, 90, w(2.5)), item('stepup', 3, 8, 8, 90, w(2.5))],
  },
];
const slotsC: SlotDef[] = [
  { slot: 'chins', role: 'main', options: [chinItem('chins'), chinItem('supchins'), chinItem('ringchins')] },
  { slot: 'rdl', role: 'main', options: [item('rdl', 3, 8, 8, 120, w(5)), item('singlerdl', 3, 8, 8, 120, w(2.5))] },
  {
    slot: 'tri',
    role: 'accessory',
    options: [item('dips', 3, 8, 10, 90, reps), item('bandpushdown', 3, 12, 15, 90, reps), item('skull', 3, 10, 12, 90, w(2.5))],
  },
];

export const DAYS: DayDef[] = [
  {
    id: 'A',
    title: 'Ben + bröst + rygg',
    focus: 'Knäböj, bänkpress, rodd',
    warmup: 'Lätta set av knäböjen (t.ex. 2×5 med tom stång och 50 %), armcirklar, några bandrodd.',
    slots: slotsA,
    hiitOptions: [
      { kind: 'emom', minutes: 10, items: ['12 hantelsvingar (en hantel, båda händer)', '10 armhävningar på ringarna (eller i golvet)'] },
      { kind: 'emom', minutes: 10, items: ['12 gobletböj (en hantel mot bröstet)', '12 bandrodd (bandet i dörren)'] },
      { kind: 'emom', minutes: 10, items: ['10 hopp-utfall (eller utfall med hantlar)', '8 ringrodd (fötterna fram)'] },
    ],
  },
  {
    id: 'B',
    title: 'Marklyft + ben + press',
    focus: 'Marklyft, press, enbensböj',
    warmup: 'Lätta set marklyft (tom stång, sedan 50 %), höftmobilitet, 10 gobletböj med lätt hantel.',
    slots: slotsB,
    hiitOptions: [
      { kind: 'intervals', workSec: 40, restSec: 20, rounds: 5, items: ['Gobletböj (en hantel mot bröstet)', 'Gummibandsrodd (bandet fäst i dörren)', 'Burpees'] },
      { kind: 'intervals', workSec: 40, restSec: 20, rounds: 5, items: ['Hantelmarklyft (två lätta hantlar)', 'Armhävningar', 'Mountain climbers'] },
      { kind: 'intervals', workSec: 40, restSec: 20, rounds: 5, items: ['Step-up med hantlar', 'Bandpress från dörren', 'Hantelsvingar'] },
    ],
  },
  {
    id: 'C',
    title: 'Drag + baksida lår + triceps',
    focus: 'Chins, rumänskt marklyft, triceps',
    warmup: 'Hänga i stången 2×20 s, 8 skulderblads-chins (scapula pull), lätta set rumänskt marklyft.',
    slots: slotsC,
    hiitOptions: [
      { kind: 'amrap', minutes: 10, items: ['8 hantelrodd per arm', '10 hopp-utfall (eller utfall med hantlar)', '12 bandpress från dörren', '30 s plankan'] },
      { kind: 'amrap', minutes: 10, items: ['8 hantelrodd per arm', '12 gobletböj', '10 armhävningar', '30 s plankan'] },
      { kind: 'amrap', minutes: 10, items: ['10 bandrodd', '10 hantelmarklyft (två lätta hantlar)', '8 dips på bänk', '20 mountain climbers'] },
    ],
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

export function getSlot(dayId: DayId, slot: string): SlotDef {
  const s = getDay(dayId).slots.find((x) => x.slot === slot);
  if (!s) throw new Error(`Okänd plats: ${dayId}/${slot}`);
  return s;
}

/** Baslyft väljs efter block, komplement efter hur många pass av den här sorten som gjorts */
export function pickOption(slot: SlotDef, block: number, rotation: number): { item: StrengthItem; variant: number } {
  const n = slot.options.length;
  const variant = (slot.role === 'main' ? block : rotation) % n;
  return { item: slot.options[variant], variant };
}

export function hiitTitleFor(spec: HiitSpec): string {
  switch (spec.kind) {
    case 'emom':
      return `EMOM ${spec.minutes} min`;
    case 'amrap':
      return `AMRAP ${spec.minutes} min`;
    case 'intervals':
      return `${spec.rounds} varv · ${spec.workSec} s arbete / ${spec.restSec} s vila`;
  }
}

export function hiitMinutes(h: HiitSpec): number {
  return h.kind === 'intervals' ? (h.items.length * h.rounds * (h.workSec + h.restSec) - h.restSec) / 60 : h.minutes;
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
  return Math.round(3 + 22 + hiitMinutes(day.hiitOptions[0]));
}

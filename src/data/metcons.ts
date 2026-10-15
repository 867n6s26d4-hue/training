import type { DayId, HiitSpec } from '../types';

/**
 * Bank med metcon-pass för garagegymmet: hantlar, räcke, ringar, skivstång (från golvet, ingen rack),
 * bänk och gummiband. Inga lyft över huvudet (låg takhöjd), inget löpning eller hopprep.
 * Klassiska benchmark-pass är anpassade: Cindy, Chelsea, Barbara, Helen, Fran, Diane och Elizabeth.
 * `avoid` anger vilka passdagar som inte ska få passet, för att inte belasta samma sak som baslyften.
 */
export interface Metcon {
  id: string;
  spec: HiitSpec;
  avoid?: DayId[];
}

export const METCONS: Metcon[] = [
  // ---- På tid: fast antal så fort som möjligt
  {
    id: 'ft-fran',
    avoid: ['C'],
    spec: {
      kind: 'fortime',
      name: 'Fran (utan press)',
      capMinutes: 10,
      note: 'Benchmark Fran, men gobletböj i stället för thrusters. Hanteln mot bröstet.',
      items: ['21 gobletböj + 21 chins', '15 gobletböj + 15 chins', '9 gobletböj + 9 chins'],
    },
  },
  {
    id: 'ft-barbara',
    avoid: ['C'],
    spec: {
      kind: 'fortime',
      name: 'Barbara (kort)',
      capMinutes: 20,
      rounds: 3,
      note: 'Benchmark Barbara i kortare version. Ta paus mellan varven vid behov, klockan går.',
      items: ['10 chins', '15 armhävningar', '20 situps', '25 luftböj'],
    },
  },
  {
    id: 'ft-diane',
    avoid: ['B', 'C'],
    spec: {
      kind: 'fortime',
      name: 'Diane (hemma)',
      capMinutes: 10,
      note: 'Benchmark Diane. Lätt stång, ringarmhävningar med fötterna upphöjda i stället för handstående.',
      items: ['21 stångmarklyft (lätt) + 21 ringarmhävningar', '15 + 15', '9 + 9'],
    },
  },
  {
    id: 'ft-helen',
    avoid: ['C'],
    spec: {
      kind: 'fortime',
      name: 'Helen (hemma)',
      capMinutes: 15,
      rounds: 3,
      note: 'Benchmark Helen, men hopp-utfall i stället för löpning.',
      items: ['21 hantelsvingar (en hantel, båda händer)', '12 chins', '30 hopp-utfall (totalt)'],
    },
  },
  {
    id: 'ft-bench',
    avoid: ['C'],
    spec: {
      kind: 'fortime',
      name: 'Bänkrundan',
      capMinutes: 15,
      rounds: 4,
      items: ['15 step-ups på bänk (hantlar)', '12 dips på bänk', '10 situps', '8 burpees'],
    },
  },
  {
    id: 'ft-chipper',
    spec: {
      kind: 'fortime',
      name: 'Hantelchipper',
      capMinutes: 15,
      note: 'Ett varv, gör allt i ordning. Dela upp setten så du inte går sönder tidigt.',
      items: ['50 hantelsvingar', '40 gobletböj', '30 ringrodd', '20 armhävningar', '10 burpees'],
    },
  },
  {
    id: 'ft-elizabeth',
    avoid: ['C'],
    spec: {
      kind: 'fortime',
      name: 'Elizabeth (hemma)',
      capMinutes: 10,
      note: 'Benchmark Elizabeth, men gobletböj i stället för cleans.',
      items: ['21 ringdips + 21 gobletböj', '15 + 15', '9 + 9'],
    },
  },

  // ---- AMRAP: så många varv som möjligt
  {
    id: 'am-cindy',
    avoid: ['C'],
    spec: {
      kind: 'amrap',
      name: 'Cindy',
      minutes: 12,
      note: 'Benchmark Cindy, 12 minuter i stället för 20.',
      items: ['5 chins', '10 armhävningar', '15 luftböj'],
    },
  },
  {
    id: 'am-dbfive',
    avoid: ['A'],
    spec: {
      kind: 'amrap',
      name: 'Hantelfyran',
      minutes: 12,
      items: ['10 gobletböj', '8 hantelrodd per arm', '10 armhävningar', '20 mountain climbers (totalt)'],
    },
  },
  {
    id: 'am-deadburp',
    avoid: ['B', 'C'],
    spec: {
      kind: 'amrap',
      name: 'Marklyft och burpees',
      minutes: 10,
      note: 'Lätt stång, ca 50 % av din marklyftsvikt.',
      items: ['8 stångmarklyft', '6 burpees över stången', '10 situps'],
    },
  },
  {
    id: 'am-rings',
    avoid: ['A'],
    spec: {
      kind: 'amrap',
      name: 'Ringar och ben',
      minutes: 12,
      items: ['8 ringrodd', '8 armhävningar med fötterna upphöjda', '12 luftböj', '10 V-ups'],
    },
  },
  {
    id: 'am-bench',
    avoid: ['C'],
    spec: {
      kind: 'amrap',
      name: 'Bänktriplett',
      minutes: 10,
      items: ['12 step-ups på bänk (hantlar)', '8 dips på bänk', '10 mountain climbers per ben'],
    },
  },
  {
    id: 'am-short',
    spec: {
      kind: 'amrap',
      name: 'Kort och elakt',
      minutes: 8,
      note: 'Kort, så kör hårt från start.',
      items: ['10 hantelsvingar', '10 burpees'],
    },
  },

  // ---- EMOM: varje minut
  {
    id: 'em-chelsea',
    avoid: ['C'],
    spec: {
      kind: 'emom',
      name: 'Chelsea',
      minutes: 15,
      note: 'Benchmark Chelsea, 15 minuter i stället för 30. Allt görs varje minut.',
      items: ['5 chins + 10 armhävningar + 15 luftböj'],
    },
  },
  {
    id: 'em-three',
    avoid: ['A'],
    spec: {
      kind: 'emom',
      name: 'Trean',
      minutes: 12,
      items: ['12 hantelsvingar', '10 armhävningar', '8 ringrodd'],
    },
  },
  {
    id: 'em-legs',
    avoid: ['B'],
    spec: {
      kind: 'emom',
      name: 'Benpump',
      minutes: 12,
      items: ['10 gobletböj + 10 hopp-utfall (totalt)', '10 armhävningar + 20 mountain climbers'],
    },
  },
  {
    id: 'em-core',
    spec: {
      kind: 'emom',
      name: 'Core-EMOM',
      minutes: 12,
      items: ['40 s planka', '10 situps', '8 burpees'],
    },
  },
  {
    id: 'em-swing',
    avoid: ['C'],
    spec: {
      kind: 'emom',
      name: 'Svingar och drag',
      minutes: 14,
      items: ['12 hantelsvingar', '6 chins'],
    },
  },

  // ---- E2MOM: varannan minut
  {
    id: 'e2-mix',
    avoid: ['A'],
    spec: {
      kind: 'e2mom',
      name: 'E2MOM Mix',
      minutes: 16,
      note: 'Två block som växlar. Du får vila resten av de två minuterna.',
      items: [
        '10 gobletböj + 8 hantelrodd per arm + 10 armhävningar',
        '12 bandrodd + 10 hopp-utfall + 30 s planka',
      ],
    },
  },
  {
    id: 'e2-pull',
    avoid: ['C'],
    spec: {
      kind: 'e2mom',
      name: 'E2MOM Drag',
      minutes: 16,
      items: ['5 chins + 10 ringarmhävningar', '12 hantelsvingar + 10 situps'],
    },
  },
  {
    id: 'e2-legs',
    avoid: ['B'],
    spec: {
      kind: 'e2mom',
      name: 'E2MOM Ben',
      minutes: 12,
      items: ['12 gobletböj + 10 baklängesutfall (5/ben)', '10 step-ups på bänk (hantlar) + 10 situps'],
    },
  },

  // ---- Intervaller: arbete och vila
  {
    id: 'in-goblet',
    spec: {
      kind: 'intervals',
      name: 'Intervaller 1',
      workSec: 40,
      restSec: 20,
      rounds: 5,
      items: ['Gobletböj (en hantel mot bröstet)', 'Gummibandsrodd (bandet fäst i dörren)', 'Burpees'],
    },
  },
  {
    id: 'in-pushdead',
    avoid: ['B', 'C'],
    spec: {
      kind: 'intervals',
      name: 'Intervaller 2',
      workSec: 40,
      restSec: 20,
      rounds: 5,
      items: ['Hantelmarklyft (två lätta hantlar)', 'Armhävningar', 'Mountain climbers'],
    },
  },
  {
    id: 'in-stepup',
    avoid: ['B'],
    spec: {
      kind: 'intervals',
      name: 'Intervaller 3',
      workSec: 40,
      restSec: 20,
      rounds: 5,
      items: ['Step-up med hantlar', 'Bandpress från dörren', 'Hantelsvingar'],
    },
  },
];

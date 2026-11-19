/**
 * Egna, enkla streckfigurer för rörlighetsstegen (ritade som SVG-data, inga externa bilder).
 * Koordinater i rutan 200 × 110, golvet ligger på y = 98. Figuren ritas i textfärgen (currentColor):
 *  - body: bålen, tjockast
 *  - near: närmaste armar och ben
 *  - far: avlägsna armar och ben, tonade
 *  - prop: vägg, räcke och liknande
 *  - band: gummiband (streckat)
 * Poser som ligger ner är ritade uppifrån (floor: false), resten från sidan eller framifrån.
 */
export type Pt = [number, number];
export interface PosePart {
  k: 'body' | 'near' | 'far' | 'prop' | 'band';
  p: Pt[];
}
export interface Pose {
  head: Pt;
  parts: PosePart[];
  floor?: boolean;
}

const body = (...p: Pt[]): PosePart => ({ k: 'body', p });
const near = (...p: Pt[]): PosePart => ({ k: 'near', p });
const far = (...p: Pt[]): PosePart => ({ k: 'far', p });
const prop = (...p: Pt[]): PosePart => ({ k: 'prop', p });
const band = (...p: Pt[]): PosePart => ({ k: 'band', p });

export const POSES: Record<string, Pose> = {
  child: {
    head: [112, 90],
    parts: [
      near([50, 95], [82, 95], [56, 76]),
      body([56, 74], [80, 70], [100, 82]),
      near([100, 84], [146, 95]),
      far([100, 86], [152, 96]),
    ],
  },
  catcow: {
    head: [130, 76],
    parts: [
      far([68, 62], [68, 94], [40, 96]),
      far([124, 64], [128, 96]),
      body([62, 62], [78, 52], [98, 50], [118, 62]),
      near([62, 62], [62, 94], [34, 96]),
      near([118, 62], [122, 96]),
    ],
  },
  dog: {
    head: [127, 72],
    parts: [
      far([58, 96], [82, 40]),
      far([118, 58], [150, 96]),
      body([80, 40], [114, 58]),
      near([46, 96], [80, 40]),
      near([114, 58], [142, 96]),
    ],
  },
  wgs: {
    head: [114, 38],
    parts: [
      near([28, 96], [54, 92], [80, 72]),
      near([80, 72], [112, 66], [112, 96]),
      body([80, 72], [104, 48]),
      near([104, 48], [122, 74], [130, 96]),
      near([104, 48], [108, 26], [110, 6]),
    ],
  },
  lunge: {
    head: [86, 22],
    parts: [
      near([28, 96], [54, 92], [80, 72]),
      near([80, 72], [112, 66], [112, 96]),
      body([80, 72], [84, 36]),
      near([84, 38], [106, 10]),
      far([84, 38], [100, 4]),
    ],
  },
  pigeon: {
    head: [24, 90],
    parts: [
      body([36, 92], [88, 92]),
      far([88, 92], [126, 80], [112, 60]),
      near([88, 92], [114, 58], [90, 50]),
      near([46, 90], [78, 64], [100, 58]),
    ],
  },
  ninety: {
    head: [92, 32],
    parts: [
      far([92, 88], [64, 90], [80, 97]),
      body([92, 88], [92, 46]),
      near([92, 88], [128, 88], [118, 96]),
      near([92, 50], [108, 74], [118, 92]),
    ],
  },
  squat: {
    head: [90, 34],
    parts: [
      body([84, 84], [88, 48]),
      near([84, 84], [108, 68], [86, 94], [100, 96]),
      near([88, 50], [108, 66], [94, 58]),
    ],
  },
  needle: {
    head: [124, 90],
    parts: [
      near([62, 62], [62, 94], [34, 96]),
      body([62, 62], [90, 66], [108, 76]),
      far([108, 78], [150, 94]),
      near([108, 76], [124, 84], [132, 96]),
    ],
  },
  cobra: {
    head: [118, 50],
    parts: [
      near([66, 92], [24, 95]),
      body([66, 92], [88, 86], [106, 64]),
      near([106, 64], [110, 96]),
    ],
  },
  hang: {
    floor: false,
    head: [100, 26],
    parts: [
      prop([56, 6], [144, 6]),
      near([78, 8], [92, 40]),
      near([122, 8], [108, 40]),
      body([100, 40], [100, 70]),
      near([100, 70], [95, 96]),
      near([100, 70], [105, 96]),
    ],
  },
  twist: {
    floor: false,
    head: [24, 55],
    parts: [
      far([40, 55], [40, 22]),
      far([40, 55], [40, 88]),
      body([34, 55], [92, 55]),
      far([92, 55], [124, 78], [100, 92]),
      near([92, 55], [116, 72], [90, 84]),
    ],
  },
  rest: {
    floor: false,
    head: [24, 55],
    parts: [
      far([44, 55], [84, 34]),
      far([44, 55], [84, 76]),
      body([34, 55], [92, 55]),
      near([92, 55], [160, 50]),
      near([92, 55], [160, 62]),
    ],
  },
  hamstring: {
    head: [24, 90],
    parts: [
      far([88, 92], [150, 92]),
      body([36, 92], [88, 92]),
      near([88, 92], [102, 34]),
      near([44, 90], [72, 62]),
      band([72, 62], [102, 34]),
    ],
  },
  butterfly: {
    head: [128, 46],
    parts: [
      far([88, 90], [112, 95], [124, 95]),
      body([88, 88], [104, 70], [116, 56]),
      near([88, 88], [104, 94], [126, 95]),
      near([116, 58], [126, 78], [124, 94]),
    ],
  },
  ankle: {
    head: [116, 12],
    parts: [
      prop([160, 4], [160, 98]),
      far([118, 48], [96, 96]),
      body([118, 48], [116, 22]),
      near([118, 48], [152, 72], [124, 96], [140, 96]),
      near([116, 24], [154, 32]),
    ],
  },
  happybaby: {
    head: [24, 90],
    parts: [
      body([36, 92], [94, 92]),
      far([94, 92], [88, 52], [104, 34]),
      near([94, 92], [74, 56], [92, 32]),
      near([46, 90], [70, 60], [92, 34]),
    ],
  },
  chestwall: {
    head: [94, 16],
    parts: [
      prop([36, 4], [36, 98]),
      far([84, 64], [98, 96]),
      body([86, 30], [84, 64]),
      near([84, 64], [72, 96]),
      near([86, 30], [62, 30], [38, 30]),
      far([86, 30], [100, 50], [108, 66]),
    ],
  },
  shoulderband: {
    head: [100, 20],
    parts: [
      far([100, 68], [90, 96]),
      body([100, 34], [100, 68]),
      near([100, 68], [110, 96]),
      near([88, 34], [78, 20], [66, 8]),
      near([112, 34], [122, 20], [134, 8]),
      band([66, 8], [100, 2], [134, 8]),
    ],
  },
  childside: {
    floor: false,
    head: [124, 48],
    parts: [
      far([46, 66], [22, 54]),
      far([46, 66], [22, 78]),
      body([46, 66], [78, 62], [108, 52]),
      far([108, 54], [164, 38]),
      near([108, 50], [162, 24]),
    ],
  },
  cowface: {
    head: [100, 22],
    parts: [
      far([100, 78], [136, 90], [96, 95]),
      body([100, 38], [100, 78]),
      near([100, 78], [64, 90], [104, 96]),
      near([108, 38], [112, 10], [103, 46]),
      near([92, 38], [86, 62], [103, 50]),
    ],
  },
  openbook: {
    floor: false,
    head: [24, 60],
    parts: [
      far([88, 60], [118, 38], [92, 28]),
      body([34, 60], [88, 60]),
      near([88, 60], [112, 42], [90, 30]),
      near([42, 60], [72, 34]),
      far([42, 60], [40, 98]),
    ],
  },
  sleeper: {
    floor: false,
    head: [24, 60],
    parts: [
      far([88, 60], [118, 38], [92, 28]),
      body([34, 60], [88, 60]),
      near([88, 60], [112, 42], [90, 30]),
      near([42, 60], [44, 34], [44, 20]),
      far([50, 58], [60, 38], [46, 22]),
    ],
  },
  sphinx: {
    head: [122, 52],
    parts: [
      near([76, 92], [26, 95]),
      body([76, 92], [96, 84], [112, 66]),
      near([112, 66], [112, 94], [146, 95]),
    ],
  },
};

/** Vilken pose som hör till vilket steg (efter stegets namn) */
export const POSE_BY_STEP: Record<string, string> = {
  'Barnets position': 'child',
  'Katt–ko': 'catcow',
  'Nedåtvänd hund': 'dog',
  'Världens bästa stretch': 'wgs',
  'Låg utfallsställning': 'lunge',
  'Duva (liggande)': 'pigeon',
  '90/90 höftrotation': 'ninety',
  'Djup hukställning': 'squat',
  'Tråd genom nålen': 'needle',
  Kobra: 'cobra',
  'Häng i räcket': 'hang',
  'Ryggliggande vridning': 'twist',
  Slutvila: 'rest',
  'Hamstring med band': 'hamstring',
  Fjärilsstretch: 'butterfly',
  'Ankelrörlighet vid vägg': 'ankle',
  'Glad bebis': 'happybaby',
  'Bröstöppning mot vägg': 'chestwall',
  'Axelcirklar med band': 'shoulderband',
  'Barnets position, sidostretch': 'childside',
  Kohuvudsarmar: 'cowface',
  'Öppen bok': 'openbook',
  'Sleeper stretch': 'sleeper',
  Sfinxen: 'sphinx',
};

/**
 * Rörelse: slutläget för en pose. Figuren går sakta från grundposen till slutläget och tillbaka.
 * `parts` pekar ut vilka delar (index i POSES[...].parts) som ändras; antalet punkter måste stämma med grundposen.
 */
export interface Motion {
  head?: Pt;
  parts: Record<number, Pt[]>;
  /** Sekunder för en hel där-och-tillbaka */
  dur?: number;
}

export const MOTION: Record<string, Motion> = {
  child: {
    head: [112, 94],
    parts: { 1: [[56, 78], [80, 74], [100, 86]], 2: [[100, 88], [146, 95]], 3: [[100, 90], [152, 96]] },
  },
  catcow: {
    head: [134, 58],
    parts: {
      0: [[68, 68], [68, 94], [40, 96]],
      2: [[62, 68], [78, 72], [98, 74], [118, 62]],
      3: [[62, 68], [62, 94], [34, 96]],
    },
  },
  dog: {
    dur: 3,
    parts: { 3: [[52, 90], [80, 40]], 0: [[52, 96], [82, 40]] },
  },
  wgs: {
    head: [112, 42],
    dur: 5,
    parts: { 4: [[104, 48], [118, 62], [126, 84]] },
  },
  lunge: {
    head: [94, 30],
    parts: {
      0: [[28, 96], [58, 92], [88, 76]],
      1: [[88, 76], [118, 70], [118, 96]],
      2: [[88, 76], [92, 42]],
      3: [[92, 44], [112, 18]],
      4: [[92, 44], [108, 12]],
    },
  },
  pigeon: {
    parts: { 2: [[88, 92], [104, 62], [82, 56]], 3: [[46, 90], [72, 66], [90, 60]] },
  },
  ninety: {
    head: [114, 40],
    parts: { 1: [[92, 88], [110, 52]], 3: [[110, 56], [120, 74], [126, 92]] },
  },
  squat: {
    head: [88, 44],
    parts: { 0: [[84, 88], [86, 56]], 2: [[86, 58], [108, 70], [94, 62]] },
  },
  needle: {
    head: [118, 94],
    parts: { 2: [[108, 78], [82, 92]], 3: [[108, 76], [112, 90], [126, 96]] },
  },
  cobra: {
    head: [126, 68],
    parts: { 1: [[66, 92], [90, 91], [112, 80]], 2: [[112, 80], [114, 96]] },
  },
  hang: {
    head: [100, 30],
    parts: {
      1: [[78, 8], [92, 44]],
      2: [[122, 8], [108, 44]],
      3: [[100, 44], [100, 74]],
      4: [[100, 74], [95, 98]],
      5: [[100, 74], [105, 98]],
    },
  },
  twist: {
    parts: { 3: [[92, 55], [124, 32], [100, 18]], 4: [[92, 55], [116, 38], [90, 26]] },
  },
  hamstring: {
    parts: {
      2: [[88, 92], [80, 36]],
      3: [[44, 90], [62, 62]],
      4: [[62, 62], [80, 38]],
    },
  },
  butterfly: {
    head: [138, 68],
    parts: { 1: [[88, 88], [108, 78], [128, 72]], 3: [[128, 74], [130, 86], [124, 94]] },
  },
  ankle: {
    head: [114, 14],
    parts: {
      1: [[116, 50], [94, 96]],
      2: [[116, 50], [114, 24]],
      3: [[116, 50], [140, 72], [124, 96], [140, 96]],
      4: [[114, 26], [154, 32]],
    },
  },
  happybaby: {
    parts: { 1: [[94, 92], [80, 60], [98, 40]], 2: [[94, 92], [68, 64], [88, 38]], 3: [[46, 90], [66, 64], [88, 40]] },
  },
  chestwall: {
    head: [98, 16],
    parts: { 5: [[86, 30], [104, 36], [118, 42]] },
  },
  shoulderband: {
    dur: 5,
    parts: {
      3: [[88, 34], [76, 48], [68, 62]],
      4: [[112, 34], [124, 48], [132, 62]],
      5: [[68, 62], [100, 62], [132, 62]],
    },
  },
  childside: {
    head: [124, 52],
    parts: { 3: [[108, 54], [158, 66]], 4: [[108, 50], [152, 52]] },
  },
  cowface: {
    parts: { 3: [[108, 38], [114, 12], [106, 42]], 4: [[92, 38], [86, 62], [106, 48]] },
  },
  openbook: {
    dur: 5,
    parts: { 4: [[42, 60], [72, 36]] },
  },
  sleeper: {
    parts: { 3: [[42, 60], [44, 34], [58, 30]], 4: [[50, 58], [56, 44], [50, 32]] },
  },
  sphinx: {
    head: [124, 62],
    parts: { 1: [[76, 92], [96, 89], [112, 76]], 2: [[112, 76], [112, 94], [146, 95]] },
  },
};

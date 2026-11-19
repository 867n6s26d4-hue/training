import { POSE_BY_STEP } from './poses';
import type { ExerciseDef, FlowStep, HiitSpec, SlotDef, StrengthItem } from '../types';

/**
 * Extrapass utanför A → B → C-cykeln.
 *
 * S, Axlar + core: stabilitet och styrka runt skuldrorna (rotatorkuff, bakre axel, skulderblad, serratus)
 * samt core. Urvalet följer det som återkommer i axel- och coreträning: utåtrotation, face pull, Y–T–W,
 * push-up plus, och McGills "big three" (sidoplanka, bird dog) plus dead bug och Pallof press. Inga lyft över
 * huvudet (låg takhöjd).
 *
 * M, Rörlighet: yogainspirerade flöden och rörlighetsövningar för höfter, bröstrygg, axlar och vader.
 * Håll lugnt, andas jämnt och gå aldrig in i smärta. Tiderna är ett förslag, inte ett recept.
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

export const EXTRA_EXERCISES: Record<string, ExerciseDef> = {
  // Axlar
  erside: {
    id: 'erside',
    name: 'Utåtrotation, liggande',
    note: 'Ligg på sidan, armbågen mot revbenen, vrid underarmen uppåt. Lätt hantel, vikt per hantel',
    kind: 'dumbbell',
    repsSuffix: '/arm',
  },
  banderot: {
    id: 'banderot',
    name: 'Utåtrotation med band',
    note: 'Bandet fäst i dörren i armbågshöjd, armbågen mot sidan. Notera bandfärg som nivå',
    kind: 'bodyweight',
    repsSuffix: '/arm',
  },
  facepull: {
    id: 'facepull',
    name: 'Face pull med band',
    note: 'Bandet fäst i ögonhöjd. Dra mot ansiktet, armbågarna högt, tryck ihop skulderbladen',
    kind: 'bodyweight',
  },
  revfly: {
    id: 'revfly',
    name: 'Bakre axellyft',
    note: 'Böjd framåt med stöd, lätta hantlar, lyft armarna ut i sidan. Vikt per hantel',
    kind: 'dumbbell',
  },
  ytw: {
    id: 'ytw',
    name: 'Y–T–W-lyft på bänk',
    note: 'Ligg på mage över bänkens kant, lyft armarna i Y, T och W. Mycket lätta hantlar eller bara armarna',
    kind: 'dumbbell',
  },
  pushupplus: {
    id: 'pushupplus',
    name: 'Armhävning plus',
    note: 'Efter varje armhävning: skjut bort golvet och låt skulderbladen glida isär i toppläget',
    kind: 'bodyweight',
  },
  scapull: {
    id: 'scapull',
    name: 'Skulderbladsdrag i räcke',
    note: 'Häng med raka armar, dra ner skulderbladen utan att böja armarna',
    kind: 'bodyweight',
  },
  pullapart: {
    id: 'pullapart',
    name: 'Bandspridning',
    note: 'Håll bandet framför bröstet och dra isär det med raka armar, tryck ihop skulderbladen',
    kind: 'bodyweight',
  },
  // Core
  plank: {
    id: 'plank',
    name: 'Planka',
    note: 'På underarmarna, en rak linje från hälar till huvud, kläm rumpan. Reps = sekunder',
    kind: 'bodyweight',
    unit: 'sek',
  },
  sideplank: {
    id: 'sideplank',
    name: 'Sidoplanka',
    note: 'På underarmen, höften uppe i linje med kroppen. Reps = sekunder per sida',
    kind: 'bodyweight',
    unit: 'sek',
    repsSuffix: '/sida',
  },
  hollow: {
    id: 'hollow',
    name: 'Hollow hold',
    note: 'På rygg, ländryggen tryckt mot golvet, armar och ben utsträckta strax över golvet. Reps = sekunder',
    kind: 'bodyweight',
    unit: 'sek',
  },
  pallof: {
    id: 'pallof',
    name: 'Pallof press med band',
    note: 'Bandet fäst i dörren vid sidan, tryck armarna rakt fram och motstå vridningen',
    kind: 'bodyweight',
    repsSuffix: '/sida',
  },
  deadbug: {
    id: 'deadbug',
    name: 'Dead bug',
    note: 'På rygg, ländryggen mot golvet. Sänk motsatt arm och ben långsamt, utan att svanka',
    kind: 'bodyweight',
    repsSuffix: '/sida',
  },
  birddog: {
    id: 'birddog',
    name: 'Bird dog',
    note: 'På alla fyra, sträck motsatt arm och ben, håll 3–5 s, bålen helt stilla',
    kind: 'bodyweight',
    repsSuffix: '/sida',
  },
  hangknee: {
    id: 'hangknee',
    name: 'Hängande knälyft',
    note: 'Häng i räcket, lyft knäna mot bröstet utan att svinga',
    kind: 'bodyweight',
  },
  rollout: {
    id: 'rollout',
    name: 'Rullar med skivstång',
    note: 'Från knä, skivstång med skivor. Rulla fram så långt du håller ländryggen neutral',
    kind: 'bodyweight',
  },
  hangleg: {
    id: 'hangleg',
    name: 'Hängande benlyft',
    note: 'Häng i räcket, lyft raka ben mot stången, kontrollerat ner',
    kind: 'bodyweight',
  },
};

/** S: tre par där en axelövning och en coreövning körs som superset */
export const SHOULDER_CORE_SLOTS: SlotDef[] = [
  { slot: 'cuff', role: 'main', options: [item('erside', 3, 12, 15, 60, w(1.25)), item('banderot', 3, 12, 15, 60, reps)] },
  {
    slot: 'plank',
    role: 'main',
    options: [item('plank', 3, 30, 60, 60, reps), item('sideplank', 3, 20, 45, 60, reps), item('hollow', 3, 20, 40, 60, reps)],
  },
  {
    slot: 'rear',
    role: 'accessory',
    options: [item('facepull', 3, 12, 15, 60, reps), item('revfly', 3, 12, 15, 60, w(1.25)), item('ytw', 3, 8, 10, 60, w(1.25))],
  },
  {
    slot: 'antirot',
    role: 'accessory',
    options: [item('pallof', 3, 10, 12, 60, reps), item('deadbug', 3, 8, 12, 60, reps), item('birddog', 3, 8, 10, 60, reps)],
  },
  {
    slot: 'scap',
    role: 'accessory',
    options: [item('pushupplus', 3, 10, 15, 60, reps), item('scapull', 3, 8, 12, 60, reps), item('pullapart', 3, 15, 20, 60, reps)],
  },
  {
    slot: 'hang',
    role: 'accessory',
    options: [item('hangknee', 3, 8, 12, 75, reps), item('rollout', 3, 8, 10, 75, reps), item('hangleg', 3, 6, 10, 75, reps)],
  },
];

export const SHOULDER_CORE_PAIRS: [string, string][] = [
  ['cuff', 'plank'],
  ['rear', 'antirot'],
  ['scap', 'hang'],
];

const step = (name: string, sec: number, cue: string, perSide = false): FlowStep => ({ name, sec, cue, perSide, pose: POSE_BY_STEP[name] });

/** Sammanfattning av ett steg till en rad i listan */
export function flowLine(s: FlowStep): string {
  return `${s.name} · ${s.sec} s${s.perSide ? ' per sida' : ''}`;
}

function flow(name: string, note: string, steps: FlowStep[]): HiitSpec {
  return { kind: 'flow', name, note, steps, items: steps.map(flowLine) };
}

const CHILD = step('Barnets position', 60, 'Knäna brett isär, pannan mot golvet, armarna framåt. Andas lugnt ner i ryggen.');
const CATCOW = step('Katt–ko', 60, 'På alla fyra. Andas in och svanka, andas ut och runda ryggen. Långsamt.');
const DOG = step('Nedåtvänd hund', 60, 'Pedala hälarna växelvis mot golvet, tryck bröstet mot låren.');
const WGS = step('Världens bästa stretch', 45, 'Djupt utfall, vrid bröstkorgen upp mot det främre knät och sträck armen mot taket.', true);
const LUNGE = step('Låg utfallsställning', 45, 'Bakre knät i golvet, kläm rumpan och skjut höften framåt utan att svanka.', true);
const PIGEON = step('Duva (liggande)', 60, 'Ligg på rygg, ankeln över motsatt knä, dra benet mot dig. Låt höften slappna av.', true);
const NINETY = step('90/90 höftrotation', 60, 'Sitt med båda knäna i 90 grader och växla sida långsamt, ryggen rak.');
const SQUAT = step('Djup hukställning', 60, 'Armbågarna trycker ut knäna, hälarna i golvet, bröstet högt. Andas.');
const NEEDLE = step('Tråd genom nålen', 45, 'På alla fyra, tråda en arm under bröstet och vila axeln mot golvet. Vrid brösryggen.', true);
const COBRA = step('Kobra', 40, 'Handflatorna under axlarna, lyft bröstet och för axlarna bort från öronen.');
const HANG = step('Häng i räcket', 30, 'Slappna av i axlarna och låt kroppen hänga. Släpp spänningen, andas jämnt.');
const TWIST = step('Ryggliggande vridning', 45, 'På rygg, sänk knäna åt ena sidan, armarna ut, blicken åt motsatt håll.', true);
const REST = step('Slutvila', 90, 'Ligg på rygg med armar och ben avslappnade. Andas långsamt och låt kroppen sjunka.');

export const FLOWS: HiitSpec[] = [
  flow('Helkroppsflöde', 'Yogainspirerat flöde för hela kroppen. Gå aldrig in i smärta.', [
    CHILD, CATCOW, DOG, WGS, LUNGE, PIGEON, NINETY, SQUAT, NEEDLE, COBRA, HANG, TWIST, REST,
  ]),
  flow('Höft och ben', 'Fokus på höfter, baksida lår och vader. Bra dagen efter benpass.', [
    CATCOW,
    DOG,
    step('Låg utfallsställning', 60, 'Bakre knät i golvet, kläm rumpan och skjut höften framåt utan att svanka.', true),
    step('Duva (liggande)', 75, 'Ligg på rygg, ankeln över motsatt knä, dra benet mot dig.', true),
    NINETY,
    step('Djup hukställning', 90, 'Armbågarna trycker ut knäna, hälarna i golvet. Gunga sakta från sida till sida.'),
    step('Hamstring med band', 60, 'Ligg på rygg, bandet runt foten, sträck benet mot taket och håll det rakt.', true),
    step('Fjärilsstretch', 60, 'Sitt med fotsulorna mot varandra, böj dig framåt med rak rygg.'),
    step('Ankelrörlighet vid vägg', 45, 'Knäet mot väggen utan att lyfta hälen. Flytta foten längre ut när det går lätt.', true),
    step('Glad bebis', 60, 'På rygg, ta tag i fötterna, dra knäna mot armhålorna och vagga.'),
    step('Slutvila', 60, 'Ligg på rygg, andas långsamt och slappna av.'),
  ]),
  flow('Axlar och rygg', 'Fokus på axlar, bröstrygg och bröst. Passar efter press- och dragpass.', [
    CATCOW,
    step('Tråd genom nålen', 50, 'På alla fyra, tråda en arm under bröstet och vila axeln mot golvet.', true),
    step('Bröstöppning mot vägg', 45, 'Armen mot väggen i axelhöjd, vrid kroppen sakta bort tills det sträcker i bröstet.', true),
    step('Axelcirklar med band', 45, 'Håll bandet brett och för det i en båge framför dig och bakom ryggen. Rakt, långsamt.'),
    step('Barnets position, sidostretch', 40, 'Barnets position med båda händerna gångna åt ena sidan. Känn sträcket längs sidan.', true),
    step('Häng i räcket', 40, 'Slappna av och låt axlarna sträckas ut. Andas jämnt.'),
    step('Kohuvudsarmar', 45, 'Ena armen över axeln och andra bakom ryggen, försök nå varandra. Använd ett band vid behov.', true),
    step('Öppen bok', 45, 'På sidan med knäna böjda, öppna övre armen bakåt och följ med blicken.', true),
    step('Sleeper stretch', 40, 'På sidan, underarmen i 90 grader, tryck handen mjukt mot golvet. Stanna före smärta.', true),
    step('Sfinxen', 45, 'På mage, uppstödd på underarmarna, lyft bröstet och slappna av i ländryggen.'),
    step('Barnets position', 60, 'Knäna brett isär, pannan mot golvet och armarna långt fram.'),
    step('Slutvila', 60, 'Ligg på rygg och andas långsamt.'),
  ]),
];

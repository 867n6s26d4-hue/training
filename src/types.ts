export type DayId = 'A' | 'B' | 'C';
export type ExerciseKind = 'barbell' | 'dumbbell' | 'bodyweight' | 'weighted-bodyweight';

export interface ExerciseDef {
  id: string;
  name: string;
  note?: string;
  kind: ExerciseKind;
  /** Visas bredvid reps, t.ex. "per ben" */
  repsSuffix?: string;
}

export type Progression = { kind: 'weight'; inc: number } | { kind: 'reps' };

export interface StrengthItem {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  progression: Progression;
  /** Text som ersätter "4 × 5" i visningen, t.ex. "4 × max" */
  targetLabel?: string;
}

export type HiitSpec =
  | { kind: 'emom'; minutes: number; items: string[] }
  | { kind: 'intervals'; workSec: number; restSec: number; rounds: number; items: string[] }
  | { kind: 'amrap'; minutes: number; items: string[] };

/** En plats i passet. Baslyft byts per block, komplement roterar varje pass. */
export interface SlotDef {
  slot: string;
  role: 'main' | 'accessory';
  options: StrengthItem[];
}

export interface PlanItem extends StrengthItem {
  slot: string;
  role: 'main' | 'accessory';
}

export interface DayDef {
  id: DayId;
  title: string;
  focus: string;
  warmup: string;
  slots: SlotDef[];
  /** Alla alternativ har samma format och längd, bara olika övningar */
  hiitOptions: HiitSpec[];
}

export interface SetLog {
  weight: number | null;
  reps: number | null;
  done: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  /** Fritext för svårighetsgrad, t.ex. ringhöjd eller bandfärg */
  level?: string;
}

export interface HiitLog {
  kind: HiitSpec['kind'];
  completed: boolean;
  rounds?: number;
  note?: string;
}

export interface ProgressionChange {
  exerciseId: string;
  from: number | null;
  to: number | null;
  reason: 'up' | 'down' | 'hold' | 'skipped';
  harder?: boolean;
}

export interface Session {
  id?: number;
  dayId: DayId;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'done';
  deload: boolean;
  /** Blocknummer (0-baserat) när passet startades */
  block: number;
  /** Övningarna som valdes för just det här passet */
  items: PlanItem[];
  /** Vald variant per plats, för komplementövningar */
  variants: Record<string, number>;
  hiitSpec: HiitSpec;
  hiitVariant: number;
  strength: ExerciseLog[];
  hiit?: HiitLog;
  changes?: ProgressionChange[];
}

export interface ExerciseState {
  exerciseId: string;
  weight: number | null;
  failStreak: number;
  level?: string;
  suggestHarder?: boolean;
  updatedAt: number;
}

export type AudioSessionType = 'ambient' | 'transient' | 'playback' | 'auto';

export interface Settings {
  audioSession: AudioSessionType;
  barWeight: number;
  plates: number[];
  leadInSec: number;
  /** Antal återstående deload-pass (0 = ingen deload pågår) */
  deloadRemaining: number;
  lastDeloadAt: number | null;
  /** Aktuellt block för baslyften. Ökar när en deload är klar. */
  blockIndex: number;
}

export const DEFAULT_SETTINGS: Settings = {
  audioSession: 'ambient',
  barWeight: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  leadInSec: 5,
  deloadRemaining: 0,
  lastDeloadAt: null,
  blockIndex: 0,
};

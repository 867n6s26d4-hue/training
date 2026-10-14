import Dexie, { type Table } from 'dexie';
import {
  DEFAULT_SETTINGS,
  type DayId,
  type ExerciseLog,
  type ExerciseState,
  type ProgressionChange,
  type Session,
  type SetLog,
  type Settings,
} from './types';
import { DAYS, getDay } from './data/program';
import { deloadSets, evaluateProgression, plannedReps } from './logic/progression';

interface SettingRow {
  key: string;
  value: unknown;
}

export class AppDB extends Dexie {
  sessions!: Table<Session, number>;
  exerciseState!: Table<ExerciseState, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'garagepasset') {
    super(name);
    this.version(1).stores({
      sessions: '++id, dayId, status, startedAt',
      exerciseState: 'exerciseId',
      settings: 'key',
    });
  }
}

export let db = new AppDB();

/** Endast för tester */
export function useDb(next: AppDB): void {
  db = next;
}

/* ---------- inställningar ---------- */

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  const out: Settings = { ...DEFAULT_SETTINGS };
  const rec = out as unknown as Record<string, unknown>;
  for (const r of rows) if (r.key in rec) rec[r.key] = r.value;
  return out;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value });
}

/* ---------- pass ---------- */

export function buildSession(
  dayId: DayId,
  states: Record<string, ExerciseState | undefined>,
  lastSets: Record<string, { sets: SetLog[]; level?: string } | undefined>,
  deload: boolean,
  now = Date.now(),
): Session {
  const day = getDay(dayId);
  const strength: ExerciseLog[] = day.strength.map((item) => {
    const st = states[item.exerciseId];
    const last = lastSets[item.exerciseId];
    const n = deload ? deloadSets(item.sets) : item.sets;
    const weight = st?.weight ?? null;
    const sets: SetLog[] = [];
    for (let i = 0; i < n; i++) {
      sets.push({ weight, reps: plannedReps(item, weight, last?.sets[i]), done: false });
    }
    return { exerciseId: item.exerciseId, sets, level: st?.level ?? last?.level };
  });
  return { dayId, startedAt: now, status: 'active', deload, strength };
}

export async function lastDoneSets(): Promise<Record<string, { sets: SetLog[]; level?: string }>> {
  const done = await db.sessions.where('status').equals('done').toArray();
  done.sort((a, b) => b.startedAt - a.startedAt);
  const out: Record<string, { sets: SetLog[]; level?: string }> = {};
  for (const s of done) {
    for (const ex of s.strength) {
      if (!out[ex.exerciseId] && ex.sets.some((x) => x.done)) out[ex.exerciseId] = { sets: ex.sets, level: ex.level };
    }
  }
  return out;
}

export async function startSession(dayId: DayId, now = Date.now()): Promise<Session> {
  const existing = await getActiveSession();
  if (existing) return existing;
  const settings = await getSettings();
  const stateRows = await db.exerciseState.toArray();
  const states: Record<string, ExerciseState> = {};
  stateRows.forEach((r) => (states[r.exerciseId] = r));
  const deload = settings.deloadNext;
  const session = buildSession(dayId, states, await lastDoneSets(), deload, now);
  const id = await db.sessions.add(session);
  session.id = id;
  if (deload) {
    await setSetting('deloadNext', false);
    await setSetting('lastDeloadAt', now);
  }
  return session;
}

export async function getActiveSession(): Promise<Session | undefined> {
  const rows = await db.sessions.where('status').equals('active').toArray();
  rows.sort((a, b) => b.startedAt - a.startedAt);
  return rows[0];
}

export async function saveSession(s: Session): Promise<void> {
  if (s.id === undefined) throw new Error('Passet saknar id');
  await db.sessions.put(s);
}

export async function discardSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

export async function finishSession(id: number, now = Date.now()): Promise<Session> {
  const s = await db.sessions.get(id);
  if (!s) throw new Error('Passet finns inte');
  if (s.status === 'done') return s;
  const day = getDay(s.dayId);
  const changes: ProgressionChange[] = [];
  for (const item of day.strength) {
    const log = s.strength.find((x) => x.exerciseId === item.exerciseId);
    if (!log) continue;
    const prev = await db.exerciseState.get(item.exerciseId);
    if (s.deload) {
      // Deload ger inte progression, men senaste nivå/anteckning sparas
      if (log.level !== undefined && prev) await db.exerciseState.put({ ...prev, level: log.level, updatedAt: now });
      changes.push({ exerciseId: item.exerciseId, from: prev?.weight ?? null, to: prev?.weight ?? null, reason: 'skipped' });
      continue;
    }
    const res = evaluateProgression(item, prev, log.sets);
    const skipped = res.change.reason === 'skipped';
    const next: ExerciseState = {
      exerciseId: item.exerciseId,
      weight: skipped ? (prev?.weight ?? null) : res.weight,
      failStreak: res.failStreak,
      level: log.level ?? prev?.level,
      suggestHarder: res.change.harder === true,
      updatedAt: now,
    };
    if (!skipped || prev) await db.exerciseState.put(next);
    changes.push(res.change);
  }
  const done: Session = { ...s, status: 'done', endedAt: now, changes };
  await db.sessions.put(done);
  return done;
}

export async function listDoneSessions(): Promise<Session[]> {
  const rows = await db.sessions.where('status').equals('done').toArray();
  return rows.sort((a, b) => b.startedAt - a.startedAt);
}

/** Nästa pass i turordningen A → B → C, utifrån senast slutförda pass */
export async function suggestNextDay(): Promise<DayId> {
  const done = await listDoneSessions();
  if (!done.length) return 'A';
  const idx = DAYS.findIndex((d) => d.id === done[0].dayId);
  return DAYS[(idx + 1) % DAYS.length].id;
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Föreslå deload om det gått minst 5 veckor sedan senaste deload (eller första passet) */
export async function deloadSuggested(now = Date.now()): Promise<boolean> {
  const settings = await getSettings();
  if (settings.deloadNext) return false;
  const done = await listDoneSessions();
  if (done.length < 6) return false;
  const first = done[done.length - 1].startedAt;
  const since = settings.lastDeloadAt ?? first;
  return now - since >= 5 * WEEK_MS;
}

/* ---------- export / import ---------- */

export interface ExportFile {
  app: 'garagepasset';
  version: 1;
  exportedAt: string;
  sessions: Session[];
  exerciseState: ExerciseState[];
  settings: SettingRowPublic[];
}
type SettingRowPublic = { key: string; value: unknown };

export async function exportAll(now = new Date()): Promise<ExportFile> {
  return {
    app: 'garagepasset',
    version: 1,
    exportedAt: now.toISOString(),
    sessions: await db.sessions.toArray(),
    exerciseState: await db.exerciseState.toArray(),
    settings: await db.settings.toArray(),
  };
}

export function validateExport(data: unknown): ExportFile {
  const d = data as Partial<ExportFile> | null;
  if (!d || d.app !== 'garagepasset' || d.version !== 1) throw new Error('Filen är ingen export från Garagepasset');
  if (!Array.isArray(d.sessions) || !Array.isArray(d.exerciseState) || !Array.isArray(d.settings)) {
    throw new Error('Exportfilen är ofullständig');
  }
  for (const s of d.sessions) {
    if (!s || typeof s.startedAt !== 'number' || !['A', 'B', 'C'].includes(s.dayId) || !Array.isArray(s.strength)) {
      throw new Error('Exportfilen innehåller ett ogiltigt pass');
    }
  }
  return d as ExportFile;
}

/** Ersätter all lokal data. Validerar först, så att en trasig fil aldrig raderar något. */
export async function importAll(data: unknown): Promise<{ sessions: number }> {
  const f = validateExport(data);
  await db.transaction('rw', db.sessions, db.exerciseState, db.settings, async () => {
    await db.sessions.clear();
    await db.exerciseState.clear();
    await db.settings.clear();
    await db.sessions.bulkAdd(f.sessions);
    await db.exerciseState.bulkAdd(f.exerciseState);
    await db.settings.bulkAdd(f.settings);
  });
  return { sessions: f.sessions.length };
}

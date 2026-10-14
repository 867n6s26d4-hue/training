import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AppDB,
  deloadSuggested,
  exportAll,
  finishSession,
  getSettings,
  importAll,
  listDoneSessions,
  saveSession,
  setSetting,
  startSession,
  suggestNextDay,
  useDb,
  getActiveSession,
} from '../src/db';

let n = 0;
beforeEach(() => {
  useDb(new AppDB('test-' + n++));
});

async function completeAll(id: number, weights: Record<string, number>, repsOverride?: Record<string, number[]>) {
  const s = (await getActiveSession())!;
  expect(s.id).toBe(id);
  for (const ex of s.strength) {
    ex.sets.forEach((set, i) => {
      if (ex.exerciseId in weights) set.weight = weights[ex.exerciseId];
      const o = repsOverride?.[ex.exerciseId];
      if (o) set.reps = o[i] ?? set.reps;
      set.done = true;
    });
  }
  await saveSession(s);
}

describe('pass och progression', () => {
  it('första passet har tomma vikter, sedan förvalda och progression efter slutfört pass', async () => {
    const s1 = await startSession('A', 1000);
    expect(s1.strength[0].sets).toHaveLength(4);
    expect(s1.strength[0].sets[0].weight).toBeNull();
    expect(s1.strength[0].sets[0].reps).toBe(5);
    await completeAll(s1.id!, { squat: 60, bench: 40 }, { ringrow: [10, 10, 10] });
    const done = await finishSession(s1.id!, 2000);
    expect(done.status).toBe('done');
    expect(done.changes?.find((c) => c.exerciseId === 'squat')).toMatchObject({ from: 60, to: 65, reason: 'up' });
    expect(done.changes?.find((c) => c.exerciseId === 'ringrow')?.harder).toBe(true);

    const s2 = await startSession('A', 3000);
    expect(s2.strength[0].sets[0].weight).toBe(65);
    expect(s2.strength[1].sets[0].weight).toBe(42.5);
  });

  it('startSession återanvänder ett pågående pass', async () => {
    const a = await startSession('B', 1000);
    const b = await startSession('A', 2000);
    expect(b.id).toBe(a.id);
    expect(b.dayId).toBe('B');
  });

  it('nästa pass roterar A → B → C → A', async () => {
    expect(await suggestNextDay()).toBe('A');
    for (const [day, next] of [['A', 'B'], ['B', 'C'], ['C', 'A']] as const) {
      const s = await startSession(day, Date.now());
      await completeAll(s.id!, {});
      await finishSession(s.id!);
      expect(await suggestNextDay()).toBe(next);
    }
  });

  it('deload ger färre set, ingen progression och nollställer flaggan', async () => {
    await setSetting('deloadNext', true);
    const s = await startSession('A', 5000);
    expect(s.deload).toBe(true);
    expect(s.strength[0].sets).toHaveLength(2);
    expect(s.strength[2].sets).toHaveLength(2);
    const settings = await getSettings();
    expect(settings.deloadNext).toBe(false);
    expect(settings.lastDeloadAt).toBe(5000);
    await completeAll(s.id!, { squat: 100 });
    const done = await finishSession(s.id!, 6000);
    expect(done.changes?.every((c) => c.reason === 'skipped')).toBe(true);
    const s2 = await startSession('A', 7000);
    expect(s2.strength[0].sets[0].weight).toBeNull();
  });

  it('föreslår deload efter minst 5 veckor och 6 pass', async () => {
    const week = 7 * 24 * 3600 * 1000;
    for (let i = 0; i < 6; i++) {
      const s = await startSession('A', 1000 + i * week);
      await completeAll(s.id!, {});
      await finishSession(s.id!, 2000 + i * week);
    }
    expect(await deloadSuggested(1000 + 4 * week)).toBe(false);
    expect(await deloadSuggested(1000 + 6 * week)).toBe(true);
  });
});

describe('export och import', () => {
  it('rundtur bevarar data och vägrar trasiga filer utan att radera något', async () => {
    const s = await startSession('C', 1000);
    await completeAll(s.id!, { chins: 0, rdl: 50 });
    await finishSession(s.id!, 2000);
    const exp = JSON.parse(JSON.stringify(await exportAll()));
    expect(exp.sessions).toHaveLength(1);

    useDb(new AppDB('test-' + n++));
    expect((await listDoneSessions()).length).toBe(0);
    await importAll(exp);
    const back = await listDoneSessions();
    expect(back).toHaveLength(1);
    expect(back[0].changes?.length).toBe(3);

    await expect(importAll({ app: 'nåt annat' })).rejects.toThrow();
    await expect(importAll({ ...exp, sessions: [{ foo: 1 }] })).rejects.toThrow();
    expect((await listDoneSessions()).length).toBe(1);
  });
});

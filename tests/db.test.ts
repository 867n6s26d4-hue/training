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
  startSession,
  suggestNextDay,
  useDb,
  getActiveSession,
  setDeload,
  swapAccessory,
  swapHiit,
  loadStates,
  lastDoneSets,
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

  it('komplementövningar och HIIT roterar medan baslyften ligger fast inom blocket', async () => {
    const ids = async (day: 'A' | 'B' | 'C') => {
      const s = await startSession(day, Date.now());
      const r = { items: s.items.map((i) => i.exerciseId), hiit: s.hiitSpec.name, hiitKind: s.hiitSpec.kind };
      await completeAll(s.id!, {});
      await finishSession(s.id!);
      return r;
    };
    const a1 = await ids('A');
    const a2 = await ids('A');
    const a3 = await ids('A');
    const a4 = await ids('A');
    expect(a1.items).toEqual(['squat', 'bench', 'ringrow']);
    expect(a2.items).toEqual(['squat', 'bench', 'dbrow']);
    expect(a3.items).toEqual(['squat', 'bench', 'bandrow']);
    expect(a4.items).toEqual(a1.items);
    expect(new Set([a1.hiit, a2.hiit, a3.hiit, a4.hiit]).size).toBe(4);
    expect(a1.hiitKind).not.toBe(a2.hiitKind);
    expect(a2.hiitKind).not.toBe(a3.hiitKind);
    // pass B påverkas inte av hur många A som gjorts
    expect((await ids('B')).items).toEqual(['deadlift', 'inclinepress', 'bulgarian']);
  });

  it('deload gäller tre pass, ger färre set utan progression, och byter block när den är klar', async () => {
    await setDeload(true);
    for (const day of ['A', 'B', 'C'] as const) {
      const before = await getSettings();
      expect(before.blockIndex).toBe(0);
      const s = await startSession(day, 5000);
      expect(s.deload).toBe(true);
      expect(s.strength[0].sets.length).toBeLessThan(s.items[0].sets);
      await completeAll(s.id!, { squat: 100, deadlift: 100, chins: 0 });
      const done = await finishSession(s.id!, 6000);
      expect(done.changes?.every((c) => c.reason === 'skipped')).toBe(true);
    }
    const after = await getSettings();
    expect(after.deloadRemaining).toBe(0);
    expect(after.blockIndex).toBe(1);
    expect(after.lastDeloadAt).toBe(6000);
    // ingen progression från deload
    expect((await loadStates()).squat).toBeUndefined();
    // nytt block: andra baslyft, normalt pass
    const a = await startSession('A', 7000);
    expect(a.deload).toBe(false);
    expect(a.block).toBe(1);
    expect(a.items.map((i) => i.exerciseId).slice(0, 2)).toEqual(['dbsquat', 'dbbench']);
    await completeAll(a.id!, {});
    await finishSession(a.id!);
    const c = await startSession('C', 8000);
    expect(c.items.map((i) => i.exerciseId).slice(0, 2)).toEqual(['supchins', 'singlerdl']);
  });

  it('avbruten deload (ångra) byter inte block', async () => {
    await setDeload(true);
    await setDeload(false);
    expect((await getSettings()).deloadRemaining).toBe(0);
    expect((await getSettings()).blockIndex).toBe(0);
  });

  it('byta komplementövning och HIIT i ett pågående pass', async () => {
    const s = await startSession('B', 1000);
    expect(s.items[1].exerciseId).toBe('inclinepress');
    const states = await loadStates();
    const last = await lastDoneSets();
    const s2 = swapAccessory(s, 1, states, last);
    expect(s2.items[1].exerciseId).toBe('floorpress');
    expect(s2.strength[1].exerciseId).toBe('floorpress');
    // baslyft kan inte bytas
    expect(swapAccessory(s, 0, states, last)).toBe(s);
    // inte efter att ett set är klart
    s2.strength[1].sets[0].done = true;
    expect(swapAccessory(s2, 1, states, last)).toBe(s2);
    const h = swapHiit(s);
    expect(h.hiitVariant).toBe(1);
    expect(h.hiitSpec).not.toBe(s.hiitSpec);
    expect(swapHiit({ ...h, hiit: { kind: 'intervals', completed: true } })).toEqual({ ...h, hiit: { kind: 'intervals', completed: true } });
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

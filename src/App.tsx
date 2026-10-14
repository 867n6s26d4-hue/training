import { useRef, useState } from 'preact/hooks';
import type { DayId, ExerciseState, Session } from './types';
import { DEFAULT_SETTINGS } from './types';
import {
  db,
  deloadSuggested,
  discardSession,
  finishSession,
  getActiveSession,
  getSettings,
  listDoneSessions,
  saveSession,
  setSetting,
  startSession,
  suggestNextDay,
} from './db';
import { useLive } from './hooks';
import { stopSilent, unlockAudio } from './audio';
import { allowScreenOff, keepScreenOn } from './wakelock';
import { engine } from './timer';
import { Home } from './ui/Home';
import { History } from './ui/History';
import { Settings } from './ui/Settings';
import { Summary } from './ui/Summary';
import { Workout } from './ui/Workout';

type Tab = 'home' | 'history' | 'settings';
type View = 'tabs' | 'workout' | 'summary';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [view, setView] = useState<View>('tabs');
  const [working, setWorking] = useState<Session | null>(null);
  const [summary, setSummary] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<Session | null>(null);

  const settings = useLive(getSettings, []);
  const active = useLive(getActiveSession, []);
  const done = useLive(listDoneSessions, []);
  const next = useLive(suggestNextDay, []);
  const suggested = useLive(deloadSuggested, []);
  const statesRows = useLive(() => db.exerciseState.toArray(), []);

  if (!settings || !done || !next) return <div class="screen muted">Laddar…</div>;
  const cfg = settings ?? DEFAULT_SETTINGS;
  const states: Record<string, ExerciseState | undefined> = {};
  (statesRows ?? []).forEach((r) => (states[r.exerciseId] = r));

  const enter = (s: Session) => {
    ref.current = s;
    setWorking(s);
    setView('workout');
  };

  const cleanup = () => {
    engine.stop();
    stopSilent();
    void allowScreenOff();
  };

  const onStart = (day: DayId) => {
    // Måste ske direkt i tryckhändelsen så att iOS låter oss spela ljud
    void unlockAudio(cfg.audioSession);
    void keepScreenOn();
    try {
      void navigator.storage?.persist?.();
    } catch {
      /* ignoreras */
    }
    startSession(day)
      .then(enter)
      .catch((e: Error) => setError('Kunde inte starta passet: ' + e.message));
  };

  const onResume = () => {
    if (!active) return;
    void unlockAudio(cfg.audioSession);
    void keepScreenOn();
    enter(active);
  };

  const change = (fn: (s: Session) => Session) => {
    const cur = ref.current;
    if (!cur) return;
    const n = fn(cur);
    ref.current = n;
    setWorking(n);
    saveSession(n).catch((e: Error) => setError('Kunde inte spara: ' + e.message));
  };

  const onFinish = async () => {
    const cur = ref.current;
    if (!cur || cur.id === undefined) return;
    try {
      const d = await finishSession(cur.id);
      cleanup();
      ref.current = null;
      setWorking(null);
      setSummary(d);
      setView('summary');
    } catch (e) {
      setError('Kunde inte spara passet: ' + (e as Error).message);
    }
  };

  const onDiscard = async () => {
    const cur = ref.current;
    if (cur?.id !== undefined) await discardSession(cur.id);
    cleanup();
    ref.current = null;
    setWorking(null);
    setView('tabs');
  };

  if (view === 'workout' && working) {
    return (
      <>
        <Workout
          session={working}
          states={states}
          settings={cfg}
          onChange={change}
          onFinish={onFinish}
          onDiscard={onDiscard}
          onBack={() => setView('tabs')}
        />
        {error && <div class="toast" onClick={() => setError('')}>{error}</div>}
      </>
    );
  }

  if (view === 'summary' && summary) {
    return <Summary session={summary} onClose={() => setView('tabs')} />;
  }

  return (
    <>
      {tab === 'home' && (
        <Home
          active={active}
          done={done}
          next={next}
          deloadSuggested={!!suggested}
          settings={cfg}
          states={states}
          onStart={onStart}
          onResume={onResume}
          onSetDeloadNext={(on) => void setSetting('deloadNext', on)}
        />
      )}
      {tab === 'history' && <History sessions={done} />}
      {tab === 'settings' && <Settings settings={cfg} />}
      {error && <div class="toast" onClick={() => setError('')}>{error}</div>}
      <nav class="tabbar">
        {(
          [
            ['home', 'Hem'],
            ['history', 'Historik'],
            ['settings', 'Inställningar'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} class={tab === id ? 'on' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ExerciseLog, ExerciseState, HiitLog, Session, SetLog, Settings, StrengthItem } from '../types';
import { getDay, getExercise, restText, targetText } from '../data/program';
import { fmtKg } from '../logic/progression';
import { platesPerSide } from '../logic/plates';
import { buildRestPlan, fmtClock } from '../logic/timerPlan';
import { engine } from '../timer';
import { unlockAudio } from '../audio';
import { keepScreenOn } from '../wakelock';
import { lastDoneSets } from '../db';
import { fmtTime, parseNum } from '../format';
import { useInterval } from '../hooks';
import { TimerScreen } from './TimerScreen';

interface Props {
  session: Session;
  states: Record<string, ExerciseState | undefined>;
  settings: Settings;
  onChange: (update: (s: Session) => Session) => void;
  onFinish: () => void;
  onDiscard: () => void;
  onBack: () => void;
}

type Last = Record<string, { sets: SetLog[]; level?: string }>;

function lastText(last: { sets: SetLog[] } | undefined, kind: string): string | null {
  if (!last) return null;
  const done = last.sets.filter((s) => s.done);
  if (!done.length) return null;
  const reps = done.map((s) => s.reps ?? 0).join('/');
  const w = done[0].weight;
  if (kind === 'bodyweight') return reps;
  return `${fmtKg(w)} kg · ${reps}`;
}

export function Workout({ session, states, settings, onChange, onFinish, onDiscard, onBack }: Props) {
  const day = getDay(session.dayId);
  const [last, setLast] = useState<Last>({});
  const [hiitOpen, setHiitOpen] = useState(false);
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null);
  const [restDone, setRestDone] = useState(false);

  useEffect(() => {
    void lastDoneSets().then(setLast);
    void keepScreenOn();
  }, []);

  // Vilotimerns klar-läge visas en kort stund
  useEffect(() => {
    engine.onFinish = () => {
      if (engine.plan?.kind === 'rest') {
        setRestDone(true);
        setTimeout(() => {
          if (engine.isFinished) engine.stop();
          setRestDone(false);
        }, 2500);
      }
    };
    return () => {
      engine.onFinish = null;
    };
  }, []);

  const restActive = !hiitOpen && engine.plan?.kind === 'rest';
  useInterval(!!restActive, 200);

  const startRest = (sec: number) => {
    void unlockAudio(settings.audioSession);
    setRestDone(false);
    engine.start(buildRestPlan(sec));
  };

  const updateEx = (i: number, fn: (ex: ExerciseLog) => ExerciseLog) =>
    onChange((s) => ({ ...s, strength: s.strength.map((ex, k) => (k === i ? fn(ex) : ex)) }));

  const setSet = (i: number, j: number, patch: Partial<SetLog>) =>
    updateEx(i, (ex) => ({ ...ex, sets: ex.sets.map((x, k) => (k === j ? { ...x, ...patch } : x)) }));

  const setWeight = (i: number, j: number, w: number | null) =>
    updateEx(i, (ex) => {
      const old = ex.sets[j].weight;
      return {
        ...ex,
        sets: ex.sets.map((x, k) => {
          if (k === j) return { ...x, weight: w };
          if (k > j && !x.done && x.weight === old) return { ...x, weight: w };
          return x;
        }),
      };
    });

  const toggleDone = (i: number, j: number, item: StrengthItem) => {
    const ex = session.strength[i];
    const nowDone = !ex.sets[j].done;
    setSet(i, j, { done: nowDone });
    if (nowDone) {
      const lastSetOfAll = i === session.strength.length - 1 && j === ex.sets.length - 1;
      if (!lastSetOfAll) startRest(item.restSec);
      else void unlockAudio(settings.audioSession);
    }
  };

  const totalSets = useMemo(() => session.strength.reduce((n, e) => n + e.sets.length, 0), [session]);
  const doneSets = useMemo(() => session.strength.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0), [session]);

  const openHiit = () => {
    void unlockAudio(settings.audioSession);
    setHiitOpen(true);
  };

  const closeHiit = (result: HiitLog | null) => {
    setHiitOpen(false);
    if (result) onChange((s) => ({ ...s, hiit: result }));
  };

  if (hiitOpen) {
    return <TimerScreen title={day.hiitTitle} spec={day.hiit} leadInSec={settings.leadInSec} onClose={closeHiit} />;
  }

  const restState = engine.plan?.kind === 'rest' ? engine : null;
  const restRemaining = restState && engine.plan ? Math.max(0, engine.plan.totalMs - engine.elapsed()) : 0;

  return (
    <div class="screen workout">
      <header class="topbar">
        <button class="btn ghost small" onClick={onBack}>
          ‹ Hem
        </button>
        <div class="topbar-title">
          Pass {day.id}
          {session.deload && <span class="tag warn">Deload</span>}
        </div>
        <div class="muted tnum">{fmtTime(session.startedAt)}</div>
      </header>

      <h1 class="h1">{day.title}</h1>
      <p class="muted">{day.focus}</p>

      <div class="callout">
        <b>Uppvärmning ca 3 min:</b> {day.warmup}
      </div>
      {session.deload && (
        <div class="callout warn">
          Deload-pass: färre set (ca 60 % volym), samma vikt. Ingen progression räknas för det här passet.
        </div>
      )}

      <h2 class="h2">Del 1 · Styrka</h2>
      {day.strength.map((item, i) => {
        const def = getExercise(item.exerciseId);
        const ex = session.strength[i];
        const st = states[item.exerciseId];
        const topWeight = ex.sets.find((x) => !x.done)?.weight ?? ex.sets[0]?.weight ?? null;
        const plates =
          def.kind === 'barbell' && topWeight !== null && topWeight > settings.barWeight
            ? platesPerSide(topWeight, settings.barWeight, settings.plates)
            : null;
        const lt = lastText(last[item.exerciseId], def.kind);
        return (
          <section class="card ex" key={item.exerciseId}>
            <div class="ex-head">
              <div>
                <div class="ex-name">{def.name}</div>
                {def.note && <div class="muted small-text">{def.note}</div>}
              </div>
              <div class="ex-target">
                <div class="tnum">{targetText(ex.sets.length, item.repsMin, item.repsMax, session.deload ? undefined : item.targetLabel)}</div>
                <div class="muted small-text">vila {restText(item.restSec)}</div>
              </div>
            </div>
            {lt && <div class="muted small-text">Förra gången: {lt}</div>}
            {st?.suggestHarder && (
              <div class="hint">Alla set på toppen förra gången. Dags för en svårare variant.</div>
            )}
            {plates && (
              <div class="plates tnum">
                Skivor per sida: {plates.perSide.length ? plates.perSide.map(fmtKg).join(' + ') : 'bara stången'}
                {plates.remainder > 0 && <span class="warn-text"> (saknar {fmtKg(plates.remainder)} kg)</span>}
              </div>
            )}
            {(def.kind === 'bodyweight' || def.kind === 'weighted-bodyweight') && (
              <input
                class="text-input"
                placeholder={def.kind === 'bodyweight' ? 'Nivå (ringhöjd, bandfärg, variant)' : 'Variant (t.ex. band)'}
                value={ex.level ?? ''}
                onInput={(e) => updateEx(i, (x) => ({ ...x, level: (e.currentTarget as HTMLInputElement).value }))}
              />
            )}
            <div class="sets">
              {ex.sets.map((set, j) => (
                <div class={'set-row' + (set.done ? ' done' : '')} key={j}>
                  <div class="set-no tnum">{j + 1}</div>
                  {def.kind !== 'bodyweight' && (
                    <Stepper
                      label={def.kind === 'weighted-bodyweight' ? 'kg extra' : def.kind === 'dumbbell' ? 'kg/hantel' : 'kg'}
                      value={set.weight}
                      step={2.5}
                      allowNegative={def.kind === 'weighted-bodyweight'}
                      decimals
                      onChange={(v) => setWeight(i, j, v)}
                    />
                  )}
                  <Stepper
                    label={def.repsSuffix ? `reps ${def.repsSuffix}` : 'reps'}
                    value={set.reps}
                    step={1}
                    onChange={(v) => setSet(i, j, { reps: v })}
                  />
                  <button
                    class={'check' + (set.done ? ' on' : '')}
                    aria-label={set.done ? 'Ångra klart' : 'Markera klart'}
                    aria-pressed={set.done}
                    onClick={() => toggleDone(i, j, item)}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <h2 class="h2">Del 2 · Högintensivt</h2>
      <section class="card hiit">
        <div class="ex-name">{day.hiitTitle}</div>
        <ol class="hiit-list">
          {day.hiit.items.map((it, k) => (
            <li key={k}>{it}</li>
          ))}
        </ol>
        {day.hiit.kind === 'intervals' && (
          <div class="muted small-text">
            {day.hiit.rounds} varv × {day.hiit.items.length} övningar, {day.hiit.workSec} s arbete / {day.hiit.restSec} s vila
            (ca {Math.round((day.hiit.rounds * day.hiit.items.length * (day.hiit.workSec + day.hiit.restSec)) / 60)} min)
          </div>
        )}
        {session.hiit ? (
          <div class="result-line">
            <span class="tag ok">Klar</span>
            {session.hiit.rounds !== undefined && <span> {session.hiit.rounds} varv</span>}
            {session.hiit.note && <span class="muted"> · {session.hiit.note}</span>}
            <button class="btn ghost small" onClick={openHiit}>
              Kör igen
            </button>
          </div>
        ) : (
          <button class="btn primary xl" onClick={openHiit}>
            Starta {day.hiit.kind === 'emom' ? 'EMOM' : day.hiit.kind === 'amrap' ? 'AMRAP' : 'intervaller'}
          </button>
        )}
      </section>

      <div class="finish">
        <div class="muted tnum">
          {doneSets} av {totalSets} set klara{session.hiit ? ' · HIIT klar' : ''}
        </div>
        {confirm === 'finish' ? (
          <div class="row gap">
            <button class="btn primary grow" onClick={onFinish}>
              Ja, avsluta
            </button>
            <button class="btn grow" onClick={() => setConfirm(null)}>
              Tillbaka
            </button>
          </div>
        ) : confirm === 'discard' ? (
          <div class="row gap">
            <button class="btn danger grow" onClick={onDiscard}>
              Ja, släng passet
            </button>
            <button class="btn grow" onClick={() => setConfirm(null)}>
              Behåll
            </button>
          </div>
        ) : (
          <div class="row gap">
            <button
              class="btn primary grow xl"
              onClick={() => (doneSets < totalSets ? setConfirm('finish') : onFinish())}
            >
              Avsluta pass
            </button>
            <button class="btn ghost" onClick={() => setConfirm('discard')}>
              Släng
            </button>
          </div>
        )}
        {confirm === 'finish' && doneSets < totalSets && (
          <div class="warn-text small-text">{totalSets - doneSets} set är inte markerade som klara. De räknas inte i progressionen.</div>
        )}
      </div>

      {(restState || restDone) && (
        <div class={'rest-bar' + (restDone ? ' ready' : '')} role="status">
          {restDone ? (
            <div class="rest-label">Redo för nästa set</div>
          ) : (
            <>
              <div class="rest-clock tnum">{fmtClock(restRemaining)}</div>
              <div class="rest-label">Vila</div>
              <button
                class="btn small"
                onClick={() => {
                  const remaining = engine.plan ? Math.max(0, engine.plan.totalMs - engine.elapsed()) : 0;
                  startRest(Math.round(remaining / 1000) + 15);
                }}
              >
                +15 s
              </button>
              <button class="btn small" onClick={() => engine.stop()}>
                Hoppa över
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface StepperProps {
  label: string;
  value: number | null;
  step: number;
  decimals?: boolean;
  allowNegative?: boolean;
  onChange: (v: number | null) => void;
}

function Stepper({ label, value, step, decimals, allowNegative, onChange }: StepperProps) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value === null ? '' : fmtKg(value));
  const bump = (d: number) => {
    const base = value ?? 0;
    let n = Math.round((base + d) * 100) / 100;
    if (!allowNegative && n < 0) n = 0;
    onChange(n);
    setText(null);
  };
  return (
    <div class="stepper">
      <button class="step" onClick={() => bump(-step)} aria-label={`Minska ${label}`}>
        −
      </button>
      <div class="stepper-mid">
        <input
          class="num-input tnum"
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={shown}
          placeholder="–"
          onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
          onInput={(e) => {
            const t = (e.currentTarget as HTMLInputElement).value;
            setText(t);
            onChange(parseNum(t));
          }}
          onBlur={() => setText(null)}
          aria-label={label}
        />
        <div class="stepper-label">{label}</div>
      </div>
      <button class="step" onClick={() => bump(step)} aria-label={`Öka ${label}`}>
        +
      </button>
    </div>
  );
}

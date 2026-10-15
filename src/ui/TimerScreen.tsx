import { useEffect, useMemo, useState } from 'preact/hooks';
import type { HiitLog, HiitSpec } from '../types';
import { buildHiitPlan, fmtClock, fmtElapsed, stateAt } from '../logic/timerPlan';
import { engine } from '../timer';
import { useInterval } from '../hooks';
import { keepScreenOn } from '../wakelock';
import { playSound } from '../audio';

interface Props {
  title: string;
  spec: HiitSpec;
  leadInSec: number;
  onClose: (result: HiitLog | null) => void;
}

export function TimerScreen({ title, spec, leadInSec, onClose }: Props) {
  const plan = useMemo(() => buildHiitPlan(spec, leadInSec), [spec, leadInSec]);
  const [rounds, setRounds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [note, setNote] = useState('');
  /** På tid: användarens sluttid i ms, eller tidsgränsen om den nåddes */
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const [capped, setCapped] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    engine.onFinish = () => {
      if (spec.kind === 'fortime') {
        setFinalMs(spec.capMinutes * 60000);
        setCapped(true);
      }
      setFinished(true);
    };
    engine.start(plan);
    void keepScreenOn();
    force((n) => n + 1);
    return () => {
      engine.onFinish = null;
      engine.stop();
    };
  }, [plan, spec]);

  useInterval(!finished, 200);

  const paused = engine.paused;
  const st = stateAt(plan, engine.elapsed());
  const seg = st.segment;
  const isAmrap = spec.kind === 'amrap';
  const isFortime = spec.kind === 'fortime';
  const countsRounds = isAmrap || (isFortime && (spec.rounds ?? 0) > 1);

  /** På tid: klar före tidsgränsen */
  const stopFortime = () => {
    const ms = Math.max(0, engine.elapsed() - seg.start);
    engine.stop();
    playSound('final');
    setFinalMs(Math.min(ms, spec.kind === 'fortime' ? spec.capMinutes * 60000 : ms));
    setCapped(false);
    setFinished(true);
  };

  const finishDone = () =>
    onClose({
      kind: spec.kind,
      completed: true,
      rounds: isAmrap || (isFortime && capped && countsRounds) ? rounds : undefined,
      timeSec: isFortime && finalMs !== null ? Math.round(finalMs / 1000) : undefined,
      capped: isFortime ? capped : undefined,
      note: note.trim() || undefined,
    });

  if (finished) {
    return (
      <div class="timer-screen" data-kind="done">
        <div class="timer-top">
          <span class="chip">{title}</span>
        </div>
        <div class="timer-mid">
          <div class="timer-title">Klart!</div>
          {isFortime && finalMs !== null && (
            <div class="amrap-final">
              <div class="muted">{capped ? 'Tidsgränsen nåddes' : 'Din tid'}</div>
              <div class="timer-clock tnum">{fmtElapsed(finalMs)}</div>
            </div>
          )}
          {(isAmrap || (isFortime && capped && countsRounds)) && (
            <div class="amrap-final">
              <div class="muted">Antal varv</div>
              <div class="stepper big">
                <button class="step" onClick={() => setRounds((r) => Math.max(0, r - 1))} aria-label="Minska varv">
                  −
                </button>
                <div class="num">{rounds}</div>
                <button class="step" onClick={() => setRounds((r) => r + 1)} aria-label="Öka varv">
                  +
                </button>
              </div>
            </div>
          )}
          <input
            class="text-input"
            placeholder="Anteckning (valfritt)"
            value={note}
            onInput={(e) => setNote((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div class="timer-bottom">
          <button class="btn primary xl" onClick={finishDone}>
            Spara resultat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="timer-screen" data-kind={seg.kind}>
      <div class="timer-top">
        <span class="chip">{title}</span>
        <span class="muted tnum">Totalt kvar {fmtClock(st.totalRemainingMs)}</span>
      </div>
      <div class="timer-mid">
        <div class="timer-phase">
          {seg.kind === 'leadin' ? 'Förbered' : seg.kind === 'rest' ? 'Vila' : seg.kind === 'amrap' ? 'AMRAP' : seg.kind === 'fortime' ? 'På tid' : 'Kör'}
        </div>
        <div class="timer-clock tnum">
          {seg.kind === 'fortime' ? fmtElapsed(engine.elapsed() - seg.start) : fmtClock(st.segRemainingMs)}
        </div>
        <div class="timer-title">{seg.kind === 'rest' ? 'Vila' : seg.title}</div>
        {seg.detail && <div class="muted timer-detail">{seg.detail}</div>}
        {seg.lines && (
          <ul class="timer-lines">
            {seg.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
        {seg.next && !seg.lines && (
          <div class="timer-next">
            <span class="muted">Nästa</span> {seg.next}
          </div>
        )}
        {countsRounds && (seg.kind === 'amrap' || seg.kind === 'fortime') && (
          <button class="btn round xl" onClick={() => setRounds((r) => r + 1)}>
            <span class="round-count tnum">{isFortime ? `${rounds} / ${spec.rounds}` : rounds}</span>
            <span>+1 varv</span>
          </button>
        )}
        {isFortime && seg.kind === 'fortime' && (
          <button class="btn primary xl" onClick={stopFortime}>
            Klar!
          </button>
        )}
      </div>
      <div class="progress">
        <div class="progress-fill" style={{ width: `${st.progress * 100}%` }} />
      </div>
      <div class="timer-bottom">
        {confirmStop ? (
          <div class="row gap">
            <button class="btn danger grow" onClick={() => onClose(null)}>
              Avsluta timern
            </button>
            <button class="btn grow" onClick={() => setConfirmStop(false)}>
              Fortsätt
            </button>
          </div>
        ) : (
          <div class="row gap">
            <button
              class="btn grow"
              onClick={() => {
                if (paused) engine.resume();
                else engine.pause();
                force((n) => n + 1);
              }}
            >
              {paused ? 'Fortsätt' : 'Paus'}
            </button>
            <button class="btn ghost" onClick={() => setConfirmStop(true)}>
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

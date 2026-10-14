import type { DayId, ExerciseState, Session, Settings } from '../types';
import { DAYS, estimateMinutes, getDay } from '../data/program';
import { fmtDate, fmtTime } from '../format';

interface Props {
  active: Session | undefined;
  done: Session[];
  next: DayId;
  deloadSuggested: boolean;
  settings: Settings;
  states: Record<string, ExerciseState | undefined>;
  onStart: (day: DayId) => void;
  onResume: () => void;
  onSetDeload: (on: boolean) => void;
}

export function Home({ active, done, next, deloadSuggested, settings, onStart, onResume, onSetDeload }: Props) {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = done.filter((s) => s.startedAt >= weekAgo).length;
  const nextDay = getDay(next);
  return (
    <div class="screen">
      <header class="topbar plain">
        <div class="brand">Garagepasset</div>
      </header>

      {active ? (
        <section class="card hero">
          <div class="muted">Pågående pass</div>
          <div class="hero-title">
            Pass {active.dayId} · {getDay(active.dayId).title}
          </div>
          <div class="muted">Startade {fmtDate(active.startedAt)} kl {fmtTime(active.startedAt)}</div>
          <button class="btn primary xl" onClick={onResume}>
            Fortsätt passet
          </button>
        </section>
      ) : (
        <section class="card hero">
          <div class="muted">Nästa pass</div>
          <div class="hero-title">
            Pass {nextDay.id} · {nextDay.title}
          </div>
          <div class="muted">
            {nextDay.focus} · ca {estimateMinutes(nextDay)} min · block {settings.blockIndex + 1}
          </div>
          {settings.deloadRemaining > 0 && <div class="tag warn">Deload (ca 60 % volym), {settings.deloadRemaining} pass kvar</div>}
          <button class="btn primary xl" onClick={() => onStart(next)}>
            Starta pass {nextDay.id}
          </button>
        </section>
      )}

      {!active && deloadSuggested && (
        <section class="callout warn">
          Det har gått minst fem veckor sedan senaste deload. Ett lättare pass med färre set ger återhämtning.
          <button class="btn small" onClick={() => onSetDeload(true)}>
            Starta deload (3 pass)
          </button>
        </section>
      )}
      {!active && settings.deloadRemaining > 0 && (
        <section class="callout">
          Deload pågår: {settings.deloadRemaining} pass kvar. När den är klar byts baslyften till nästa block.
          <button class="btn small" onClick={() => onSetDeload(false)}>
            Ångra
          </button>
        </section>
      )}

      {!active && (
        <>
          <h2 class="h2">Välj annat pass</h2>
          <div class="grid3">
            {DAYS.map((d) => (
              <button class="btn day" key={d.id} onClick={() => onStart(d.id)}>
                <b>{d.id}</b>
                <span class="small-text">{d.title}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 class="h2">Överblick</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-num tnum">{thisWeek}</div>
          <div class="muted small-text">pass senaste 7 dagarna</div>
        </div>
        <div class="stat">
          <div class="stat-num tnum">{done.length}</div>
          <div class="muted small-text">pass totalt</div>
        </div>
        <div class="stat">
          <div class="stat-num tnum">{done[0] ? fmtDate(done[0].startedAt) : '–'}</div>
          <div class="muted small-text">senaste pass</div>
        </div>
      </div>
    </div>
  );
}

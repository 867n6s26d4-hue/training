import type { Session } from '../types';
import { getDay, getExercise } from '../data/program';
import { fmtKg } from '../logic/progression';
import { fmtDate, fmtDuration } from '../format';

function exerciseLine(ex: Session['strength'][number]): string | null {
  const done = ex.sets.filter((s) => s.done);
  if (!done.length) return null;
  const def = getExercise(ex.exerciseId);
  const reps = done.map((s) => s.reps ?? 0).join('/');
  const w = done[0].weight;
  const parts = [def.name];
  if (def.kind !== 'bodyweight' && w !== null) parts.push(`${fmtKg(w)} kg`);
  parts.push(reps);
  if (ex.level) parts.push(`(${ex.level})`);
  return parts.join(' · ');
}

export function History({ sessions }: { sessions: Session[] }) {
  return (
    <div class="screen">
      <header class="topbar plain">
        <div class="brand">Historik</div>
      </header>
      {sessions.length === 0 && <p class="muted">Inga pass ännu. Det första passet du avslutar dyker upp här.</p>}
      {sessions.map((s) => (
        <section class="card" key={s.id}>
          <div class="hist-head">
            <div>
              <b>
                Pass {s.dayId} · {getDay(s.dayId).title}
              </b>
              <div class="muted small-text">
                {fmtDate(s.startedAt)}
                {s.endedAt ? ` · ${fmtDuration(s.endedAt - s.startedAt)}` : ''}
              </div>
            </div>
            {s.deload && <span class="tag warn">Deload</span>}
          </div>
          <ul class="hist-list">
            {s.strength.map((ex) => {
              const l = exerciseLine(ex);
              return l ? <li key={ex.exerciseId} class="tnum">{l}</li> : null;
            })}
            {s.hiit?.completed && (
              <li class="tnum">
                {getDay(s.dayId).hiitTitle}
                {s.hiit.rounds !== undefined ? ` · ${s.hiit.rounds} varv` : ''}
                {s.hiit.note ? ` · ${s.hiit.note}` : ''}
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

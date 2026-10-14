import type { Session } from '../types';
import { getExercise } from '../data/program';
import { fmtKg } from '../logic/progression';
import { fmtDuration } from '../format';

export function Summary({ session, onClose }: { session: Session; onClose: () => void }) {
  return (
    <div class="screen">
      <header class="topbar plain">
        <div class="brand">Bra jobbat</div>
      </header>
      <section class="card hero">
        <div class="hero-title">Pass {session.dayId} sparat</div>
        <div class="muted">
          {session.endedAt ? fmtDuration(session.endedAt - session.startedAt) : ''}
          {session.deload ? ' · deload' : ''}
        </div>
      </section>
      <h2 class="h2">Nästa gång</h2>
      <section class="card">
        {(session.changes ?? []).map((c) => {
          const def = getExercise(c.exerciseId);
          let text: string;
          let cls = 'muted';
          if (c.reason === 'up' && c.harder) {
            text = 'Alla set på toppen. Prova en svårare variant.';
            cls = 'ok-text';
          } else if (c.reason === 'up') {
            text = `${fmtKg(c.from)} → ${fmtKg(c.to)} kg`;
            cls = 'ok-text';
          } else if (c.reason === 'down') {
            text = `${fmtKg(c.from)} → ${fmtKg(c.to)} kg (två pass i rad under målet)`;
            cls = 'warn-text';
          } else if (c.reason === 'skipped') {
            text = session.deload ? 'Ingen progression (deload)' : 'Inga set loggade';
          } else {
            text = c.to === null ? 'Behåll' : `Behåll ${fmtKg(c.to)} kg`;
          }
          return (
            <div class="sum-row" key={c.exerciseId}>
              <div>{def.name}</div>
              <div class={cls}>{text}</div>
            </div>
          );
        })}
      </section>
      <button class="btn primary xl" onClick={onClose}>
        Klar
      </button>
    </div>
  );
}

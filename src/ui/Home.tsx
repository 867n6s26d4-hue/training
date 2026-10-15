import type { DayId, Session, Settings } from '../types';
import { DAYS, estimateMinutes, getDay, hiitTitleFor } from '../data/program';
import { describeItem } from '../logic/preview';
import { weekDays, weekStreak } from '../logic/stats';
import { useLive } from '../hooks';
import { lastDoneSets, previewNext } from '../db';

interface Props {
  active: Session | undefined;
  done: Session[];
  next: DayId;
  deloadSuggested: boolean;
  settings: Settings;
  onStart: (day: DayId) => void;
  onResume: () => void;
  onSetDeload: (on: boolean) => void;
}

const WEEKDAYS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const dateFmt = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

export function Home({ active, done, next, deloadSuggested, settings, onStart, onResume, onSetDeload }: Props) {
  const now = Date.now();
  const heroDay = active ? active.dayId : next;
  const day = getDay(heroDay);
  const preview = useLive(() => previewNext(heroDay), [heroDay, done.length, settings.blockIndex, settings.deloadRemaining]);
  const last = useLive(lastDoneSets, [done.length]);
  const streak = weekStreak(done.map((s) => s.startedAt), now);
  const days = weekDays(done, now);
  const trainedToday = days.some((d) => d.today && d.dayId);
  const rows = preview?.items.map((it, i) => describeItem(it, preview.strength[i], last?.[it.exerciseId]));

  return (
    <div class="screen">
      <header class="home-top">
        <div>
          <div class="date">{dateFmt.format(now)}</div>
          <div class="brand">Garagepasset</div>
        </div>
        {streak > 0 && <span class="chip lime">{streak === 1 ? '1 vecka i rad' : `${streak} veckor i rad`}</span>}
      </header>

      <section class="hero2">
        <div class="hero-letter" aria-hidden="true">
          {day.id}
        </div>
        <div class="kick">{active ? 'Pågående pass' : trainedToday ? 'Nästa pass' : 'Dagens pass'}</div>
        <h1 class="hero-name">{day.title}</h1>
        <div class="chips">
          <span class="chip">ca {estimateMinutes(day)} min</span>
          <span class="chip">Block {(active ? active.block : settings.blockIndex) + 1}</span>
          {(active ? active.deload : settings.deloadRemaining > 0) && <span class="chip warn">Deload</span>}
        </div>
        {!active && rows && preview && (
          <div class="lifts">
            {rows.map((r, i) => (
              <div class="lift" key={i}>
                <b>{r.name}</b>
                <span class="tnum">
                  {r.target}
                  {r.weight && <span class={r.up ? 'up' : 'wt'}> {r.weight}</span>}
                </span>
              </div>
            ))}
            <div class="lift">
              <b>HIIT</b>
              <span class="tnum">{hiitTitleFor(preview.hiitSpec)}</span>
            </div>
          </div>
        )}
        <button class="btn primary xl" onClick={() => (active ? onResume() : onStart(heroDay))}>
          {active ? 'Fortsätt passet' : `Starta pass ${day.id}`}
          <span aria-hidden="true">›</span>
        </button>
      </section>

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

      <h2 class="h2">Veckan</h2>
      <div class="week" aria-label="Veckans pass">
        {days.map((d, i) => (
          <div class="wd" key={i}>
            {WEEKDAYS[i]}
            <div class={'dot' + (d.dayId ? ' done' : '') + (d.today ? ' today' : '')}>{d.dayId ?? ''}</div>
          </div>
        ))}
      </div>

      {!active && (
        <>
          <h2 class="h2">Annat pass</h2>
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
    </div>
  );
}

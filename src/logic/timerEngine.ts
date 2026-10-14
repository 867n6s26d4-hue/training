import type { Plan, SoundId } from './timerPlan';

export type PlayFn = (sound: SoundId) => void;

const LOOKAHEAD_MS = 1200;
const TICK_MS = 200;
/** Signaler som är mer än så här sena (t.ex. efter att appen legat i bakgrunden) hoppas över */
const STALE_MS = 500;

/**
 * Kör en plan med absoluta tidsstämplar. Tiden räknas alltid från Date.now(), aldrig genom
 * att räkna tick, och signaler schemaläggs strax i förväg (lookahead) via setTimeout.
 */
export class TimerEngine {
  plan: Plan | null = null;
  private startedAt = 0;
  private pausedAt: number | null = null;
  private pausedTotal = 0;
  private fired = new Set<number>();
  private scheduled = new Map<number, ReturnType<typeof setTimeout>>();
  private tickId: ReturnType<typeof setInterval> | null = null;
  private finished = false;
  private token = 0;
  onFinish: (() => void) | null = null;
  /** Spelade signaler med avvikelse i ms, för diagnostik */
  lastDeviationMs: number | null = null;

  constructor(private play: PlayFn, private now: () => number = () => Date.now()) {}

  get running(): boolean {
    return this.plan !== null && !this.finished && this.pausedAt === null;
  }
  get paused(): boolean {
    return this.plan !== null && !this.finished && this.pausedAt !== null;
  }
  get isFinished(): boolean {
    return this.finished;
  }

  elapsed(): number {
    if (!this.plan) return 0;
    const ref = this.pausedAt ?? this.now();
    return Math.min(this.plan.totalMs, Math.max(0, ref - this.startedAt - this.pausedTotal));
  }

  start(plan: Plan): void {
    this.stop();
    this.plan = plan;
    this.startedAt = this.now();
    this.pausedAt = null;
    this.pausedTotal = 0;
    this.finished = false;
    this.fired.clear();
    this.token++;
    this.tickId = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  pause(): void {
    if (!this.running) return;
    this.pausedAt = this.now();
    this.clearScheduled();
  }

  resume(): void {
    if (!this.paused || this.pausedAt === null) return;
    this.pausedTotal += this.now() - this.pausedAt;
    this.pausedAt = null;
    this.tick();
  }

  stop(): void {
    if (this.tickId) clearInterval(this.tickId);
    this.tickId = null;
    this.clearScheduled();
    this.plan = null;
    this.pausedAt = null;
    this.finished = false;
    this.token++;
  }

  private clearScheduled(): void {
    for (const t of this.scheduled.values()) clearTimeout(t);
    this.scheduled.clear();
  }

  private tick(): void {
    const plan = this.plan;
    if (!plan || this.pausedAt !== null || this.finished) return;
    const e = this.elapsed();
    plan.events.forEach((ev, i) => {
      if (this.fired.has(i) || this.scheduled.has(i)) return;
      const until = ev.at - e;
      if (until < -STALE_MS) {
        this.fired.add(i);
        return;
      }
      if (until <= LOOKAHEAD_MS) {
        const token = this.token;
        const wallDue = this.now() + Math.max(0, until);
        const h = setTimeout(() => {
          this.scheduled.delete(i);
          if (token !== this.token || this.pausedAt !== null) return;
          this.fired.add(i);
          this.lastDeviationMs = this.now() - wallDue;
          this.play(ev.sound);
        }, Math.max(0, until));
        this.scheduled.set(i, h);
      }
    });
    if (e >= plan.totalMs && this.scheduled.size === 0) {
      this.finished = true;
      if (this.tickId) clearInterval(this.tickId);
      this.tickId = null;
      const cb = this.onFinish;
      if (cb) cb();
    }
  }
}

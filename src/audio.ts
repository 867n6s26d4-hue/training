import type { AudioSessionType } from './types';
import type { SoundId } from './logic/timerPlan';

/**
 * Ljud via vanliga HTMLAudio-element. Fas 0-testerna på iPhone (Safari 26, hemskärmsapp) visade att
 * Web Audio tappar ljudklockan i hemskärmsläge, medan ljudelement var pålitliga (+10–20 ms).
 * navigator.audioSession.type = 'ambient' låter beepen blandas med musik i stället för att pausa den.
 */
const SPEC: Record<SoundId, { f: number; d: number }> = {
  tick: { f: 660, d: 0.12 },
  go: { f: 880, d: 0.35 },
  rest: { f: 520, d: 0.25 },
  warn: { f: 740, d: 0.25 },
  final: { f: 1100, d: 0.9 },
};

function b64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function wavDataUri(samples: Int16Array, rate: number): string {
  const dataLen = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + dataLen, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, dataLen, true);
  samples.forEach((x, i) => v.setInt16(44 + i * 2, x, true));
  return 'data:audio/wav;base64,' + b64(new Uint8Array(buf));
}

export function toneSamples(freq: number, dur: number, rate = 22050): Int16Array {
  const n = Math.floor(rate * dur);
  const out = new Int16Array(n);
  const fadeIn = Math.floor(rate * 0.008);
  const fadeOut = Math.floor(rate * Math.min(0.04, dur / 3));
  for (let i = 0; i < n; i++) {
    let a = 0.8;
    if (i < fadeIn) a *= i / fadeIn;
    if (i > n - fadeOut) a *= (n - i) / fadeOut;
    out[i] = Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * a * 32767);
  }
  return out;
}

let tones: Partial<Record<SoundId, HTMLAudioElement>> = {};
let silent: HTMLAudioElement | null = null;
let primed = false;

export function audioSessionSupported(): boolean {
  return typeof navigator !== 'undefined' && 'audioSession' in navigator;
}

export function applyAudioSession(type: AudioSessionType): string {
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession) {
      nav.audioSession.type = type;
      return nav.audioSession.type;
    }
  } catch {
    /* ignoreras */
  }
  return 'saknas';
}

function ensureElements(): void {
  if (Object.keys(tones).length) return;
  (Object.keys(SPEC) as SoundId[]).forEach((id) => {
    const el = new Audio(wavDataUri(toneSamples(SPEC[id].f, SPEC[id].d), 22050));
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    tones[id] = el;
  });
  silent = new Audio(wavDataUri(new Int16Array(8000), 8000));
  silent.loop = true;
  silent.setAttribute('playsinline', '');
}

/**
 * Måste anropas direkt i en tryckhändelse (t.ex. "Starta pass"). Förbereder ljudelementen
 * tyst och startar en ljudlös loop så att ringkontakten och ljudsessionen hålls aktiva.
 */
export async function unlockAudio(type: AudioSessionType): Promise<{ session: string; ok: boolean }> {
  const session = applyAudioSession(type);
  ensureElements();
  let ok = true;
  if (!primed) {
    const jobs = Object.values(tones).map(async (el) => {
      if (!el) return;
      try {
        el.muted = true;
        await el.play();
        el.pause();
        el.currentTime = 0;
      } catch {
        ok = false;
      } finally {
        el.muted = false;
      }
    });
    await Promise.all(jobs);
    primed = ok;
  }
  await startSilent();
  return { session, ok };
}

export async function startSilent(): Promise<void> {
  ensureElements();
  try {
    await silent?.play();
  } catch {
    /* ignoreras */
  }
}

export function stopSilent(): void {
  try {
    silent?.pause();
  } catch {
    /* ignoreras */
  }
}

export function silentPlaying(): boolean {
  return !!silent && !silent.paused;
}

export function playSound(id: SoundId): void {
  const el = tones[id];
  if (!el) return;
  try {
    el.currentTime = 0;
    void el.play().catch(() => undefined);
  } catch {
    /* ignoreras */
  }
}

export async function soundCheck(): Promise<void> {
  const order: SoundId[] = ['tick', 'tick', 'tick', 'go', 'rest', 'warn', 'final'];
  for (const id of order) {
    playSound(id);
    await new Promise((r) => setTimeout(r, id === 'final' ? 1000 : 600));
  }
}

export function resetAudioForTests(): void {
  tones = {};
  silent = null;
  primed = false;
}

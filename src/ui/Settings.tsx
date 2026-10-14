import { useEffect, useState } from 'preact/hooks';
import type { AudioSessionType, Settings as S } from '../types';
import { applyAudioSession, audioSessionSupported, silentPlaying, soundCheck, unlockAudio } from '../audio';
import { exportAll, importAll, setSetting } from '../db';
import { parsePlates } from '../logic/plates';
import { parseNum } from '../format';

const SESSION_HELP: Record<AudioSessionType, string> = {
  ambient: 'Beepen blandas med din musik. Följer ringkontakten.',
  transient: 'Beepen spelas ovanpå och kan sänka musiken en stund.',
  playback: 'Beepen pausar musiken och startar den inte igen.',
  auto: 'Låter iOS välja. Pausade musiken i testerna.',
};

export function Settings({ settings }: { settings: S }) {
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState<string>('okänt');
  const [platesText, setPlatesText] = useState(settings.plates.join(', ').replace(/\./g, ','));
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        if (navigator.storage?.persisted) setPersisted((await navigator.storage.persisted()) ? 'ja' : 'nej');
      } catch {
        /* ignoreras */
      }
    })();
  }, []);

  const doExport = async () => {
    try {
      const data = await exportAll();
      const json = JSON.stringify(data, null, 2);
      const name = `garagepasset-${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        setMsg('Exporten delades.');
        return;
      }
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMsg(`Exporterade ${data.sessions.length} pass.`);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsg('Export misslyckades: ' + (e as Error).message);
    }
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const r = await importAll(data);
      setMsg(`Importerade ${r.sessions} pass. Tidigare data ersattes.`);
    } catch (e) {
      setMsg('Import misslyckades, inget har ändrats: ' + (e as Error).message);
    }
  };

  const doCheck = async () => {
    setChecking(true);
    const r = await unlockAudio(settings.audioSession);
    setMsg(`Ljudsession: ${r.session}. ${r.ok ? '' : 'Ljudet kunde inte förberedas. '}Du ska höra tre korta beep, tre olika signaler och en lång.`);
    await soundCheck();
    setChecking(false);
  };

  return (
    <div class="screen">
      <header class="topbar plain">
        <div class="brand">Inställningar</div>
      </header>

      <h2 class="h2">Ljud</h2>
      <section class="card">
        <label class="field">
          Ljudsession
          <select
            value={settings.audioSession}
            onChange={(e) => {
              const v = (e.currentTarget as HTMLSelectElement).value as AudioSessionType;
              void setSetting('audioSession', v);
              applyAudioSession(v);
            }}
          >
            <option value="ambient">Ambient (blandas med musik)</option>
            <option value="transient">Transient (sänker musiken)</option>
            <option value="playback">Playback (pausar musiken)</option>
            <option value="auto">Standard</option>
          </select>
        </label>
        <div class="muted small-text">{SESSION_HELP[settings.audioSession]}</div>
        <button class="btn" onClick={doCheck} disabled={checking}>
          Testa ljud
        </button>
        <div class="muted small-text">
          Ställ ringkontakten på ljud. Ambient följer den. Appen fungerar bäst med skärmen tänd och appen i förgrunden,
          annat ljud i en annan app tystar beepen.
        </div>
        <div class="muted small-text tnum">
          audioSession: {audioSessionSupported() ? 'stöds' : 'saknas'} · tyst loop: {silentPlaying() ? 'på' : 'av'}
        </div>
      </section>

      <h2 class="h2">Träning</h2>
      <section class="card">
        <label class="field">
          Stångens vikt (kg)
          <input
            class="text-input"
            inputMode="decimal"
            value={String(settings.barWeight).replace('.', ',')}
            onChange={(e) => {
              const n = parseNum((e.currentTarget as HTMLInputElement).value);
              if (n !== null && n > 0) void setSetting('barWeight', n);
            }}
          />
        </label>
        <label class="field">
          Skivor du har (kg, skilj med mellanslag)
          <input
            class="text-input"
            value={platesText}
            onInput={(e) => setPlatesText((e.currentTarget as HTMLInputElement).value)}
            onChange={() => {
              const p = parsePlates(platesText);
              if (p.length) void setSetting('plates', p);
            }}
          />
        </label>
        <label class="field">
          Nedräkning före HIIT (sekunder)
          <input
            class="text-input"
            inputMode="numeric"
            value={String(settings.leadInSec)}
            onChange={(e) => {
              const n = parseNum((e.currentTarget as HTMLInputElement).value);
              if (n !== null && n >= 0 && n <= 30) void setSetting('leadInSec', Math.round(n));
            }}
          />
        </label>
      </section>

      <h2 class="h2">Data</h2>
      <section class="card">
        <div class="muted small-text">
          All träning sparas lokalt i telefonen. Beständig lagring: {persisted}. Exportera då och då som säkerhetskopia.
        </div>
        <div class="row gap">
          <button class="btn grow" onClick={doExport}>
            Exportera
          </button>
          <label class="btn grow filebtn">
            Importera
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void doImport((e.currentTarget as HTMLInputElement).files?.[0])}
            />
          </label>
        </div>
        {msg && <div class="small-text" role="status">{msg}</div>}
      </section>
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

export const fmtDate = (ms: number): string => dateFmt.format(new Date(ms));
export const fmtTime = (ms: number): string => timeFmt.format(new Date(ms));

export function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  return m < 1 ? '< 1 min' : `${m} min`;
}

export function parseNum(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

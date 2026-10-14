export interface PlateResult {
  perSide: number[];
  /** Kvarvarande vikt (totalt) som inte går att bygga med tillgängliga skivor */
  remainder: number;
}

export function platesPerSide(total: number, bar: number, plates: number[]): PlateResult {
  let side = (total - bar) / 2;
  if (side <= 0) return { perSide: [], remainder: 0 };
  const sorted = [...plates].filter((p) => p > 0).sort((a, b) => b - a);
  const out: number[] = [];
  for (const p of sorted) {
    while (side + 1e-9 >= p) {
      out.push(p);
      side -= p;
    }
  }
  const remainder = Math.max(0, Math.round(side * 2 * 1000) / 1000);
  return { perSide: out, remainder };
}

export function parsePlates(text: string): number[] {
  // Mellanslag och semikolon skiljer skivor åt. Komma är decimaltecken ("2,5"),
  // men ett komma sist i en token ("20, 10") tolkas som skiljetecken.
  return text
    .split(/[\s;]+/)
    .map((t) => t.replace(/,+$/, ''))
    .map((t) => parseFloat(t.replace(',', '.')))
    .filter((x) => Number.isFinite(x) && x > 0);
}

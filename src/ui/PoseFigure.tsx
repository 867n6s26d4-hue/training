import { MOTION, POSES, type Pt } from '../data/poses';

const STYLE = {
  body: { w: 10, o: 1 },
  near: { w: 6, o: 1 },
  far: { w: 6, o: 0.45 },
  prop: { w: 2.5, o: 0.4 },
  band: { w: 2.5, o: 0.9 },
} as const;

const HEAD_R = 7;
/** Mjuk in- och utgång så att rörelsen känns som andning, inte ryck */
const EASE = { calcMode: 'spline', keyTimes: '0;0.5;1', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1' } as const;

function reducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
const PAD = 12;
const ASPECT = 1.5;

/** Rutan som ramar in figuren: tät runt figuren men alltid i samma bildformat. */
function viewBoxFor(points: Pt[], head: Pt): string {
  const xs = [...points.map((q) => q[0]), head[0] - HEAD_R, head[0] + HEAD_R];
  const ys = [...points.map((q) => q[1]), head[1] - HEAD_R, head[1] + HEAD_R];
  const minX = Math.min(...xs) - PAD;
  const maxX = Math.max(...xs) + PAD;
  const minY = Math.min(...ys) - PAD;
  const maxY = Math.max(...ys) + PAD;
  let w = Math.max(maxX - minX, 170);
  let h = maxY - minY;
  if (w / h < ASPECT) w = h * ASPECT;
  else h = w / ASPECT;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

/** Streckfigur för ett rörlighetssteg. `mirror` speglar bilden (höger sida). */
export function PoseFigure({ pose, mirror }: { pose: string; mirror?: boolean }) {
  const def = POSES[pose];
  if (!def) return null;
  const motion = MOTION[pose];
  const animate = !!motion && !reducedMotion();
  const moved = (i: number): Pt[] | undefined => motion?.parts[i];
  const all = [...def.parts.flatMap((x) => x.p), ...Object.values(motion?.parts ?? {}).flat()];
  const headTo = motion?.head;
  const vb = viewBoxFor(headTo ? [...all, headTo] : all, def.head);
  const dur = `${motion?.dur ?? 4}s`;
  const [vx, , vw] = vb.split(' ').map(Number);
  return (
    <svg class="pose" viewBox={vb} role="img" aria-label="Illustration av rörelsen" style={mirror ? 'transform:scaleX(-1)' : undefined}>
      {def.floor !== false && <line x1={vx} y1="99.5" x2={vx + vw} y2="99.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="2" />}
      {def.parts.map((part, i) => {
        const s = STYLE[part.k];
        const to = animate ? moved(i) : undefined;
        const pts = part.p.map((q) => q.join(',')).join(' ');
        return (
          <polyline
            key={i}
            points={pts}
            fill="none"
            stroke="currentColor"
            stroke-opacity={s.o}
            stroke-width={s.w}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray={part.k === 'band' ? '0.5 5' : undefined}
          >
            {to && <animate attributeName="points" values={`${pts};${to.map((q) => q.join(',')).join(' ')};${pts}`} {...EASE} dur={dur} repeatCount="indefinite" />}
          </polyline>
        );
      })}
      <circle cx={def.head[0]} cy={def.head[1]} r={HEAD_R} fill="currentColor">
        {animate && headTo && <animate attributeName="cx" values={`${def.head[0]};${headTo[0]};${def.head[0]}`} {...EASE} dur={dur} repeatCount="indefinite" />}
        {animate && headTo && <animate attributeName="cy" values={`${def.head[1]};${headTo[1]};${def.head[1]}`} {...EASE} dur={dur} repeatCount="indefinite" />}
      </circle>
    </svg>
  );
}

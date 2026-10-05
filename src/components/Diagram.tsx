import { useState } from 'react';
import { useSettings } from '../stores/settings';
import type { Diagram } from '../lib/content-types';

/**
 * Diagram renderer. Diagrams are hand-written inline SVG React components
 * (DECISIONS D-003): one language-neutral structure, per-language labels,
 * RTL-safe by construction (mirrored only where direction matters).
 * role=img + accessible name + visible text-description toggle.
 */

interface LabeledNode {
  x: number;
  y: number;
  w?: number;
  key: string;
  tone?: 'neutral' | 'bad' | 'good' | 'accent';
}

/** Generic labeled-box diagram used for analogy / wrong-vs-right / flow roles. */
export function DiagramSvg({ diagram, nodes, arrows }: {
  diagram: Diagram;
  nodes: LabeledNode[];
  arrows: { from: number; to: number; labelKey?: string }[];
}) {
  const lang = useSettings((s) => s.lang);
  const [showAlt, setShowAlt] = useState(false);
  const labels = diagram.labels ?? {};
  const label = (k: string) => labels[k]?.[lang] ?? k;
  const W = 560;
  const H = Math.max(120, ...nodes.map((n) => n.y + 60));
  const fill = (tone?: string) =>
    tone === 'bad'
      ? 'fill-red-100 stroke-red-500 dark:fill-red-950'
      : tone === 'good'
        ? 'fill-green-100 stroke-green-600 dark:fill-green-950'
        : tone === 'accent'
          ? 'fill-teal-100 stroke-teal-600 dark:fill-teal-950'
          : 'fill-slate-100 stroke-slate-400 dark:fill-slate-800 dark:stroke-slate-600';

  return (
    <figure className="my-4 max-w-full overflow-x-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <figcaption className="mb-2 text-sm font-medium">{diagram.caption[lang]}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={diagram.alt[lang]}
        className="min-w-[28rem]"
      >
        {nodes.map((n, i) => {
          const w = n.w ?? 150;
          const cx = n.x + w / 2;
          return (
            <g key={i}>
              <rect x={n.x} y={n.y} width={w} height={46} rx={8} className={fill(n.tone)} strokeWidth={2} />
              <text x={cx} y={n.y + 28} textAnchor="middle" className="fill-slate-900 text-[13px] dark:fill-slate-100">
                {label(n.key)}
              </text>
            </g>
          );
        })}
        {arrows.map((a, i) => {
          const from = nodes[a.from];
          const to = nodes[a.to];
          if (!from || !to) return null;
          const fw = from.w ?? 150;
          const tw = to.w ?? 150;
          const x1 = from.x + fw / 2;
          const y1 = from.y + 46;
          const x2 = to.x + tw / 2;
          const y2 = to.y;
          return (
            <g key={`a-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-slate-500" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
              {a.labelKey && (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" className="fill-slate-600 text-[11px] dark:fill-slate-300">
                  {label(a.labelKey)}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" className="fill-slate-500" />
          </marker>
        </defs>
      </svg>
      <button
        type="button"
        className="mt-2 min-h-[44px] rounded-lg border border-slate-300 px-3 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        aria-expanded={showAlt}
        onClick={() => setShowAlt((v) => !v)}
      >
        {lang === 'ar' ? 'وصف نصي' : 'Text description'}
      </button>
      {showAlt && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{diagram.alt[lang]}</p>
      )}
      {diagram.explanation[lang] && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{diagram.explanation[lang]}</p>
      )}
    </figure>
  );
}

/** Wrong-vs-right side-by-side panel (stacked on narrow screens). */
export function WrongRightPanel({ wrong, right }: { wrong: React.ReactNode; right: React.ReactNode }) {
  const lang = useSettings((s) => s.lang);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border-2 border-red-400 p-4">
        <p className="mb-2 flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
          <span aria-hidden="true">✗</span> {lang === 'ar' ? 'خطأ' : 'Wrong'}
        </p>
        {wrong}
      </div>
      <div className="rounded-xl border-2 border-green-500 p-4">
        <p className="mb-2 flex items-center gap-2 font-semibold text-green-800 dark:text-green-400">
          <span aria-hidden="true">✓</span> {lang === 'ar' ? 'صواب' : 'Right'}
        </p>
        {right}
      </div>
    </div>
  );
}

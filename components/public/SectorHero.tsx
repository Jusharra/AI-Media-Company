interface SectorHeroProps {
  name: string;
  tagline: string;
  context: string;
  themes: string[];
  color: 'rose' | 'amber' | 'orange';
}

const COLOR_MAP = {
  rose: { badge: 'text-rose-700 bg-rose-50 border border-rose-200', dot: 'bg-rose-600' },
  amber: { badge: 'text-amber-700 bg-amber-50 border border-amber-200', dot: 'bg-amber-600' },
  orange: { badge: 'text-orange-700 bg-orange-50 border border-orange-200', dot: 'bg-orange-600' },
};

export function SectorHero({ name, tagline, context, themes, color }: SectorHeroProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className="border-b border-stone-200 pb-12 mb-12">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ${colors.badge}`}>
            {name}
          </span>
          <h1 className="font-display text-5xl text-stone-900 mt-4 mb-4 leading-tight">{tagline}</h1>
          <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">{context}</p>
        </div>

        <div className="hidden lg:block w-64 shrink-0">
          <p className="text-stone-400 text-xs font-mono uppercase tracking-wider mb-3">Key Themes</p>
          <ul className="space-y-2">
            {themes.slice(0, 5).map(theme => (
              <li key={theme} className="flex gap-2 items-start">
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
                <span className="text-stone-600 text-sm">{theme}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-100 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <div className="font-display text-2xl text-amber-700 mb-2">SIGNAL</div>
            <p className="text-stone-500 text-sm leading-relaxed">
              The authority engine for operators building the next generation of industry.
            </p>
          </div>

          <div>
            <h4 className="text-stone-800 font-sans font-medium text-sm mb-3">Sectors</h4>
            <ul className="space-y-2">
              {[
                { href: '/sectors/healthcare', label: 'Healthcare' },
                { href: '/sectors/oil-gas', label: 'Oil & Gas / Energy' },
                { href: '/sectors/construction', label: 'Construction' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-500 hover:text-stone-800 text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-stone-800 font-sans font-medium text-sm mb-3">Content</h4>
            <ul className="space-y-2">
              {[
                { href: '/founders', label: 'Founder Directory' },
                { href: '/articles', label: 'Articles' },
                { href: '/podcast', label: 'Podcast' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-500 hover:text-stone-800 text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-stone-800 font-sans font-medium text-sm mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/get-featured" className="text-stone-500 hover:text-stone-800 text-sm transition-colors">Get Featured</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-6 flex items-center justify-between">
          <p className="text-stone-400 text-xs">© {new Date().getFullYear()} SIGNAL Media. All rights reserved.</p>
          <p className="text-stone-400 text-xs font-mono">The Authority Engine</p>
        </div>
      </div>
    </footer>
  );
}

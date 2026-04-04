import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-amber-700 tracking-wide hover:text-amber-600 transition-colors">
          SIGNAL
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '/founders', label: 'Founders' },
            { href: '/articles', label: 'Articles' },
            { href: '/podcast', label: 'Podcast' },
            { href: '/sectors/healthcare', label: 'Healthcare' },
            { href: '/sectors/oil-gas', label: 'Energy' },
            { href: '/sectors/construction', label: 'Construction' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-stone-600 hover:text-stone-900 text-sm font-sans transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/get-featured"
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-sans px-4 py-2 rounded transition-colors"
        >
          Get Featured
        </Link>
      </div>
    </header>
  );
}

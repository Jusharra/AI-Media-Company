import Link from 'next/link';
import { VoiceIndicator } from '@/components/admin/VoiceIndicator';

const NAV_LINKS = [
  { href: '/dashboard', label: 'COMMAND' },
  { href: '/dashboard/intake', label: 'INTAKE' },
  { href: '/dashboard/pipeline', label: 'PIPELINE' },
  { href: '/dashboard/content', label: 'CONTENT' },
  { href: '/dashboard/distribution', label: 'DISTRIBUTION' },
  { href: '/dashboard/deals', label: 'DEALS' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top nav */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <span className="font-heading text-2xl text-amber-500 tracking-wider hover:text-amber-400 transition-colors">SIGNAL</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-500 hover:text-zinc-200 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <VoiceIndicator />
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors"
            >
              LOGOUT
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}

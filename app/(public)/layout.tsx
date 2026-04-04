import { SiteHeader } from '@/components/public/SiteHeader';
import { SiteFooter } from '@/components/public/SiteFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-50 text-stone-800 min-h-screen antialiased">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

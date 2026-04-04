export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
      {children}
    </div>
  );
}

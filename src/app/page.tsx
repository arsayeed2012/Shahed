import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <div className="font-display text-4xl text-cream-400 italic animate-pulse">شهد</div>
        <div className="text-cream-300 text-sm font-body mt-2">Loading...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <AppShell />;
}

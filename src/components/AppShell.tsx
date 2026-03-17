'use client';

import { useState, useEffect, useCallback } from 'react';
import TodayScreen from '@/components/screens/TodayScreen';
import RoutineScreen from '@/components/screens/RoutineScreen';
import PlacesScreen from '@/components/screens/PlacesScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import { getSettings, UserSettings, seedDefaultRoutine } from '@/lib/db';

type Tab = 'today' | 'routine' | 'places' | 'settings';

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    async function init() {
      const s = await getSettings();
      setSettings(s);
      await seedDefaultRoutine();
    }
    init();
  }, []);

  const handleSettingsChange = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, []);

  const tabItems = [
    {
      id: 'today' as Tab,
      label: 'Today',
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728.707.707M3 12h1m16 0h1M4.927 19.073l.707-.707M18.364 5.636l.707-.707" />
          <circle cx="12" cy="12" r="4" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.5} />
        </svg>
      ),
    },
    {
      id: 'routine' as Tab,
      label: 'Routine',
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill={active ? 'currentColor' : 'none'} />
        </svg>
      ),
    },
    {
      id: 'places' as Tab,
      label: 'Places',
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
        </svg>
      ),
    },
    {
      id: 'settings' as Tab,
      label: 'Settings',
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (!settings) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="font-display text-3xl text-cream-400 italic mb-2">شهد</div>
          <div className="text-cream-300 text-sm font-body">Loading your space...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 relative">
      {/* Screen content */}
      <main className="no-bounce overflow-y-auto" style={{ minHeight: '100dvh', paddingBottom: '80px' }}>
        <div className={activeTab === 'today' ? 'block' : 'hidden'}>
          <TodayScreen
            settings={settings}
          />
        </div>
        <div className={activeTab === 'routine' ? 'block' : 'hidden'}>
          <RoutineScreen settings={settings} />
        </div>
        <div className={activeTab === 'places' ? 'block' : 'hidden'}>
          <PlacesScreen settings={settings} />
        </div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsScreen settings={settings} onSettingsChange={handleSettingsChange} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-cream-100 bottom-nav">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2">
          {tabItems.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 min-w-0 flex-1 ${
                  active
                    ? 'text-cream-500'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                  {tab.icon(active)}
                </div>
                <span className={`text-xs font-body truncate transition-all ${active ? 'font-medium' : 'font-normal'}`}>
                  {tab.id === 'places' ? 'Places' : tab.label}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-cream-400 mb-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

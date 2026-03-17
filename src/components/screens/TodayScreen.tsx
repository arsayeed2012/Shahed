'use client';

import { useState, useEffect, useRef } from 'react';
import { getDailyContent } from '@/lib/quotes';
import { UserSettings, getTodayMood, saveMood, getStreak, updateStreak, getRoutineItems, MoodEntry } from '@/lib/db';
import StarGlowModal from '@/components/ui/StarGlowModal';

type Props = {
  settings: UserSettings;
  onOpenEid?: () => void; // kept for compatibility, no longer used directly
};

const MOODS = [
  { id: 'radiant', emoji: '✨', label: 'Radiant', labelAr: 'مشرقة', labelNl: 'Stralend' },
  { id: 'calm', emoji: '🌿', label: 'Calm', labelAr: 'هادئة', labelNl: 'Kalm' },
  { id: 'okay', emoji: '🌤', label: 'Okay', labelAr: 'بخير', labelNl: 'Goed' },
  { id: 'tired', emoji: '🍂', label: 'Tired', labelAr: 'متعبة', labelNl: 'Moe' },
  { id: 'low', emoji: '🌧', label: 'Low', labelAr: 'حزينة', labelNl: 'Neerslachtig' },
] as const;

function getGreeting(name: string, lang: UserSettings['language']): string {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 12) return `صباح الخير، ${name} ✦`;
    if (hour < 17) return `مساء النور، ${name} ✦`;
    return `مساء الخير، ${name} ✦`;
  }
  if (lang === 'nl') {
    if (hour < 12) return `Goedemorgen, ${name} ✦`;
    if (hour < 17) return `Goedemiddag, ${name} ✦`;
    return `Goedenavond, ${name} ✦`;
  }
  if (hour < 12) return `Good morning, ${name} ✦`;
  if (hour < 17) return `Good afternoon, ${name} ✦`;
  return `Good evening, ${name} ✦`;
}

function formatDate(lang: UserSettings['language']): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'nl' ? 'nl-NL' : 'en-US';
  return new Date().toLocaleDateString(locale, opts);
}

export default function TodayScreen({ settings, onOpenEid }: Props) {
  const [daily, setDaily] = useState(() => getDailyContent(settings.language));
  const [mood, setMood] = useState<MoodEntry['mood'] | null>(null);
  const [streak, setStreak] = useState(0);
  const [amTotal, setAmTotal] = useState(0);
  const [amDone, setAmDone] = useState(0);
  const [pmTotal, setPmTotal] = useState(0);
  const [pmDone, setPmDone] = useState(0);
  const [showStar, setShowStar] = useState(false);
  const moonTapCount = useRef(0);
  const moonTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRTL = settings.language === 'ar';

  useEffect(() => {
    setDaily(getDailyContent(settings.language));
  }, [settings.language]);

  useEffect(() => {
    async function load() {
      const [todayMood, streakData, amItems, pmItems] = await Promise.all([
        getTodayMood(),
        getStreak(),
        getRoutineItems('am'),
        getRoutineItems('pm'),
      ]);
      if (todayMood) setMood(todayMood.mood);
      setStreak(streakData.currentStreak);
      setAmTotal(amItems.length);
      setAmDone(amItems.filter(i => i.completed).length);
      setPmTotal(pmItems.length);
      setPmDone(pmItems.filter(i => i.completed).length);
    }
    load();
  }, []);

  async function handleMoodSelect(m: MoodEntry['mood']) {
    setMood(m);
    await saveMood(m);
    await updateStreak();
    const s = await getStreak();
    setStreak(s.currentStreak);
  }

  function handleMoonTap() {
    moonTapCount.current += 1;
    if (moonTapTimer.current) clearTimeout(moonTapTimer.current);
    moonTapTimer.current = setTimeout(() => {
      moonTapCount.current = 0;
    }, 600);
    if (moonTapCount.current >= 2) {
      moonTapCount.current = 0;
      setShowStar(true);
    }
  }

  const lang = settings.language;
  const dir = isRTL ? 'rtl' : 'ltr';

  const labels = {
    quote: lang === 'ar' ? 'اقتباس اليوم' : lang === 'nl' ? 'Quote van de dag' : "Today's Quote",
    heartNote: lang === 'ar' ? 'رسالة اليوم' : lang === 'nl' ? 'Hartbericht' : 'Heart Note',
    islamic: lang === 'ar' ? 'تذكير إيماني' : lang === 'nl' ? 'Islamitische herinnering' : 'Islamic Reminder',
    mood: lang === 'ar' ? 'كيف تشعرين اليوم؟' : lang === 'nl' ? 'Hoe voel je je vandaag?' : 'How are you feeling today?',
    streak: lang === 'ar' ? 'أيام متتالية' : lang === 'nl' ? 'dagen op rij' : 'day streak',
    amRoutine: lang === 'ar' ? 'روتين الصباح' : lang === 'nl' ? 'Ochtendroutine' : 'AM Routine',
    pmRoutine: lang === 'ar' ? 'روتين المساء' : lang === 'nl' ? 'Avendroutine' : 'PM Routine',
    completed: lang === 'ar' ? 'مكتملة' : lang === 'nl' ? 'voltooid' : 'completed',
  };

  return (
    <div dir={dir} className="page-container animate-fade-in" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <div className={`font-display text-2xl font-medium text-ink-800 ${isRTL ? 'text-arabic' : 'italic'}`}>
            {getGreeting(settings.name, lang)}
          </div>
          <div className="text-xs text-ink-400 font-body mt-0.5">
            {formatDate(lang)}
          </div>
        </div>
        {/* Hidden moon trigger */}
        <button
          onClick={handleMoonTap}
          className="w-10 h-10 rounded-full flex items-center justify-center text-cream-300 hover:text-cream-400 transition-all active:scale-90 active:text-amber-300"
          aria-label="moon"
        >
          <span className="text-xl">🌙</span>
        </button>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className={`flex ${isRTL ? 'justify-end' : ''} mb-5`}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-cream-100 px-4 py-2 rounded-full border border-amber-200/60">
            <span className="text-base">🔥</span>
            <span className="font-body text-sm font-medium text-amber-700">
              {streak} {labels.streak}
            </span>
          </div>
        </div>
      )}

      {/* Self-Love Quote Card */}
      <div className="card mb-4 relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blush-100/60 to-transparent rounded-bl-3xl pointer-events-none" />
        <div className="text-xs font-body font-medium text-cream-400 uppercase tracking-widest mb-3">
          {labels.quote}
        </div>
        <blockquote
          className={`font-display text-xl font-medium leading-relaxed text-ink-700 italic text-balance ${isRTL ? 'text-arabic text-lg font-normal' : ''}`}
          dir={daily.quote.lang === 'ar' ? 'rtl' : 'ltr'}
        >
          "{daily.quote.text}"
        </blockquote>
        {daily.quote.author && (
          <cite className="block mt-3 text-xs text-ink-400 font-body not-italic">
            — {daily.quote.author}
          </cite>
        )}
        <div className="absolute bottom-3 right-4 text-cream-200 font-display text-6xl font-bold leading-none select-none pointer-events-none">
          "
        </div>
      </div>

      {/* Heart Note Card */}
      <div className="card mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🤍</span>
          <div className="text-xs font-body font-medium text-cream-400 uppercase tracking-widest">
            {labels.heartNote}
          </div>
        </div>
        <p
          className={`text-ink-600 leading-relaxed font-body text-sm ${isRTL ? 'text-arabic text-right' : ''}`}
          dir={daily.heartNote.lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {daily.heartNote.text}
        </p>
      </div>

      {/* Islamic Reminder */}
      <div className="card mb-4 animate-slide-up bg-gradient-to-br from-sage-50/80 to-cream-50" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🌿</span>
          <div className="text-xs font-body font-medium text-sage-500 uppercase tracking-widest">
            {labels.islamic}
          </div>
        </div>
        <p
          className={`text-ink-700 leading-relaxed font-display italic text-lg ${daily.islamicReminder.lang === 'ar' ? 'text-arabic font-normal text-xl' : ''}`}
          dir={daily.islamicReminder.lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {daily.islamicReminder.text}
        </p>
        {daily.islamicReminder.source && (
          <p className={`mt-2 text-xs text-sage-400 font-body ${isRTL ? 'text-right' : ''}`}
             dir={daily.islamicReminder.lang === 'ar' ? 'rtl' : 'ltr'}>
            {daily.islamicReminder.source}
          </p>
        )}
      </div>

      {/* Mood Selector */}
      <div className="card mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className={`text-xs font-body font-medium text-cream-400 uppercase tracking-widest mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.mood}
        </div>
        <div className="flex gap-2 justify-between">
          {MOODS.map((m) => {
            const mLabel = lang === 'ar' ? m.labelAr : lang === 'nl' ? m.labelNl : m.label;
            return (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id)}
                className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                  mood === m.id
                    ? 'bg-cream-100 border-cream-300 shadow-soft'
                    : 'bg-cream-50/50 border-cream-100 hover:bg-cream-50'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className={`text-xs font-body ${mood === m.id ? 'text-cream-600 font-medium' : 'text-ink-400'} ${isRTL ? 'text-arabic' : ''}`}>
                  {mLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🌅</span>
            <div className="text-xs font-body font-medium text-cream-400 uppercase tracking-widest">
              {labels.amRoutine}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-2xl font-medium text-ink-700">{amDone}/{amTotal}</span>
            <span className="text-xs text-ink-400 font-body pb-1">{labels.completed}</span>
          </div>
          {amTotal > 0 && (
            <div className="mt-2 h-1.5 bg-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cream-300 to-cream-400 rounded-full transition-all duration-500"
                style={{ width: `${(amDone / amTotal) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🌙</span>
            <div className="text-xs font-body font-medium text-cream-400 uppercase tracking-widest">
              {labels.pmRoutine}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-2xl font-medium text-ink-700">{pmDone}/{pmTotal}</span>
            <span className="text-xs text-ink-400 font-body pb-1">{labels.completed}</span>
          </div>
          {pmTotal > 0 && (
            <div className="mt-2 h-1.5 bg-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ink-300 to-ink-400 rounded-full transition-all duration-500"
                style={{ width: `${(pmDone / pmTotal) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
      {/* Star Glow + Eid Surprise */}
      {showStar && (
        <StarGlowModal
          name={settings.name}
          onClose={() => setShowStar(false)}
        />
      )}
    </div>
  );
}

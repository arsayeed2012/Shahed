'use client';

import { useState, useRef } from 'react';
import {
  UserSettings, saveSettings, exportAllData, importAllData, resetAllData,
} from '@/lib/db';

type Props = {
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
};

export default function SettingsScreen({ settings, onSettingsChange }: Props) {
  const [name, setName] = useState(settings.name);
  const [showReset, setShowReset] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const lang = settings.language;
  const isRTL = lang === 'ar';

  async function handleSaveName() {
    const updated = { ...settings, name: name.trim() || 'Shahed' };
    await saveSettings(updated);
    onSettingsChange(updated);
  }

  async function handleLanguage(l: UserSettings['language']) {
    const updated = { ...settings, language: l };
    await saveSettings(updated);
    onSettingsChange(updated);
  }

  async function handleDarkMode(v: boolean) {
    const updated = { ...settings, darkMode: v };
    await saveSettings(updated);
    onSettingsChange(updated);
    document.documentElement.classList.toggle('dark', v);
  }

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shahed-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAllData(text);
      setImportMsg('✓ Data imported successfully');
      setTimeout(() => setImportMsg(''), 3000);
    } catch {
      setImportMsg('✗ Import failed — invalid file');
      setTimeout(() => setImportMsg(''), 3000);
    }
  }

  async function handleReset() {
    await resetAllData();
    setShowReset(false);
    window.location.reload();
  }

  const labels = {
    title: lang === 'ar' ? 'الإعدادات' : lang === 'nl' ? 'Instellingen' : 'Settings',
    profile: lang === 'ar' ? 'الملف الشخصي' : lang === 'nl' ? 'Profiel' : 'Profile',
    name: lang === 'ar' ? 'الاسم' : lang === 'nl' ? 'Naam' : 'Name',
    save: lang === 'ar' ? 'حفظ' : lang === 'nl' ? 'Opslaan' : 'Save',
    language: lang === 'ar' ? 'اللغة' : lang === 'nl' ? 'Taal' : 'Language',
    appearance: lang === 'ar' ? 'المظهر' : lang === 'nl' ? 'Weergave' : 'Appearance',
    darkMode: lang === 'ar' ? 'الوضع الداكن' : lang === 'nl' ? 'Donkere modus' : 'Dark Mode',
    data: lang === 'ar' ? 'البيانات' : lang === 'nl' ? 'Gegevens' : 'Data',
    export: lang === 'ar' ? 'تصدير البيانات' : lang === 'nl' ? 'Gegevens exporteren' : 'Export Data',
    import: lang === 'ar' ? 'استيراد البيانات' : lang === 'nl' ? 'Gegevens importeren' : 'Import Data',
    reset: lang === 'ar' ? 'إعادة تعيين التطبيق' : lang === 'nl' ? 'App resetten' : 'Reset App',
    privacy: lang === 'ar' ? 'الخصوصية' : lang === 'nl' ? 'Privacy' : 'Privacy',
    resetConfirm: lang === 'ar' ? 'هل أنتِ متأكدة؟ ستُحذف جميع البيانات.' : lang === 'nl' ? 'Weet je het zeker? Alle gegevens worden verwijderd.' : 'Are you sure? All data will be erased.',
    cancel: lang === 'ar' ? 'إلغاء' : lang === 'nl' ? 'Annuleren' : 'Cancel',
    confirm: lang === 'ar' ? 'نعم، احذف' : lang === 'nl' ? 'Ja, verwijder' : 'Yes, delete',
    viewPrivacy: lang === 'ar' ? 'عرض سياسة الخصوصية' : lang === 'nl' ? 'Privacybeleid bekijken' : 'View Privacy Policy',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="page-container animate-fade-in" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
      <h1 className={`font-display text-2xl font-medium italic mb-6 text-ink-800 ${isRTL ? 'text-arabic not-italic text-right' : ''}`}>
        {labels.title}
      </h1>

      {/* Profile */}
      <section className="card mb-4">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.profile}
        </h2>
        <div className={`flex gap-3 items-end ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1">
            <label className={`block text-xs font-body text-ink-400 mb-1.5 ${isRTL ? 'text-right' : ''}`}>{labels.name}</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <button onClick={handleSaveName} className="btn-primary py-3 px-5 text-sm flex-shrink-0">
            {labels.save}
          </button>
        </div>
      </section>

      {/* Language */}
      <section className="card mb-4">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.language}
        </h2>
        <div className="flex gap-2">
          {[
            { id: 'en' as const, label: 'English', flag: '🇬🇧' },
            { id: 'ar' as const, label: 'العربية', flag: '🌙' },
            { id: 'nl' as const, label: 'Nederlands', flag: '🇳🇱' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => handleLanguage(l.id)}
              className={`flex-1 py-3 rounded-2xl border font-body text-sm flex flex-col items-center gap-1 transition-all ${
                settings.language === l.id
                  ? 'bg-cream-100 border-cream-300 text-ink-700 font-medium'
                  : 'border-cream-100 text-ink-400'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span className={l.id === 'ar' ? 'text-arabic text-xs' : 'text-xs'}>{l.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Appearance */}
      <section className="card mb-4">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.appearance}
        </h2>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="font-body text-sm text-ink-700">{labels.darkMode}</span>
          <button
            onClick={() => handleDarkMode(!settings.darkMode)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings.darkMode ? 'bg-ink-700' : 'bg-cream-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.darkMode ? (isRTL ? 'left-1' : 'left-7') : (isRTL ? 'left-7' : 'left-1')}`} />
          </button>
        </div>
      </section>

      {/* Reminders */}
      <section className="card mb-4">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {lang === 'ar' ? 'أوقات التذكير' : lang === 'nl' ? 'Herinneringstijden' : 'Reminder Times'}
        </h2>
        <div className="space-y-3">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>🌅</span>
              <span className="font-body text-sm text-ink-700">AM</span>
            </div>
            <input
              type="time"
              className="input-field w-32 text-center"
              value={settings.amReminderTime}
              onChange={async (e) => {
                const updated = { ...settings, amReminderTime: e.target.value };
                await saveSettings(updated);
                onSettingsChange(updated);
              }}
            />
          </div>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>🌙</span>
              <span className="font-body text-sm text-ink-700">PM</span>
            </div>
            <input
              type="time"
              className="input-field w-32 text-center"
              value={settings.pmReminderTime}
              onChange={async (e) => {
                const updated = { ...settings, pmReminderTime: e.target.value };
                await saveSettings(updated);
                onSettingsChange(updated);
              }}
            />
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="card mb-4">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.data}
        </h2>
        <div className="space-y-3">
          <button onClick={handleExport} className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-base">📤</span>
            <span className="font-body text-sm text-ink-700">{labels.export}</span>
          </button>
          <button onClick={() => fileRef.current?.click()} className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-base">📥</span>
            <span className="font-body text-sm text-ink-700">{labels.import}</span>
          </button>
          {importMsg && (
            <p className={`text-xs font-body text-center py-2 rounded-xl ${importMsg.startsWith('✓') ? 'text-sage-500 bg-sage-50' : 'text-blush-500 bg-blush-50'}`}>
              {importMsg}
            </p>
          )}
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => setShowReset(true)} className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-blush-50 hover:bg-blush-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-base">🗑</span>
            <span className="font-body text-sm text-blush-600">{labels.reset}</span>
          </button>
        </div>
      </section>

      {/* Privacy */}
      <section className="card mb-6">
        <h2 className={`font-body text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
          {labels.privacy}
        </h2>
        <button onClick={() => setShowPrivacy(true)} className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-base">🔒</span>
          <span className="font-body text-sm text-ink-700">{labels.viewPrivacy}</span>
        </button>
      </section>

      {/* Branding */}
      <div className="text-center pb-4">
        <div className="font-display text-lg italic text-cream-400 mb-1">شهد · SHAHED</div>
        <p className="text-xs font-body text-ink-300">Built by ARS for Shahed</p>
        <p className="text-xs font-body text-ink-300">Eid Mubarak 2026 🌙</p>
      </div>

      {/* Reset Confirm Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowReset(false); }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowReset(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="text-3xl text-center mb-4">⚠️</div>
            <p className={`font-body text-sm text-ink-600 text-center mb-6 ${isRTL ? 'text-arabic' : ''}`}>
              {labels.resetConfirm}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="btn-ghost flex-1">{labels.cancel}</button>
              <button onClick={handleReset} className="flex-1 bg-blush-400 hover:bg-blush-500 text-white font-body font-medium py-3 px-6 rounded-2xl transition-all active:scale-95">
                {labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowPrivacy(false); }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} onClick={() => setShowPrivacy(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-12 animate-slide-up shadow-2xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-10 h-1 bg-cream-200 rounded-full mx-auto mb-5" />
            <h3 className="font-display text-xl font-medium italic mb-4 text-ink-800">Privacy</h3>
            <div className="space-y-3 font-body text-sm text-ink-600 leading-relaxed">
              <p>🔒 <strong>All your data stays on your device.</strong> Nothing is ever sent to any server.</p>
              <p>📵 <strong>No tracking.</strong> No analytics. No cookies.</p>
              <p>🚫 <strong>No login required.</strong> No accounts, no data collection.</p>
              <p>💾 <strong>Storage:</strong> IndexedDB — local to your browser/device only.</p>
              <p>📤 <strong>Export:</strong> You can export your data anytime as a JSON file to keep your backup.</p>
              <p>🗑 <strong>Delete:</strong> Use "Reset App" to permanently remove all data.</p>
              <p className="pt-2 text-xs text-ink-400">Built with love by ARS for Shahed. This is a personal, private app. Eid Mubarak 2026 🌙</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="btn-primary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

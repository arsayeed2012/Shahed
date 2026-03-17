'use client';

import { useState, useEffect } from 'react';
import {
  UserSettings, Destination, PlanItem,
  getDestinations, saveDestination, deleteDestination,
  getPlanItems, savePlanItem, deletePlanItem, togglePlanItem,
  generateId, GRADIENT_PRESETS,
} from '@/lib/db';

type Props = { settings: UserSettings };
type View = 'list' | 'destination';

const PLAN_CATEGORIES: { id: PlanItem['category']; emoji: string; label: string }[] = [
  { id: 'sight',   emoji: '🏛',  label: 'Sights'  },
  { id: 'food',    emoji: '🍽',  label: 'Food'    },
  { id: 'stay',    emoji: '🏨',  label: 'Stay'    },
  { id: 'shop',    emoji: '🛍',  label: 'Shop'    },
  { id: 'nature',  emoji: '🌿',  label: 'Nature'  },
  { id: 'culture', emoji: '🎭',  label: 'Culture' },
  { id: 'custom',  emoji: '📍',  label: 'Other'   },
];

const SUGGESTION_TEMPLATES: { title: string; category: PlanItem['category'] }[] = [
  { title: 'Local Coffee Shop',  category: 'food'    },
  { title: 'Famous Landmark',    category: 'sight'   },
  { title: 'Market / Bazaar',    category: 'shop'    },
  { title: 'Local Restaurant',   category: 'food'    },
  { title: 'Museum',             category: 'culture' },
  { title: 'Historic Square',    category: 'sight'   },
  { title: 'Nature Walk',        category: 'nature'  },
  { title: 'Shopping Street',    category: 'shop'    },
];

export default function PlacesScreen({ settings }: Props) {
  const [view, setView] = useState<View>('list');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);

  // Destination modal
  const [showDestModal, setShowDestModal] = useState(false);
  const [editingDest, setEditingDest] = useState<Partial<Destination>>({});
  const [isSavingDest, setIsSavingDest] = useState(false);
  const [destError, setDestError] = useState('');

  // Plan item modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PlanItem>>({ category: 'sight', note: '' });
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  const [editingTitle, setEditingTitle] = useState(false);

  const lang = settings.language;
  const isRTL = lang === 'ar';

  useEffect(() => { loadDestinations(); }, []);

  async function loadDestinations() {
    const dests = await getDestinations();
    setDestinations(dests);
  }

  async function loadPlanItems(destId: string) {
    const items = await getPlanItems(destId);
    setPlanItems(items);
  }

  async function openDestination(dest: Destination) {
    setSelectedDest(dest);
    await loadPlanItems(dest.id);
    setView('destination');
  }

  // ── Save destination ──
  async function handleSaveDestination() {
    const city = editingDest.city?.trim() ?? '';
    if (!city) {
      setDestError(lang === 'ar' ? 'أدخلي اسم المدينة' : lang === 'nl' ? 'Vul een stad in' : 'Please enter a city name');
      return;
    }
    setIsSavingDest(true);
    setDestError('');
    try {
      const dest: Destination = {
        id: editingDest.id ?? generateId(),
        city,
        country:       editingDest.country?.trim() ?? '',
        emoji:         editingDest.emoji ?? '✈️',
        startDate:     editingDest.startDate,
        endDate:       editingDest.endDate,
        interests:     editingDest.interests ?? [],
        notes:         editingDest.notes ?? '',
        coverGradient: editingDest.coverGradient ?? GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)],
        createdAt:     editingDest.createdAt ?? Date.now(),
        updatedAt:     Date.now(),
      };
      await saveDestination(dest);
      await loadDestinations();
      setShowDestModal(false);
      setEditingDest({});
    } catch (err) {
      console.error('[PlacesScreen] save destination failed:', err);
      setDestError(lang === 'ar' ? 'فشل الحفظ' : lang === 'nl' ? 'Opslaan mislukt' : 'Save failed — try again');
    } finally {
      setIsSavingDest(false);
    }
  }

  // ── Save plan item ──
  async function handleSavePlanItem() {
    const title = editingPlan.title?.trim() ?? '';
    if (!title) {
      setPlanError(lang === 'ar' ? 'أدخلي اسم المكان' : lang === 'nl' ? 'Vul een naam in' : 'Please enter a place name');
      return;
    }
    if (!selectedDest) return;
    setIsSavingPlan(true);
    setPlanError('');
    try {
      const item: PlanItem = {
        id:            editingPlan.id ?? generateId(),
        destinationId: selectedDest.id,
        title,
        category:      editingPlan.category ?? 'custom',
        note:          editingPlan.note ?? '',
        done:          editingPlan.done ?? false,
        order:         editingPlan.id
                         ? (planItems.find(i => i.id === editingPlan.id)?.order ?? planItems.length)
                         : planItems.length,
        createdAt:     editingPlan.createdAt ?? Date.now(),
      };
      await savePlanItem(item);
      await loadPlanItems(selectedDest.id);
      setShowPlanModal(false);
      setEditingPlan({ category: 'sight', note: '' });
    } catch (err) {
      console.error('[PlacesScreen] save plan item failed:', err);
      setPlanError(lang === 'ar' ? 'فشل الحفظ' : lang === 'nl' ? 'Opslaan mislukt' : 'Save failed — try again');
    } finally {
      setIsSavingPlan(false);
    }
  }

  async function handleDeleteDestination(id: string) {
    await deleteDestination(id);
    await loadDestinations();
    if (selectedDest?.id === id) { setView('list'); setSelectedDest(null); }
  }

  async function handleTogglePlan(id: string) {
    await togglePlanItem(id);
    setPlanItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  async function handleDeletePlan(id: string) {
    await deletePlanItem(id);
    setPlanItems(prev => prev.filter(i => i.id !== id));
  }

  function openInMaps(item: PlanItem) {
    if (!selectedDest) return;
    const q = encodeURIComponent(`${item.title} ${selectedDest.city}`);
    window.open(`https://maps.google.com/?q=${q}`, '_blank');
  }

  async function handleUpdateDestTitle(title: string) {
    if (!selectedDest || !title.trim()) return;
    const updated = { ...selectedDest, city: title.trim(), updatedAt: Date.now() };
    await saveDestination(updated);
    setSelectedDest(updated);
    await loadDestinations();
  }

  function openAddDest() {
    setEditingDest({});
    setDestError('');
    setShowDestModal(true);
  }

  function openAddPlan() {
    setEditingPlan({ category: 'sight', note: '' });
    setPlanError('');
    setShowPlanModal(true);
  }

  function openEditPlan(item: PlanItem) {
    setEditingPlan(item);
    setPlanError('');
    setShowPlanModal(true);
  }

  function addSuggestion(s: { title: string; category: PlanItem['category'] }) {
    setEditingPlan({ title: s.title, category: s.category, note: '' });
    setPlanError('');
    setShowPlanModal(true);
  }

  const getCatInfo = (id: PlanItem['category']) =>
    PLAN_CATEGORIES.find(c => c.id === id) ?? PLAN_CATEGORIES[6];

  const groupedPlan = PLAN_CATEGORIES.reduce((acc, cat) => {
    const catItems = planItems.filter(i => i.category === cat.id);
    if (catItems.length > 0) acc[cat.id] = catItems;
    return acc;
  }, {} as Record<string, PlanItem[]>);

  const donePlan = planItems.filter(i => i.done).length;

  const L = {
    title:       lang === 'ar' ? 'أماكن تستحق الزيارة' : lang === 'nl' ? 'Plekken de Moeite Waard' : 'Places Worth Exploring',
    addDest:     lang === 'ar' ? 'وجهة جديدة'           : lang === 'nl' ? 'Nieuw bestemming'         : 'New destination',
    city:        lang === 'ar' ? 'المدينة'              : lang === 'nl' ? 'Stad'                     : 'City',
    country:     lang === 'ar' ? 'الدولة'               : lang === 'nl' ? 'Land'                     : 'Country',
    save:        lang === 'ar' ? 'حفظ'                  : lang === 'nl' ? 'Opslaan'                  : 'Save',
    cancel:      lang === 'ar' ? 'إلغاء'                : lang === 'nl' ? 'Annuleren'                : 'Cancel',
    myPlan:      lang === 'ar' ? 'خطتي'                 : lang === 'nl' ? 'Mijn Plan'                : 'My Plan',
    suggestions: lang === 'ar' ? 'اقتراحات للإلهام'    : lang === 'nl' ? 'Inspiratiesuggesties'     : 'Quick-add',
    notes:       lang === 'ar' ? 'ملاحظات'              : lang === 'nl' ? 'Notities'                 : 'Notes',
    note:        lang === 'ar' ? 'ملاحظة (اختياري)'    : lang === 'nl' ? 'Notitie (optioneel)'      : 'Note (optional)',
    category:    lang === 'ar' ? 'الفئة'               : lang === 'nl' ? 'Categorie'                : 'Category',
    done:        lang === 'ar' ? 'مكتمل'                : lang === 'nl' ? 'voltooid'                 : 'done',
    addToMyPlan: lang === 'ar' ? 'أضيفي للخطة'          : lang === 'nl' ? 'Aan mijn plan'            : 'Add to My Plan',
    noDests:     lang === 'ar' ? 'أضيفي وجهتك الأولى'  : lang === 'nl' ? 'Voeg je eerste bestemming toe' : 'Add your first destination',
    newPlanItem: lang === 'ar' ? 'مكان جديد'            : lang === 'nl' ? 'Nieuw item'               : 'New place',
    editPlanItem:lang === 'ar' ? 'تعديل المكان'          : lang === 'nl' ? 'Item bewerken'            : 'Edit place',
    placeName:   lang === 'ar' ? 'اسم المكان'            : lang === 'nl' ? 'Naam van de plek'         : 'Place name (e.g. Colosseum, Café de Flore…)',
  };

  // ─────────────────────────────────────────────
  // DESTINATION DETAIL VIEW
  // ─────────────────────────────────────────────
  if (view === 'destination' && selectedDest) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="page-container animate-fade-in"
           style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>

        {/* Back */}
        <button
          onClick={() => { setView('list'); setSelectedDest(null); }}
          className={`flex items-center gap-2 text-cream-500 font-body text-sm mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {lang === 'ar' ? 'الوجهات' : lang === 'nl' ? 'Bestemmingen' : 'Destinations'}
        </button>

        {/* Header card */}
        <div className={`rounded-3xl p-6 mb-5 bg-gradient-to-br ${selectedDest.coverGradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10" />
          <div className="relative">
            <div className="text-4xl mb-2">{selectedDest.emoji}</div>
            {editingTitle ? (
              <input
                autoFocus
                className="bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-xl px-3 py-2 font-display text-2xl italic border border-white/30 focus:outline-none w-full"
                value={selectedDest.city}
                onChange={e => setSelectedDest(prev => prev ? { ...prev, city: e.target.value } : prev)}
                onBlur={() => { setEditingTitle(false); handleUpdateDestTitle(selectedDest.city); }}
                onKeyDown={e => { if (e.key === 'Enter') { setEditingTitle(false); handleUpdateDestTitle(selectedDest.city); } }}
              />
            ) : (
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="font-display text-2xl font-medium text-white italic">
                  {selectedDest.city}{selectedDest.country ? `, ${selectedDest.country}` : ''}
                </h2>
                <button onClick={() => setEditingTitle(true)} className="text-white/70 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            {(selectedDest.startDate || selectedDest.endDate) && (
              <p className="text-white/80 text-sm font-body mt-1">
                {selectedDest.startDate && selectedDest.endDate
                  ? `${selectedDest.startDate} → ${selectedDest.endDate}`
                  : (selectedDest.startDate ?? selectedDest.endDate)}
              </p>
            )}
            {selectedDest.notes && (
              <p className="text-white/70 text-xs font-body mt-2 italic">{selectedDest.notes}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleDeleteDestination(selectedDest.id)}
                className="px-3 py-1.5 rounded-full bg-black/25 border border-white/20 text-white text-xs font-body font-semibold backdrop-blur-sm"
              >
                {lang === 'ar' ? 'حذف' : lang === 'nl' ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </div>
          {planItems.length > 0 && (
            <div className="relative mt-3 bg-white/20 rounded-2xl px-4 py-2 flex items-center gap-3">
              <span className="text-white/80 text-xs font-body">{donePlan}/{planItems.length} {L.done}</span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${(donePlan / planItems.length) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Add to plan */}
        <button onClick={openAddPlan} className="btn-primary w-full mb-5 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {L.addToMyPlan}
        </button>

        {/* Plan items */}
        {planItems.length > 0 && (
          <div className="mb-5">
            <h3 className={`font-body text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3 ${isRTL ? 'text-right' : ''}`}>
              {L.myPlan}
            </h3>
            <div className="space-y-3">
              {PLAN_CATEGORIES.map(cat => {
                const catItems = groupedPlan[cat.id];
                if (!catItems) return null;
                return (
                  <div key={cat.id} className="card">
                    <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm">{cat.emoji}</span>
                      <span className="font-body text-xs font-semibold text-ink-400 uppercase tracking-wide">{cat.label}</span>
                    </div>
                    <div className="space-y-2">
                      {catItems.map(item => (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-2xl ${item.done ? 'bg-sage-50/60' : 'bg-cream-50/50'} ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => handleTogglePlan(item.id)}
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center active:scale-90 transition-all ${
                              item.done ? 'bg-sage-400 border-sage-400' : 'border-cream-300'
                            }`}
                          >
                            {item.done && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-body text-sm font-medium ${item.done ? 'text-ink-400 line-through' : 'text-ink-700'} ${isRTL ? 'text-right' : ''}`}>
                              {item.title}
                            </p>
                            {item.note && <p className={`text-xs text-ink-400 font-body mt-0.5 ${isRTL ? 'text-right' : ''}`}>{item.note}</p>}
                          </div>
                          <div className={`flex gap-1 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button onClick={() => openInMaps(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-sky-500 hover:bg-sky-50 transition-all" title="Open in Maps">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                            </button>
                            <button onClick={() => openEditPlan(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-ink-500 hover:bg-cream-100 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDeletePlan(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-blush-400 hover:bg-blush-50 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="mb-6">
          <h3 className={`font-body text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3 ${isRTL ? 'text-right' : ''}`}>
            {L.suggestions}
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_TEMPLATES.map((s, i) => (
              <button
                key={i}
                onClick={() => addSuggestion(s)}
                className="bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs font-body text-ink-600 flex items-center gap-1.5 hover:bg-cream-100 active:scale-95 transition-all"
              >
                <span>{getCatInfo(s.category).emoji}</span>
                <span>{s.title}</span>
                <span className="text-cream-400">+</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Plan item modal ── */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
               onClick={(e) => { if (e.target === e.currentTarget) { setShowPlanModal(false); } }}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }}
                 onClick={() => setShowPlanModal(false)} />
            <div className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col"
                 style={{ maxHeight: '82vh' }}
                 dir={isRTL ? 'rtl' : 'ltr'}>

              <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-cream-200 rounded-full" />
              </div>
              <div className="flex-shrink-0 px-6 pb-3 flex items-center justify-between gap-3">
  <button
    type="button"
    onClick={handleSavePlanItem}
    disabled={isSavingPlan}
    className="px-3 py-1.5 rounded-full bg-cream-400 text-white text-xs font-body font-semibold shadow-sm disabled:opacity-60"
  >
    {isSavingPlan ? "..." : L.save}
  </button>

  <h3 className="font-display text-xl font-medium italic text-ink-800">
    {editingPlan.id ? L.editPlanItem : L.newPlanItem}
  </h3>

  <button
    onClick={() => setShowPlanModal(false)}
    className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-ink-400 hover:bg-cream-200 transition-all flex-shrink-0"
    aria-label="Close"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>

              <div className="flex-1 overflow-y-auto px-6 pb-2">
                {/* Category */}
                <div className="mb-4">
                  <label className="block text-xs font-body font-medium text-ink-400 mb-2 uppercase tracking-wide">{L.category}</label>
                  <div className="flex flex-wrap gap-2">
                    {PLAN_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditingPlan(p => ({ ...p, category: cat.id }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-body transition-all ${
                          editingPlan.category === cat.id ? 'bg-cream-100 border-cream-300' : 'border-cream-100 bg-cream-50/50'
                        }`}
                      >
                        <span>{cat.emoji}</span><span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Place name */}
                <div className="mb-3">
                  <input
                    className="input-field"
                    placeholder={L.placeName}
                    value={editingPlan.title ?? ''}
                    onChange={e => { setPlanError(''); setEditingPlan(p => ({ ...p, title: e.target.value })); }}
                    autoComplete="off"
                  />
                </div>

                {/* Note */}
                <div className="mb-3">
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder={L.note}
                    value={editingPlan.note ?? ''}
                    onChange={e => setEditingPlan(p => ({ ...p, note: e.target.value }))}
                  />
                </div>

                {planError && <p className="text-xs text-blush-500 font-body mb-2 text-center">{planError}</p>}
              </div>

              <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-cream-100 flex gap-3"
                   style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn-ghost flex-1" disabled={isSavingPlan}>
                  {L.cancel}
                </button>
                <button type="button" onClick={handleSavePlanItem} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSavingPlan}>
                  {isSavingPlan ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : L.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DESTINATIONS LIST VIEW
  // ─────────────────────────────────────────────
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="page-container animate-fade-in"
         style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>

      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className={`font-display text-2xl font-medium text-ink-800 ${isRTL ? 'text-arabic not-italic' : 'italic'}`}>
          {L.title}
        </h1>
        <button onClick={openAddDest} className="w-9 h-9 rounded-full bg-cream-400 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {destinations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="font-display text-xl italic text-ink-600 mb-2">{L.noDests}</h2>
          <p className="text-sm text-ink-400 font-body mb-6">
            {lang === 'ar' ? 'ابدئي بإضافة مكان يستحق الزيارة' : lang === 'nl' ? 'Voeg een plek toe die je wilt verkennen' : 'Start by adding a place you dream of exploring'}
          </p>
          <button onClick={openAddDest} className="btn-primary">{L.addDest}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {destinations.map(dest => (
            <div key={dest.id} className="relative group">
              <button
                onClick={() => openDestination(dest)}
                className={`relative w-full overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${dest.coverGradient} text-left shadow-card active:scale-[0.98] transition-all`}
              >
                <div className="absolute inset-0 bg-black/18 pointer-events-none" />
                <div className="relative text-3xl mb-2">{dest.emoji}</div>
                <h3 className="relative font-display text-xl font-medium text-white italic drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                  {dest.city}{dest.country ? `, ${dest.country}` : ''}
                </h3>
                {(dest.startDate || dest.endDate) && (
                  <p className="relative text-white/90 text-xs font-body mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                    {dest.startDate && dest.endDate ? `${dest.startDate} → ${dest.endDate}` : (dest.startDate ?? dest.endDate)}
                  </p>
                )}
                {dest.notes && <p className="relative text-white/85 text-xs font-body mt-1 truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">{dest.notes}</p>}
                <div className="relative mt-3 flex items-center gap-2 text-white text-xs font-body drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                  <span>→</span>
                  <span>{lang === 'ar' ? 'فتح الخطة' : lang === 'nl' ? 'Plan openen' : 'Open plan'}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDestination(dest.id);
                }}
                aria-label={lang === 'ar' ? 'حذف الوجهة' : lang === 'nl' ? 'Bestemming verwijderen' : 'Delete destination'}
                className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-black/75 hover:bg-black text-white px-3 py-2 border border-white/15 shadow-xl transition-all backdrop-blur-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-[11px] font-body font-semibold">{lang === 'ar' ? 'حذف' : lang === 'nl' ? 'Verwijder' : 'Delete'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Add destination modal ── */}
      {showDestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
             onClick={(e) => { if (e.target === e.currentTarget) setShowDestModal(false); }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }}
               onClick={() => setShowDestModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col"
               style={{ maxHeight: '88vh' }}
               dir={isRTL ? 'rtl' : 'ltr'}>

            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-cream-200 rounded-full" />
            </div>
            <div className="flex-shrink-0 px-6 pb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveDestination}
                disabled={isSavingDest}
                className="px-3 py-1.5 rounded-full bg-cream-400 text-white text-xs font-body font-semibold shadow-sm disabled:opacity-60"
              >
                {isSavingDest ? '...' : L.save}
              </button>
              <h3 className="font-display text-xl font-medium italic text-ink-800">{L.addDest}</h3>
              <button onClick={() => setShowDestModal(false)} className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-ink-400 hover:bg-cream-200 transition-all flex-shrink-0" aria-label="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {/* Emoji picker */}
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  {['✈️','🌍','🗼','🏖','🏔','🏙','🌸','🌿','🕌','🏛','🎡','🌊'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingDest(p => ({ ...p, emoji }))}
                      className={`text-2xl p-2 rounded-xl border transition-all ${editingDest.emoji === emoji ? 'bg-cream-100 border-cream-300' : 'border-cream-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <input
                  className="input-field"
                  placeholder={`${L.city} *`}
                  value={editingDest.city ?? ''}
                  onChange={e => { setDestError(''); setEditingDest(p => ({ ...p, city: e.target.value })); }}
                  autoComplete="off"
                />
                <input
                  className="input-field"
                  placeholder={L.country}
                  value={editingDest.country ?? ''}
                  onChange={e => setEditingDest(p => ({ ...p, country: e.target.value }))}
                  autoComplete="off"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-400 font-body mb-1">From</label>
                    <input type="date" className="input-field" value={editingDest.startDate ?? ''} onChange={e => setEditingDest(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 font-body mb-1">To</label>
                    <input type="date" className="input-field" value={editingDest.endDate ?? ''} onChange={e => setEditingDest(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder={L.notes}
                  value={editingDest.notes ?? ''}
                  onChange={e => setEditingDest(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Gradient picker */}
              <div className="mb-4">
                <label className="block text-xs text-ink-400 font-body mb-2 uppercase tracking-wide">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditingDest(p => ({ ...p, coverGradient: g }))}
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g} border-2 transition-all ${editingDest.coverGradient === g ? 'border-ink-400 scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              {destError && <p className="text-xs text-blush-500 font-body mb-2 text-center">{destError}</p>}
            </div>

            <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-cream-100 flex gap-3"
                 style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <button type="button" onClick={() => setShowDestModal(false)} className="btn-ghost flex-1" disabled={isSavingDest}>
                {L.cancel}
              </button>
              <button type="button" onClick={handleSaveDestination} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSavingDest}>
                {isSavingDest ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : L.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserSettings, RoutineItem,
  getRoutineItems, saveRoutineItem, deleteRoutineItem, toggleRoutineItem,
  generateId, getTodayString,
} from '@/lib/db';

type Props = { settings: UserSettings };
type Category = RoutineItem['category'];

const CATEGORIES: { id: Category; emoji: string; label: string; labelAr: string; labelNl: string }[] = [
  { id: 'face',   emoji: '✨', label: 'Face',   labelAr: 'الوجه',    labelNl: 'Gezicht' },
  { id: 'hair',   emoji: '🌿', label: 'Hair',   labelAr: 'الشعر',    labelNl: 'Haar'    },
  { id: 'nails',  emoji: '💅', label: 'Nails',  labelAr: 'الأظافر',  labelNl: 'Nagels'  },
  { id: 'outfit', emoji: '👗', label: 'Outfit', labelAr: 'الملبس',   labelNl: 'Outfit'  },
];

type EditingItem = {
  id: string | null;
  title: string;
  product: string;
  category: Category;
};

export default function RoutineScreen({ settings }: Props) {
  const [period, setPeriod] = useState<'am' | 'pm'>('am');
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [editing, setEditing] = useState<EditingItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const loadItems = useCallback(async () => {
    const data = await getRoutineItems(period);
    setItems(data);
  }, [period]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function handleToggle(id: string) {
    await toggleRoutineItem(id);
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, completed: !i.completed, date: getTodayString() } : i
    ));
  }

  async function handleSave() {
    // Guard: must have text
    if (!editing) return;
    const trimmedTitle = editing.title.trim();
    if (!trimmedTitle) {
      setSaveError(lang === 'ar' ? 'أدخلي اسم الخطوة' : lang === 'nl' ? 'Vul een naam in' : 'Please enter a step name');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const existingOrder = editing.id
        ? (items.find(i => i.id === editing.id)?.order ?? items.length)
        : items.length;

      const item: RoutineItem = {
        id: editing.id ?? generateId(),
        period,
        category: editing.category,
        title: trimmedTitle,
        product: editing.product.trim() || undefined,
        completed: false,
        date: '',
        order: existingOrder,
      };

      await saveRoutineItem(item);

      // Optimistic UI update — add or replace in state immediately
      setItems(prev => {
        const exists = prev.findIndex(i => i.id === item.id);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = item;
          return next;
        }
        return [...prev, item];
      });

      // Also reload from DB to make sure we are in sync
      await loadItems();

      // Close and reset form
      setEditing(null);
      setShowModal(false);
    } catch (err) {
      console.error('[RoutineScreen] save failed:', err);
      setSaveError(lang === 'ar' ? 'فشل الحفظ، حاولي مجدداً' : lang === 'nl' ? 'Opslaan mislukt' : 'Save failed — please try again');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteRoutineItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function openAdd() {
    setEditing({ id: null, title: '', product: '', category: 'face' });
    setSaveError('');
    setShowModal(true);
  }

  function openEdit(item: RoutineItem) {
    setEditing({ id: item.id, title: item.title, product: item.product ?? '', category: item.category });
    setSaveError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setSaveError('');
  }

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = items.filter(i => i.category === cat.id);
    return acc;
  }, {} as Record<Category, RoutineItem[]>);

  const totalItems = items.length;
  const doneItems = items.filter(i => i.completed).length;

  const L = {
    title:    lang === 'ar' ? 'الروتين اليومي'  : lang === 'nl' ? 'Dagelijkse Routine' : 'Daily Routine',
    am:       lang === 'ar' ? 'صباح'             : lang === 'nl' ? 'Ochtend'            : 'Morning',
    pm:       lang === 'ar' ? 'مساء'             : lang === 'nl' ? 'Avond'              : 'Evening',
    addItem:  lang === 'ar' ? 'إضافة خطوة'       : lang === 'nl' ? 'Stap toevoegen'     : 'Add step',
    save:     lang === 'ar' ? 'حفظ'              : lang === 'nl' ? 'Opslaan'            : 'Save',
    cancel:   lang === 'ar' ? 'إلغاء'            : lang === 'nl' ? 'Annuleren'          : 'Cancel',
    stepName: lang === 'ar' ? 'اسم الخطوة'       : lang === 'nl' ? 'Naam van de stap'   : 'Step name',
    product:  lang === 'ar' ? 'المنتج (اختياري)' : lang === 'nl' ? 'Product (optioneel)': 'Product (optional)',
    category: lang === 'ar' ? 'الفئة'            : lang === 'nl' ? 'Categorie'          : 'Category',
    completed:lang === 'ar' ? 'مكتملة'           : lang === 'nl' ? 'voltooid'           : 'completed',
    editTitle:lang === 'ar' ? 'تعديل الخطوة'     : lang === 'nl' ? 'Stap bewerken'      : 'Edit step',
    newTitle: lang === 'ar' ? 'خطوة جديدة'       : lang === 'nl' ? 'Nieuwe stap'        : 'New step',
    noSteps:  lang === 'ar' ? 'أضيفي خطوات الروتين' : lang === 'nl' ? 'Voeg routinestappen toe' : 'Add your routine steps',
  };

  const getCatLabel = (id: Category) => {
    const c = CATEGORIES.find(x => x.id === id)!;
    return lang === 'ar' ? c.labelAr : lang === 'nl' ? c.labelNl : c.label;
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="page-container animate-fade-in"
         style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>

      {/* Header */}
      <div className={`flex items-center justify-between mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className={`font-display text-2xl font-medium text-ink-800 ${isRTL ? 'text-arabic not-italic' : 'italic'}`}>
          {L.title}
        </h1>
        <button
          onClick={openAdd}
          className="w-9 h-9 rounded-full bg-cream-400 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-ink-400 font-body mb-2">
            <span>{doneItems}/{totalItems} {L.completed}</span>
            <span>{Math.round((doneItems / totalItems) * 100)}%</span>
          </div>
          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cream-300 to-cream-400 rounded-full transition-all duration-700"
              style={{ width: `${totalItems > 0 ? (doneItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6 bg-cream-100/80 p-1 rounded-2xl">
        {(['am', 'pm'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-xl font-body text-sm font-medium transition-all duration-200 ${
              period === p ? 'bg-white text-ink-800 shadow-soft' : 'text-ink-400'
            }`}
          >
            {p === 'am' ? `🌅 ${L.am}` : `🌙 ${L.pm}`}
          </button>
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {CATEGORIES.map(cat => {
          const catItems = grouped[cat.id] ?? [];
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id} className="card">
              <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-base">{cat.emoji}</span>
                <h3 className={`font-body text-xs font-semibold text-ink-500 uppercase tracking-wider ${isRTL ? 'text-arabic' : ''}`}>
                  {getCatLabel(cat.id)}
                </h3>
              </div>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      item.completed ? 'bg-sage-50/60' : 'bg-cream-50/50'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                        item.completed ? 'bg-sage-400 border-sage-400' : 'border-cream-300'
                      }`}
                    >
                      {item.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-body text-sm font-medium ${
                        item.completed ? 'text-ink-400 line-through' : 'text-ink-700'
                      } ${isRTL ? 'text-right' : ''}`}>
                        {item.title}
                      </div>
                      {item.product && (
                        <div className={`text-xs text-ink-400 font-body mt-0.5 ${isRTL ? 'text-right' : ''}`}>
                          {item.product}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className={`flex gap-1 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={() => openEdit(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-ink-500 hover:bg-cream-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-blush-400 hover:bg-blush-50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{period === 'am' ? '🌅' : '🌙'}</div>
            <p className="font-body text-ink-400 text-sm">{L.noSteps}</p>
            <button onClick={openAdd} className="mt-4 btn-primary text-sm py-2 px-5">
              {L.addItem}
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={closeModal}
          />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col"
            style={{ maxHeight: '82vh' }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Drag handle + X close button */}
            <div className="flex-shrink-0 pt-3 pb-1 flex flex-col items-center">
              <div className="w-10 h-1 bg-cream-200 rounded-full mb-1" />
            </div>

            {/* Header with Save + X */}
            <div className="flex-shrink-0 px-6 pb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-full bg-cream-400 text-white text-xs font-body font-semibold shadow-sm disabled:opacity-60"
              >
                {isSaving ? '...' : L.save}
              </button>
              <h3 className={`font-display text-xl font-medium text-ink-800 ${isRTL ? 'text-arabic not-italic' : 'italic'}`}>
                {editing.id ? L.editTitle : L.newTitle}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-ink-400 hover:bg-cream-200 transition-all flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-2">

              {/* Category picker */}
              <div className="mb-4">
                <label className={`block text-xs font-body font-medium text-ink-400 mb-2 uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                  {L.category}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditing(e => e ? { ...e, category: cat.id } : e)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-body transition-all ${
                        editing.category === cat.id
                          ? 'bg-cream-100 border-cream-300'
                          : 'border-cream-100 bg-cream-50/50'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className={isRTL ? 'text-arabic text-xs' : ''}>
                        {lang === 'ar' ? cat.labelAr : lang === 'nl' ? cat.labelNl : cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step name */}
              <div className="mb-3">
                <input
                  className="input-field"
                  placeholder={L.stepName}
                  value={editing.title}
                  onChange={e => {
                    setSaveError('');
                    setEditing(prev => prev ? { ...prev, title: e.target.value } : prev);
                  }}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>

              {/* Product */}
              <div className="mb-3">
                <input
                  className="input-field"
                  placeholder={L.product}
                  value={editing.product}
                  onChange={e => setEditing(prev => prev ? { ...prev, product: e.target.value } : prev)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  autoComplete="off"
                />
              </div>

              {/* Error message */}
              {saveError && (
                <p className="text-xs text-blush-500 font-body mb-2 text-center">{saveError}</p>
              )}
            </div>

            {/* Buttons — fixed at bottom of sheet */}
            <div
              className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-cream-100 flex gap-3"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="btn-ghost flex-1"
                disabled={isSaving}
              >
                {L.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
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

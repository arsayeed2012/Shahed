import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type Language = 'en' | 'ar' | 'nl';

export interface UserSettings {
  id: 'settings';
  name: string;
  language: Language;
  darkMode: boolean;
  amReminderTime: string;
  pmReminderTime: string;
  backgroundPhoto: string | null;
  hasSeenEidSurprise: boolean;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 'radiant' | 'calm' | 'okay' | 'tired' | 'low';
  timestamp: number;
}

export interface RoutineItem {
  id: string;
  period: 'am' | 'pm';
  category: 'face' | 'hair' | 'nails' | 'outfit' | 'custom';
  title: string;
  product?: string;
  completed: boolean;
  date: string;
  order: number;
}

export interface StreakData {
  id: 'streak';
  currentStreak: number;
  lastCompletedDate: string;
  longestStreak: number;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  emoji?: string;
  startDate?: string;
  endDate?: string;
  interests: string[];
  notes: string;
  coverGradient: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlanItem {
  id: string;
  destinationId: string;
  title: string;
  category: 'food' | 'sight' | 'stay' | 'shop' | 'nature' | 'culture' | 'custom';
  note: string;
  done: boolean;
  order: number;
  createdAt: number;
}

interface ShahedDB extends DBSchema {
  settings: { key: string; value: UserSettings };
  moods: { key: string; value: MoodEntry; indexes: { 'by-date': string } };
  routine: { key: string; value: RoutineItem; indexes: { 'by-period': string; 'by-date': string } };
  streak: { key: string; value: StreakData };
  destinations: { key: string; value: Destination };
  planItems: { key: string; value: PlanItem; indexes: { 'by-destination': string } };
}

// ---- DB singleton — always returns a Promise, never null ----
let dbPromise: Promise<IDBPDatabase<ShahedDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ShahedDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available (SSR context)'));
  }
  if (!dbPromise) {
    dbPromise = openDB<ShahedDB>('shahed-db', 2, {
      upgrade(db, oldVersion) {
        console.log('[shahed-db] upgrading from version', oldVersion);
        // Create all stores from scratch on v0→v1
        if (oldVersion < 1) {
          db.createObjectStore('settings', { keyPath: 'id' });
          const moodStore = db.createObjectStore('moods', { keyPath: 'id' });
          moodStore.createIndex('by-date', 'date');
          const routineStore = db.createObjectStore('routine', { keyPath: 'id' });
          routineStore.createIndex('by-period', 'period');
          routineStore.createIndex('by-date', 'date');
          db.createObjectStore('streak', { keyPath: 'id' });
          db.createObjectStore('destinations', { keyPath: 'id' });
          const planStore = db.createObjectStore('planItems', { keyPath: 'id' });
          planStore.createIndex('by-destination', 'destinationId');
        }
        // v1→v2: no schema changes needed
      },
      blocked() {
        console.warn('[shahed-db] upgrade blocked by another open tab');
      },
      blocking() {
        console.warn('[shahed-db] blocking a newer version — will refresh');
      },
      terminated() {
        console.error('[shahed-db] connection terminated — resetting');
        dbPromise = null;
      },
    }).catch((err) => {
      console.error('[shahed-db] open failed:', err);
      // Reset so next call retries
      setTimeout(() => { dbPromise = null; }, 0);
      throw err;
    }) as Promise<IDBPDatabase<ShahedDB>>;
  }
  return dbPromise;
}

// ---- Settings ----
export async function getSettings(): Promise<UserSettings> {
  try {
    const db = await getDB();
    const settings = await db.get('settings', 'settings');
    return settings ?? defaultSettings();
  } catch (err) {
    console.error('[getSettings] failed:', err);
    return defaultSettings();
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', settings);
  } catch (err) {
    console.error('[saveSettings] failed:', err);
    throw err;
  }
}

function defaultSettings(): UserSettings {
  return {
    id: 'settings',
    name: 'Shahed',
    language: 'en',
    darkMode: false,
    amReminderTime: '07:30',
    pmReminderTime: '21:00',
    backgroundPhoto: null,
    hasSeenEidSurprise: false,
  };
}

// ---- Mood ----
export async function saveMood(mood: MoodEntry['mood']): Promise<void> {
  try {
    const db = await getDB();
    const today = getTodayString();
    const entry: MoodEntry = { id: today, date: today, mood, timestamp: Date.now() };
    await db.put('moods', entry);
  } catch (err) {
    console.error('[saveMood] failed:', err);
    throw err;
  }
}

export async function getTodayMood(): Promise<MoodEntry | undefined> {
  try {
    const db = await getDB();
    return db.get('moods', getTodayString());
  } catch (err) {
    console.error('[getTodayMood] failed:', err);
    return undefined;
  }
}

// ---- Routine ----
export async function getRoutineItems(period: 'am' | 'pm'): Promise<RoutineItem[]> {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('routine', 'by-period', period);
    return all.sort((a: RoutineItem, b: RoutineItem) => a.order - b.order);
  } catch (err) {
    console.error('[getRoutineItems] failed:', err);
    return [];
  }
}

export async function saveRoutineItem(item: RoutineItem): Promise<void> {
  try {
    const db = await getDB();
    await db.put('routine', item);
    console.log('[saveRoutineItem] saved:', item.title);
  } catch (err) {
    console.error('[saveRoutineItem] failed:', err);
    throw err;
  }
}

export async function deleteRoutineItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('routine', id);
  } catch (err) {
    console.error('[deleteRoutineItem] failed:', err);
    throw err;
  }
}

export async function toggleRoutineItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    const item = await db.get('routine', id);
    if (item) {
      item.completed = !item.completed;
      item.date = getTodayString();
      await db.put('routine', item);
    }
  } catch (err) {
    console.error('[toggleRoutineItem] failed:', err);
    throw err;
  }
}

export async function seedDefaultRoutine(): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.count('routine');
    if (existing > 0) return;

    const items: RoutineItem[] = [
      { id: 'am-face-1', period: 'am', category: 'face', title: 'Cleanser', completed: false, date: '', order: 0 },
      { id: 'am-face-2', period: 'am', category: 'face', title: 'Toner', completed: false, date: '', order: 1 },
      { id: 'am-face-3', period: 'am', category: 'face', title: 'Moisturizer', completed: false, date: '', order: 2 },
      { id: 'am-face-4', period: 'am', category: 'face', title: 'SPF', completed: false, date: '', order: 3 },
      { id: 'am-hair-1', period: 'am', category: 'hair', title: 'Brush', completed: false, date: '', order: 4 },
      { id: 'am-hair-2', period: 'am', category: 'hair', title: 'Style', completed: false, date: '', order: 5 },
      { id: 'am-nails-1', period: 'am', category: 'nails', title: 'Check & file', completed: false, date: '', order: 6 },
      { id: 'am-outfit-1', period: 'am', category: 'outfit', title: 'Choose outfit', completed: false, date: '', order: 7 },
      { id: 'pm-face-1', period: 'pm', category: 'face', title: 'Makeup removal', completed: false, date: '', order: 0 },
      { id: 'pm-face-2', period: 'pm', category: 'face', title: 'Gentle cleanser', completed: false, date: '', order: 1 },
      { id: 'pm-face-3', period: 'pm', category: 'face', title: 'Serum', completed: false, date: '', order: 2 },
      { id: 'pm-face-4', period: 'pm', category: 'face', title: 'Night cream', completed: false, date: '', order: 3 },
      { id: 'pm-hair-1', period: 'pm', category: 'hair', title: 'Brush & oil', completed: false, date: '', order: 4 },
      { id: 'pm-nails-1', period: 'pm', category: 'nails', title: 'Cuticle oil', completed: false, date: '', order: 5 },
      { id: 'pm-outfit-1', period: 'pm', category: 'outfit', title: 'Lay out tomorrow', completed: false, date: '', order: 6 },
    ];

    const tx = db.transaction('routine', 'readwrite');
    for (const item of items) await tx.store.put(item);
    await tx.done;
    console.log('[seedDefaultRoutine] seeded', items.length, 'items');
  } catch (err) {
    console.error('[seedDefaultRoutine] failed:', err);
  }
}

// ---- Streak ----
export async function getStreak(): Promise<StreakData> {
  try {
    const db = await getDB();
    return (await db.get('streak', 'streak')) ?? { id: 'streak', currentStreak: 0, lastCompletedDate: '', longestStreak: 0 };
  } catch (err) {
    console.error('[getStreak] failed:', err);
    return { id: 'streak', currentStreak: 0, lastCompletedDate: '', longestStreak: 0 };
  }
}

export async function updateStreak(): Promise<void> {
  try {
    const db = await getDB();
    const streak = await getStreak();
    const today = getTodayString();
    if (streak.lastCompletedDate === today) return;
    const yesterday = getYesterdayString();
    streak.currentStreak = streak.lastCompletedDate === yesterday ? streak.currentStreak + 1 : 1;
    streak.lastCompletedDate = today;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    await db.put('streak', streak);
  } catch (err) {
    console.error('[updateStreak] failed:', err);
  }
}

// ---- Destinations ----
export async function getDestinations(): Promise<Destination[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('destinations');
    return all.sort((a: Destination, b: Destination) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('[getDestinations] failed:', err);
    return [];
  }
}

export async function saveDestination(dest: Destination): Promise<void> {
  try {
    const db = await getDB();
    dest.updatedAt = Date.now();
    await db.put('destinations', dest);
    console.log('[saveDestination] saved:', dest.city);
  } catch (err) {
    console.error('[saveDestination] failed:', err);
    throw err;
  }
}

export async function deleteDestination(id: string): Promise<void> {
  try {
    const db = await getDB();
    const planItems = await db.getAllFromIndex('planItems', 'by-destination', id);
    const tx = db.transaction(['destinations', 'planItems'], 'readwrite');
    await tx.objectStore('destinations').delete(id);
    for (const item of planItems) await tx.objectStore('planItems').delete(item.id);
    await tx.done;
  } catch (err) {
    console.error('[deleteDestination] failed:', err);
    throw err;
  }
}

export async function getDestination(id: string): Promise<Destination | undefined> {
  try {
    const db = await getDB();
    return db.get('destinations', id);
  } catch (err) {
    console.error('[getDestination] failed:', err);
    return undefined;
  }
}

// ---- Plan Items ----
export async function getPlanItems(destinationId: string): Promise<PlanItem[]> {
  try {
    const db = await getDB();
    const items = await db.getAllFromIndex('planItems', 'by-destination', destinationId);
    return items.sort((a: PlanItem, b: PlanItem) => a.order - b.order);
  } catch (err) {
    console.error('[getPlanItems] failed:', err);
    return [];
  }
}

export async function savePlanItem(item: PlanItem): Promise<void> {
  try {
    const db = await getDB();
    await db.put('planItems', item);
    console.log('[savePlanItem] saved:', item.title);
  } catch (err) {
    console.error('[savePlanItem] failed:', err);
    throw err;
  }
}

export async function deletePlanItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('planItems', id);
  } catch (err) {
    console.error('[deletePlanItem] failed:', err);
    throw err;
  }
}

export async function togglePlanItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    const item = await db.get('planItems', id);
    if (item) {
      item.done = !item.done;
      await db.put('planItems', item);
    }
  } catch (err) {
    console.error('[togglePlanItem] failed:', err);
    throw err;
  }
}

// ---- Export / Import / Reset ----
export async function exportAllData(): Promise<string> {
  try {
    const db = await getDB();
    const [settings, moods, routine, streak, destinations, planItems] = await Promise.all([
      db.getAll('settings'), db.getAll('moods'), db.getAll('routine'),
      db.getAll('streak'), db.getAll('destinations'), db.getAll('planItems'),
    ]);
    return JSON.stringify({ settings, moods, routine, streak, destinations, planItems, exportedAt: Date.now() }, null, 2);
  } catch (err) {
    console.error('[exportAllData] failed:', err);
    throw err;
  }
}

export async function importAllData(json: string): Promise<void> {
  try {
    const db = await getDB();
    const data = JSON.parse(json);
    const stores = ['settings', 'moods', 'routine', 'streak', 'destinations', 'planItems'] as const;
    const tx = db.transaction(stores, 'readwrite');
    for (const store of stores) {
      await tx.objectStore(store).clear();
      if (data[store]) for (const item of data[store]) await tx.objectStore(store).put(item);
    }
    await tx.done;
  } catch (err) {
    console.error('[importAllData] failed:', err);
    throw err;
  }
}

export async function resetAllData(): Promise<void> {
  try {
    const db = await getDB();
    const stores = ['settings', 'moods', 'routine', 'streak', 'destinations', 'planItems'] as const;
    const tx = db.transaction(stores, 'readwrite');
    for (const store of stores) await tx.objectStore(store).clear();
    await tx.done;
  } catch (err) {
    console.error('[resetAllData] failed:', err);
    throw err;
  }
}

// ---- Helpers ----
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const GRADIENT_PRESETS = [
  'from-rose-300 to-pink-200',
  'from-amber-300 to-yellow-200',
  'from-teal-300 to-cyan-200',
  'from-violet-300 to-purple-200',
  'from-sky-300 to-blue-200',
  'from-lime-300 to-green-200',
  'from-orange-300 to-amber-200',
  'from-indigo-300 to-violet-200',
];

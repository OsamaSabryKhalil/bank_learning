import { create } from 'zustand';
import { get, set } from 'idb-keyval';

export interface LearnerData {
  completedLessons: string[];
  quizScores: Record<string, { correct: number; total: number }>;
  bookmarks: string[];
  notes: Record<string, string>;
  reviewQueue: Record<string, number>; // lessonId -> Leitner box 1..5
  lastLesson: string | null;
}

const KEY = 'bank-academy:learner-data';
const EMPTY: LearnerData = {
  completedLessons: [],
  quizScores: {},
  bookmarks: [],
  notes: {},
  reviewQueue: {},
  lastLesson: null,
};

interface ProgressStore extends LearnerData {
  hydrated: boolean;
  hydrate(): Promise<void>;
  markComplete(lessonId: string): void;
  toggleBookmark(lessonId: string): void;
  setNote(lessonId: string, note: string): void;
  recordQuiz(lessonId: string, correct: number, total: number): void;
  setLastLesson(lessonId: string): void;
  exportAll(): LearnerData;
  importAll(data: LearnerData): void;
  resetAll(): void;
}

async function load(): Promise<LearnerData> {
  try {
    return { ...EMPTY, ...((await get<LearnerData>(KEY)) ?? {}) };
  } catch {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...EMPTY };
    }
  }
}

export const useProgress = create<ProgressStore>((setStore, getStore) => ({
  ...EMPTY,
  hydrated: false,
  async hydrate() {
    const data = await load();
    setStore({ ...data, hydrated: true });
  },
  markComplete(lessonId) {
    const s = getStore();
    if (s.completedLessons.includes(lessonId)) return;
    const next = {
      ...s,
      completedLessons: [...s.completedLessons, lessonId],
      reviewQueue: { ...s.reviewQueue, [lessonId]: 1 },
    };
    setStore(next);
    void persist(next);
  },
  toggleBookmark(lessonId) {
    const s = getStore();
    const bookmarks = s.bookmarks.includes(lessonId)
      ? s.bookmarks.filter((b) => b !== lessonId)
      : [...s.bookmarks, lessonId];
    const next = { ...s, bookmarks };
    setStore(next);
    void persist(next);
  },
  setNote(lessonId, note) {
    const s = getStore();
    const notes = note ? { ...s.notes, [lessonId]: note } : { ...s.notes };
    if (!note) delete notes[lessonId];
    const next = { ...s, notes };
    setStore(next);
    void persist(next);
  },
  recordQuiz(lessonId, correct, total) {
    const s = getStore();
    const quizScores = { ...s.quizScores, [lessonId]: { correct, total } };
    // Simple Leitner: pass >= 70% promotes one box, else demote to box 1
    const passed = total > 0 && correct / total >= 0.7;
    const currentBox = s.reviewQueue[lessonId] ?? 1;
    const box = passed ? Math.min(5, currentBox + 1) : 1;
    const next = { ...s, quizScores, reviewQueue: { ...s.reviewQueue, [lessonId]: box } };
    setStore(next);
    void persist(next);
  },
  setLastLesson(lessonId) {
    const s = getStore();
    const next = { ...s, lastLesson: lessonId };
    setStore(next);
    void persist(next);
  },
  exportAll() {
    const s = getStore();
    const { hydrated: _h, ...data } = s;
    return data as LearnerData;
  },
  importAll(data) {
    setStore({ ...EMPTY, ...data });
    void persist({ ...EMPTY, ...data });
  },
  resetAll() {
    setStore({ ...EMPTY });
    void persist({ ...EMPTY });
  },
}));

async function persist(data: LearnerData): Promise<void> {
  try {
    await set(KEY, data);
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* session-only */
    }
  }
}

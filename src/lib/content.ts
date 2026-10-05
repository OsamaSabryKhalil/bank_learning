/**
 * Content loader. All content is local JSON, loaded via Vite's import.meta.glob
 * so every lesson is bundled (and precached by the service worker) at build
 * time. No network at runtime, ever.
 */
import type { Curriculum, GlossaryTerm, Lesson } from './content-types';

const lessonModules = import.meta.glob<Record<string, unknown>>('/content/lessons/*.json', {
  eager: true,
});

const curriculumModules = import.meta.glob<Record<string, unknown>>('/content/*.json', {
  eager: true,
});

let resolved: Curriculum | undefined;
for (const path of Object.keys(curriculumModules)) {
  if (path.endsWith('/curriculum.json')) {
    const mod = curriculumModules[path]! as Record<string, unknown>;
    resolved = (mod.default as Curriculum | undefined) ?? (mod as unknown as Curriculum);
  }
}
if (!resolved) throw new Error('content/curriculum.json missing');
export const curriculum: Curriculum = resolved;

const lessons = new Map<string, Lesson>();
for (const path of Object.keys(lessonModules)) {
  const mod = lessonModules[path]! as unknown as { default: Lesson } | Lesson;
  const lesson = ((mod as { default?: Lesson }).default ?? mod) as Lesson;
  lessons.set(lesson.id, lesson);
}

const glossaryModules = import.meta.glob<Record<string, unknown>>('/content/glossary/*.json', {
  eager: true,
});

export const glossary: GlossaryTerm[] = [];
for (const path of Object.keys(glossaryModules)) {
  const mod = glossaryModules[path]! as unknown as { default: GlossaryTerm[] } | GlossaryTerm[];
  const list = (mod as { default?: GlossaryTerm[] }).default ?? mod;
  glossary.push(...(Array.isArray(list) ? list : [list as unknown as GlossaryTerm]));
}

export const glossaryById = new Map(glossary.map((t) => [t.id, t]));

export function getLesson(id: string): Lesson | undefined {
  return lessons.get(id);
}

export function publishedLessons(): Lesson[] {
  const published = new Set<string>();
  for (const m of curriculum.modules) {
    for (const l of m.lessons) if (l.status === 'published') published.add(l.id);
  }
  return [...lessons.values()].filter((l) => published.has(l.id));
}

export function isPublished(lessonId: string): boolean {
  for (const m of curriculum.modules) {
    for (const l of m.lessons) if (l.id === lessonId && l.status === 'published') return true;
  }
  return false;
}

/** Lessons using a glossary term (backlinks), published only. */
export function termBacklinks(termId: string): Lesson[] {
  return publishedLessons().filter((l) => l.glossary_terms.includes(termId));
}

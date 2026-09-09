// Temporary local-only persistence: the backend has no `courses` table yet.
// Once it exists, swap this file's internals for real Supabase calls —
// callers (subscribe/getCoursesSnapshot/createCourse/getCourse) should
// keep the same signatures so components don't need to change.

export type Course = {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  createdAt: string;
};

const STORAGE_KEY = "lernapp.courses";
const EMPTY: Course[] = [];
const listeners = new Set<() => void>();

function readStorage(): Course[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Course[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

let cache: Course[] = readStorage();

function commit(next: Course[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCoursesSnapshot(): Course[] {
  return cache;
}

export function getCoursesServerSnapshot(): Course[] {
  return EMPTY;
}

export function getCourse(id: string): Course | undefined {
  return cache.find((course) => course.id === id);
}

export function createCourse(input: Omit<Course, "id" | "createdAt">): Course {
  const course: Course = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  commit([...cache, course]);
  return course;
}

export function deleteCourse(id: string): void {
  commit(cache.filter((course) => course.id !== id));
}

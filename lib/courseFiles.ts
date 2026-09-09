// Temporary local-only file storage: the backend has no Storage bucket or
// document model for lecture material yet. Files live in the browser's
// IndexedDB (needed for real Blob content, unlike localStorage) until a
// real upload endpoint exists to swap this for.

export type CourseFile = {
  id: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  blob: Blob;
};

const DB_NAME = "lernapp";
const STORE_NAME = "courseFiles";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("courseId", "courseId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addCourseFile(
  courseId: string,
  file: File
): Promise<CourseFile> {
  const db = await openDb();
  const record: CourseFile = {
    id: crypto.randomUUID(),
    courseId,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return record;
}

export async function getCourseFiles(courseId: string): Promise<CourseFile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).index("courseId").getAll(courseId);
    request.onsuccess = () => resolve(request.result as CourseFile[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCourseFile(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCourseFiles(courseId: string): Promise<void> {
  const files = await getCourseFiles(courseId);
  await Promise.all(files.map((file) => deleteCourseFile(file.id)));
}

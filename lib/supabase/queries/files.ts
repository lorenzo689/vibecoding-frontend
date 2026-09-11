import { createClient } from "@/lib/supabase/browser";

// Real metadata row in `files`, but the actual bytes stay in this browser's
// IndexedDB keyed by the row's id — the backend has no Storage bucket/policies
// yet. Swap `blobStore` for real Supabase Storage once that exists.

export type CourseFile = {
  id: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
};

type FileRow = {
  id: string;
  course_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

function mapFile(row: FileRow): CourseFile {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.original_filename,
    type: row.mime_type,
    size: row.size_bytes,
    createdAt: row.created_at,
  };
}

const DB_NAME = "lernapp";
const STORE_NAME = "courseFileBlobs";
// v2: the old localStorage-era client already created "lernapp" at v1 with a
// different store name in some browsers. Bumping the version forces
// onupgradeneeded to run so this store actually gets created for them.
const DB_VERSION = 2;

function openBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openBlobDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBlob(id: string): Promise<Blob | null> {
  const db = await openBlobDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteBlob(id: string): Promise<void> {
  const db = await openBlobDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listCourseFiles(courseId: string): Promise<CourseFile[]> {
  const { data, error } = await createClient()
    .from("files")
    .select("id, course_id, original_filename, mime_type, size_bytes, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as FileRow[]).map(mapFile);
}

export async function addCourseFile(courseId: string, file: File): Promise<CourseFile> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const path = `${courseId}/${crypto.randomUUID()}-${file.name}`;
  const { data, error } = await supabase
    .from("files")
    .insert({
      course_id: courseId,
      uploaded_by: userData.user.id,
      storage_bucket: "learning-materials",
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    })
    .select("id, course_id, original_filename, mime_type, size_bytes, created_at")
    .single();

  if (error) throw error;
  const mapped = mapFile(data as FileRow);
  await putBlob(mapped.id, file);
  return mapped;
}

export async function deleteCourseFile(id: string): Promise<void> {
  const { error } = await createClient().from("files").delete().eq("id", id);
  if (error) throw error;
  await deleteBlob(id);
}

export async function getCourseFileBlob(id: string): Promise<Blob | null> {
  return getBlob(id);
}

export async function deleteLocalBlob(id: string): Promise<void> {
  await deleteBlob(id);
}

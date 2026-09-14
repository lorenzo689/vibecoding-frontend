import { createClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Tables } from "@/lib/supabase/database.types";

// Real backend contract (see ../lernapp/docs/storage.md): metadata lives in
// `files`, actual bytes live in the private `learning-files` Storage bucket.
// prepare/complete/download/delete all go through the `files` Edge Function;
// only listing reads the table directly.

export type FileStatus = "unverified" | "pending" | "ready" | "failed" | "deleting";

export type CourseFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: FileStatus;
  errorCode: string | null;
  createdAt: string;
};

type FileRow = Pick<
  Tables<"files">,
  "id" | "original_filename" | "mime_type" | "size_bytes" | "status" | "error_code" | "created_at"
>;

function mapFile(row: FileRow): CourseFile {
  return {
    id: row.id,
    name: row.original_filename,
    type: row.mime_type,
    size: row.size_bytes,
    status: row.status as FileStatus,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const MAX_FILE_SIZE = 52_428_800;

// Browsers sometimes leave file.type empty for these formats; fall back to
// the extension. The backend rejects application/octet-stream outright.
export function resolveMimeType(file: File): string | null {
  if (ALLOWED_MIME_TYPES.includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? (EXTENSION_MIME[ext] ?? null) : null;
}

export function isFileSizeAllowed(size: number): boolean {
  return size >= 1 && size <= MAX_FILE_SIZE;
}

async function callFilesFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().functions.invoke("files", { body });
  if (error) {
    let code: string | undefined;
    try {
      const context = (error as { context?: Response }).context;
      if (context) {
        const parsed = (await context.clone().json()) as { error?: { code?: string } };
        code = parsed.error?.code;
      }
    } catch {
      // Ignore parse failures — fall through to a generic error below.
    }
    throw new Error(code ?? "SERVICE_UNAVAILABLE");
  }
  return data as T;
}

export async function listCourseFiles(courseId: string): Promise<CourseFile[]> {
  const { data, error } = await createClient()
    .from("files")
    .select("id, original_filename, mime_type, size_bytes, status, error_code, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .range(0, 49);

  if (error) throw error;
  return data.map(mapFile);
}

export async function uploadCourseFile(courseId: string, file: File): Promise<CourseFile> {
  const mimeType = resolveMimeType(file);
  if (!mimeType) throw new Error("INVALID_FILE");
  if (!isFileSizeAllowed(file.size)) throw new Error("FILE_TOO_LARGE");

  const uploadKey = crypto.randomUUID();
  const prepared = await callFilesFunction<{
    file: FileRow & { storage_bucket: string; storage_path: string };
  }>({
    action: "prepare",
    course_id: courseId,
    upload_key: uploadKey,
    filename: file.name,
    mime_type: mimeType,
    size_bytes: file.size,
  });

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(prepared.file.storage_bucket)
    .upload(prepared.file.storage_path, file, { contentType: mimeType, upsert: false });

  // Per the backend contract: on any upload error/uncertainty, try `complete`
  // with the same file id first. Only retry the byte upload on UPLOAD_MISSING,
  // and never with upsert:true / a second file record.
  try {
    const completed = await callFilesFunction<{ file: FileRow }>({
      action: "complete",
      file_id: prepared.file.id,
    });
    return mapFile(completed.file);
  } catch (completeError) {
    const message = completeError instanceof Error ? completeError.message : "";
    if (uploadError && message === "UPLOAD_MISSING") {
      const { error: retryError } = await supabase.storage
        .from(prepared.file.storage_bucket)
        .upload(prepared.file.storage_path, file, { contentType: mimeType, upsert: false });
      if (retryError) throw retryError;
      const completed = await callFilesFunction<{ file: FileRow }>({
        action: "complete",
        file_id: prepared.file.id,
      });
      return mapFile(completed.file);
    }
    throw completeError;
  }
}

export async function getCourseFileDownloadUrl(
  fileId: string,
  download: boolean
): Promise<string> {
  const result = await callFilesFunction<{ path: string }>({
    action: "download",
    file_id: fileId,
    download,
  });
  const { url } = getSupabaseConfig();
  return new URL(result.path, url).href;
}

export async function deleteCourseFile(fileId: string): Promise<void> {
  await callFilesFunction<{ deleted: boolean }>({ action: "delete", file_id: fileId });
}

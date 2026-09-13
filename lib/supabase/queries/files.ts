import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

export type CourseFile = {
  id: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
};

type FileRow = Pick<
  Tables<"files">,
  "id" | "course_id" | "original_filename" | "mime_type" | "size_bytes" | "created_at"
>;

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

export async function listCourseFiles(courseId: string): Promise<CourseFile[]> {
  const { data, error } = await createClient()
    .from("files")
    .select("id, course_id, original_filename, mime_type, size_bytes, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(mapFile);
}

export async function deleteCourseFile(id: string): Promise<void> {
  const { error } = await createClient().from("files").delete().eq("id", id);
  if (error) throw error;
}

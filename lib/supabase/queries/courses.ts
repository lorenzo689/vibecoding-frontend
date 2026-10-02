import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

export type Course = {
  id: string;
  title: string;
  description: string;
  semester: string;
  lecturer: string;
  targetGrade: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

type CourseRow = Tables<"courses">;

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    semester: row.semester ?? "",
    lecturer: row.lecturer ?? "",
    targetGrade: row.target_grade === null ? null : Number(row.target_grade),
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCourses(): Promise<Course[]> {
  const courses: Course[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await createClient()
      .from("courses")
      .select("id, title, description, semester, lecturer, target_grade, owner_id, created_at, updated_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + 99);
    if (error) throw error;
    courses.push(...data.map(mapCourse));
    if (data.length < 100) return courses;
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await createClient()
    .from("courses")
    .select("id, title, description, semester, lecturer, target_grade, owner_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCourse(data) : null;
}

export async function createCourse(input: {
  title: string;
  description: string;
  semester?: string;
  lecturer?: string;
}): Promise<Course> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { data, error } = await supabase
    .from("courses")
    .insert({
      owner_id: userData.user.id,
      title: input.title,
      description: input.description,
      semester: input.semester?.trim() || null,
      lecturer: input.lecturer?.trim() || null,
    })
    .select("id, title, description, semester, lecturer, target_grade, owner_id, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapCourse(data);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await createClient().from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCourse(
  id: string,
  input: { title: string; description: string; semester?: string; lecturer?: string },
): Promise<Course> {
  const { data, error } = await createClient().from("courses")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      ...(input.semester !== undefined && { semester: input.semester.trim() || null }),
      ...(input.lecturer !== undefined && { lecturer: input.lecturer.trim() || null }),
    }).eq("id", id)
    .select("id, title, description, semester, lecturer, target_grade, owner_id, created_at, updated_at").single();
  if (error) throw error;
  return mapCourse(data);
}

/** Personal target grade (1.0-5.0) of a course; null clears it. */
export async function setCourseTargetGrade(id: string, targetGrade: number | null): Promise<void> {
  const { error } = await createClient().from("courses").update({ target_grade: targetGrade }).eq("id", id);
  if (error) throw error;
}

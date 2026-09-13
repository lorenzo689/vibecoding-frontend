import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

export type Course = {
  id: string;
  title: string;
  description: string;
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
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await createClient()
    .from("courses")
    .select("id, title, description, owner_id, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(mapCourse);
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await createClient()
    .from("courses")
    .select("id, title, description, owner_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCourse(data) : null;
}

export async function createCourse(input: {
  title: string;
  description: string;
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
    })
    .select("id, title, description, owner_id, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapCourse(data);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await createClient().from("courses").delete().eq("id", id);
  if (error) throw error;
}

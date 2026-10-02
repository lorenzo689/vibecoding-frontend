import { createClient } from "@/lib/supabase/browser";

export type Lecture = { id: string; courseId: string; title: string; heldOn: string | null; createdAt: string };

const COLUMNS = "id, course_id, title, held_on, created_at";

type LectureRow = { id: string; course_id: string; title: string; held_on: string | null; created_at: string };

function mapLecture(row: LectureRow): Lecture {
  return { id: row.id, courseId: row.course_id, title: row.title, heldOn: row.held_on, createdAt: row.created_at };
}

export async function listLectures(courseId: string): Promise<Lecture[]> {
  const { data, error } = await createClient().from("lectures").select(COLUMNS)
    .eq("course_id", courseId)
    .order("held_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapLecture);
}

export async function createLecture(courseId: string, input: { title: string; heldOn: string | null }): Promise<Lecture> {
  const { data, error } = await createClient().from("lectures")
    .insert({ course_id: courseId, title: input.title.trim(), held_on: input.heldOn })
    .select(COLUMNS).single();
  if (error) throw error;
  return mapLecture(data);
}

export async function updateLecture(id: string, input: { title: string; heldOn: string | null }): Promise<Lecture> {
  const { data, error } = await createClient().from("lectures")
    .update({ title: input.title.trim(), held_on: input.heldOn }).eq("id", id)
    .select(COLUMNS).single();
  if (error) throw error;
  return mapLecture(data);
}

export async function deleteLecture(id: string): Promise<void> {
  const { error } = await createClient().from("lectures").delete().eq("id", id);
  if (error) throw error;
}

/** materialId → lectureId for every document of the course that is assigned to a lecture. */
export async function listMaterialLectures(courseId: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await createClient().from("materials").select("id, lecture_id")
      .eq("course_id", courseId).eq("type", "source_document").not("lecture_id", "is", null)
      .order("id", { ascending: true }).range(offset, offset + 99);
    if (error) throw error;
    for (const row of data) if (row.lecture_id) result.set(row.id, row.lecture_id);
    if (data.length < 100) return result;
  }
}

export async function assignMaterialLecture(materialId: string, lectureId: string | null): Promise<void> {
  const { error } = await createClient().from("materials").update({ lecture_id: lectureId }).eq("id", materialId);
  if (error) throw error;
}

import { createClient } from "@/lib/supabase/browser";
import { summaryText } from "./summary-format";

export type CourseSummary = {
  materialId: string;
  summaryId: string;
  title: string;
  text: string;
  updatedAt: string;
};

type MaterialWithSummaryRow = {
  id: string;
  title: string;
  summaries: {
    id: string;
    content: { text?: string } | null;
    updated_at: string;
  } | null;
};

export async function getCourseSummary(courseId: string): Promise<CourseSummary | null> {
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, summaries!material_id!inner(id, content, updated_at, source_file_id)")
    .eq("course_id", courseId)
    .eq("type", "summary")
    .is("summaries.source_file_id", null)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  const row = (data as MaterialWithSummaryRow[])[0] ?? null;
  if (!row || !row.summaries) return null;

  return {
    materialId: row.id,
    summaryId: row.summaries.id,
    title: row.title,
    text: summaryText(row.summaries.content),
    updatedAt: row.summaries.updated_at,
  };
}

export async function saveCourseSummary(
  courseId: string,
  input: { title: string; text: string }
): Promise<CourseSummary> {
  const { data, error } = await createClient().rpc("save_course_summary", {
    p_course: courseId, p_title: input.title, p_text: input.text,
  });
  if (error) throw error;
  return data as CourseSummary;
}

// Deleting the material cascades to the summary row (see core_erm migration).
export async function deleteCourseSummary(materialId: string): Promise<void> {
  const { error } = await createClient().from("materials").delete().eq("id", materialId);
  if (error) throw error;
}

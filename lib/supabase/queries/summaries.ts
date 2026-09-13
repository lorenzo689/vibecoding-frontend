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
  // .limit(1) instead of .maybeSingle(): a partial failure between the two
  // inserts below could in theory leave more than one "summary" material for
  // this course. Take the first rather than throwing on that edge case.
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, summaries!material_id(id, content, updated_at)")
    .eq("course_id", courseId)
    .eq("type", "summary")
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
  const supabase = createClient();
  const existing = await getCourseSummary(courseId);

  if (existing) {
    const { error: materialError } = await supabase
      .from("materials")
      .update({ title: input.title })
      .eq("id", existing.materialId);
    if (materialError) throw materialError;

    const { data, error } = await supabase
      .from("summaries")
      .update({ content: { text: input.text } })
      .eq("id", existing.summaryId)
      .select("id, content, updated_at")
      .single();
    if (error) throw error;

    return {
      materialId: existing.materialId,
      summaryId: data.id,
      title: input.title,
      text: summaryText(data.content),
      updatedAt: data.updated_at,
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .insert({
      course_id: courseId,
      created_by: userData.user.id,
      type: "summary",
      title: input.title,
    })
    .select("id")
    .single();
  if (materialError) throw materialError;

  const { data: summary, error: summaryError } = await supabase
    .from("summaries")
    .insert({
      material_id: material.id,
      content: { text: input.text },
    })
    .select("id, content, updated_at")
    .single();
  if (summaryError) {
    await supabase.from("materials").delete().eq("id", material.id);
    throw summaryError;
  }

  return {
    materialId: material.id,
    summaryId: summary.id,
    title: input.title,
    text: summaryText(summary.content),
    updatedAt: summary.updated_at,
  };
}

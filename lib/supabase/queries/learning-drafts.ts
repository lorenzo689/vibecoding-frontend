import { createClient } from "@/lib/supabase/browser";
import type { Json } from "@/lib/supabase/database.types";

export type DraftKind = "summary" | "flashcards";

export async function getLearningDraft<T>(materialId: string, kind: DraftKind): Promise<T | null> {
  const { data, error } = await createClient().from("learning_drafts").select("payload")
    .eq("source_material_id", materialId).eq("kind", kind).maybeSingle();
  if (error) throw error;
  return data ? data.payload as T : null;
}

export async function saveLearningDraft(materialId: string, kind: DraftKind, payload: Json): Promise<void> {
  const client = createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw authError ?? new Error("Nicht angemeldet.");
  const { data: existing, error: readError } = await client.from("learning_drafts").select("kind")
    .eq("source_material_id", materialId).eq("kind", kind).maybeSingle();
  if (readError) throw readError;
  const { error } = existing
    ? await client.from("learning_drafts").update({ payload }).eq("source_material_id", materialId).eq("kind", kind)
    : await client.from("learning_drafts").insert({ user_id: user.id, source_material_id: materialId, kind, payload });
  if (error) throw error;
}

export async function deleteLearningDraft(materialId: string, kind: DraftKind): Promise<void> {
  const { error } = await createClient().from("learning_drafts").delete()
    .eq("source_material_id", materialId).eq("kind", kind);
  if (error) throw error;
}

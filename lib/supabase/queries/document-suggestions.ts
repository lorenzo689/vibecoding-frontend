import { createClient } from "@/lib/supabase/browser";
import type { CalendarEventKind } from "./calendar-map";

export type SuggestionKind = "topic" | "definition" | "date";
export type SuggestionStatus = "pending" | "accepted" | "rejected";

export type DocumentSuggestion = {
  id: string;
  materialId: string;
  kind: SuggestionKind;
  title: string;
  detail: string;
  pageNumber: number | null;
  quote: string;
  startsAt: string | null;
  allDay: boolean;
  status: SuggestionStatus;
  createdAt: string;
};

export type NewSuggestion = {
  kind: SuggestionKind;
  title: string;
  detail?: string;
  pageNumber?: number | null;
  quote?: string;
  startsAt?: string | null;
  allDay?: boolean;
};

type SuggestionRow = {
  id: string; material_id: string; kind: string; title: string; detail: string | null; page_number: number | null;
  quote: string | null; starts_at: string | null; all_day: boolean; status: string; created_at: string;
};

const COLUMNS = "id, material_id, kind, title, detail, page_number, quote, starts_at, all_day, status, created_at";

function mapSuggestion(row: SuggestionRow): DocumentSuggestion {
  return {
    id: row.id, materialId: row.material_id, kind: row.kind as SuggestionKind, title: row.title,
    detail: row.detail ?? "", pageNumber: row.page_number, quote: row.quote ?? "", startsAt: row.starts_at,
    allDay: row.all_day, status: row.status as SuggestionStatus, createdAt: row.created_at,
  };
}

export async function listSuggestions(materialId: string): Promise<DocumentSuggestion[]> {
  const { data, error } = await createClient().from("document_suggestions").select(COLUMNS)
    .eq("material_id", materialId).order("page_number", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapSuggestion);
}

/** Stores new suggestions; duplicates of earlier suggestions are skipped. Returns how many were added. */
export async function saveSuggestions(materialId: string, items: NewSuggestion[]): Promise<number> {
  const { data, error } = await createClient().rpc("save_document_suggestions", {
    p_material: materialId,
    p_items: items.map((item) => ({
      kind: item.kind, title: item.title, detail: item.detail ?? null, page_number: item.pageNumber ?? null,
      quote: item.quote ?? null, starts_at: item.startsAt ?? null, all_day: item.allDay ?? true,
    })),
  });
  if (error) throw error;
  return data;
}

/** Confirms a suggestion. Date suggestions create exactly one calendar event, with optional corrections. */
export async function acceptSuggestion(id: string, correction?: {
  title: string; startsAt: string; allDay: boolean; eventKind: CalendarEventKind;
}): Promise<string | null> {
  const { data, error } = await createClient().rpc("accept_document_suggestion", {
    p_id: id,
    ...(correction && {
      p_title: correction.title, p_starts_at: correction.startsAt, p_all_day: correction.allDay, p_event_kind: correction.eventKind,
    }),
  });
  if (error) throw error;
  return (data as { eventId: string | null }).eventId;
}

export async function reviewSuggestion(id: string, status: "pending" | "rejected"): Promise<void> {
  const { error } = await createClient().rpc("review_document_suggestion", { p_id: id, p_status: status });
  if (error) throw error;
}

export async function deleteSuggestion(id: string): Promise<void> {
  const { error } = await createClient().from("document_suggestions").delete().eq("id", id);
  if (error) throw error;
}

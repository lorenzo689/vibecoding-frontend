import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

export type CalendarEventKind =
  | "lecture"
  | "exercise"
  | "study"
  | "presentation"
  | "exam"
  | "deadline"
  | "other";

export type CalendarEvent = {
  id: string;
  ownerId: string;
  courseId: string | null;
  title: string;
  description: string;
  kind: CalendarEventKind;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = {
  courseId: string | null;
  title: string;
  description: string;
  kind: CalendarEventKind;
  startsAt: string;
  endsAt: string | null;
};

type CalendarEventRow = Tables<"calendar_events">;

const COLUMNS =
  "id, owner_id, course_id, title, description, kind, starts_at, ends_at, created_at, updated_at";

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    courseId: row.course_id,
    title: row.title,
    description: row.description ?? "",
    kind: row.kind as CalendarEventKind,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await createClient()
    .from("calendar_events")
    .select(COLUMNS)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data.map(mapEvent);
}

export async function createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      owner_id: userData.user.id,
      course_id: input.courseId,
      title: input.title,
      description: input.description,
      kind: input.kind,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return mapEvent(data);
}

export async function updateEvent(id: string, input: CalendarEventInput): Promise<CalendarEvent> {
  const { data, error } = await createClient()
    .from("calendar_events")
    .update({
      course_id: input.courseId,
      title: input.title,
      description: input.description,
      kind: input.kind,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return mapEvent(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await createClient().from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}

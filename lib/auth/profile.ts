import type { Tables } from "@/lib/supabase/database.types";

export type ProfileRecord = Pick<
  Tables<"profiles">,
  "name" | "created_at" | "updated_at"
>;

export const PROFILE_UPDATED_EVENT = "lernapp:profile-updated";

export type ProfileUpdatedDetail = {
  displayName: string;
};

export function registrationProfileMetadata(displayName: string) {
  return { display_name: displayName };
}

export function profileInitial(displayName: string): string {
  return Array.from(displayName.trim())[0]?.toLocaleUpperCase("de-DE") ?? "L";
}

export function announceProfileUpdate(displayName: string) {
  window.dispatchEvent(
    new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, {
      detail: { displayName },
    })
  );
}

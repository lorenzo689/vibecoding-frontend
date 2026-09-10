export type ProfileRecord = {
  display_name: string;
  created_at: string;
  updated_at: string;
};

export const PROFILE_UPDATED_EVENT = "lernapp:profile-updated";

export type ProfileUpdatedDetail = {
  displayName: string;
};

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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import type { ProfileRecord } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil · Lernapp",
  description: "Persönliche Profil- und Kontoinformationen",
};

export default async function Page() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login?next=%2Fprofile");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, created_at, updated_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  return (
    <ProfilePage
      email={userData.user.email ?? "Keine E-Mail-Adresse verfügbar"}
      initialProfile={(data as ProfileRecord | null) ?? null}
      initialError={
        error
          ? "Dein Profil konnte gerade nicht geladen werden."
          : !data
            ? "Zu deinem Konto wurde kein Profil gefunden."
            : null
      }
    />
  );
}

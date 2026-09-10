import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Registrieren | Lernapp" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <AuthShell><AuthForm mode="register" next={params.next} /></AuthShell>;
}

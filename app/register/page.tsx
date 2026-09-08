import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create account | Lernapp" };

export default function RegisterPage() {
  return <AuthShell><AuthForm mode="register" /></AuthShell>;
}

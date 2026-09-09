"use client";
import { usePathname } from "next/navigation";
import s from "./dashboard.module.css";
const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/courses": "Kurse",
  "/calendar": "Kalender",
  "/documents": "Unterlagen",
  "/flashcards": "Karteikarten",
  "/summaries": "Zusammenfassungen",
  "/grades": "Noten",
};
export default function Topbar() {
  const path = usePathname();
  return (
    <header className={s.topbar}>
      <div>
        <span>Dein Studienraum / </span>
        <strong>{labels[path] ?? "Lernapp"}</strong>
      </div>
      <small>Design-Vorschau</small>
    </header>
  );
}

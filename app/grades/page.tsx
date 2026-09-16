import type { Metadata } from "next";
import GradesWorkspace from "@/components/grades/GradesWorkspace";

export const metadata: Metadata = {
  title: "Noten | Lernapp",
  description: "Kursleistungen, offene Bewertungen und Zielnoten im Überblick.",
};

export default function GradesPage() {
  return <GradesWorkspace />;
}

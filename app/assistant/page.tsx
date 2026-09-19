import type { Metadata } from "next";
import AssistantWorkspace from "@/components/assistant/AssistantWorkspace";
export const metadata: Metadata = { title: "KI-Assistent | Lernapp", description: "Dein Lernraum f?r Kursunterlagen, Fragen und Antworten mit Quellen." };
export default function AssistantPage() { return <AssistantWorkspace />; }

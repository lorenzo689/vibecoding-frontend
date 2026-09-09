import type { Metadata } from "next";
import CalendarPreview from "@/components/calendar/CalendarPreview";

export const metadata: Metadata = {
  title: "Kalender | Lernapp",
  description: "Vorlesungen, Lernzeit und wichtige Termine im Studienkontext.",
};

export default function CalendarPage() {
  return <CalendarPreview />;
}

export type SummaryStatus = "ready" | "processing" | "queued" | "failed";

export type SummaryPreview = {
  id: string;
  title: string;
  course: string;
  lecture: string;
  document: string;
  pages: number;
  unit: "Folien" | "Seiten";
  updated: string;
  status: SummaryStatus;
  statusDetail: string;
  processed?: number;
};

// Illustrative UI fixtures only; these do not describe a backend contract.
export const summaries: SummaryPreview[] = [
  {
    id: "vibe-coding",
    title: "Vibe Coding Setup",
    course: "Neue Konzepte",
    lecture: "Lecture 03",
    document: "Vibe Coding Setup.pdf",
    pages: 18,
    unit: "Folien",
    updated: "2026-10-12",
    status: "ready",
    statusDetail: "KI-Beispiel · Lesebereit",
  },
  {
    id: "network-security",
    title: "Network Security",
    course: "IT Security",
    lecture: "Lecture 08",
    document: "Network Security.pdf",
    pages: 24,
    unit: "Folien",
    updated: "2026-10-12",
    status: "processing",
    statusDetail: "8 von 24 Seiten verarbeitet · Beispielstand",
    processed: 8,
  },
  {
    id: "threat-modeling",
    title: "Threat Modeling",
    course: "Advanced Practical IT Security",
    lecture: "Lab 04",
    document: "Threat Modeling Lab.pdf",
    pages: 12,
    unit: "Seiten",
    updated: "2026-10-12",
    status: "queued",
    statusDetail: "Wartet auf Verarbeitung · Beispielstand",
  },
  {
    id: "software-foundations",
    title: "Software Foundations",
    course: "Neue Konzepte",
    lecture: "Lecture 02",
    document: "Software Foundations.pdf",
    pages: 16,
    unit: "Folien",
    updated: "2026-10-08",
    status: "failed",
    statusDetail: "Erstellung konnte nicht abgeschlossen werden",
  },
];

export const statusLabels: Record<SummaryStatus, string> = {
  ready: "Bereit",
  processing: "Wird erstellt",
  queued: "In Warteschlange",
  failed: "Fehlgeschlagen",
};

export function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

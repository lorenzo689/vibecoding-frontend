import type { Course } from "./calculations";

// Illustrative, independent grading scenarios; not real student records.
export const courses: Course[] = [
  {
    id: "nk", name: "Neue Konzepte",
    assessments: [
      { name: "Präsentation", weight: 30, grade: 2, date: "2026-11-18", state: "graded" },
      { name: "Projektdokumentation", weight: 20, grade: 1.7, date: "2026-12-04", state: "graded" },
      { name: "Klausur", weight: 50, grade: null, date: "2027-02-12", state: "planned" },
    ],
  },
  {
    id: "is", name: "IT Security",
    assessments: [
      { name: "Klausur · Network Security", weight: 70, grade: 2.3, date: "2026-10-24", state: "graded" },
      { name: "Übungsportfolio", weight: 30, grade: 1.7, date: "2026-10-28", state: "graded" },
    ],
  },
  {
    id: "ap", name: "Advanced Practical IT Security",
    assessments: [
      { name: "Laborbericht · Threat Modeling", weight: 40, grade: null, date: "2027-01-08", state: "submitted" },
      { name: "Praktische Prüfung", weight: 60, grade: null, date: "2027-02-19", state: "planned" },
    ],
  },
];

export const targetCourse = courses[0];
export const statusLabels = {
  complete: "Vollständig bewertet",
  partial: "Teilweise bewertet",
  ungraded: "Noch unbewertet",
} as const;

export function formatDate(date: string) {
  return date.split("-").reverse().join(".");
}

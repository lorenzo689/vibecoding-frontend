export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
};

// Illustrative UI fixtures only; these do not describe a backend contract.
export const conversation: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    text: "Kannst du mir Vibe Coding aus Lecture 03 nochmal kurz erklären?",
  },
  {
    id: "m2",
    role: "assistant",
    text: "Vibe Coding beschreibt eine Arbeitsweise, bei der Software über natürliche Sprache und kurze Feedbackschleifen mit einem Coding-Assistenten entwickelt wird. Entscheidend ist, Ziele, Kontext und Qualitätsanforderungen klar zu formulieren.",
    source: "Neue Konzepte · Lecture 03 · Folien 3–4",
  },
  {
    id: "m3",
    role: "user",
    text: "Erstelle mir dazu 3 Karteikarten.",
  },
  {
    id: "m4",
    role: "assistant",
    text: "3 Karteikarten wurden aus Lecture 03 vorbereitet: „Was ist ein Prompt?“, „Was ist eine Feedbackschleife?“ und „Warum kleine Schritte?“. Du findest sie danach bei deinen Karteikarten.",
    source: "Neue Konzepte · Lecture 03",
  },
];

export const suggestedPrompts: string[] = [
  "Erkläre mir Vibe Coding nochmal",
  "Erstelle 5 Karteikarten zu Lecture 03",
  "Welche Termine habe ich diese Woche?",
  "Fasse Network Security in 3 Sätzen zusammen",
];

// Derives a per-course study plan from persistent review state and confirmed exam dates.
// Pure and deterministic: nothing here is stored, it is recomputed from the real data.

export type PlanCard = { courseId: string; dueAt: string | null; known: boolean | null };
export type PlanExam = { courseId: string | null; title: string; startsAt: string };
export type PlanCourse = { id: string; title: string };

export type CoursePlan = {
  courseId: string;
  courseTitle: string;
  dueCards: number;
  weakCards: number;
  reviewedCards: number;
  nextExam: { title: string; startsAt: string; daysLeft: number } | null;
  /** Suggested number of cards to review today to be through the due cards by the exam. */
  focus: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildStudyPlan(courses: PlanCourse[], cards: PlanCard[], exams: PlanExam[], now = new Date()): CoursePlan[] {
  const plans = courses.map((course): CoursePlan => {
    const own = cards.filter((card) => card.courseId === course.id);
    const dueCards = own.filter((card) => card.dueAt !== null && new Date(card.dueAt).getTime() <= now.getTime()).length;
    const weakCards = own.filter((card) => card.known === false).length;
    const upcoming = exams
      .filter((exam) => exam.courseId === course.id && new Date(exam.startsAt).getTime() >= now.getTime() - DAY_MS)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    const nextExam = upcoming
      ? { title: upcoming.title, startsAt: upcoming.startsAt, daysLeft: Math.max(0, Math.ceil((new Date(upcoming.startsAt).getTime() - now.getTime()) / DAY_MS)) }
      : null;
    return { courseId: course.id, courseTitle: course.title, dueCards, weakCards, reviewedCards: own.length, nextExam, focus: describeFocus(dueCards, weakCards, nextExam?.daysLeft ?? null) };
  });
  // Soonest exam first, then the most due cards; courses with nothing to do go last.
  return plans
    .filter((plan) => plan.dueCards > 0 || plan.weakCards > 0 || plan.nextExam)
    .sort((a, b) => (a.nextExam?.daysLeft ?? Infinity) - (b.nextExam?.daysLeft ?? Infinity) || b.dueCards - a.dueCards || a.courseTitle.localeCompare(b.courseTitle));
}

export function describeFocus(dueCards: number, weakCards: number, daysLeft: number | null): string {
  if (dueCards > 0 && daysLeft !== null && daysLeft > 0) {
    const perDay = Math.ceil(dueCards / daysLeft);
    return `${dueCards} fällige Karten – ca. ${perDay} pro Tag bis zur Prüfung.`;
  }
  if (dueCards > 0) return `${dueCards} Karten sind heute fällig.`;
  if (weakCards > 0) return `${weakCards} Karten sitzen noch nicht – gezielt wiederholen.`;
  if (daysLeft !== null) return "Keine fälligen Karten. Material und Zusammenfassung durchgehen.";
  return "Alles auf dem Stand.";
}

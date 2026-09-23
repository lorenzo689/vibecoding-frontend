import type { Metadata } from "next";
import CourseDocuments from "@/components/courses/CourseDocuments";

export const metadata: Metadata = {
  title: "Unterlagen | Lernapp",
  description: "Vorlesungsmaterial für diesen Kurs verwalten und hochladen.",
};

export default async function CourseDocumentsPage(
  props: PageProps<"/courses/[courseId]/documents">
) {
  const { courseId } = await props.params;
  return <CourseDocuments courseId={courseId} />;
}

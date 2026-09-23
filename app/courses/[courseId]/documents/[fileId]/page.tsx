import type { Metadata } from "next";
import CourseDocumentDetail from "@/components/courses/CourseDocumentDetail";

export const metadata: Metadata = {
  title: "Dokument | Lernapp",
  description: "Einzelansicht eines hochgeladenen Dokuments.",
};

export default async function CourseDocumentDetailPage(
  props: PageProps<"/courses/[courseId]/documents/[fileId]">
) {
  const { courseId, fileId } = await props.params;
  return <CourseDocumentDetail courseId={courseId} fileId={fileId} />;
}

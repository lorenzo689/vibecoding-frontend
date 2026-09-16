"use client";

import { useEffect, useState } from "react";
import {
  listCourseAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  type Assessment,
  type AssessmentInput,
} from "@/lib/supabase/queries/grades";
import { courseGradeSummary, formatGrade, formatEcts } from "./calculations";
import AssessmentDialog from "./AssessmentDialog";
import TargetCalculator from "./TargetCalculator";
import shared from "@/components/dashboard.module.css";
import s from "./grades.module.css";

export const KIND_LABELS: Record<Assessment["kind"], string> = {
  exam: "Klausur",
  presentation: "Präsentation",
  assignment: "Abgabe",
  project: "Projekt",
  exercise: "Übung",
  oral_exam: "Mündliche Prüfung",
  other: "Sonstiges",
};

export const STATUS_LABELS: Record<Assessment["status"], string> = {
  planned: "Geplant",
  submitted: "Eingereicht",
  graded: "Bewertet",
};

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Undated assessments sort after dated ones; ties broken by creation order,
// which listCourseAssessments already guarantees via its second order clause.
function sortKey(item: Assessment): string {
  return item.assessmentDate ?? "9999-99-99";
}

export default function CourseAssessments({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function fetchAssessments() {
    return listCourseAssessments(courseId)
      .then(setAssessments)
      .catch(() => {
        setError("Die Prüfungsleistungen konnten nicht geladen werden. Bitte versuche es erneut.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function loadAssessments() {
    setLoading(true);
    setError(null);
    fetchAssessments();
  }

  useEffect(() => {
    fetchAssessments();
    // courseId is fixed for the lifetime of this component (parent remounts
    // it via `key` on course switch), so this only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = courseGradeSummary(assessments);
  const sorted = [...assessments].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  async function handleCreate(input: AssessmentInput) {
    setActionError(null);
    try {
      const created = await createAssessment(courseId, input);
      setAssessments((prev) => [...prev, created]);
      setDialogOpen(false);
      setStatusMessage(`„${created.title}“ wurde angelegt.`);
    } catch {
      setActionError("Die Prüfungsleistung konnte nicht angelegt werden.");
      throw new Error("create-assessment-failed");
    }
  }

  async function handleUpdate(input: AssessmentInput) {
    if (!editingAssessment) return;
    setActionError(null);
    try {
      const updated = await updateAssessment(editingAssessment.id, input);
      setAssessments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingAssessment(undefined);
      setStatusMessage(`„${updated.title}“ wurde aktualisiert.`);
    } catch {
      setActionError("Die Änderungen konnten nicht gespeichert werden.");
      throw new Error("update-assessment-failed");
    }
  }

  async function handleDelete(assessment: Assessment) {
    if (!window.confirm(`„${assessment.title}“ wirklich löschen?`)) return;
    setDeletingId(assessment.id);
    setActionError(null);
    try {
      await deleteAssessment(assessment.id);
      setAssessments((prev) => prev.filter((item) => item.id !== assessment.id));
      setStatusMessage(`„${assessment.title}“ wurde gelöscht.`);
    } catch {
      setActionError(`„${assessment.title}“ konnte nicht gelöscht werden.`);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p aria-live="polite" className={s.loading}>Prüfungsleistungen werden geladen …</p>;
  }

  if (error && assessments.length === 0) {
    return (
      <div className={s.empty} role="alert">
        <h2>Prüfungsleistungen nicht verfügbar</h2>
        <p>{error}</p>
        <button type="button" className={s.createButton} onClick={loadAssessments}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <>
      <section className={s.overview} aria-label={`ECTS-Übersicht für ${courseName}`}>
        <dl>
          <div><dt>PRÜFUNGSLEISTUNGEN</dt><dd>{assessments.length}</dd></div>
          <div><dt>ERFASSTE ECTS</dt><dd>{formatEcts(summary.totalEcts)}</dd></div>
          <div><dt>BEWERTET</dt><dd>{formatEcts(summary.gradedEcts)} <span>ECTS</span></dd></div>
          <div><dt>OFFEN</dt><dd>{formatEcts(summary.openEcts)} <span>ECTS</span></dd></div>
          <div>
            <dt>ECTS-GEWICHTETER ZWISCHENSTAND</dt>
            <dd>{summary.average === null ? "—" : `≈ ${formatGrade(summary.average)}`}</dd>
          </div>
        </dl>
        <p>
          {summary.average === null
            ? "Noch keine bewertete Leistung."
            : "Der Zwischenstand berücksichtigt nur bereits bewertete Leistungen (nicht bewertete ECTS fließen nicht ein) und ist keine offizielle Hochschulnote."}
        </p>
      </section>

      {actionError && <p className={shared.notice} role="alert">{actionError}</p>}
      <p role="status" aria-live="polite" className={s.visuallyHidden}>{statusMessage}</p>

      <div className={s.layout}>
        <div>
          <div className={shared.sectionHeader}>
            <h2 id="assessments-heading">Prüfungsleistungen</h2>
            <button type="button" className={s.createButton} onClick={() => setDialogOpen(true)}>+ Prüfungsleistung</button>
          </div>

          {sorted.length === 0 ? (
            <p className={s.empty}>Für diesen Kurs sind noch keine Prüfungsleistungen erfasst.</p>
          ) : (
            <ul className={s.assessments} aria-labelledby="assessments-heading">
              {sorted.map((item) => (
                <li key={item.id}>
                  <div>
                    <span className={s.kindTag}>{KIND_LABELS[item.kind]}</span>
                    <h4>{item.title}</h4>
                    <p>
                      <span className={s.status} data-status={item.status === "graded" ? "complete" : item.status === "submitted" ? "partial" : "ungraded"}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      {item.assessmentDate && <> · <time dateTime={item.assessmentDate}>{formatDate(item.assessmentDate)}</time></>}
                    </p>
                    {(item.pointsEarned !== null && item.pointsMax !== null) && (
                      <small>{formatGrade(item.pointsEarned)} von {formatGrade(item.pointsMax)} Punkten</small>
                    )}
                    {item.notes && <small>{item.notes}</small>}
                  </div>
                  <div className={s.assessmentGrade}>
                    <strong>{item.grade === null ? "Noch nicht bewertet" : formatGrade(item.grade)}</strong>
                    <span>{formatEcts(item.ectsCredits)} ECTS</span>
                  </div>
                  <div className={s.assessmentActions}>
                    <button type="button" onClick={() => setEditingAssessment(item)} disabled={deletingId === item.id}>Bearbeiten</button>
                    <button type="button" className={s.dangerAction} onClick={() => handleDelete(item)} disabled={deletingId === item.id}>
                      {deletingId === item.id ? "Wird gelöscht …" : "Löschen"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <TargetCalculator courseName={courseName} assessments={assessments} />
      </div>

      {dialogOpen && (
        <AssessmentDialog onClose={() => setDialogOpen(false)} onSave={handleCreate} />
      )}
      {editingAssessment && (
        <AssessmentDialog initial={editingAssessment} onClose={() => setEditingAssessment(undefined)} onSave={handleUpdate} />
      )}
    </>
  );
}

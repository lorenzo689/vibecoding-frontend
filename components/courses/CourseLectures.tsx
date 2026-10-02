"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  assignMaterialLecture,
  createLecture,
  deleteLecture,
  listLectures,
  listMaterialLectures,
  updateLecture,
  type Lecture,
} from "@/lib/supabase/queries/lectures";
import styles from "./lectures.module.css";

export type LectureDocument = { materialId: string; fileId: string; name: string };

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Course → lecture → document: lectures of a course and the assignment of its documents to them. */
export default function CourseLectures({ courseId, documents }: { courseId: string; documents: LectureDocument[] }) {
  const [lectures, setLectures] = useState<Lecture[] | null>(null);
  const [assignment, setAssignment] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listLectures(courseId), listMaterialLectures(courseId)])
      .then(([nextLectures, nextAssignment]) => {
        if (!active) return;
        setLectures(nextLectures);
        setAssignment(nextAssignment);
      })
      .catch(() => { if (active) setError("Die Vorlesungen konnten nicht geladen werden."); });
    return () => { active = false; };
  }, [courseId]);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try { await action(); } catch { setError(failure); } finally { setBusy(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    const input = { title, heldOn: heldOn || null };
    void run(async () => {
      if (editingId) {
        const saved = await updateLecture(editingId, input);
        setLectures((current) => (current ?? []).map((lecture) => lecture.id === saved.id ? saved : lecture));
      } else {
        const created = await createLecture(courseId, input);
        setLectures((current) => [...(current ?? []), created]);
      }
      setTitle(""); setHeldOn(""); setEditingId(null);
    }, editingId ? "Die Vorlesung konnte nicht gespeichert werden." : "Die Vorlesung konnte nicht angelegt werden.");
  }

  function remove(lecture: Lecture) {
    if (!window.confirm(`Vorlesung „${lecture.title}“ löschen? Die Dokumente bleiben erhalten.`)) return;
    void run(async () => {
      await deleteLecture(lecture.id);
      setLectures((current) => (current ?? []).filter((item) => item.id !== lecture.id));
      setAssignment((current) => new Map([...current].filter(([, lectureId]) => lectureId !== lecture.id)));
    }, "Die Vorlesung konnte nicht gelöscht werden.");
  }

  function assign(materialId: string, lectureId: string) {
    void run(async () => {
      await assignMaterialLecture(materialId, lectureId || null);
      setAssignment((current) => {
        const next = new Map(current);
        if (lectureId) next.set(materialId, lectureId); else next.delete(materialId);
        return next;
      });
    }, "Die Zuordnung konnte nicht gespeichert werden.");
  }

  if (lectures === null && !error) return null;
  const groups = [...(lectures ?? []).map((lecture) => ({ lecture, docs: documents.filter((doc) => assignment.get(doc.materialId) === lecture.id) })),
    { lecture: null, docs: documents.filter((doc) => !assignment.has(doc.materialId)) }];

  return (
    <section className={styles.section} aria-labelledby="lectures-heading">
      <h2 id="lectures-heading">Vorlesungen<span className={styles.count}>{lectures?.length ?? 0}</span></h2>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor="lecture-title" className={styles.srOnly}>Titel der Vorlesung</label>
        <input id="lecture-title" value={title} maxLength={200} placeholder="z. B. Vorlesung 3 – Graphen" disabled={busy}
          onChange={(event) => setTitle(event.target.value)} required />
        <label htmlFor="lecture-date" className={styles.srOnly}>Datum der Vorlesung</label>
        <input id="lecture-date" type="date" value={heldOn} disabled={busy} onChange={(event) => setHeldOn(event.target.value)} />
        <button type="submit" disabled={busy || !title.trim()}>{editingId ? "Speichern" : "Vorlesung anlegen"}</button>
        {editingId && <button type="button" className={styles.ghost} onClick={() => { setEditingId(null); setTitle(""); setHeldOn(""); }}>Abbrechen</button>}
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {documents.length > 0 || (lectures?.length ?? 0) > 0 ? (
        <ul className={styles.list}>
          {groups.map(({ lecture, docs }) => (lecture || docs.length > 0) && (
            <li key={lecture?.id ?? "unassigned"} className={styles.lecture}>
              <header>
                <h3>{lecture ? lecture.title : "Nicht zugeordnet"}</h3>
                {lecture?.heldOn && <time dateTime={lecture.heldOn}>{formatDate(lecture.heldOn)}</time>}
                {lecture && (
                  <span className={styles.actions}>
                    <button type="button" disabled={busy} onClick={() => { setEditingId(lecture.id); setTitle(lecture.title); setHeldOn(lecture.heldOn ?? ""); }}>Bearbeiten</button>
                    <button type="button" disabled={busy} onClick={() => remove(lecture)}>Löschen</button>
                  </span>
                )}
              </header>
              {docs.length === 0 ? <p className={styles.muted}>Noch keine Dokumente zugeordnet.</p> : (
                <ul className={styles.docs}>
                  {docs.map((doc) => (
                    <li key={doc.materialId}>
                      <Link href={`/courses/${courseId}/documents/${doc.fileId}`}>{doc.name}</Link>
                      <select aria-label={`Vorlesung für ${doc.name}`} value={assignment.get(doc.materialId) ?? ""} disabled={busy}
                        onChange={(event) => assign(doc.materialId, event.target.value)}>
                        <option value="">Keine Vorlesung</option>
                        {(lectures ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : <p className={styles.muted}>Lege Vorlesungen an und ordne deine Dokumente zu, damit Folien und Notizen ihrem Vorlesungstermin zugeordnet bleiben.</p>}
    </section>
  );
}

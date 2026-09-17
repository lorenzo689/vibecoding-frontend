// Maps the backend document pipeline onto one progress indicator per file.
//
// The backend (see ../lernapp_backend/docs/documents.md and docs/rag.md) runs
// two independent stages after an upload is confirmed:
//
//   files.status            pending -> ready
//   source_documents.processing_status   uploaded -> processing -> ready|failed
//   source_documents.indexing_status     pending  -> processing -> ready|failed
//
// Only `indexing_status = ready` means the document is searchable. The exact
// chunk cursor lives in `document_indexing_jobs`, which is service-role only,
// so the percentages below are stage milestones, not a chunk count.

export type FileProgressStatus = "unverified" | "pending" | "ready" | "failed" | "deleting";
export type ProcessingStatus = "uploaded" | "processing" | "ready" | "failed";
export type IndexingStatus = "pending" | "processing" | "ready" | "failed";

export type DocumentPipelineState = {
  processingStatus: ProcessingStatus;
  errorCode: string | null;
  indexingStatus: IndexingStatus;
  indexingError: string | null;
};

export type IndexingTone = "pending" | "active" | "ready" | "failed";

export type IndexingProgress = {
  /** "pending" while nothing is running yet, "active" while a worker is busy. */
  tone: IndexingTone;
  /** Stage milestone in percent; 100 only when the document is searchable. */
  percent: number;
  label: string;
  /** Why it failed, when a public error code is available. */
  detail: string | null;
  /** True while the status can still change on its own and polling is useful. */
  inProgress: boolean;
};

const PROCESSING_ERRORS: Record<string, string> = {
  PROCESSING_FAILED: "Der Text konnte nicht ausgelesen werden.",
  PROCESSING_TIMEOUT: "Die Verarbeitung hat zu lange gedauert.",
  SOURCE_DELETED: "Die zugehörige Datei wurde gelöscht.",
  UNSUPPORTED_FORMAT: "Aus diesem Format wird derzeit kein Text ausgelesen (PDF und TXT werden unterstützt).",
  INVALID_DOCUMENT: "Die Datei ist beschädigt, passwortgeschützt oder zu umfangreich (max. 10 MiB, 100 Seiten).",
};

const INDEXING_ERRORS: Record<string, string> = {
  INDEXING_TIMEOUT: "Die Indexierung hat zu lange gedauert.",
  INVALID_INDEXING_INPUT: "Das Dokument konnte nicht indexiert werden.",
};

function failure(label: string, detail: string | null): IndexingProgress {
  return { tone: "failed", percent: 0, label, detail, inProgress: false };
}

/**
 * One status line per file row, covering upload verification, text extraction
 * and search indexing. `state` is null while no source document row exists yet.
 */
export function describeIndexingProgress(
  fileStatus: FileProgressStatus,
  state: DocumentPipelineState | null
): IndexingProgress {
  if (fileStatus === "failed") {
    return failure("Upload fehlgeschlagen", "Die Datei wurde nicht übernommen.");
  }
  if (fileStatus === "deleting") {
    return { tone: "pending", percent: 0, label: "Wird gelöscht …", detail: null, inProgress: false };
  }
  if (fileStatus === "unverified") {
    return {
      tone: "pending",
      percent: 5,
      label: "Ungeprüfter Altbestand",
      detail: "Diese Datei wurde nie bestätigt und wird nicht verarbeitet.",
      inProgress: false,
    };
  }
  if (fileStatus === "pending") {
    return { tone: "active", percent: 10, label: "Upload wird geprüft …", detail: null, inProgress: true };
  }

  if (!state) {
    return {
      tone: "pending",
      percent: 15,
      label: "Verarbeitung wird vorbereitet …",
      detail: null,
      inProgress: true,
    };
  }

  if (state.processingStatus === "failed") {
    return failure(
      "Textextraktion fehlgeschlagen",
      state.errorCode ? (PROCESSING_ERRORS[state.errorCode] ?? state.errorCode) : null
    );
  }
  if (state.processingStatus === "uploaded") {
    return {
      tone: "pending",
      percent: 25,
      label: "Hochgeladen – Verarbeitung ausstehend",
      detail: null,
      inProgress: true,
    };
  }
  if (state.processingStatus === "processing") {
    return { tone: "active", percent: 45, label: "Text wird ausgelesen …", detail: null, inProgress: true };
  }

  // Text extraction finished; the indexing stage decides searchability.
  if (state.indexingStatus === "failed") {
    return failure(
      "Indexierung fehlgeschlagen",
      state.indexingError ? (INDEXING_ERRORS[state.indexingError] ?? state.indexingError) : null
    );
  }
  if (state.indexingStatus === "pending") {
    return {
      tone: "pending",
      percent: 65,
      label: "Text erkannt – wartet auf Indexierung",
      detail: null,
      inProgress: true,
    };
  }
  if (state.indexingStatus === "processing") {
    return { tone: "active", percent: 85, label: "Wird indexiert …", detail: null, inProgress: true };
  }

  return {
    tone: "ready",
    percent: 100,
    label: "Indexiert – für Fragen nutzbar",
    detail: null,
    inProgress: false,
  };
}

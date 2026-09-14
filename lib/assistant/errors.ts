// Server-defined, stable error codes from the assistant-chat Edge Function.
// See backend/docs/assistant-chat.md and _shared/ai/cost.ts admission reasons.
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
  ORIGIN_NOT_ALLOWED: "Diese Umgebung ist für den Assistenten nicht freigegeben.",
  METHOD_NOT_ALLOWED: "Unerwartete Anfrage an den Assistenten.",
  SERVICE_UNAVAILABLE: "Der Assistent ist gerade nicht erreichbar. Versuch es später erneut.",
  CONVERSATION_NOT_FOUND: "Diese Unterhaltung ist nicht verfügbar.",
  INVALID_REQUEST: "Die Anfrage konnte nicht verarbeitet werden.",
  EMPTY_MESSAGE: "Bitte gib eine Frage ein.",
  REQUEST_TOO_LARGE: "Die Anfrage ist zu groß.",
  MESSAGE_TOO_LONG: "Deine Frage ist zu lang.",
  rate_limit: "Du stellst gerade zu viele Fragen. Warte kurz und versuch es erneut.",
  concurrency_limit: "Es läuft noch eine Antwort. Warte, bis sie fertig ist.",
  question_length_limit: "Deine Frage ist zu lang.",
  history_message_limit: "Diese Unterhaltung ist zu lang geworden.",
  history_token_limit: "Diese Unterhaltung ist zu lang geworden.",
  request_cost_limit: "Diese Anfrage würde das Kostenlimit überschreiten.",
  user_monthly_budget: "Du hast dein monatliches KI-Budget aufgebraucht.",
  project_monthly_budget: "Das monatliche KI-Budget ist aktuell aufgebraucht.",
  invalid_citation: "Der Assistent konnte keine verlässliche Antwort erzeugen.",
  invalid_embedding_response: "Der Assistent konnte die Frage gerade nicht verarbeiten.",
  invalid_stream_event: "Der Assistent hat eine unerwartete Antwort gesendet.",
  incomplete_stream_response: "Der Assistent konnte keine vollständige Antwort erzeugen.",
  incomplete_provider_response: "Der Assistent konnte keine vollständige Antwort erzeugen.",
  provider_http_error: "Der KI-Anbieter ist gerade nicht erreichbar. Versuch es später erneut.",
  response_too_large: "Die Antwort wurde zu lang und wurde abgebrochen.",
  request_cancelled: "Anfrage abgebrochen.",
  database_error: "Ein technisches Problem ist aufgetreten.",
  provider_response_failed: "Der KI-Anbieter konnte keine Antwort liefern.",
  chat_processing_failed: "Der Assistent konnte die Anfrage nicht verarbeiten.",
};

export function assistantErrorMessage(code: string): string {
  return MESSAGES[code] ?? "Etwas ist schiefgelaufen. Versuch es erneut.";
}

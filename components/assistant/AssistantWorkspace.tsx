"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listCourses, type Course } from "@/lib/supabase/queries/courses";
import {
  createConversation,
  deleteConversation,
  listConversations,
  loadMessages,
  renameConversation,
  type ChatMessageRecord,
  type Conversation,
} from "@/lib/supabase/queries/chat";
import { streamAssistantChat, ChatRequestError } from "@/lib/assistant/chat-client";
import { assistantErrorMessage } from "@/lib/assistant/errors";
import { suggestedPrompts } from "./examples";
import s from "./assistant.module.css";

const MAX_QUESTION_CHARACTERS = 4000;

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: ChatMessageRecord["status"] | "sending";
  errorCode: string | null;
  sources: ChatMessageRecord["sources"];
};

function toDisplayMessage(message: ChatMessageRecord): DisplayMessage {
  return { ...message };
}

export default function AssistantWorkspace() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoadedFor, setConversationsLoadedFor] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [messagesLoadedFor, setMessagesLoadedFor] = useState<string | null>(null);

  const [composerText, setComposerText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const conversationsLoading = selectedCourseId !== null && conversationsLoadedFor !== selectedCourseId;
  const messagesLoading =
    selectedConversationId !== null && !isStreaming && messagesLoadedFor !== selectedConversationId;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCourses()
      .then((data) => {
        if (cancelled) return;
        setCourses(data);
        setSelectedCourseId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCoursesError(error instanceof Error ? error.message : "Kurse konnten nicht geladen werden.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    let cancelled = false;
    listConversations(selectedCourseId)
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
        setSelectedConversationId(data[0]?.id ?? null);
        if (data.length === 0) setMessages([]);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setBanner(error instanceof Error ? error.message : "Unterhaltungen konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) setConversationsLoadedFor(selectedCourseId);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    // Skip while a send is in flight: the optimistic/streaming messages for
    // this conversation are ahead of what is persisted so far. Once streaming
    // ends this effect re-runs (isStreaming is a dependency) and reconciles
    // with the authoritative, persisted message list.
    if (!selectedConversationId || isStreaming) return;
    let cancelled = false;
    loadMessages(selectedConversationId)
      .then((data) => {
        if (cancelled) return;
        setMessages(data.map(toDisplayMessage));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setBanner(error instanceof Error ? error.message : "Nachrichten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) setMessagesLoadedFor(selectedConversationId);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const selectedCourse = useMemo(
    () => courses?.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  async function handleNewConversation() {
    if (!selectedCourseId) return;
    try {
      const created = await createConversation(selectedCourseId);
      setConversations((current) => [created, ...current]);
      setSelectedConversationId(created.id);
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unterhaltung konnte nicht erstellt werden.");
    }
  }

  async function handleDeleteConversation(id: string) {
    if (!window.confirm("Diese Unterhaltung wirklich löschen?")) return;
    try {
      await deleteConversation(id);
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      if (selectedConversationId === id) {
        const remaining = conversations.filter((conversation) => conversation.id !== id);
        setSelectedConversationId(remaining[0]?.id ?? null);
        if (remaining.length === 0) setMessages([]);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unterhaltung konnte nicht gelöscht werden.");
    }
  }

  async function commitRename(id: string) {
    const title = renamingValue.trim();
    setRenamingId(null);
    if (!title) return;
    try {
      await renameConversation(id, title);
      setConversations((current) =>
        current.map((conversation) => (conversation.id === id ? { ...conversation, title } : conversation))
      );
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Umbenennen fehlgeschlagen.");
    }
  }

  function updateLastAssistantMessage(updater: (message: DisplayMessage) => DisplayMessage) {
    setMessages((current) => {
      const next = [...current];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === "assistant") {
          next[i] = updater(next[i]);
          break;
        }
      }
      return next;
    });
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? composerText).trim();
    if (!text || isStreaming || !selectedCourseId) return;
    if (text.length > MAX_QUESTION_CHARACTERS) {
      setBanner(`Deine Frage darf höchstens ${MAX_QUESTION_CHARACTERS} Zeichen lang sein.`);
      return;
    }

    setBanner(null);
    let conversationId = selectedConversationId;
    if (!conversationId) {
      try {
        const created = await createConversation(selectedCourseId, text.slice(0, 60));
        setConversations((current) => [created, ...current]);
        conversationId = created.id;
        setSelectedConversationId(created.id);
      } catch (error) {
        setBanner(error instanceof Error ? error.message : "Unterhaltung konnte nicht erstellt werden.");
        return;
      }
    }

    setComposerText("");
    setIsStreaming(true);

    const tempUserId = `pending-user-${crypto.randomUUID()}`;
    const tempAssistantId = `pending-assistant-${crypto.randomUUID()}`;
    setMessages((current) => [
      ...current,
      { id: tempUserId, role: "user", content: text, status: "completed", errorCode: null, sources: [] },
      { id: tempAssistantId, role: "assistant", content: "", status: "streaming", errorCode: null, sources: [] },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAssistantChat(
        { conversationId, courseId: selectedCourseId, message: text },
        {
          onReady: ({ userMessageId, assistantMessageId }) => {
            setMessages((current) =>
              current.map((message) => {
                if (message.id === tempUserId) return { ...message, id: userMessageId };
                if (message.id === tempAssistantId) return { ...message, id: assistantMessageId };
                return message;
              })
            );
          },
          onDelta: (delta) => {
            updateLastAssistantMessage((message) => ({ ...message, content: message.content + delta }));
          },
          onSources: (sources) => {
            updateLastAssistantMessage((message) => ({
              ...message,
              sources: sources.map((source, index) => ({
                id: `${source.chunkId ?? "snapshot"}-${index}`,
                chunkId: source.chunkId,
                rank: source.rank,
                similarity: source.similarity,
                quotedExcerpt: source.quotedExcerpt,
                pageNumber: source.pageNumber,
              })),
            }));
          },
          onDone: () => {
            updateLastAssistantMessage((message) => ({ ...message, status: "completed" }));
            setConversations((current) =>
              [...current]
                .map((conversation) =>
                  conversation.id === conversationId
                    ? { ...conversation, updatedAt: new Date().toISOString() }
                    : conversation
                )
                .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
            );
          },
          onError: (code) => {
            updateLastAssistantMessage((message) => ({ ...message, status: "failed", errorCode: code }));
            setBanner(assistantErrorMessage(code));
          },
        },
        controller.signal
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        updateLastAssistantMessage((message) => ({ ...message, status: "cancelled" }));
      } else {
        const code = error instanceof ChatRequestError ? error.code : "SERVICE_UNAVAILABLE";
        setMessages((current) => current.filter((message) => message.id !== tempAssistantId));
        setBanner(assistantErrorMessage(code));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  if (coursesError) {
    return (
      <div className={s.workspace}>
        <p className={s.composerNote}>{coursesError}</p>
      </div>
    );
  }

  if (!courses) {
    return (
      <div className={s.workspace}>
        <p className={s.composerNote}>Kurse werden geladen …</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={s.workspace}>
        <p className={s.composerNote}>
          Du hast noch keine Kurse angelegt. Erstelle zuerst einen Kurs, um den Assistenten zu nutzen.
        </p>
      </div>
    );
  }

  return (
    <div className={s.workspace}>
      <div className={s.contextBar}>
        <label htmlFor="assistant-context">Kontext</label>
        <select
          id="assistant-context"
          value={selectedCourseId ?? ""}
          onChange={(event) => setSelectedCourseId(event.target.value)}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <span className={s.contextNote}>Der Assistent antwortet mit Bezug zu diesem Kurs.</span>
      </div>

      <div className={s.layout}>
        <aside className={s.sidebar}>
          <button type="button" className={s.newConversationButton} onClick={handleNewConversation}>
            + Neuer Chat
          </button>
          {conversationsLoading && <p className={s.composerNote}>Unterhaltungen werden geladen …</p>}
          <ul className={s.conversationList}>
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div
                  className={s.conversationItem}
                  data-active={conversation.id === selectedConversationId}
                >
                  {renamingId === conversation.id ? (
                    <input
                      className={s.conversationRenameInput}
                      autoFocus
                      value={renamingValue}
                      onChange={(event) => setRenamingValue(event.target.value)}
                      onBlur={() => commitRename(conversation.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename(conversation.id);
                        if (event.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className={s.conversationTitle}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      onDoubleClick={() => {
                        setRenamingId(conversation.id);
                        setRenamingValue(conversation.title);
                      }}
                      title="Doppelklick zum Umbenennen"
                    >
                      {conversation.title}
                    </button>
                  )}
                  <button
                    type="button"
                    className={s.conversationDelete}
                    aria-label="Unterhaltung löschen"
                    onClick={() => handleDeleteConversation(conversation.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
            {!conversationsLoading && conversations.length === 0 && (
              <li className={s.composerNote}>Noch keine Unterhaltung in diesem Kurs.</li>
            )}
          </ul>
        </aside>

        <div className={s.chatColumn}>
          {banner && (
            <div className={s.banner} role="alert">
              <span>{banner}</span>
              <button type="button" onClick={() => setBanner(null)} aria-label="Hinweis schließen">
                ×
              </button>
            </div>
          )}

          <ul className={s.messages}>
            {messagesLoading && <li className={s.composerNote}>Nachrichten werden geladen …</li>}
            {!messagesLoading && messages.length === 0 && (
              <li className={s.composerNote}>
                Stell {selectedCourse ? `zu „${selectedCourse.title}“` : ""} deine erste Frage.
              </li>
            )}
            {messages.map((message) => (
              <li key={message.id} className={s.messageRow} data-role={message.role}>
                <div className={s.bubble} data-status={message.status}>
                  {message.role === "assistant" && (
                    <div className={s.assistantMeta}>
                      KI-GENERIERT
                      {message.status === "streaming" && <span className={s.typingDot} />}
                    </div>
                  )}
                  <p>
                    {message.content || (message.status === "streaming" ? "…" : "")}
                  </p>
                  {message.status === "failed" && (
                    <span className={s.errorChip}>
                      {assistantErrorMessage(message.errorCode ?? "")}
                    </span>
                  )}
                  {message.sources.map((source) => (
                    <span key={source.id} className={s.sourceChip}>
                      Quelle {source.rank}
                      {source.pageNumber ? ` · Seite ${source.pageNumber}` : ""}
                    </span>
                  ))}
                </div>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>

          <div className={s.suggestions} role="group" aria-label="Vorgeschlagene Fragen">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={s.suggestionChip}
                disabled={isStreaming}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className={s.composer}>
            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              maxLength={MAX_QUESTION_CHARACTERS}
              disabled={isStreaming}
              placeholder="Frag deinen KI-Assistenten …"
              aria-describedby="assistant-composer-note"
            />
            {isStreaming ? (
              <button type="button" className={s.sendButton} onClick={handleStop}>
                Stopp
              </button>
            ) : (
              <button
                type="button"
                className={s.sendButton}
                disabled={!composerText.trim()}
                onClick={() => handleSend()}
              >
                Senden
              </button>
            )}
          </div>
          <p id="assistant-composer-note" className={s.composerNote}>
            {composerText.length}/{MAX_QUESTION_CHARACTERS} Zeichen
          </p>
        </div>
      </div>
    </div>
  );
}

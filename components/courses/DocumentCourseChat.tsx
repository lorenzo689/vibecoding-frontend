"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { createConversation, loadConversations, loadHistoryPage, sendChat, sourceDocumentLinks } from "@/lib/chat";
import { ChatError, canDiscardRequest, mergeExchange, sendBlockedReason, withMaterialScope, type ChatMessage, type ChatRequest, type Conversation } from "@/lib/chatProtocol";
import { useAuthenticatedProfile } from "@/lib/auth/useAuthenticatedProfile";
import MessageFeedback from "@/components/chat/MessageFeedback";
import { useMessageFeedback } from "@/components/chat/useMessageFeedback";
import styles from "@/components/documents/documents.module.css";

function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

// Renders `inline code` spans from the model's answer as styled <code>.
function renderContent(content: string) {
  const parts = content.split(/(`[^`]+`)/g);
  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1
      ? <code key={index}>{part.slice(1, -1)}</code>
      : <Fragment key={index}>{part}</Fragment>
  );
}

// A document-specific conversation whose questions and retrieval are scoped to
// this material; the course assistant lists only unscoped conversations.
export default function DocumentCourseChat({ courseId, courseTitle, materialId }: { courseId: string; courseTitle: string; materialId: string }) {
  const { initial } = useAuthenticatedProfile();
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sourceLinks, setSourceLinks] = useState<Map<string, string>>(new Map());
  const feedback = useMessageFeedback(setMessages);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState<ChatRequest | null>(null);
  const [storageKey, setStorageKey] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const sendingRef = useRef(false);
  const alive = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const busy = loading || sending;
  const waitSeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const blockedReason = sendBlockedReason({ courseId, busy, pending: false, loadFailed, waitSeconds, question });

  function savePending(request: ChatRequest | null) {
    if (!storageKey) return;
    try { if (request) sessionStorage.setItem(storageKey, JSON.stringify(request)); else sessionStorage.removeItem(storageKey); }
    catch { /* In-memory request remains available. */ }
    setPending(request);
  }

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, sending]);
  useEffect(() => {
    let active = true;
    sourceDocumentLinks(createClient(), messages).then((links) => { if (active) setSourceLinks(links); }).catch(() => {});
    return () => { active = false; };
  }, [messages]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  useEffect(() => {
    let active = true;
    const client = createClient();
    client.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError || !data.user) throw authError ?? new Error("Nicht angemeldet");
      const key = `universe.document-chat.pending:${data.user.id}:${materialId}`;
      let restored: ChatRequest | null = null;
      try { restored = JSON.parse(sessionStorage.getItem(key) ?? "null") as ChatRequest | null; }
      catch { /* Damaged browser state is ignored. */ }
      if (restored?.material_ids?.[0] !== materialId) restored = null;
      const list = await loadConversations(client, courseId, materialId);
      return { key, restored, list };
    })
      .then(async ({ key, restored, list }) => {
        if (!active) return;
        setStorageKey(key);
        setConversations(list);
        const recoverable = restored && list.some((item) => item.id === restored.conversation_id) ? restored : null;
        if (restored && !recoverable) try { sessionStorage.removeItem(key); } catch { /* Optional cleanup. */ }
        const latest = list.find((item) => item.id === recoverable?.conversation_id) ?? list[0];
        if (!latest) return;
        setConversationId(latest.id);
        const { messages: history, hasOlder: older } = await loadHistoryPage(client, latest.id);
        if (!active) return;
        setMessages(history);
        setHasOlder(older);
        if (recoverable && !history.some((message) => message.role === "assistant" && message.request_id === recoverable.request_id)) {
          setPending(recoverable); setQuestion(recoverable.question);
        } else if (recoverable) {
          try { sessionStorage.removeItem(key); } catch { /* Optional cleanup. */ }
        }
      })
      .catch((failure) => { if (active) { setError(asChatError(failure)); setLoadFailed(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, materialId]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sendingRef.current || busy || loadFailed || waitSeconds > 0 || (!pending && blockedReason)) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    const askedQuestion = question.trim();
    try {
      const client = createClient();
      let id = conversationId;
      if (!id) {
        const conversation = await createConversation(client, courseId, materialId);
        if (!alive.current) return;
        id = conversation.id;
        setConversationId(id);
        setConversations((current) => [conversation, ...current]);
      }
      const request: ChatRequest = pending ?? withMaterialScope({ conversation_id: id, request_id: crypto.randomUUID(), question: askedQuestion }, materialId);
      if (!pending) savePending(request);
      const exchange = await sendChat(client, request);
      if (!alive.current) return;
      setMessages((history) => mergeExchange(history, exchange));
      setConversations((current) => current.map((conversation) => conversation.id === exchange.conversation_id && conversation.title === "Neuer Chat"
        ? { ...conversation, title: request.question } : conversation));
      savePending(null);
      setQuestion("");
      setRetryAt(0);
    } catch (failure) {
      if (!alive.current) return;
      const chatError = asChatError(failure);
      setError(chatError);
      const timestamp = Date.now();
      setNow(timestamp);
      setRetryAt(timestamp + Math.max(chatError.retryAfter, chatError.code === "REQUEST_IN_PROGRESS" ? 2 : 0) * 1000);
      if (canDiscardRequest(chatError.code)) {
        savePending(null);
        if (chatError.code === "CONVERSATION_NOT_FOUND") setConversationId("");
      }
    } finally {
      sendingRef.current = false;
      if (alive.current) { setSending(false); inputRef.current?.focus(); }
    }
  }

  async function loadOlder() {
    if (!conversationId || !messages.length || olderLoading) return;
    setOlderLoading(true);
    try {
      const page = await loadHistoryPage(createClient(), conversationId, messages[0].seq);
      setHasOlder(page.hasOlder);
      setMessages((current) => [...page.messages, ...current]);
    } catch { setError(new ChatError("LOAD_FAILED")); }
    finally { setOlderLoading(false); }
  }

  async function selectConversation(id: string) {
    if (pending || sending) return;
    setConversationId(id);
    setMessages([]);
    setHasOlder(false);
    setError(null);
    if (!id) return;
    setLoading(true);
    try {
      const page = await loadHistoryPage(createClient(), id);
      setMessages(page.messages);
      setHasOlder(page.hasOlder);
    } catch { setError(new ChatError("LOAD_FAILED")); setLoadFailed(true); }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.chatPanel}>
      <label htmlFor="document-conversation">Dokumentchat</label>
      <select id="document-conversation" value={conversationId} disabled={loading || sending || Boolean(pending)}
        onChange={(event) => void selectConversation(event.target.value)}>
        <option value="">Neuer Dokumentchat</option>
        {conversations.map((conversation) => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}
      </select>
      <div className={styles.chatScroll}>
        {!messages.length && !sending && (
          <div className={styles.panelEmpty}>
            <span className={styles.panelIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" /></svg>
            </span>
            <h3>{loading ? "Chat wird geladen …" : "Starte eine Unterhaltung"}</h3>
            {!loading && <p>Frag mich etwas zu den Unterlagen von {courseTitle}.</p>}
          </div>
        )}

        {hasOlder && <button type="button" className={styles.viewerLink} onClick={() => void loadOlder()} disabled={olderLoading}>
          {olderLoading ? "Ältere Nachrichten werden geladen …" : "Ältere Nachrichten laden"}
        </button>}
        <ul className={styles.chatMessages} aria-label="Fragen und Antworten">
          {messages.map((message) => (
            <li key={message.id} className={styles.chatRow} data-role={message.role}>
              {message.role === "assistant" && (
                <span className={styles.chatAvatar} data-role="assistant" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /><circle cx="12" cy="12" r="3.2" /></svg>
                </span>
              )}
              <div className={styles.chatBubble}>
                <p>{renderContent(message.content)}</p>
                {message.chat_message_sources?.length > 0 && (
                  <div className={styles.chatSources}>
                    {[...message.chat_message_sources].sort((a, b) => a.citation_no - b.citation_no).map((source) => (
                      <details key={source.citation_no}>
                        <summary>[{source.citation_no}] {source.material_title}{source.page_number !== null ? ` · S. ${source.page_number}` : ""}</summary>
                        <blockquote>{source.excerpt}</blockquote>
                        {source.material_id && sourceLinks.has(source.material_id) && (
                          <Link href={`${sourceLinks.get(source.material_id)}${source.page_number ? `?page=${source.page_number}` : ""}`}>
                            Quelle öffnen
                          </Link>
                        )}
                      </details>
                    ))}
                  </div>
                )}
                <MessageFeedback message={message} pending={feedback.pending.has(message.id)} failed={feedback.failedId === message.id} onRate={feedback.rate} />
              </div>
              {message.role === "user" && (
                <span className={styles.chatAvatar} data-role="user" aria-hidden="true">{initial}</span>
              )}
            </li>
          ))}
        </ul>
        <div ref={endRef} />
        {sending && <p className={styles.chatStatus} role="status">Antwort wird erstellt …</p>}
        {error && <p className={styles.errorHint} role="alert">{error.message}</p>}
      </div>

      <form className={styles.chatComposer} onSubmit={submit}>
        <textarea
          ref={inputRef}
          className={styles.chatInput}
          value={question}
          maxLength={1800}
          rows={1}
          readOnly={sending || Boolean(pending)}
          placeholder="Frage etwas zu diesem Dokument …"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <button type="submit" className={styles.chatSend} aria-label={sending ? "Antwortet …" : pending ? "Anfrage wiederholen" : "Frage senden"} disabled={busy || loadFailed || waitSeconds > 0 || (!pending && Boolean(blockedReason))}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 20 18-8L3 4v6l12 2-12 2v6Z" /></svg>
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { createConversation, hasIndexedMaterial, loadConversations, loadCourses, loadHistory, sendChat } from "@/lib/chat";
import { ChatError, canDiscardRequest, mergeExchange, sendBlockedReason, type ChatCourse, type ChatMessage, type ChatRequest, type Conversation } from "@/lib/chatProtocol";
import s from "./assistant.module.css";

const storagePrefix = "lernapp.chat.pending:";
function readPending(key: string): ChatRequest | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return value && typeof value.conversation_id === "string" && typeof value.request_id === "string" && typeof value.question === "string" ? value : null;
  } catch { return null; }
}
function savePending(key: string, request: ChatRequest | null) {
  try {
    if (request) sessionStorage.setItem(key, JSON.stringify(request));
    else sessionStorage.removeItem(key);
  } catch { /* The in-memory request remains usable when session storage is blocked. */ }
}
function clearPendingStorage() {
  try {
    Object.keys(sessionStorage).filter((key) => key.startsWith(storagePrefix)).forEach((key) => sessionStorage.removeItem(key));
  } catch { /* Storage may be disabled. */ }
}
function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

export default function AssistantWorkspace() {
  const router = useRouter();
  const [courses, setCourses] = useState<ChatCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ChatError | null>(null);
  const [reload, setReload] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let active = true;
    const client = createClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_OUT") {
        clearPendingStorage();
        router.replace("/login?next=%2Fassistant");
        router.refresh();
      }
    });
    async function load() {
      try {
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) throw new ChatError("UNAUTHENTICATED");
        const available = await loadCourses(client);
        if (!active) return;
        setUserId(user.id);
        setCourses(available);
        // Prefer a course with an unresolved request after navigation/reload.
        const restored = available.find((course) => readPending(`${storagePrefix}${user.id}:${course.id}`));
        setCourseId(restored?.id ?? available[0]?.id ?? "");
        setError(null);
      } catch (failure) {
        if (active) setError(asChatError(failure));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; subscription.unsubscribe(); };
  }, [reload, router]);

  return (
    <div className={s.workspace} data-full-bleed>
      <header className={s.workspaceIntro}><div><p className={s.micro}>02 / KI-ASSISTENT</p><h1>Frag dein Material.</h1></div><p>Antworten kommen nur aus deinen hochgeladenen Unterlagen, mit Quellenangabe zu Folie und Seite.</p></header>
      <div className={s.contextBar}>
        <label htmlFor="assistant-context">Kurs</label>
        <select id="assistant-context" value={courseId} disabled={locked || loading || !courses.length}
          onChange={(event) => setCourseId(event.target.value)}>
          {!courses.length && <option value="">{loading ? "Kurse werden geladen …" : "Keine Kurse verfügbar"}</option>}
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <span className={s.contextNote}>Antworten auf Grundlage deiner Kursunterlagen.</span>
      </div>
      {loading && <p className={s.status} role="status">Chat wird geladen …</p>}
      {error && <div className={s.error} role="alert"><p>{error.message}</p>
        {error.code === "UNAUTHENTICATED" ? <Link href="/login?next=%2Fassistant">Erneut anmelden</Link>
          : <button className={s.action} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Erneut laden</button>}
      </div>}
      {!loading && !error && <CourseChat key={`${userId}:${courseId}`} courseId={courseId} userId={userId} setLocked={setLocked} />}
    </div>
  );
}

function CourseChat({ courseId, userId, setLocked }: { courseId: string; userId: string; setLocked: (locked: boolean) => void }) {
  const storageKey = `${storagePrefix}${userId}:${courseId}`;
  const [pending, setPending] = useState<ChatRequest | null>(() => readPending(storageKey));
  const [conversationId, setConversationId] = useState(() => readPending(storageKey)?.conversation_id ?? "");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState(() => readPending(storageKey)?.question ?? "");
  const [indexed, setIndexed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const sendingRef = useRef(false);
  const alive = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = loading || historyLoading || sending;
  const waitSeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const blockedReason = sendBlockedReason({ courseId, busy, pending: Boolean(pending), loadFailed, waitSeconds, question });

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    setLocked(busy || Boolean(pending));
    return () => setLocked(false);
  }, [busy, pending, setLocked]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, sending]);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    const client = createClient();
    Promise.all([loadConversations(client, courseId), hasIndexedMaterial(client, courseId).catch(() => null)])
      .then(([list, ready]) => {
        if (!active) return;
        setConversations(list);
        setIndexed(ready);
      })
      .catch((failure) => { if (active) { setError(asChatError(failure)); setLoadFailed(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, reload]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    loadHistory(createClient(), conversationId).then((history) => {
      if (!active) return;
      setMessages((current) => [...new Map([...history, ...current].map((message) => [message.id, message])).values()].sort((a, b) => a.seq - b.seq));
      const saved = readPending(storageKey);
      if (saved && history.some((message) => message.role === "assistant" && message.request_id === saved.request_id)) {
        savePending(storageKey, null);
        setPending(null);
        setQuestion("");
        setError(null);
      }
    }).catch((failure) => { if (active) { setError(asChatError(failure)); setLoadFailed(true); } })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [conversationId, storageKey, reload]);

  function selectConversation(id: string) {
    setConversationId(id);
    setMessages([]);
    setQuestion("");
    setError(null);
    setHistoryLoading(Boolean(id));
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sendingRef.current || busy || waitSeconds > 0 || !courseId || loadFailed) return;
    if (!pending && blockedReason) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    let request = pending;
    try {
      const client = createClient();
      if (!request) {
        let id = conversationId;
        if (!id) {
          const conversation = await createConversation(client, courseId);
          if (!alive.current) return;
          id = conversation.id;
          setConversations((list) => [conversation, ...list]);
          setConversationId(id);
        }
        request = { conversation_id: id, request_id: crypto.randomUUID(), question: question.trim() };
        // Persist the exact request before sending; retries must keep both ID and question.
        savePending(storageKey, request);
        setPending(request);
      }
      const exchange = await sendChat(client, request);
      if (!alive.current) return;
      setMessages((history) => mergeExchange(history, exchange));
      savePending(storageKey, null);
      setPending(null);
      setQuestion("");
      setRetryAt(0);
      setConversations((list) => list.map((conversation) => conversation.id === exchange.conversation_id
        ? { ...conversation, title: conversation.title === "Neuer Chat" ? request!.question : conversation.title } : conversation));
    } catch (failure) {
      if (!alive.current) return;
      const chatError = asChatError(failure);
      setError(chatError);
      const timestamp = Date.now();
      setNow(timestamp);
      setRetryAt(timestamp + Math.max(chatError.retryAfter, chatError.code === "REQUEST_IN_PROGRESS" ? 2 : 0) * 1000);
      if (canDiscardRequest(chatError.code)) {
        savePending(storageKey, null);
        setPending(null);
        if (chatError.code === "NO_INDEXED_MATERIAL") setIndexed(false);
        if (chatError.code === "CONVERSATION_NOT_FOUND") setConversationId("");
      }
    } finally {
      sendingRef.current = false;
      if (alive.current) { setSending(false); inputRef.current?.focus(); }
    }
  }

  return <div className={s.learningRoom}>
    <aside className={s.questionDesk}><p className={s.micro}>ARBEITSAUFTRAG</p><h2>Woran arbeitest du?</h2>
    <div className={s.contextBar}>
      <label htmlFor="assistant-conversation">Unterhaltung</label>
      <select id="assistant-conversation" value={conversationId} disabled={busy || Boolean(pending) || loadFailed}
        onChange={(event) => selectConversation(event.target.value)}>
        <option value="">Neuer Chat</option>
        {pending && !conversations.some((item) => item.id === conversationId) && <option value={conversationId}>Offene Anfrage</option>}
        {conversations.map((conversation) => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}
      </select>
      <button className={s.action} disabled={busy || !courseId} onClick={() => {
        setLoadFailed(false); setLoading(Boolean(courseId)); setHistoryLoading(Boolean(conversationId)); setError(null); setReload((value) => value + 1);
      }}>Aktualisieren</button>
    </div>
    <form className={s.composer} onSubmit={submit}>
      <label className={s.inputLabel} htmlFor="assistant-question">Deine Frage</label>
      <textarea ref={inputRef} id="assistant-question" value={question} maxLength={1800}
        readOnly={sending || Boolean(pending)} rows={3} placeholder="Was möchtest du zu deinen Unterlagen wissen?"
        aria-describedby="assistant-composer-note" onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!pending) void submit();
          }
        }} />
      <button type="submit" className={s.sendButton}
        disabled={Boolean(blockedReason)} aria-describedby="assistant-send-status">
        {sending ? "Antwortet …" : "Senden"}
      </button>
    </form>
    <p id="assistant-send-status" className={s.composerNote} role="status">{blockedReason ?? "Bereit zum Senden."}</p>
    <p id="assistant-composer-note" className={s.composerNote}>
      {question.length}/1800 Zeichen · Enter zum Senden, Umschalt + Enter für einen Absatz. KI-Antworten können Fehler enthalten; prüfe die Quellen.
    </p>
</aside>
    <section className={s.answerDesk} aria-label="Lernprotokoll"><header className={s.answerHeading}><h2>Dein Lernprotokoll</h2><span>FRAGEN / ANTWORTEN / QUELLEN</span></header>
{!messages.length && !pending && !busy && <div className={s.emptyProtocol}><span aria-hidden="true">01</span><h3>Raum für deine Fragen.</h3><p>Formuliere links eine Frage. Antworten und ihre Quellen sammeln sich hier.</p></div>}
    {!courseId && <p className={s.status}>In deinem Konto sind noch keine Kurse vorhanden. <Link href="/courses">Lege einen Kurs an und lade deine Unterlagen hoch.</Link></p>}
    {loading || historyLoading ? <p className={s.status} role="status">Kurs und Unterhaltung werden geladen …</p>
      : courseId && indexed === false && !loadFailed && <p className={s.status}>Bei der letzten Prüfung waren noch keine durchsuchbaren Unterlagen verfügbar. Beim Senden prüft der Chat den aktuellen Stand. <Link href={`/courses/${courseId}`}>Unterlagen im Kurs verwalten</Link></p>}
    {!busy && indexed && !messages.length && !pending && <p className={s.status}>Stelle eine Frage zu deinen Kursunterlagen.</p>}
    <ul className={s.messages} aria-label="Fragen und Antworten">
      {messages.map((message) => <li key={message.id} className={s.messageRow} data-role={message.role}>
        <div className={s.messageContent}>
          <div className={s.assistantMeta}>{message.role === "assistant" ? "KI-ANTWORT" : "DEINE FRAGE"}</div>
          <p>{message.content}</p>
          {message.chat_message_sources?.length > 0 && <div className={s.sources}>
            {[...message.chat_message_sources].sort((a, b) => a.citation_no - b.citation_no).map((source) =>
              <details key={source.citation_no}>
                <summary>[{source.citation_no}] {source.material_title}{source.page_number !== null ? ` · S. ${source.page_number}` : ""}</summary>
                <blockquote>{source.excerpt}</blockquote>
              </details>)}
          </div>}
        </div>
      </li>)}
      {pending && !messages.some((message) => message.request_id === pending.request_id) && <li className={s.messageRow} data-role="user"><div className={s.messageContent}><p>{pending.question}</p></div></li>}
    </ul>
    <div ref={endRef} />
    {sending && <p className={s.status} role="status">Deine Antwort wird erstellt. Das kann bis zu zwei Minuten dauern …</p>}
    {error && <div className={s.error} role="alert"><p>{error.message}</p>
      {error.code === "UNAUTHENTICATED" && <Link href="/login?next=%2Fassistant">Erneut anmelden</Link>}
    </div>}
    {pending && !sending && <div className={s.status}>
      <p>Eine Anfrage ist noch offen. Rufe zuerst deren Ergebnis ab, bevor du eine weitere Frage stellst.</p>
      <button className={s.action} disabled={busy || waitSeconds > 0 || loadFailed} onClick={() => void submit()}>
        {waitSeconds > 0 ? `Wiederholen in ${waitSeconds} s` : "Anfrage wiederholen"}
      </button>
    </div>}
</section>
  </div>;
}

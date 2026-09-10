"use client";

import { conversation, suggestedPrompts } from "./examples";
import s from "./assistant.module.css";

export default function AssistantWorkspace() {
  return (
    <div className={s.workspace}>
      <div className={s.contextBar}>
        <label htmlFor="assistant-context">Kontext</label>
        <select id="assistant-context" disabled defaultValue="nk">
          <option value="nk">Neue Konzepte</option>
          <option value="it">IT Security</option>
        </select>
        <span className={s.contextNote}>
          Der Assistent antwortet mit Bezug zu diesem Kurs.
        </span>
      </div>

      <ul className={s.messages}>
        {conversation.map((message) => (
          <li key={message.id} className={s.messageRow} data-role={message.role}>
            <div className={s.bubble}>
              {message.role === "assistant" && (
                <div className={s.assistantMeta}>KI-GENERIERTER BEISPIELINHALT</div>
              )}
              <p>{message.text}</p>
              {message.source && (
                <span className={s.sourceChip}>{message.source}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className={s.suggestions} role="group" aria-label="Vorgeschlagene Fragen">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className={s.suggestionChip}
            disabled
            aria-describedby="assistant-composer-note"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className={s.composer}>
        <textarea
          disabled
          placeholder="Frag deinen KI-Assistenten …"
          aria-describedby="assistant-composer-note"
        />
        <button
          type="button"
          className={s.sendButton}
          disabled
          aria-describedby="assistant-composer-note"
        >
          Senden
        </button>
      </div>
      <p id="assistant-composer-note" className={s.composerNote}>
        Vorschau · Der Chat ist hier noch nicht verfügbar.
      </p>
    </div>
  );
}

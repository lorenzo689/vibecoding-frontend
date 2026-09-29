"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredChoice,
  storeChoice,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/theme";
import s from "./themeToggle.module.css";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // Render the light icon until mounted: the server cannot know the stored
  // choice, and reading it during render would mismatch the hydrated markup.
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const choice = readStoredChoice();
    setResolved(applyTheme(choice));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      // Only follow the system while the user has not made an explicit choice.
      if (readStoredChoice() === "system") setResolved(applyTheme("system"));
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next: ThemeChoice = resolved === "dark" ? "light" : "dark";
    storeChoice(next);
    setResolved(applyTheme(next));
  }

  const isDark = mounted && resolved === "dark";
  const label = isDark ? "Zu hellem Erscheinungsbild wechseln" : "Zu dunklem Erscheinungsbild wechseln";

  return (
    <button
      type="button"
      className={s.toggle}
      data-compact={compact || undefined}
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      <span className={s.icon}>{isDark ? <SunIcon /> : <MoonIcon />}</span>
      {!compact && <span className={s.text}>{isDark ? "Hell" : "Dunkel"}</span>}
    </button>
  );
}

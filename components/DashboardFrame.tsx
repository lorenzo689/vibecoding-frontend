"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthenticatedProfile } from "@/lib/auth/useAuthenticatedProfile";
import s from "./dashboardFrame.module.css";

const items = [
  { href: "/dashboard", label: "Übersicht", icon: <path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9-2h7v9h-7v-9Z" /> },
  { href: "/assistant", label: "KI-Assistent", icon: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" /></> },
  { href: "/courses", label: "Kurse", icon: <><path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" /><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" /></> },
  { href: "/calendar", label: "Kalender", icon: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9.5h16M8 3v3.4M16 3v3.4" /></> },
  { href: "/documents", label: "Unterlagen", icon: <><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13.6 3.6V8h4.3" /></> },
  { href: "/grades", label: "Noten", icon: <><path d="M5 20V11M12 20V4M19 20v-7" /></> },
];

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name, detail, initial, signingOut, logout } = useAuthenticatedProfile();

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <Link href="/dashboard" className={s.brand}>
          <span className={s.logo} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="7" r="2.4" /><circle cx="18" cy="7" r="2.4" /><circle cx="12" cy="18" r="2.4" />
              <path d="M8.1 8.2 10.5 16M15.9 8.2 13.5 16M8.4 7h7.2" />
            </svg>
          </span>
          <span>Lernapp</span>
        </Link>
        <div className={s.search}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" placeholder="Kurse, Dokumente, Karteikarten durchsuchen …" aria-label="Globale Suche" />
        </div>
        <div className={s.topbarRight}>
          <button type="button" className={s.bell} aria-label="Benachrichtigungen">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
            <span className={s.dot} aria-hidden="true" />
          </button>
          <Link href="/profile" className={s.profileChip}>
            <span className={s.avatar} aria-hidden="true">{initial}</span>
            <span className={s.identity}><strong>{name}</strong><small>{detail}</small></span>
          </Link>
        </div>
      </header>
      <div className={s.body}>
        <aside className={s.sidebar}>
          <nav aria-label="Hauptnavigation">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={s.navItem} aria-current={active ? "page" : undefined} data-active={active}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <button type="button" className={s.logoutItem} onClick={logout} disabled={signingOut}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" /><path d="M15 16l4-4-4-4M19 12H9" /></svg>
            <span>{signingOut ? "Wird abgemeldet …" : "Abmelden"}</span>
          </button>
        </aside>
        <main className={s.main}>{children}</main>
      </div>
    </div>
  );
}

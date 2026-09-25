"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthenticatedProfile } from "@/lib/auth/useAuthenticatedProfile";
import logo from "@/components/ui/logo.png";
import s from "./dashboardFrame.module.css";

const sidebarStorageKey = "lernapp-dashboard-sidebar";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(sidebarStorageKey) === "collapsed");
      } catch { /* Navigation works without browser storage. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try { localStorage.setItem(sidebarStorageKey, next ? "collapsed" : "expanded"); } catch { /* Optional preference. */ }
      return next;
    });
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar} data-collapsed={collapsed}>
        <div className={s.brandRow}>
          <Link href="/dashboard" className={s.brand} title={collapsed ? "UniVerse" : undefined}>
            {collapsed ? (
              <span className={s.logo} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="7" r="2.4" /><circle cx="18" cy="7" r="2.4" /><circle cx="12" cy="18" r="2.4" />
                  <path d="M8.1 8.2 10.5 16M15.9 8.2 13.5 16M8.4 7h7.2" />
                </svg>
              </span>
            ) : (
              <Image src={logo} alt="UniVerse" className={s.wordmark} priority />
            )}
          </Link>
          {!collapsed && (
            <button type="button" className={s.collapseToggle} onClick={toggleCollapsed} title="Navigation einklappen"
              aria-expanded={!collapsed} aria-controls="dashboard-navigation" aria-label="Navigation einklappen">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 5 12l6 7M5 12h14" /></svg>
            </button>
          )}
        </div>
        <div className={s.sidebarBody}>
          {collapsed && (
            <button type="button" className={s.collapseToggle} onClick={toggleCollapsed} title="Navigation ausklappen"
              aria-expanded={!collapsed} aria-controls="dashboard-navigation" aria-label="Navigation ausklappen">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" data-flip="true"><path d="M11 5 5 12l6 7M5 12h14" /></svg>
            </button>
          )}
          <nav aria-label="Hauptnavigation" id="dashboard-navigation">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={s.navItem} aria-current={active ? "page" : undefined} data-active={active} title={collapsed ? item.label : undefined}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <button type="button" className={s.logoutItem} onClick={logout} disabled={signingOut} title={collapsed ? "Abmelden" : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" /><path d="M15 16l4-4-4-4M19 12H9" /></svg>
            <span>{signingOut ? "Wird abgemeldet …" : "Abmelden"}</span>
          </button>
        </div>
      </aside>
      <div className={s.workspace}>
        <header className={s.topbar}>
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
        <main className={s.main}>{children}</main>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthenticatedProfile from "./auth/AuthenticatedProfile";
import s from "./dashboard.module.css";
const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assistant", label: "KI-Assistent" },
  { href: "/courses", label: "Kurse" },
  { href: "/calendar", label: "Kalender" },
  { href: "/documents", label: "Unterlagen" },
  { href: "/grades", label: "Noten" },
];
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <aside className={s.sidebar}>
      <div className={s.brandRow}>
        <Link href="/dashboard" className={s.brand} onClick={() => setOpen(false)}>
          Lernapp<span>.</span>
        </Link>
        <button
          className={s.menu}
          aria-expanded={open}
          aria-controls="app-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Menü schließen" : "Menü öffnen"}
        </button>
      </div>
      <div id="app-navigation" className={open ? s.navOpen : s.navArea}>
        <p className={s.eyebrow}>DEIN STUDIENRAUM</p>
        <nav aria-label="Hauptnavigation">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={s.sidebarBottom}>
          <p>
            Alles beginnt mit
            <br />
            <strong>einem guten Überblick.</strong>
          </p>
          <AuthenticatedProfile />
        </div>
      </div>
    </aside>
  );
}

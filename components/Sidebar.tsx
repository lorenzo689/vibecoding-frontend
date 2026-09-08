"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/courses", label: "Kurse" },
  { href: "/calendar", label: "Kalender" },
  { href: "/documents", label: "Unterlagen" },
  { href: "/flashcards", label: "Karteikarten" },
  { href: "/summaries", label: "Zusammenfassungen" },
  { href: "/grades", label: "Noten" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-200 bg-white p-2 md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
              isActive
                ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

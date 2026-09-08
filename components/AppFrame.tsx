"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Presentation only: these routes have no session or authorization behavior.
  if (pathname === "/login" || pathname === "/register") return children;

  return (
    <>
      <Topbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  );
}

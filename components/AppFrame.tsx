"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./dashboard.module.css";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register" || pathname === "/" || pathname.startsWith("/auth/"))
    return children;

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.workspace}>
        <Topbar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

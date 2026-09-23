import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page} lang="de">
      <div className={styles.card}>
        <Link href="/" className={styles.logo} aria-label="Lernapp, zur Startseite">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="7" r="2.4" />
            <circle cx="18" cy="7" r="2.4" />
            <circle cx="12" cy="18" r="2.4" />
            <path d="M8.1 8.2 10.5 16M15.9 8.2 13.5 16M8.4 7h7.2" />
          </svg>
        </Link>
        {children}
      </div>
      <p className={styles.legal}>Mit der Fortsetzung stimmst du unseren Nutzungsbedingungen und der Datenschutzerklärung zu.</p>
    </main>
  );
}

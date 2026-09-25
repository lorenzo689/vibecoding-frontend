import Image from "next/image";
import Link from "next/link";
import logo from "@/components/ui/logo.png";
import styles from "./auth.module.css";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page} lang="de">
      <div className={styles.card}>
        <Link href="/" className={styles.logo} aria-label="UniVerse, zur Startseite">
          <Image src={logo} alt="UniVerse" className={styles.wordmark} priority />
        </Link>
        {children}
      </div>
      <p className={styles.legal}>Mit der Fortsetzung stimmst du unseren Nutzungsbedingungen und der Datenschutzerklärung zu.</p>
    </main>
  );
}

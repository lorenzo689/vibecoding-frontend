"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Visual foundation only. Never send, persist, or log these field values.
    setSubmitted(true);
  }

  return (
    <div className={styles.formContent}>
      <p className={styles.eyebrow}>A little more clarity. Every semester.</p>
      <h1>{registering ? "Create your account" : "Welcome back"}</h1>
      <p className={styles.subtitle}>{registering
        ? "Start organizing your semester and learning in one place."
        : "Sign in to continue your studies."}</p>
      <form onSubmit={submit} aria-describedby="auth-preview-note">
        {registering && <div className={styles.field}>
          <label htmlFor="display-name">Display name</label>
          <input id="display-name" name="display_name" autoComplete="nickname" placeholder="How should we call you?" required
            onChange={(event) => event.currentTarget.setCustomValidity("")}
            onBlur={(event) => event.currentTarget.setCustomValidity(event.currentTarget.value.trim() ? "" : "Please enter a display name.")} />
        </div>}
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@university.edu" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordWrap}>
            <input id="password" name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "Choose a password" : "Enter your password"} required />
            <button className={styles.visibility} type="button" aria-label={visible ? "Hide password" : "Show password"} aria-controls="password" onClick={() => setVisible(!visible)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
                {visible && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>
        </div>
        <button className={styles.primary} type="submit">{registering ? "Create account" : "Sign in"}<span aria-hidden="true">→</span></button>
        <p id="auth-preview-note" className={styles.previewNote}>Design preview · {registering ? "Account creation" : "Sign-in"} is not available yet.</p>
        <div role="status" className={styles.status}>{submitted && "This is a visual preview. Your details have not been sent or saved."}</div>
      </form>
      <p className={styles.alternative}>{registering ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link href={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create account"}</Link>
      </p>
    </div>
  );
}

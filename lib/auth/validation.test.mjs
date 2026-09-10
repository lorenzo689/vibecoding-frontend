import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authErrorMessage,
  safeAuthRedirect,
  validateDisplayName,
  validateLoginPassword,
  validateRegistrationPassword,
} from "./validation.ts";

test("display names are trimmed and checked as Unicode code points", () => {
  assert.deepEqual(validateDisplayName("  Anna  "), { valid: true, value: "Anna" });
  assert.equal(validateDisplayName("   ").valid, false);
  assert.equal(validateDisplayName("ä".repeat(60)).valid, true);
  assert.equal(validateDisplayName("🧠".repeat(61)).valid, false);
});

test("registration and login apply different password rules without changing input", () => {
  assert.equal(validateRegistrationPassword("1234567"), "Das Passwort muss mindestens 8 Zeichen lang sein.");
  assert.equal(validateRegistrationPassword(" 123456 "), null);
  assert.equal(validateLoginPassword("x"), null);
  assert.equal(validateLoginPassword(""), "Bitte gib dein Passwort ein.");
});

test("redirects are restricted to protected internal application paths", () => {
  assert.equal(safeAuthRedirect("/courses/example?tab=files"), "/courses/example?tab=files");
  assert.equal(safeAuthRedirect("/profile"), "/profile");
  assert.equal(safeAuthRedirect("/profile/preferences?tab=account"), "/profile/preferences?tab=account");
  for (const unsafe of ["https://evil.example", "//evil.example", "/login", "/auth/callback", null]) {
    assert.equal(safeAuthRedirect(unsafe), "/dashboard");
  }
});

test("auth errors are mapped without exposing backend messages", () => {
  assert.equal(authErrorMessage({ code: "invalid_credentials", message: "secret detail" }, "login"), "E-Mail-Adresse oder Passwort ist nicht korrekt.");
  assert.match(authErrorMessage({ status: 429 }, "register"), /Zu viele Versuche/);
});

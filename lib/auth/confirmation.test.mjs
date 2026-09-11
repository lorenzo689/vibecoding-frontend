import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPendingConfirmation,
  parseEmailOtpType,
  parsePendingConfirmation,
  requestHasTrustedOrigin,
  trustedOrigin,
} from "./confirmation.ts";

test("only configured confirmation and recovery OTP types are accepted", () => {
  assert.equal(parseEmailOtpType("email"), "email");
  assert.equal(parseEmailOtpType("recovery"), "recovery");
  for (const value of [null, "signup", "invite", "magiclink", "email_change"]) {
    assert.equal(parseEmailOtpType(value), null);
  }
});

test("pending confirmations round-trip without accepting malformed tokens", () => {
  const token = "a".repeat(64);
  const encoded = createPendingConfirmation(token, "recovery");
  assert.deepEqual(parsePendingConfirmation(encoded ?? undefined), {
    tokenHash: token,
    type: "recovery",
  });
  assert.equal(createPendingConfirmation("short", "email"), null);
  assert.equal(parsePendingConfirmation("email.not valid"), null);
});

test("server redirects and POST requests use one trusted origin", () => {
  assert.equal(trustedOrigin("https://app.example", "http://internal:3000"), "https://app.example");
  assert.equal(trustedOrigin(undefined, "http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  assert.equal(requestHasTrustedOrigin("https://app.example", "https://app.example"), true);
  assert.equal(requestHasTrustedOrigin("https://evil.example", "https://app.example"), false);
  assert.throws(() => trustedOrigin("https://app.example/path", "http://internal"));
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { profileInitial, registrationProfileMetadata } from "./profile.ts";

test("profile initials use the first trimmed Unicode character", () => {
  assert.equal(profileInitial("  anna"), "A");
  assert.equal(profileInitial("ömer"), "Ö");
  assert.equal(profileInitial("🧠 Lernen"), "🧠");
  assert.equal(profileInitial("   "), "L");
});

test("registration maps the UI name to Auth display_name metadata", () => {
  assert.deepEqual(registrationProfileMetadata("Anna"), { display_name: "Anna" });
});

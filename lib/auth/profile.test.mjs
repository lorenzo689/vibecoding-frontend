import assert from "node:assert/strict";
import { test } from "node:test";
import { profileInitial } from "./profile.ts";

test("profile initials use the first trimmed Unicode character", () => {
  assert.equal(profileInitial("  anna"), "A");
  assert.equal(profileInitial("ömer"), "Ö");
  assert.equal(profileInitial("🧠 Lernen"), "🧠");
  assert.equal(profileInitial("   "), "L");
});

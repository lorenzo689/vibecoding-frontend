import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

// Static regression guard for the document scope: every document AI action must send
// its chat request through withMaterialScope(…, materialId); the course-wide assistant
// must never do so. Behaviour of the scope itself is covered in chat.test.mjs.
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("every document-bound AI request is scoped to the open material", async () => {
  for (const file of ["DocumentFlashcardGenerator", "DocumentQuizzes", "DocumentAiActions", "DocumentCourseChat"]) {
    const source = await read(`../components/courses/${file}.tsx`);
    const sends = source.match(/sendChat\(/g) ?? [];
    const scoped = source.match(/withMaterialScope\(/g) ?? [];
    assert.ok(sends.length > 0, `${file} sends chat requests`);
    assert.equal(scoped.length, sends.length, `${file}: each sendChat is scoped`);
    assert.ok(/withMaterialScope\([\s\S]*?materialId\)/.test(source), `${file}: scope uses materialId`);
    assert.ok(!/material_ids/.test(source.replace(/\/\/.*$/gm, "")) || /withMaterialScope/.test(source));
  }
});

test("the course-wide assistant stays unscoped", async () => {
  const source = await read("../components/assistant/AssistantWorkspace.tsx");
  assert.ok(!source.includes("withMaterialScope"));
  assert.ok(!source.includes("material_ids"));
});

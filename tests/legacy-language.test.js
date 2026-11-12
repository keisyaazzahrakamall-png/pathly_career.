import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAssessmentLanguage, normalizeRoadmapLanguage } from "../js/lib/legacy-language.js";
import { calculatePathlyScore } from "../js/lib/scoring-core.js";

test("old assessment answers keep their scores and user-written evidence", () => {
  const answer = { level: 2, evidence: ["Academic"], evidenceDetail: "Tugas saya — https://example.com" };
  const old = { careerId: "data-analyst", answers: { "Analisis Data": answer } };
  const normalized = normalizeAssessmentLanguage(old);
  assert.deepEqual(normalized.answers["Data Analysis"], answer);
  assert.ok(old.answers["Analisis Data"]);
  const result = calculatePathlyScore({
    targetCareer: { id: "data-analyst", name: "Data Analyst" }, assessmentData: old,
    careerRequirements: [{ skill: "Data Analysis", targetLevel: 2, weight: 3 }]
  });
  assert.equal(result.alignment, 100);
});

test("English answers take precedence when both language keys exist", () => {
  const data = normalizeAssessmentLanguage({ answers: { "Data Analysis": { level: 3 }, "Analisis Data": { level: 1 } } });
  assert.equal(data.answers["Data Analysis"].level, 3);
});

test("old roadmaps display English while task IDs and progress remain stable", () => {
  const old = { careerId: "data-analyst", signature: "unchanged", priorities: [{ skill: "Analisis Data", importance: "Inti" }], pace: { label: "Terfokus", duration: "2–3 minggu per prioritas" }, tasks: [{ id: "p1-learn", type: "Pelajari", skill: "Analisis Data", title: "Pahami alur kerja analisis data", estimate: "3–4 jam", doneWhen: "Dapat menjelaskan konsep utama Analisis Data dan mencatat tiga poin penting." }] };
  const data = normalizeRoadmapLanguage(old);
  assert.equal(data.tasks[0].id, "p1-learn");
  assert.equal(data.signature, old.signature);
  assert.equal(data.tasks[0].type, "Learn");
  assert.equal(data.tasks[0].title, "Understand the data analysis workflow");
  assert.equal(data.tasks[0].doneWhen, "Explain the main concepts of Data Analysis and record three key takeaways.");
  assert.equal(data.tasks[0].estimate, "3–4 hours");
  assert.equal(data.pace.label, "Focused");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePathlyScore,
  hasRealEvidence
} from "../js/lib/scoring-core.js";

const career = { id: "data-analyst", name: "Data Analyst" };
const requirements = [
  { skill: "SQL", importance: "Core", weight: 3, targetLevel: 2 },
  { skill: "Communication", importance: "Important", weight: 2, targetLevel: 1 }
];

test("menghasilkan skor 100 saat seluruh target tercapai", () => {
  const result = calculatePathlyScore({
    targetCareer: career,
    assessmentData: {
      careerId: career.id,
      answers: {
        SQL: { level: 2, evidence: ["Project"] },
        Communication: { level: 1, evidence: ["None"] }
      }
    },
    careerRequirements: requirements,
    calculatedAt: "2026-01-01T00:00:00.000Z"
  });

  assert.equal(result.alignment, 100);
  assert.equal(result.developedCount, 2);
  assert.equal(result.evidenceCount, 1);
});

test("menghitung skor berbobot dan prioritas gap", () => {
  const result = calculatePathlyScore({
    targetCareer: career,
    assessmentData: {
      careerId: career.id,
      answers: {
        SQL: { level: 1, evidence: [] },
        Communication: { level: 0, evidence: [] }
      }
    },
    careerRequirements: requirements
  });

  assert.equal(result.alignment, 30);
  assert.equal(result.priorityGaps[0].skill, "SQL");
  assert.equal(result.developingCount, 1);
  assert.equal(result.missingCount, 1);
});

test("menolak asesmen milik karier berbeda", () => {
  assert.equal(
    calculatePathlyScore({
      targetCareer: career,
      assessmentData: { careerId: "business-analyst", answers: {} },
      careerRequirements: requirements
    }),
    null
  );
});

test("tidak menghitung pilihan None sebagai bukti", () => {
  assert.equal(hasRealEvidence(["None"]), false);
  assert.equal(hasRealEvidence(["Project"]), true);
});

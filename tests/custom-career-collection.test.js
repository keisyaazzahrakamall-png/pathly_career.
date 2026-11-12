import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceCustomCareerCollection,
  removeCustomCareer,
  upsertCustomCareer
} from "../js/lib/custom-career-collection.js";

function customCareer(id, name) {
  return {
    career: { id, name },
    requirements: []
  };
}

test("memigrasikan satu karier lama menjadi koleksi", () => {
  const machineLearning = customCareer(
    "custom-machine-learning-engineer",
    "Machine Learning Engineer"
  );

  assert.deepEqual(
    coerceCustomCareerCollection(machineLearning),
    [machineLearning]
  );
});

test("pencarian karier baru tidak menghapus pencarian sebelumnya", () => {
  const machineLearning = customCareer(
    "custom-machine-learning-engineer",
    "Machine Learning Engineer"
  );
  const learningDevelopment = customCareer(
    "custom-learning-development-specialist",
    "Learning & Development Specialist"
  );

  const saved = upsertCustomCareer(
    upsertCustomCareer([], machineLearning),
    learningDevelopment
  );

  assert.deepEqual(
    saved.map((item) => item.career.name),
    ["Learning & Development Specialist", "Machine Learning Engineer"]
  );
});

test("menyimpan ulang karier yang sama tidak membuat duplikat", () => {
  const dataAnalyst = customCareer("custom-data-analyst", "Data Analyst");
  const saved = upsertCustomCareer(
    upsertCustomCareer([], dataAnalyst),
    dataAnalyst
  );

  assert.equal(saved.length, 1);
});

test("menghapus hanya karier yang dipilih", () => {
  const first = customCareer("custom-first", "First");
  const second = customCareer("custom-second", "Second");

  assert.deepEqual(
    removeCustomCareer([first, second], first.career.id),
    [second]
  );
});

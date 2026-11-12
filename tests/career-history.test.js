import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("database menyimpan hasil tiap karier secara terpisah", () => {
  const schema = read("supabase/migrations/001_initial_schema.sql");

  assert.match(schema, /unique \(user_id, career_id\)/);
  assert.match(schema, /create table if not exists public\.assessments/);
  assert.match(schema, /create table if not exists public\.roadmaps/);
});

test("riwayat karier mengambil asesmen dan ketersediaan roadmap", () => {
  const source = read("js/lib/user-data.js");

  assert.match(source, /export async function getCareerHistory\(\)/);
  assert.match(source, /from\(["']assessments["']\)[\s\S]*?completed_at/);
  assert.match(source, /from\(["']roadmaps["']\)[\s\S]*?select\(["']career_id["']\)/);
});

test("mengganti target hanya membersihkan cache aktif tanpa menghapus data lama", () => {
  const source = read("js/lib/user-data.js");
  const activation = source.match(
    /export async function activateCareerTarget\(career\)([\s\S]*?)export async function saveAssessmentRecord/
  );

  assert.ok(activation, "fungsi penggantian target tidak ditemukan");
  assert.match(activation[1], /target_career_id/);
  assert.match(activation[1], /ACTIVE_CAREER_CACHE_KEYS/);
  assert.doesNotMatch(activation[1], /\.delete\(\)/);
});

test("Jalur Saya menyediakan penggantian target dan riwayat karier", () => {
  const html = read("my-path.html");
  const source = read("js/my-path.js");

  assert.match(html, />\s*Change Career Target\s*</);
  assert.match(html, />Careers you have assessed\.</);
  assert.match(source, /activateCareerTarget\(career\)/);
  assert.match(source, /window\.location\.assign\(getCareerDestination\(career\)\)/);
});

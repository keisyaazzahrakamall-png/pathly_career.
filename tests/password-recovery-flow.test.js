import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("halaman lupa password menjelaskan tiga langkah pemulihan", () => {
  const html = read("forgot-password.html");

  assert.match(html, /Open the email from Pathly/);
  assert.match(html, /Click the password reset link/);
  assert.match(html, /Set a new password/);
});

test("tautan email diarahkan ke halaman ganti password", () => {
  const source = read("js/auth/forgot-password.js");

  assert.match(source, /new URL\(["']reset-password\.html["']/);
  assert.match(source, /resetPasswordForEmail/);
});

test("halaman ganti password dapat digunakan dari tautan atau sesi aktif", () => {
  const source = read("js/auth/reset-password.js");

  assert.match(source, /event === ["']PASSWORD_RECOVERY["']/);
  assert.match(source, /if \(session\) \{\s*showForm\(\)/);
  assert.match(source, /RECOVERY_WAIT_ATTEMPTS = 16/);
  assert.match(source, /updateUser\(\{ password \}\)/);
});

test("menu profil tidak menampilkan pintasan ganti password", () => {
  const source = read("js/auth/session-ui.js");

  assert.doesNotMatch(source, /["']reset-password\.html["']/);
  assert.doesNotMatch(source, /["']Ganti Password["']/);
});

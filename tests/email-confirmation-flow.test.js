import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("pendaftaran mengarahkan verifikasi ke halaman konfirmasi khusus", () => {
  const source = read("js/auth/signup.js");

  assert.match(source, /new URL\(["']confirm-email\.html["']/);
  assert.match(source, /emailRedirectTo:\s*redirectUrl/);
});

test("halaman konfirmasi selalu menampilkan status yang jelas", () => {
  const html = read("confirm-email.html");

  assert.match(html, /VERIFYING EMAIL/);
  assert.match(html, /We are checking the confirmation link/);
  assert.match(html, /id=["']confirmationPrimary["']/);
  assert.match(html, /id=["']confirmationRetry["']/);
});

test("konfirmasi menangani sesi berhasil dan tautan gagal", () => {
  const source = read("js/auth/confirm-email.js");

  assert.match(source, /EMAIL VERIFIED/);
  assert.match(source, /LINK EXPIRED/);
  assert.match(source, /VERIFICATION UNSUCCESSFUL/);
  assert.match(source, /getSession\(\)/);
  assert.match(source, /event[\s\S]*SIGNED_IN/);
});

test("production build menyertakan halaman konfirmasi email", () => {
  const config = read("vite.config.js");

  assert.match(config, /confirmEmail:\s*resolve\(projectRoot, ["']confirm-email\.html["']\)/);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  getLoginErrorMessage,
  getPasswordResetErrorMessage,
  getSignupErrorMessage
} from "../js/lib/auth-error-messages.js";

test("error email tidak diizinkan tidak disebut sebagai gangguan koneksi", () => {
  assert.match(
    getSignupErrorMessage({ message: "Email address not authorized" }),
    /Check the address/
  );
});

test("hanya error jaringan yang menampilkan pesan koneksi", () => {
  assert.match(
    getSignupErrorMessage({ message: "Failed to fetch" }),
    /internet connection/
  );
  assert.doesNotMatch(
    getSignupErrorMessage({ message: "Database error saving new user" }),
    /internet connection/
  );
});

test("login membedakan email not confirmed dan gangguan jaringan", () => {
  assert.match(
    getLoginErrorMessage({ message: "Email not confirmed" }),
    /not confirmed/
  );
  assert.match(
    getLoginErrorMessage({ message: "Network request failed" }),
    /internet connection/
  );
});

test("reset password membedakan rate limit dan kesalahan email", () => {
  assert.match(
    getPasswordResetErrorMessage({ message: "Email rate limit exceeded" }),
    /Too many requests/
  );
  assert.match(
    getPasswordResetErrorMessage({ message: "Email address not authorized" }),
    /Check the address/
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  getEmailTypoMessage,
  suggestEmailAddress
} from "../js/lib/email-validation.js";

test("menyarankan Gmail untuk domain gmol", () => {
  assert.equal(
    suggestEmailAddress("keisya@gmol.com"),
    "keisya@gmail.com"
  );
});

test("mendeteksi variasi typo Gmail yang umum", () => {
  for (const email of [
    "user@gmial.com",
    "user@gamil.com",
    "user@gmail.con",
    "user@gmal.com"
  ]) {
    assert.match(getEmailTypoMessage(email), /@gmail\.com/);
  }
});

test("tidak mengubah alamat Gmail yang benar", () => {
  assert.equal(suggestEmailAddress("user@gmail.com"), "");
});

test("tidak menolak domain email lain yang valid", () => {
  assert.equal(suggestEmailAddress("user@outlook.com"), "");
  assert.equal(suggestEmailAddress("user@president.ac.id"), "");
});

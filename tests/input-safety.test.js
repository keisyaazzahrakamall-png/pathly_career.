import test from "node:test";
import assert from "node:assert/strict";
import {
  containsUnsafeCareerInput,
  sanitizeCareerName
} from "../js/lib/input-safety.js";

test("merapikan spasi pada name karier normal", () => {
  assert.equal(sanitizeCareerName("  Product   Manager  "), "Product Manager");
});

test("mendeteksi tag HTML dan protokol script", () => {
  assert.equal(containsUnsafeCareerInput("<script>alert(1)</script>"), true);
  assert.equal(containsUnsafeCareerInput("javascript:alert(1)"), true);
  assert.equal(containsUnsafeCareerInput("Product Manager"), false);
});

test("membatasi name karier sampai 80 karakter", () => {
  assert.equal(sanitizeCareerName("A".repeat(100)).length, 80);
});

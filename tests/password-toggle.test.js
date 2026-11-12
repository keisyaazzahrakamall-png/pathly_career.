import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const sandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(new URL("../public/password-toggle.js", import.meta.url), "utf8"), sandbox);
const { togglePasswordVisibility } = sandbox.module.exports;

function createButton() {
  const attributes = new Map();
  const classes = new Set();

  return {
    attributes,
    classes,
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      }
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    }
  };
}

test("ikon mata membuka dan menyembunyikan password", () => {
  const input = { type: "password" };
  const button = createButton();

  togglePasswordVisibility(input, button);
  assert.equal(input.type, "text");
  assert.equal(button.classes.has("is-visible"), true);
  assert.equal(button.attributes.get("aria-label"), "Hide password");
  assert.equal(button.attributes.get("aria-pressed"), "true");

  togglePasswordVisibility(input, button);
  assert.equal(input.type, "password");
  assert.equal(button.classes.has("is-visible"), false);
  assert.equal(button.attributes.get("aria-label"), "Show password");
  assert.equal(button.attributes.get("aria-pressed"), "false");
});

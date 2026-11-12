// This small control runs without module imports or a backend connection.
(function () {
  function updateButton(input, button) {
    const visible = input.type === "text";
    const label = visible ? "Hide password" : "Show password";
    button.classList.toggle("is-visible", visible);
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", String(visible));
  }

  function togglePasswordVisibility(input, button) {
    if (!input || !button) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.type = input.type === "password" ? "text" : "password";
    updateButton(input, button);
    if (typeof input.setSelectionRange === "function" && start !== null) {
      input.setSelectionRange(start, end);
    }
  }

  function initializePasswordToggles(root = document) {
    const owner = root.ownerDocument || root;
    root.querySelectorAll("[data-password-toggle]").forEach(function (button) {
      if (button.dataset.passwordToggleBound === "true") return;
      const input = owner.getElementById(button.dataset.passwordToggle);
      if (!input || !["password", "text"].includes(input.type)) return;
      button.type = "button";
      button.dataset.passwordToggleBound = "true";
      button.setAttribute("aria-controls", input.id);
      updateButton(input, button);
      button.addEventListener("click", function (event) {
        event.preventDefault();
        togglePasswordVisibility(input, button);
      });
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { togglePasswordVisibility, initializePasswordToggles };
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        initializePasswordToggles();
      }, { once: true });
    } else {
      initializePasswordToggles();
    }
  }
})();

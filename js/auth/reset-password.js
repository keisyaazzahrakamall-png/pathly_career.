import { supabase } from "../lib/supabase.js";

const card = document.getElementById("resetCard");
const status = document.getElementById("resetStatus");
const retryLink = document.getElementById("resetRetry");
const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("resetPassword");
const confirmationInput = document.getElementById("resetPasswordConfirm");
const message = document.getElementById("resetMessage");
const submitButton = document.getElementById("resetButton");
const submitLabel = submitButton.querySelector(".button-label");
const successPanel = document.getElementById("resetSuccess");
let recoveryAccessGranted = false;
const RECOVERY_WAIT_ATTEMPTS = 16;
const RECOVERY_WAIT_INTERVAL_MS = 250;

function showForm() {
  recoveryAccessGranted = true;
  card.setAttribute("aria-busy", "false");
  status.hidden = true;
  retryLink.hidden = true;
  form.hidden = false;
}

function showInvalidLink() {
  card.setAttribute("aria-busy", "false");
  form.hidden = true;
  status.hidden = false;
  status.textContent = "This reset link is invalid or has expired. Request a new link on the forgot password page.";
  status.className = "auth-message show error auth-reset-status";
  retryLink.hidden = false;
}

function showError(text) {
  message.textContent = text;
  message.className = "auth-message show error";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitLabel.textContent = isLoading ? "Saving Password..." : "Save New Password";
}

supabase.auth.onAuthStateChange(function (event) {
  if (event === "PASSWORD_RECOVERY") showForm();
});

const hasRecoveryData =
  new URLSearchParams(window.location.search).has("code") ||
  window.location.hash.includes("access_token=") ||
  window.location.hash.includes("type=recovery");

const {
  data: { session }
} = await supabase.auth.getSession();

if (session) {
  showForm();
} else if (hasRecoveryData) {
  for (let attempt = 0; attempt < RECOVERY_WAIT_ATTEMPTS; attempt += 1) {
    await new Promise(function (resolve) {
      window.setTimeout(resolve, RECOVERY_WAIT_INTERVAL_MS);
    });

    if (recoveryAccessGranted) break;

    const {
      data: { session: delayedSession }
    } = await supabase.auth.getSession();

    if (delayedSession) {
      showForm();
      break;
    }
  }

  if (!recoveryAccessGranted) showInvalidLink();
} else {
  showInvalidLink();
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  message.className = "auth-message";

  const password = passwordInput.value;
  const confirmation = confirmationInput.value;

  passwordInput.setAttribute("aria-invalid", "false");
  confirmationInput.setAttribute("aria-invalid", "false");

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    passwordInput.setAttribute("aria-invalid", "true");
    showError("Your password must contain at least 8 characters, including letters and numbers.");
    passwordInput.focus();
    return;
  }

  if (password !== confirmation) {
    confirmationInput.setAttribute("aria-invalid", "true");
    showError("The passwords do not match.");
    confirmationInput.focus();
    return;
  }

  setLoading(true);
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    setLoading(false);
    showError("Your password could not be updated. Request a new reset link and try again.");
    return;
  }

  await supabase.auth.signOut({ scope: "local" });
  form.hidden = true;
  status.hidden = true;
  successPanel.hidden = false;
  card.setAttribute("aria-busy", "false");
  successPanel.focus();
});

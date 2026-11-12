import { supabase } from "../lib/supabase.js";
import { getPasswordResetErrorMessage } from "../lib/auth-error-messages.js";
import { getEmailTypoMessage } from "../lib/email-validation.js";

const form = document.getElementById("forgotPasswordForm");
const formPanel = document.getElementById("forgotFormPanel");
const emailInput = document.getElementById("forgotEmail");
const message = document.getElementById("forgotMessage");
const submitButton = document.getElementById("forgotButton");
const submitLabel = submitButton.querySelector(".button-label");
const successPanel = document.getElementById("forgotSuccess");
const successEmail = document.getElementById("forgotSuccessEmail");

function showError(text) {
  message.textContent = text;
  message.className = "auth-message show error";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitLabel.textContent = isLoading ? "Sending Link..." : "Send Reset Link";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  message.className = "auth-message";
  emailInput.setAttribute("aria-invalid", "false");

  const email = emailInput.value.trim().toLowerCase();

  if (!emailInput.validity.valid || !email) {
    emailInput.setAttribute("aria-invalid", "true");
    showError("Enter a valid email address.");
    emailInput.focus();
    return;
  }

  const emailTypoMessage = getEmailTypoMessage(email);

  if (emailTypoMessage) {
    emailInput.setAttribute("aria-invalid", "true");
    showError(emailTypoMessage);
    emailInput.focus();
    return;
  }

  setLoading(true);

  const redirectTo = new URL("reset-password.html", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  setLoading(false);

  if (error) {
    showError(getPasswordResetErrorMessage(error));
    return;
  }

  successEmail.textContent = email;
  formPanel.hidden = true;
  successPanel.hidden = false;
  successPanel.focus();
});

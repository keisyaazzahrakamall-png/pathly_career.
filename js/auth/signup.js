import { supabase } from "../lib/supabase.js";
import { getSignupErrorMessage } from "../lib/auth-error-messages.js";
import { getEmailTypoMessage } from "../lib/email-validation.js";

const form = document.getElementById("signupForm");
const formPanel = document.getElementById("signupFormPanel");
const successPanel = document.getElementById("signupSuccess");
const successEmail = document.getElementById("signupSuccessEmail");
const message = document.getElementById("signupMessage");
const submitButton = document.getElementById("signupButton");
const submitLabel = submitButton.querySelector(".button-label");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `auth-message show ${type}`;
}

function clearMessage() {
  message.textContent = "";
  message.className = "auth-message";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitLabel.textContent = isLoading ? "Creating Account..." : "Create Account";
}

function markInvalid(input, isInvalid) {
  input.setAttribute("aria-invalid", String(isInvalid));
}

function validateForm(fullName, email, password, confirmation) {
  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const confirmationInput = document.getElementById("signupPasswordConfirm");
  const consentInput = document.getElementById("signupConsent");

  [nameInput, emailInput, passwordInput, confirmationInput, consentInput].forEach(function (input) {
    markInvalid(input, false);
  });

  const missingFields = [];
  const missingInputs = [];

  if (!fullName) {
    missingFields.push("name");
    missingInputs.push(nameInput);
  }
  if (!email) {
    missingFields.push("email");
    missingInputs.push(emailInput);
  }
  if (!password) {
    missingFields.push("password");
    missingInputs.push(passwordInput);
  }
  if (!confirmation) {
    missingFields.push("password confirmation");
    missingInputs.push(confirmationInput);
  }
  if (!consentInput.checked) {
    missingFields.push("data-use consent");
    missingInputs.push(consentInput);
  }

  if (missingFields.length) {
    missingInputs.forEach(function (input) { markInvalid(input, true); });
    return `Please complete the following: ${missingFields.join(", ")}.`;
  }

  if (fullName.length < 2) {
    markInvalid(nameInput, true);
    return "Your name must contain at least 2 characters.";
  }

  if (!emailInput.validity.valid) {
    markInvalid(emailInput, true);
    return "Enter a valid email address.";
  }

  const emailTypoMessage = getEmailTypoMessage(email);

  if (emailTypoMessage) {
    markInvalid(emailInput, true);
    return emailTypoMessage;
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    markInvalid(passwordInput, true);
    return "Your password must contain at least 8 characters, including letters and numbers.";
  }

  if (password !== confirmation) {
    markInvalid(confirmationInput, true);
    return "The passwords do not match.";
  }

  return "";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearMessage();

  const fullName = form.elements.fullName.value.trim().replace(/\s+/g, " ");
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  const confirmation = form.elements.passwordConfirm.value;
  const validationError = validateForm(fullName, email, password, confirmation);

  if (validationError) {
    showMessage(validationError);
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid?.focus({ preventScroll: true });
    return;
  }

  setLoading(true);

  const redirectUrl = new URL("confirm-email.html", window.location.href).href;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { full_name: fullName }
    }
  });

  setLoading(false);

  if (error) {
    showMessage(getSignupErrorMessage(error));
    return;
  }

  if (data.session) {
    window.location.href = "onboarding.html";
    return;
  }

  successEmail.textContent = email;
  formPanel.hidden = true;
  successPanel.hidden = false;
  successPanel.focus();
});

const { data: sessionData } = await supabase.auth.getSession();

if (sessionData.session) {
  window.location.replace("login.html");
}

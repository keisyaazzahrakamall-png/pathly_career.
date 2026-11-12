import { supabase } from "../lib/supabase.js";
import { getLoginErrorMessage } from "../lib/auth-error-messages.js";
import { getEmailTypoMessage } from "../lib/email-validation.js";
import { loadAccountRole } from './role-session.js';
import { loginDestination } from '../lib/roles.js';

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const message = document.getElementById("loginMessage");
const submitButton = document.getElementById("loginButton");
const submitLabel = submitButton.querySelector(".button-label");
function getRequestedDestination() {
  return new URLSearchParams(window.location.search).get('next') || '';
}

function showMessage(text) {
  message.textContent = text;
  message.className = "auth-message show error";
}

function clearMessage() {
  message.textContent = "";
  message.className = "auth-message";
  emailInput.setAttribute("aria-invalid", "false");
  passwordInput.setAttribute("aria-invalid", "false");
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitLabel.textContent = isLoading ? "Checking Account..." : "Sign In";
}

async function getDestination(userId) {
  const role = await loadAccountRole(userId);
  return loginDestination(role, getRequestedDestination());
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearMessage();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email && !password) {
    emailInput.setAttribute("aria-invalid", "true");
    passwordInput.setAttribute("aria-invalid", "true");
    showMessage("Please enter your email and password.");
    emailInput.focus();
    return;
  }

  if (!emailInput.validity.valid) {
    emailInput.setAttribute("aria-invalid", "true");
    showMessage("Enter a valid email address.");
    return;
  }

  const emailTypoMessage = getEmailTypoMessage(email);

  if (emailTypoMessage) {
    emailInput.setAttribute("aria-invalid", "true");
    showMessage(emailTypoMessage);
    emailInput.focus();
    return;
  }

  if (!password) {
    passwordInput.setAttribute("aria-invalid", "true");
    showMessage("Enter your account password.");
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      emailInput.setAttribute("aria-invalid", "true");
      passwordInput.setAttribute("aria-invalid", "true");
      showMessage(getLoginErrorMessage(error));
      return;
    }

    const destination = await getDestination(data.user.id);
    window.location.replace(destination);
  } catch (error) {
    showMessage(error.message || 'Sign in failed. Check your connection and try again.');
  } finally {
    setLoading(false);
  }
});

try {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    const destination = await getDestination(sessionData.session.user.id);
    window.location.replace(destination);
  }
} catch (error) {
  showMessage(error.message);
}

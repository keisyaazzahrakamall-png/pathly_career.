import { supabase } from "../lib/supabase.js";

const card = document.getElementById("confirmationCard");
const state = document.getElementById("confirmationState");
const icon = document.getElementById("confirmationIcon");
const label = document.getElementById("confirmationLabel");
const title = document.getElementById("confirmationStateTitle");
const description = document.getElementById("confirmationDescription");
const email = document.getElementById("confirmationEmail");
const primaryAction = document.getElementById("confirmationPrimary");
const retryAction = document.getElementById("confirmationRetry");
const VERIFICATION_WAIT_ATTEMPTS = 16;
const VERIFICATION_WAIT_INTERVAL_MS = 250;
let verificationResolved = false;

function finishState() {
  verificationResolved = true;
  card.setAttribute("aria-busy", "false");
  state.focus();
}

function showSuccess(session) {
  icon.textContent = "✓";
  icon.classList.remove("auth-confirmation-icon-error");
  label.textContent = "EMAIL VERIFIED";
  title.textContent = "Your account is active.";
  description.textContent =
    "Verification complete. Fill in your profile so Pathly can personalize your career journey.";

  if (session?.user?.email) {
    email.textContent = session.user.email;
    email.hidden = false;
  }

  primaryAction.hidden = false;
  primaryAction.href = 'login.html';
  primaryAction.textContent = 'Open My Dashboard →';
  retryAction.hidden = true;
  window.history.replaceState({}, document.title, window.location.pathname);
  finishState();
}

function showFailure(reason = "") {
  const expired = /expired|otp_expired/i.test(reason);

  icon.textContent = "!";
  icon.classList.add("auth-confirmation-icon-error");
  label.textContent = expired ? "LINK EXPIRED" : "VERIFICATION UNSUCCESSFUL";
  title.textContent = expired
    ? "Your verification link has expired."
    : "Your verification link is invalid.";
  description.textContent = expired
    ? "Return to the sign-up page to request a new verification email."
    : "Open the link directly from your Pathly email or return to the sign-up page to try again.";
  email.hidden = true;
  primaryAction.hidden = true;
  retryAction.hidden = false;
  finishState();
}

function getUrlValue(name) {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get(name) || hash.get(name) || "";
}

function hasVerificationData() {
  return Boolean(
    getUrlValue("code") ||
    getUrlValue("token_hash") ||
    getUrlValue("access_token") ||
    ["signup", "email", "magiclink"].includes(getUrlValue("type"))
  );
}

function resolveSession(session) {
  if (!session?.user) return false;
  showSuccess(session);
  return true;
}

supabase.auth.onAuthStateChange(function (event, session) {
  if (
    !verificationResolved &&
    ["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED"].includes(event)
  ) {
    resolveSession(session);
  }
});

const urlError = getUrlValue("error_description") || getUrlValue("error_code");
const {
  data: { session },
  error: sessionError
} = await supabase.auth.getSession();

if (!verificationResolved && resolveSession(session)) {
  } else if (!verificationResolved && (urlError || sessionError)) {
  showFailure(urlError || sessionError.message);
} else if (!verificationResolved && hasVerificationData()) {
  for (let attempt = 0; attempt < VERIFICATION_WAIT_ATTEMPTS; attempt += 1) {
    await new Promise(function (resolve) {
      window.setTimeout(resolve, VERIFICATION_WAIT_INTERVAL_MS);
    });

    if (verificationResolved) break;

    const {
      data: { session: delayedSession }
    } = await supabase.auth.getSession();

    if (resolveSession(delayedSession)) break;
  }

  if (!verificationResolved) showFailure();
} else if (!verificationResolved) {
  showFailure();
}

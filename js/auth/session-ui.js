import { supabase } from "../lib/supabase.js";
import { resetCareerJourney } from "../lib/user-data.js";
import { loadAccountRole } from './role-session.js';
import { ROLE_LABELS, dashboardForRole } from '../lib/roles.js';

const PATHLY_STORAGE_KEYS = [
  "pathlyProfile",
  "pathlyCareerStage",
  "pathlyCareerTarget",
  "pathlyComparedCareers",
  "pathlyAssessmentResults",
  "pathlyScoringResult",
  "pathlyAdaptabilityCheck",
  "pathlyRoadmapData",
  "pathlyRoadmapId",
  "pathlyCompletedTasks",
  "pathlyCustomCareers",
  "pathlyCustomCareer",
  "pathlyCacheUserId"
];

const authSlots = document.querySelectorAll("[data-auth-slot]");

function createLink(href, label, className = "") {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (className) link.className = className;
  return link;
}

function getDisplayName(user, profile) {
  return (
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Pathly User"
  );
}

function getInitials(name) {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function clearPathlyLocalData() {
  PATHLY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function profileIsComplete(profile) {
  return Boolean(
    profile?.full_name?.trim() &&
    profile?.education_level &&
    profile?.major?.trim() &&
    profile?.semester &&
    profile?.graduation_year
  );
}

function updateJourneyLinks(destination, signedIn) {
  document.querySelectorAll("[data-journey-link]").forEach((link) => {
    const label = signedIn
      ? link.dataset.signedInLabel || "Open My Path"
      : link.dataset.signedOutLabel || "Start My Career Path";

    link.href = signedIn ? destination : "signup.html";
    link.replaceChildren(document.createTextNode(`${label} `));

    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.append(arrow);
  });
}

async function resolveJourneyDestination(userId, profile) {
  if (!profileIsComplete(profile)) return "onboarding.html";

  const { data: journey } = await supabase
    .from("career_journeys")
    .select("career_stage, target_career_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!journey?.career_stage) return "career-stage.html";
  if (!journey?.target_career_id) {
    return `career.html?mode=${encodeURIComponent(journey.career_stage)}`;
  }

  const [assessmentResponse, roadmapResponse] = await Promise.all([
    supabase
      .from("assessments")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("career_id", journey.target_career_id)
      .maybeSingle(),
    supabase
      .from("roadmaps")
      .select("id")
      .eq("user_id", userId)
      .eq("career_id", journey.target_career_id)
      .maybeSingle()
  ]);

  if (roadmapResponse.data?.id) return "my-path.html";
  if (assessmentResponse.data?.completed_at) return "results.html";
  return "assessment.html";
}

async function handleLogout(button) {
  button.disabled = true;
  button.textContent = "Signing Out...";

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    button.disabled = false;
    button.textContent = "Sign Out";
    button.setAttribute("title", "Could not sign out. Please try again.");
    return;
  }

  clearPathlyLocalData();
  window.location.replace("index.html");
}

function renderSignedOut(slot) {
  slot.replaceChildren();
  updateJourneyLinks("signup.html", false);

  if (slot.dataset.authContext === "public") {
    slot.append(createLink("signup.html", "Start My Path", "btn-nav"));
    return;
  }

  slot.append(createLink("login.html", "Sign In", "session-login-link"));
}

function renderSignedIn(slot, name, email, destination, role) {
  slot.replaceChildren();

  if (slot.dataset.authContext === "public") {
    const journeyLabel = role !== 'student' ? `${ROLE_LABELS[role]} Dashboard` : destination === "my-path.html"
      ? "Open My Path"
      : "Continue My Path";
    slot.append(createLink(destination, journeyLabel, "btn-nav"));
  }

  updateJourneyLinks(destination, true);
  if (role !== 'student') {
    document.querySelectorAll('[data-journey-link]').forEach((link) => {
      link.textContent = `Open ${ROLE_LABELS[role]} Dashboard →`;
    });
  }

  const profileMenu = document.createElement("div");
  profileMenu.className = "profile-menu";

  const account = document.createElement("button");
  account.type = "button";
  account.className = "account-chip profile-trigger";
  account.title = "Open profile";
  account.setAttribute("aria-label", `Open profile menu for ${name}`);
  account.setAttribute("aria-expanded", "false");
  account.setAttribute("aria-haspopup", "menu");

  const avatar = document.createElement("span");
  avatar.className = "account-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = getInitials(name);

  account.append(avatar);

  const menuPanel = document.createElement("div");
  menuPanel.className = "profile-menu-panel";
  menuPanel.setAttribute("role", "menu");
  menuPanel.hidden = true;

  const menuHeader = document.createElement("div");
  menuHeader.className = "profile-menu-header";

  const menuAvatar = document.createElement("span");
  menuAvatar.className = "account-avatar profile-menu-avatar";
  menuAvatar.setAttribute("aria-hidden", "true");
  menuAvatar.textContent = getInitials(name);

  const identity = document.createElement("span");
  identity.className = "profile-identity";

  const profileName = document.createElement("strong");
  profileName.textContent = name;

  const profileEmail = document.createElement("small");
  profileEmail.textContent = email || "Email unavailable";

  identity.append(profileName, profileEmail);
  menuHeader.append(menuAvatar, identity);

  const editProfile = createLink(
    "onboarding.html?edit=profile",
    "Edit Profile",
    "profile-menu-item"
  );
  editProfile.setAttribute("role", "menuitem");

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "profile-menu-item profile-menu-reset";
  resetButton.textContent = "Reset Journey";
  resetButton.setAttribute("role", "menuitem");

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "profile-menu-item profile-menu-logout";
  logoutButton.textContent = "Sign Out";
  logoutButton.setAttribute("role", "menuitem");
  logoutButton.addEventListener("click", () => handleLogout(logoutButton));

  const dashboardLink = createLink(dashboardForRole(role), `${ROLE_LABELS[role]} Dashboard`, 'profile-menu-item');
  dashboardLink.setAttribute('role', 'menuitem');
  menuPanel.append(menuHeader, dashboardLink);
  if (role === 'student') menuPanel.append(editProfile, resetButton);
  menuPanel.append(logoutButton);
  profileMenu.append(account, menuPanel);
  slot.append(profileMenu);

  function setMenuOpen(isOpen) {
    menuPanel.hidden = !isOpen;
    account.setAttribute("aria-expanded", String(isOpen));
    profileMenu.classList.toggle("open", isOpen);
  }

  document.querySelector("[data-reset-dialog]")?.remove();

  const resetDialog = document.createElement("div");
  resetDialog.className = "reset-dialog-backdrop";
  resetDialog.dataset.resetDialog = "";
  resetDialog.hidden = true;
  resetDialog.innerHTML = `
    <section class="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="resetDialogTitle" aria-describedby="resetDialogDescription">
      <span class="reset-dialog-icon" aria-hidden="true">↻</span>
      <div>
        <p class="reset-dialog-label">RESET JOURNEY</p>
        <h2 id="resetDialogTitle">Reset your career journey?</h2>
        <p id="resetDialogDescription">Your career choices, assessment responses, roadmaps, and progress will be deleted. Your account and education profile will be kept.</p>
        <p class="reset-dialog-message" aria-live="polite"></p>
      </div>
      <div class="reset-dialog-actions">
        <button type="button" class="reset-dialog-cancel">Cancel</button>
        <button type="button" class="reset-dialog-confirm">Yes, reset journey</button>
      </div>
    </section>`;

  document.body.append(resetDialog);

  const cancelReset = resetDialog.querySelector(".reset-dialog-cancel");
  const confirmReset = resetDialog.querySelector(".reset-dialog-confirm");
  const resetMessage = resetDialog.querySelector(".reset-dialog-message");

  function closeResetDialog() {
    if (confirmReset.disabled) return;
    resetDialog.hidden = true;
    document.body.classList.remove("dialog-open");
    resetMessage.textContent = "";
    resetButton.focus();
  }

  resetButton.addEventListener("click", function () {
    setMenuOpen(false);
    resetDialog.hidden = false;
    document.body.classList.add("dialog-open");
    cancelReset.focus();
  });

  cancelReset.addEventListener("click", closeResetDialog);

  resetDialog.addEventListener("click", function (event) {
    if (event.target === resetDialog) closeResetDialog();
  });

  confirmReset.addEventListener("click", async function () {
    cancelReset.disabled = true;
    confirmReset.disabled = true;
    confirmReset.textContent = "Deleting...";
    resetMessage.textContent = "Deleting this account's journey data...";

    const { error } = await resetCareerJourney();

    if (error) {
      cancelReset.disabled = false;
      confirmReset.disabled = false;
      confirmReset.textContent = "Try again";
      resetMessage.textContent =
        "Your data could not be deleted. Check your connection and try again.";
      resetMessage.classList.add("error");
      return;
    }

    resetMessage.classList.remove("error");
    resetMessage.textContent = "Journey reset successfully.";
    window.location.replace("career-stage.html?reset=success");
  });

  account.addEventListener("click", function (event) {
    event.stopPropagation();
    setMenuOpen(menuPanel.hidden);
  });

  menuPanel.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", function () {
    setMenuOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !resetDialog.hidden) {
      closeResetDialog();
      return;
    }

    if (event.key === "Escape" && !menuPanel.hidden) {
      setMenuOpen(false);
      account.focus();
    }
  });
}

async function renderSession() {
  if (!authSlots.length) return;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    authSlots.forEach(renderSignedOut);
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, education_level, major, semester, graduation_year")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = await loadAccountRole(session.user.id);
  const destination = role === 'student'
    ? await resolveJourneyDestination(session.user.id, profile)
    : dashboardForRole(role);
  const name = getDisplayName(session.user, profile);
  authSlots.forEach((slot) =>
    renderSignedIn(slot, name, session.user.email, destination, role)
  );
}

function renderSessionError() {
  authSlots.forEach((slot) => {
    slot.replaceChildren(createLink('login.html', 'Account setup required', 'session-login-link'));
  });
}
renderSession().catch(renderSessionError);

supabase.auth.onAuthStateChange((event) => {
  // Schedule outside the Auth callback to avoid a nested Auth request lock.
  if (event === 'SIGNED_OUT') {
    clearPathlyLocalData();
    window.setTimeout(() => window.location.replace('login.html'), 0);
  }
  if (event === "SIGNED_IN" || event === "USER_UPDATED") {
    window.setTimeout(() => renderSession().catch(renderSessionError), 0);
  }
});

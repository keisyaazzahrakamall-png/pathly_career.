import "../page-transition.js";
import {
  finishPageLoading,
  showPageLoadError,
  startPageLoading
} from "../page-state.js";
import { requireRole } from "../auth/role-session.js";
import { hydrateUserData } from "../lib/user-data.js";

export async function loadCareerFoundation({ withScoring = false } = {}) {
  const foundationModules = [import("../careers.js")];

  if (withScoring) {
    foundationModules.push(import("../requirements.js"));
  }

  await Promise.all(foundationModules);
  await import("../custom-careers.js");

  if (withScoring) {
    await import("../scoring.js");
  }
}

export async function bootstrapProtectedPage({
  loadingMessage,
  loadPage
}) {
  startPageLoading(loadingMessage);

  try {
    await requireRole(['student']);
    await hydrateUserData();

    await Promise.all([
      import("../auth/session-ui.js"),
      loadPage()
    ]);

    finishPageLoading();
  } catch (error) {
    console.error(error);
    showPageLoadError();
  }
}

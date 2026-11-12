import {
  bootstrapProtectedPage,
  loadCareerFoundation
} from "./bootstrap-protected.js";

await bootstrapProtectedPage({
  loadingMessage: "Preparing your career roadmap...",
  loadPage: async () => {
    await loadCareerFoundation({ withScoring: true });
    await import("../roadmap.js");
  }
});

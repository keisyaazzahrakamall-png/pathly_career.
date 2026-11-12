import {
  bootstrapProtectedPage,
  loadCareerFoundation
} from "./bootstrap-protected.js";

await bootstrapProtectedPage({
  loadPage: async () => {
    await loadCareerFoundation({ withScoring: true });
    await import("../readiness.js");
  }
});

import {
  bootstrapProtectedPage,
  loadCareerFoundation
} from "./bootstrap-protected.js";

await bootstrapProtectedPage({
  loadingMessage: "Loading your journey progress...",
  loadPage: async () => {
    await loadCareerFoundation({ withScoring: true });
    await import("../my-path.js");
  }
});

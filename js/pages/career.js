import {
  bootstrapProtectedPage,
  loadCareerFoundation
} from "./bootstrap-protected.js";

await bootstrapProtectedPage({
  loadPage: async () => {
    await loadCareerFoundation();
    await import("../career-page.js");
  }
});

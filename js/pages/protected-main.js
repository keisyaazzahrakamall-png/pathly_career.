import { bootstrapProtectedPage } from "./bootstrap-protected.js";

await bootstrapProtectedPage({
  loadPage: () => import("../app.js")
});

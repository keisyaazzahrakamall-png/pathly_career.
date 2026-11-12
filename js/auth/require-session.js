import { supabase } from "../lib/supabase.js";

const PROTECTED_PAGES = new Set([
  "onboarding.html",
  "career-stage.html",
  "career.html",
  "assessment.html",
  "results.html",
  "readiness.html",
  "roadmap.html",
  "my-path.html",
  "student-dashboard.html",
  "supervisor-dashboard.html",
  "admin-dashboard.html"
]);

function getCurrentPage() {
  const page = window.location.pathname.split("/").pop();
  return PROTECTED_PAGES.has(page) ? page : "onboarding.html";
}

export async function requireSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (session?.user && !error) {
    return session.user;
  }

  const destination = encodeURIComponent(getCurrentPage());
  window.location.replace(`login.html?next=${destination}`);

   return new Promise(() => {});
}

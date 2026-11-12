// Routing is a convenience; Supabase RLS enforces permissions independently.
export const ROLES = Object.freeze(['student', 'supervisor', 'admin']);
export const ROLE_LABELS = Object.freeze({ student: 'Student', supervisor: 'Supervisor', admin: 'Admin' });
export const ROLE_DASHBOARDS = Object.freeze({
  student: 'student-dashboard.html',
  supervisor: 'supervisor-dashboard.html',
  admin: 'admin-dashboard.html'
});
const STUDENT_PAGES = new Set([
  'student-dashboard.html', 'onboarding.html', 'career-stage.html', 'career.html',
  'assessment.html', 'results.html', 'readiness.html', 'roadmap.html', 'my-path.html'
]);
export function dashboardForRole(role) {
  if (!Object.hasOwn(ROLE_DASHBOARDS, role)) throw new Error('Unknown account role.');
  return ROLE_DASHBOARDS[role];
}
export function pageAllowedForRole(page, role) {
  if (role === 'student') return STUDENT_PAGES.has(page);
  return Object.hasOwn(ROLE_DASHBOARDS, role) && page === ROLE_DASHBOARDS[role];
}
export function loginDestination(role, requestedPage = '') {
  return pageAllowedForRole(requestedPage, role) ? requestedPage : dashboardForRole(role);
}

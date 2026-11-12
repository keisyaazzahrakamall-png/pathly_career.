import '../page-transition.js';
import { requireRole } from '../auth/role-session.js';
import { el, showStatus } from '../lib/dashboard-ui.js';

export async function startDashboard(role, load) {
  const status = document.getElementById('dashboardStatus');
  try {
    const account = await requireRole([role]);
    await import('../auth/session-ui.js');
    await load(account);
    document.getElementById('dashboardContent').hidden = false;
    showStatus(status, '');
    return account;
  } catch (error) {
    showStatus(status, error.message || 'This dashboard could not be loaded. Check your connection and try again.', true);
    const retry = el('button', 'Try again', 'dash-button');
    retry.type = 'button';
    retry.addEventListener('click', () => window.location.reload());
    status.append(document.createTextNode(' '), retry);
    return null;
  }
}

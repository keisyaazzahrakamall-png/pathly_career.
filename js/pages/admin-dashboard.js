import { startDashboard } from './dashboard-bootstrap.js';
import { requireRole } from '../auth/role-session.js';
import { loadAdminData, setUserRole, assignSupervisor } from '../lib/supervision-data.js';
import { studentSummary } from '../lib/dashboard-summary.js';
import { ROLES, ROLE_LABELS } from '../lib/roles.js';
import { el, nameOf, showStatus, createProgress, addCell, option, dateLabel } from '../lib/dashboard-ui.js';

const $ = (id) => document.getElementById(id);
let account, data, busy = false;
function roleOf(id) { return data.roles.find((row) => row.user_id === id)?.role; }
function sortedProfiles() { return [...data.profiles].sort((a, b) => nameOf(a).localeCompare(nameOf(b))); }
function identity(profile) {
  const box = el('div', '', 'dash-identity');
  box.append(el('strong', nameOf(profile)), el('small', profile.id));
  return box;
}
function renderAccounts() {
  const tbody = $('accountRows');
  tbody.replaceChildren();
  const query = $('accountSearch').value.trim().toLowerCase();
  for (const profile of sortedProfiles().filter((p) => `${nameOf(p)} ${p.major || ''} ${p.id}`.toLowerCase().includes(query))) {
    const role = roleOf(profile.id);
    if (!role) continue;
    const row = el('tr');
    addCell(row, identity(profile)); addCell(row, profile.major || 'Not provided');
    addCell(row, el('span', ROLE_LABELS[role], 'dash-tag'));
    const actions = el('div', '', 'dash-actions');
    const select = el('select');
    select.setAttribute('aria-label', `Role for ${nameOf(profile)}`);
    ROLES.forEach((value) => select.append(option(value, ROLE_LABELS[value])));
    select.value = role;
    const save = el('button', profile.id === account.user.id ? 'Your account' : 'Save', 'dash-button');
    save.type = 'button';
    select.disabled = save.disabled = busy || profile.id === account.user.id;
    save.addEventListener('click', () => mutate('roleMessage', async () => {
      await setUserRole(profile.id, select.value);
    }, `Role updated for ${nameOf(profile)}.`));
    actions.append(select, save); addCell(row, actions); tbody.append(row);
  }
  if (!tbody.children.length) { const row = el('tr'); const cell = addCell(row, 'No matching accounts.'); cell.colSpan = 4; tbody.append(row); }
}
function renderAssignments() {
  const tbody = $('assignmentRows'); tbody.replaceChildren();
  const supervisors = sortedProfiles().filter((p) => roleOf(p.id) === 'supervisor');
  const students = sortedProfiles().filter((p) => roleOf(p.id) === 'student');
  for (const profile of students) {
    const summary = studentSummary(profile, data.journeys, data.roadmaps, data.tasks);
    const row = el('tr'); addCell(row, identity(profile)); addCell(row, summary.career); addCell(row, createProgress(summary.progress));
    const controls = el('div', '', 'dash-actions'); const select = el('select');
    select.setAttribute('aria-label', `Supervisor for ${nameOf(profile)}`);
    select.append(option('', 'Unassigned'));
    supervisors.forEach((p) => select.append(option(p.id, `${nameOf(p)} · ${p.id.slice(0, 8)}`)));
    select.value = data.assignments.find((a) => a.student_id === profile.id)?.supervisor_id || '';
    const save = el('button', 'Save', 'dash-button'); save.type = 'button';
    select.disabled = save.disabled = busy;
    save.addEventListener('click', () => mutate('assignmentMessage', async () => {
      await assignSupervisor(profile.id, select.value);
    }, `Assignment saved for ${nameOf(profile)}.`));
    controls.append(select, save); addCell(row, controls); tbody.append(row);
  }
  if (!students.length) { const row = el('tr'); const cell = addCell(row, 'No Student accounts yet. Register a Student account to begin.'); cell.colSpan = 4; tbody.append(row); }
}
function renderAll() {
  const students = data.roles.filter((row) => row.role === 'student').length;
  $('adminStudents').textContent = students;
  $('adminSupervisors').textContent = data.roles.filter((row) => row.role === 'supervisor').length;
  $('adminAdmins').textContent = data.roles.filter((row) => row.role === 'admin').length;
  $('adminAssigned').textContent = data.assignments.length;
  $('adminUnassigned').textContent = `${students - data.assignments.length} students waiting for an assignment`;
  renderAccounts(); renderAssignments();
  $('roleHistory').replaceChildren();
  if (!data.history.length) $('roleHistory').append(el('p', 'No role changes recorded yet.', 'dash-empty'));
  for (const entry of data.history) {
    const target = data.profiles.find((p) => p.id === entry.user_id);
    const actor = data.profiles.find((p) => p.id === entry.changed_by);
    $('roleHistory').append(el('p', `${nameOf(target)}: ${ROLE_LABELS[entry.old_role]} → ${ROLE_LABELS[entry.new_role]} · by ${nameOf(actor)} · ${dateLabel(entry.created_at)}`, 'dash-muted dash-subtitle'));
  }
}
async function reload() {
  account = await requireRole(['admin']);
  data = await loadAdminData(); renderAll();
}
async function mutate(messageId, action, success) {
  if (busy) return;
  busy = true;
  // Read the selected value before rerendering controls.
  const request = action();
  renderAccounts(); renderAssignments();
  showStatus($(messageId), 'Saving...');
  let saved = false;
  try {
    await request; saved = true;
    await reload(); showStatus($(messageId), success);
  } catch (error) {
    showStatus($(messageId), saved ? `Saved, but the dashboard could not refresh: ${error.message}` : error.message, true);
  } finally { busy = false; renderAccounts(); renderAssignments(); }
}
await startDashboard('admin', async (session) => {
  account = session; data = await loadAdminData(); renderAll();
  $('accountSearch').addEventListener('input', renderAccounts);
  $('refreshDashboard').addEventListener('click', async () => {
    if (busy) return;
    $('refreshDashboard').disabled = true;
    try { await reload(); showStatus($('dashboardStatus'), 'Dashboard updated.'); }
    catch (error) { showStatus($('dashboardStatus'), error.message, true); }
    finally { $('refreshDashboard').disabled = false; }
  });
});

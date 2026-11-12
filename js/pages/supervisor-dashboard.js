import { startDashboard } from './dashboard-bootstrap.js';
import { requireRole } from '../auth/role-session.js';
import { loadSupervisorData, loadStudentDetails, sendFeedback } from '../lib/supervision-data.js';
import { studentSummary } from '../lib/dashboard-summary.js';
import { el, nameOf, showStatus, createProgress, addCell, option, renderFeedback, dateLabel } from '../lib/dashboard-ui.js';

const $ = (id) => document.getElementById(id);
let account, data, selectedId = null, details = null, reviewRequest = 0;
let sending = false;
const summaries = () => data.profiles.map((profile) => studentSummary(profile, data.journeys, data.roadmaps, data.tasks));
function renderStudents() {
  const items = summaries();
  const active = items.filter((item) => item.roadmap);
  $('supervisorStudents').textContent = items.length;
  $('supervisorTargets').textContent = items.filter((item) => item.journey?.target_career_id).length;
  $('supervisorRoadmaps').textContent = active.length;
  $('supervisorProgress').textContent = active.length
    ? `${Math.round(active.reduce((total, item) => total + item.progress.percent, 0) / active.length)}%` : '—';
  const query = $('studentSearch').value.trim().toLowerCase();
  const tbody = $('studentRows'); tbody.replaceChildren();
  for (const item of items.filter((s) => `${nameOf(s.profile)} ${s.profile.major || ''}`.toLowerCase().includes(query))
    .sort((a, b) => nameOf(a.profile).localeCompare(nameOf(b.profile)))) {
    const row = el('tr'); const identity = el('div', '', 'dash-identity');
    identity.append(el('strong', nameOf(item.profile)), el('small', item.profile.major || 'No major provided'));
    addCell(row, identity); addCell(row, item.career); addCell(row, createProgress(item.progress));
    const review = el('button', 'Review student →', 'dash-button'); review.type = 'button';
    review.disabled = sending;
    review.setAttribute('aria-label', `Review ${nameOf(item.profile)}`);
    review.addEventListener('click', () => openReview(item.profile.id));
    addCell(row, review); tbody.append(row);
  }
  if (!tbody.children.length) {
    const row = el('tr'); const cell = addCell(row, items.length ? 'No matching students.' : 'No Students assigned yet. Ask your Admin to assign a Student.');
    cell.colSpan = 4; tbody.append(row);
  }
}
function renderAssessments() {
  const container = $('studentAssessments'); container.replaceChildren();
  if (!details.assessments.length) container.append(el('p', 'No saved assessments yet.', 'dash-empty'));
  for (const assessment of details.assessments) {
    const section = el('details', '', 'feedback-card');
    const summary = el('summary', `${assessment.career_name} · ${assessment.completed_at ? 'Completed' : 'In progress'}`);
    section.append(summary, el('p', `Last saved: ${dateLabel(assessment.updated_at)}`, 'dash-muted dash-subtitle'));
    const savedResult = details.readiness.find((row) => row.career_id === assessment.career_id)?.result;
    if (typeof savedResult?.alignment === 'number' && Number.isFinite(savedResult.alignment)) {
      section.append(el('p', `Saved skill alignment: ${savedResult.alignment}% (self-assessment)`, 'dash-muted'));
    }
    const table = el('table', '', 'dash-table');
    const thead = el('thead'); const heading = el('tr');
    for (const name of ['Skill', 'Level (0–3)', 'Reference note']) { const th = el('th', name); th.scope = 'col'; heading.append(th); }
    thead.append(heading); const tbody = el('tbody');
    for (const [skill, answer] of Object.entries(assessment.answers || {})) {
      const row = el('tr'); addCell(row, skill); addCell(row, String(answer?.level ?? '—'));
      const categories = Array.isArray(answer?.evidence) ? answer.evidence.join(', ') : '';
      addCell(row, [categories, answer?.evidenceDetail].filter(Boolean).join(' · ') || 'No reference recorded');
      tbody.append(row);
    }
    table.append(thead, tbody); const wrap = el('div', '', 'dash-table-wrap'); wrap.append(table); section.append(wrap); container.append(section);
  }
}
function renderTasks(item) {
  const list = $('reviewTasks'); list.replaceChildren();
  const tasks = Array.isArray(item.roadmap?.roadmap_data?.tasks) ? item.roadmap.roadmap_data.tasks : [];
  const complete = new Set(data.tasks.filter((row) => row.roadmap_id === item.roadmap?.id && row.completed).map((row) => row.task_key));
  if (!tasks.length) list.append(el('li', 'No roadmap saved for the current career target.'));
  for (const task of tasks) {
    const row = el('li', `${complete.has(String(task.id)) ? '✓ Complete' : '○ Pending'} · ${task.title || 'Roadmap task'}`);
    row.append(el('span', [task.skill, task.type, task.estimate].filter(Boolean).join(' · '))); list.append(row);
  }
}
function closeReview() {
  selectedId = null; reviewRequest += 1;
  $('studentReview').hidden = true;
  $('feedbackForm').reset();
}
async function openReview(id) {
  if (sending) return;
  const item = summaries().find((entry) => entry.profile.id === id);
  if (!item) return;
  selectedId = id;
  const request = ++reviewRequest;
  $('studentReview').hidden = false; $('reviewContent').hidden = true;
  $('reviewTitle').textContent = nameOf(item.profile);
  $('reviewMeta').textContent = `${item.profile.major || 'Major not provided'} · ${item.career}`;
  $('feedbackForm').reset(); showStatus($('feedbackMessage'), '');
  showStatus($('reviewStatus'), 'Loading student details...');
  try {
    const result = await loadStudentDetails(id);
    if (request !== reviewRequest) return;
    // An assignment can be revoked between list loading and this request.
    const current = await loadSupervisorData(account.user.id);
    if (request !== reviewRequest) return;
    data = current;
    renderStudents();
    if (!data.profiles.some((p) => p.id === id)) {
      closeReview(); showStatus($('dashboardStatus'), 'This Student is no longer assigned to you.', true); return;
    }
    details = result; renderAssessments(); renderTasks(summaries().find((s) => s.profile.id === id));
    const select = $('feedbackCareer'); select.replaceChildren(option('', 'General guidance'));
    const careers = new Map();
    for (const assessment of details.assessments) careers.set(assessment.career_id, assessment.career_name);
    if (item.journey?.target_career_id) careers.set(item.journey.target_career_id, item.career);
    for (const [careerId, name] of careers) select.append(option(careerId, name));
    select.value = item.journey?.target_career_id || '';
    renderFeedback($('reviewFeedback'), details.feedback, (supervisorId) => supervisorId === account.user.id ? 'You' : 'Previous supervisor');
    showStatus($('reviewStatus'), ''); $('reviewContent').hidden = false;
    $('studentReview').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (request === reviewRequest) showStatus($('reviewStatus'), error.message, true);
  }
}
await startDashboard('supervisor', async (session) => {
  account = session; data = await loadSupervisorData(account.user.id); renderStudents();
  $('studentSearch').addEventListener('input', renderStudents);
  $('closeReview').addEventListener('click', closeReview);
  $('refreshDashboard').addEventListener('click', async () => {
    if (sending) return;
    $('refreshDashboard').disabled = true;
    try {
      account = await requireRole(['supervisor']); data = await loadSupervisorData(account.user.id);
      closeReview(); renderStudents(); showStatus($('dashboardStatus'), 'Dashboard updated.');
    } catch (error) { showStatus($('dashboardStatus'), error.message, true); }
    finally { $('refreshDashboard').disabled = false; }
  });
  $('feedbackForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !selectedId) return;
    const body = $('feedbackBody').value.trim();
    if (body.length < 5 || body.length > 3000) {
      showStatus($('feedbackMessage'), 'Please enter feedback between 5 and 3,000 characters.', true); return;
    }
    const studentId = selectedId;
    const career = $('feedbackCareer');
    sending = true; $('sendFeedback').disabled = true; $('closeReview').disabled = true;
    $('feedbackBody').disabled = true; career.disabled = true; renderStudents();
    let saved = false;
    try {
      await sendFeedback({ studentId, supervisorId: account.user.id, careerId: career.value,
        careerName: career.selectedOptions[0]?.textContent, body });
      saved = true;
      $('feedbackBody').value = '';
      details = await loadStudentDetails(studentId);
      renderFeedback($('reviewFeedback'), details.feedback, (id) => id === account.user.id ? 'You' : 'Previous supervisor');
      showStatus($('feedbackMessage'), 'Feedback sent. Your Student can read it on their dashboard.');
    } catch (error) {
      showStatus($('feedbackMessage'), saved ? 'Feedback was saved. Refresh to reload its history.' : error.message, true);
    } finally {
      sending = false; $('sendFeedback').disabled = false; $('closeReview').disabled = false;
      $('feedbackBody').disabled = false; career.disabled = false; renderStudents();
    }
  });
});

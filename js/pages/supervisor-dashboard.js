
import { startDashboard } from './dashboard-bootstrap.js';
import { requireRole } from '../auth/role-session.js';
import {
  loadSupervisorData,
  loadStudentDetails,
  sendFeedback
} from '../lib/supervision-data.js';

import { studentSummary } from '../lib/dashboard-summary.js';

import {
  el,
  nameOf,
  showStatus,
  createProgress,
  addCell,
  option,
  renderFeedback,
  dateLabel
} from '../lib/dashboard-ui.js';

const $ = (id) => document.getElementById(id);

let account;
let data;
let selectedId = null;
let details = null;
let reviewRequest = 0;
let sending = false;

const summaries = () =>
  data.profiles.map((profile) =>
    studentSummary(
      profile,
      data.journeys,
      data.roadmaps,
      data.tasks
    )
  );

function renderStudents() {
  const items = summaries();
  const active = items.filter((item) => item.roadmap);

  $('supervisorStudents').textContent = items.length;

  $('supervisorTargets').textContent =
    items.filter((item) => item.journey?.target_career_id).length;

  $('supervisorRoadmaps').textContent = active.length;

  $('supervisorProgress').textContent = active.length
    ? `${Math.round(
        active.reduce(
          (total, item) => total + item.progress.percent,
          0
        ) / active.length
      )}%`
    : '—';

  const query = $('studentSearch').value.trim().toLowerCase();
  const tbody = $('studentRows');

  tbody.replaceChildren();

  for (const item of items
    .filter((student) =>
      `${nameOf(student.profile)} ${student.profile.major || ''}`
        .toLowerCase()
        .includes(query)
    )
    .sort((a, b) =>
      nameOf(a.profile).localeCompare(nameOf(b.profile))
    )) {

    const row = el('tr');
    const identity = el('div', '', 'dash-identity');

    identity.append(
      el('strong', nameOf(item.profile)),
      el('small', item.profile.major || 'No major provided')
    );

    addCell(row, identity);
    addCell(row, item.career);
    addCell(row, createProgress(item.progress));

    const review = el('button', 'Review student →', 'dash-button');

    review.type = 'button';
    review.disabled = sending;

    review.setAttribute(
      'aria-label',
      `Review ${nameOf(item.profile)}`
    );

    review.addEventListener('click', () =>
      openReview(item.profile.id)
    );

    addCell(row, review);
    tbody.append(row);
  }

  if (!tbody.children.length) {
    const row = el('tr');

    const cell = addCell(
      row,
      items.length
        ? 'No matching students.'
        : 'No Students assigned yet. Ask your Admin to assign a Student.'
    );

    cell.colSpan = 4;
    tbody.append(row);
  }
}

function renderAssessments() {
  const container = $('studentAssessments');
  container.replaceChildren();

  if (!details.assessments.length) {
    container.append(
      el('p', 'No saved assessments yet.', 'dash-empty')
    );
  }

  for (const assessment of details.assessments) {
    const section = el('details', '', 'feedback-card');

    const summary = el(
      'summary',
      `${assessment.career_name} · ${
        assessment.completed_at ? 'Completed' : 'In progress'
      }`
    );

    section.append(
      summary,
      el(
        'p',
        `Last saved: ${dateLabel(assessment.updated_at)}`,
        'dash-muted dash-subtitle'
      )
    );

    const savedResult = details.readiness.find(
      (row) => row.career_id === assessment.career_id
    )?.result;

    if (
      typeof savedResult?.alignment === 'number' &&
      Number.isFinite(savedResult.alignment)
    ) {
      section.append(
        el(
          'p',
          `Saved skill alignment: ${savedResult.alignment}% (self-assessment)`,
          'dash-muted'
        )
      );
    }

    const table = el('table', '', 'dash-table');
    const thead = el('thead');
    const heading = el('tr');

    for (const name of ['Skill', 'Level (0–3)', 'Reference note']) {
      const th = el('th', name);
      th.scope = 'col';
      heading.append(th);
    }

    thead.append(heading);

    const tbody = el('tbody');

    for (const [skill, answer] of Object.entries(
      assessment.answers || {}
    )) {
      const row = el('tr');

      addCell(row, skill);
      addCell(row, String(answer?.level ?? '—'));

      const categories = Array.isArray(answer?.evidence)
        ? answer.evidence.join(', ')
        : '';

      addCell(
        row,
        [categories, answer?.evidenceDetail]
          .filter(Boolean)
          .join(' · ') || 'No reference recorded'
      );

      tbody.append(row);
    }

    table.append(thead, tbody);

    const wrap = el('div', '', 'dash-table-wrap');
    wrap.append(table);
    section.append(wrap);
    container.append(section);
  }
}

function renderTasks(item) {
  const list = $('reviewTasks');
  list.replaceChildren();

  const tasks = Array.isArray(
    item.roadmap?.roadmap_data?.tasks
  )
    ? item.roadmap.roadmap_data.tasks
    : [];

  const complete = new Set(
    data.tasks
      .filter(
        (row) =>
          row.roadmap_id === item.roadmap?.id &&
          row.completed
      )
      .map((row) => row.task_key)
  );

  if (!tasks.length) {
    list.append(
      el('li', 'No roadmap saved for the current career target.')
    );
  }

  for (const task of tasks) {
    const row = el(
      'li',
      `${complete.has(String(task.id)) ? '✓ Complete' : '○ Pending'} · ${
        task.title || 'Roadmap task'
      }`
    );

    row.append(
      el(
        'span',
        [task.skill, task.type, task.estimate]
          .filter(Boolean)
          .join(' · ')
      )
    );

    list.append(row);
  }
}

// ======================================
// STUDENT PROGRESS REPORT
// ======================================

function appendReportLine(container, label, value) {
  const paragraph = el('p');
  const strong = el('strong', `${label}: `);

  paragraph.append(
    strong,
    document.createTextNode(value || 'Not available')
  );

  container.append(paragraph);
}

function renderStudentReport() {
  if (!selectedId || !details) return;

  const item = summaries().find(
    (entry) => entry.profile.id === selectedId
  );

  if (!item) return;

  const report = $('studentReport');
  const info = $('reportStudentInfo');
  const assessments = $('reportAssessments');
  const tasksContainer = $('reportTasks');
  const feedbackContainer = $('reportFeedback');

  if (
    !report ||
    !info ||
    !assessments ||
    !tasksContainer ||
    !feedbackContainer
  ) {
    return;
  }

  // STUDENT INFORMATION
  info.replaceChildren();

  appendReportLine(
    info,
    'Student',
    nameOf(item.profile)
  );

  appendReportLine(
    info,
    'Email',
    item.profile.email ||
      item.profile.user_email ||
      'Not available'
  );

  appendReportLine(
    info,
    'Major',
    item.profile.major || 'Not provided'
  );

  appendReportLine(
    info,
    'Career target',
    item.career || 'Not selected'
  );

  appendReportLine(
    info,
    'Report date',
    new Date().toLocaleDateString()
  );

  // ASSESSMENTS
  assessments.replaceChildren();

  if (!details.assessments.length) {
    assessments.append(
      el('p', 'No saved assessment data available.')
    );
  } else {
    for (const assessment of details.assessments) {
      const block = el('section', '', 'report-assessment');

      block.append(
        el('h3', assessment.career_name || 'Career assessment')
      );

      appendReportLine(
        block,
        'Status',
        assessment.completed_at
          ? 'Completed'
          : 'In progress'
      );

      appendReportLine(
        block,
        'Last updated',
        dateLabel(assessment.updated_at)
      );

      const readiness = details.readiness.find(
        (row) => row.career_id === assessment.career_id
      );

      if (
        typeof readiness?.result?.alignment === 'number' &&
        Number.isFinite(readiness.result.alignment)
      ) {
        appendReportLine(
          block,
          'Saved skill alignment',
          `${readiness.result.alignment}% (self-assessment)`
        );
      }

      const answers = Object.entries(
        assessment.answers || {}
      );

      if (answers.length) {
        const list = el('ul');

        for (const [skill, answer] of answers) {
          const evidence = Array.isArray(answer?.evidence)
            ? answer.evidence.join(', ')
            : '';

          const note = [
            evidence,
            answer?.evidenceDetail
          ]
            .filter(Boolean)
            .join(' · ');

          list.append(
            el(
              'li',
              `${skill}: Level ${answer?.level ?? '—'}${
                note ? ` · ${note}` : ''
              }`
            )
          );
        }

        block.append(list);
      } else {
        block.append(
          el('p', 'No individual skill answers recorded.')
        );
      }

      assessments.append(block);
    }
  }

  // ROADMAP PROGRESS
  tasksContainer.replaceChildren();

  const tasks = Array.isArray(
    item.roadmap?.roadmap_data?.tasks
  )
    ? item.roadmap.roadmap_data.tasks
    : [];

  const completed = new Set(
    data.tasks
      .filter(
        (row) =>
          row.roadmap_id === item.roadmap?.id &&
          row.completed
      )
      .map((row) => row.task_key)
  );

  const doneCount = tasks.filter(
    (task) => completed.has(String(task.id))
  ).length;

  const percentage = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;

  appendReportLine(
    tasksContainer,
    'Progress',
    tasks.length
      ? `${doneCount}/${tasks.length} tasks completed (${percentage}%)`
      : 'No roadmap tasks available'
  );

  if (tasks.length) {
    const list = el('ul');

    for (const task of tasks) {
      const isDone = completed.has(String(task.id));

      const extra = [
        task.skill,
        task.type,
        task.estimate
      ]
        .filter(Boolean)
        .join(' · ');

      list.append(
        el(
          'li',
          `${isDone ? 'Completed' : 'Pending'} · ${
            task.title || 'Roadmap task'
          }${extra ? ` (${extra})` : ''}`
        )
      );
    }

    tasksContainer.append(list);
  }

  // SUPERVISOR FEEDBACK
  feedbackContainer.replaceChildren();

  const renderedFeedback = $('reviewFeedback');

  if (
    !renderedFeedback ||
    !renderedFeedback.textContent.trim() ||
    renderedFeedback.textContent.toLowerCase().includes('no feedback')
  ) {
    feedbackContainer.append(
      el('p', 'No supervisor feedback available.')
    );
  } else {
    const feedbackCopy = renderedFeedback.cloneNode(true);

    feedbackCopy
      .querySelectorAll('button, form, input, textarea, select')
      .forEach((node) => node.remove());

    feedbackContainer.append(feedbackCopy);
  }

  $('reportGeneratedDate').textContent =
    new Date().toLocaleString();

  report.hidden = false;
  $('printStudentReport').hidden = false;

  report.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// ======================================
// REVIEW STUDENT
// ======================================

function closeReview() {
  selectedId = null;
  reviewRequest += 1;

  $('studentReview').hidden = true;
  $('studentReport').hidden = true;
  $('printStudentReport').hidden = true;

  $('feedbackForm').reset();
}

async function openReview(id) {
  if (sending) return;

  const item = summaries().find(
    (entry) => entry.profile.id === id
  );

  if (!item) return;

  selectedId = id;

  const request = ++reviewRequest;

  $('studentReview').hidden = false;
  $('reviewContent').hidden = true;
  $('studentReport').hidden = true;
  $('printStudentReport').hidden = true;

  $('reviewTitle').textContent = nameOf(item.profile);

  $('reviewMeta').textContent =
    `${item.profile.major || 'Major not provided'} · ${item.career}`;

  $('feedbackForm').reset();
  showStatus($('feedbackMessage'), '');

  showStatus(
    $('reviewStatus'),
    'Loading student details...'
  );

  try {
    const result = await loadStudentDetails(id);

    if (request !== reviewRequest) return;

    const current = await loadSupervisorData(account.user.id);

    if (request !== reviewRequest) return;

    data = current;
    renderStudents();

    if (!data.profiles.some((profile) => profile.id === id)) {
      closeReview();

      showStatus(
        $('dashboardStatus'),
        'This Student is no longer assigned to you.',
        true
      );

      return;
    }

    details = result;

    renderAssessments();

    renderTasks(
      summaries().find((student) => student.profile.id === id)
    );

    const select = $('feedbackCareer');

    select.replaceChildren(
      option('', 'General guidance')
    );

    const careers = new Map();

    for (const assessment of details.assessments) {
      careers.set(
        assessment.career_id,
        assessment.career_name
      );
    }

    if (item.journey?.target_career_id) {
      careers.set(
        item.journey.target_career_id,
        item.career
      );
    }

    for (const [careerId, name] of careers) {
      select.append(option(careerId, name));
    }

    select.value =
      item.journey?.target_career_id || '';

    renderFeedback(
      $('reviewFeedback'),
      details.feedback,
      (supervisorId) =>
        supervisorId === account.user.id
          ? 'You'
          : 'Previous supervisor'
    );

    showStatus($('reviewStatus'), '');

    $('reviewContent').hidden = false;

    $('studentReview').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  } catch (error) {
    if (request === reviewRequest) {
      showStatus(
        $('reviewStatus'),
        error.message,
        true
      );
    }
  }
}

// ======================================
// INITIALIZE DASHBOARD
// ======================================

await startDashboard('supervisor', async (session) => {

  account = session;

  data = await loadSupervisorData(account.user.id);

  renderStudents();

  $('studentSearch').addEventListener(
    'input',
    renderStudents
  );

  $('closeReview').addEventListener(
    'click',
    closeReview
  );

  $('generateStudentReport')?.addEventListener(
    'click',
    renderStudentReport
  );

  $('printStudentReport')?.addEventListener(
    'click',
    () => {
      if (!$('studentReport')?.hidden) {
        window.print();
      }
    }
  );

  $('refreshDashboard').addEventListener(
    'click',
    async () => {
      if (sending) return;

      $('refreshDashboard').disabled = true;

      try {
        account = await requireRole(['supervisor']);

        data = await loadSupervisorData(account.user.id);

        closeReview();
        renderStudents();

        showStatus(
          $('dashboardStatus'),
          'Dashboard updated.'
        );

      } catch (error) {
        showStatus(
          $('dashboardStatus'),
          error.message,
          true
        );

      } finally {
        $('refreshDashboard').disabled = false;
      }
    }
  );

  // FEEDBACK FORM
  $('feedbackForm').addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (sending || !selectedId) return;

      const body = $('feedbackBody').value.trim();

      if (body.length < 5 || body.length > 3000) {
        showStatus(
          $('feedbackMessage'),
          'Please enter feedback between 5 and 3,000 characters.',
          true
        );

        return;
      }

      const studentId = selectedId;
      const career = $('feedbackCareer');

      sending = true;

      $('sendFeedback').disabled = true;
      $('closeReview').disabled = true;
      $('feedbackBody').disabled = true;
      career.disabled = true;

      renderStudents();

      let saved = false;

      try {
        await sendFeedback({
          studentId,
          supervisorId: account.user.id,
          careerId: career.value,
          careerName: career.selectedOptions[0]?.textContent,
          body
        });

        saved = true;

        $('feedbackBody').value = '';

        details = await loadStudentDetails(studentId);

        renderFeedback(
          $('reviewFeedback'),
          details.feedback,
          (id) =>
            id === account.user.id
              ? 'You'
              : 'Previous supervisor'
        );

        showStatus(
          $('feedbackMessage'),
          'Feedback sent. Your Student can read it on their dashboard.'
        );

      } catch (error) {
        showStatus(
          $('feedbackMessage'),
          saved
            ? 'Feedback was saved. Refresh to reload its history.'
            : error.message,
          true
        );

      } finally {
        sending = false;

        $('sendFeedback').disabled = false;
        $('closeReview').disabled = false;
        $('feedbackBody').disabled = false;
        career.disabled = false;

        renderStudents();
      }
    }
  );
});

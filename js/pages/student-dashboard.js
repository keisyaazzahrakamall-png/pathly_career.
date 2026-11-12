import { startDashboard } from './dashboard-bootstrap.js';
import { loadStudentDashboard } from '../lib/supervision-data.js';
import { studentSummary } from '../lib/dashboard-summary.js';
import { nameOf, renderFeedback, showStatus } from '../lib/dashboard-ui.js';
import { requireRole } from '../auth/role-session.js';

const $ = (id) => document.getElementById(id);
async function render(user) {
  const data = await loadStudentDashboard(user.id);
  if (!data.profile) throw new Error('Your profile is missing. Run migration 002 and try again.');
  const summary = studentSummary(data.profile, data.journeys, data.roadmaps, data.tasks);
  $('studentWelcome').textContent = `Welcome, ${nameOf(data.profile)}.`;
  $('studentTarget').textContent = summary.journey?.target_career_name || 'Not set';
  $('studentTarget').style.fontSize = '22px';
  $('studentProgress').textContent = `${summary.progress.percent}%`;
  $('studentTasks').textContent = `${summary.progress.completed} of ${summary.progress.total} tasks completed`;
  $('studentAssessments').textContent = data.assessments.filter((row) => row.completed_at).length;
  $('studentFeedbackCount').textContent = data.feedback.length;
  $('studentSupervisor').textContent = data.supervisor ? `Your supervisor: ${nameOf(data.supervisor)}` : 'No supervisor assigned yet. Your Admin can connect you with one.';
  renderFeedback($('studentFeedback'), data.feedback, (id) => id === data.supervisor?.id ? nameOf(data.supervisor) : 'Supervisor');
  const profileComplete = data.profile.education_level && data.profile.major?.trim() && data.profile.semester && data.profile.graduation_year;
  let href = 'career-stage.html';
  let description = 'Choose your career direction to start building a plan.';
  if (!profileComplete) {
    href = 'onboarding.html';
    description = 'Complete your education profile to personalize your career journey.';
  } else if (summary.roadmap) {
    href = 'my-path.html';
    description = 'Open My Path to continue your tasks and review your skill gaps.';
  } else if (summary.journey?.target_career_id) {
    href = 'assessment.html';
    description = 'Complete or update your skills assessment, then build your roadmap.';
  } else if (summary.journey?.career_stage) {
    href = `career.html?mode=${encodeURIComponent(summary.journey.career_stage)}`;
  }
  $('continueJourney').href = href;
  $('studentNextStep').textContent = description;
}
await startDashboard('student', async ({ user }) => {
  await render(user);
  $('refreshFeedback').addEventListener('click', async () => {
    $('refreshFeedback').disabled = true;
    try {
      const account = await requireRole(['student']);
      await render(account.user);
      showStatus($('dashboardStatus'), 'Dashboard updated.');
    } catch (error) { showStatus($('dashboardStatus'), error.message, true); }
    finally { $('refreshFeedback').disabled = false; }
  });
});

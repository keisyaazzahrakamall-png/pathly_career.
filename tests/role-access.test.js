import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardForRole, loginDestination, pageAllowedForRole } from '../js/lib/roles.js';
import { roadmapProgress, studentSummary } from '../js/lib/dashboard-summary.js';

test('every role opens its own dashboard after sign-in', () => {
  for (const role of ['student', 'supervisor', 'admin']) assert.equal(loginDestination(role), `${role}-dashboard.html`);
});
test('a return URL cannot send users to another role or another site', () => {
  for (const role of ['student', 'supervisor', 'admin']) {
    for (const target of ['https://example.com', '//example.com', 'javascript:alert(1)', '../admin-dashboard.html', 'admin-dashboard.html?x=1']) {
      assert.equal(loginDestination(role, target), dashboardForRole(role));
    }
  }
  assert.equal(loginDestination('student', 'admin-dashboard.html'), 'student-dashboard.html');
  assert.equal(loginDestination('supervisor', 'my-path.html'), 'supervisor-dashboard.html');
  assert.equal(loginDestination('admin', 'supervisor-dashboard.html'), 'admin-dashboard.html');
  assert.equal(loginDestination('student', 'assessment.html'), 'assessment.html');
});
test('unknown roles fail closed and student pages are explicitly allowed', () => {
  assert.throws(() => dashboardForRole('owner'));
  assert.throws(() => dashboardForRole('__proto__'));
  assert.equal(pageAllowedForRole('my-path.html', 'supervisor'), false);
  assert.equal(pageAllowedForRole('my-path.html', 'student'), true);
});
test('roadmap progress ignores obsolete, duplicate, and other-roadmap task rows', () => {
  const roadmap = { id: 'r1', roadmap_data: { tasks: [{ id: 't1' }, { id: 't2' }] } };
  assert.deepEqual(roadmapProgress(roadmap, [
    { roadmap_id: 'r1', task_key: 't1', completed: true },
    { roadmap_id: 'r1', task_key: 't1', completed: true },
    { roadmap_id: 'r1', task_key: 'old-task', completed: true },
    { roadmap_id: 'r2', task_key: 't2', completed: true },
    { roadmap_id: 'r1', task_key: 't2', completed: false }
  ]), { total: 2, completed: 1, percent: 50 });
  assert.deepEqual(roadmapProgress(null), { total: 0, completed: 0, percent: 0 });
});
test('a student summary uses only that student and their active career', () => {
  const summary = studentSummary({ id: 'student-a' }, [
    { user_id: 'student-b', target_career_id: 'c1' },
    { user_id: 'student-a', target_career_id: 'c2', target_career_name: 'Data Analyst' }
  ], [{ id: 'r-old', user_id: 'student-a', career_id: 'c1' },
    { id: 'r-new', user_id: 'student-a', career_id: 'c2', roadmap_data: { tasks: [{ id: 't1' }] } }],
  [{ roadmap_id: 'r-old', task_key: 't1', completed: true }]);
  assert.equal(summary.roadmap.id, 'r-new');
  assert.equal(summary.career, 'Data Analyst');
  assert.equal(summary.progress.percent, 0);
});

import { supabase } from './supabase.js';

// Page through results instead of silently truncating the first 1,000 rows.
async function rows(table, columns, { filters = {}, order = 'id', ascending = true } = {}) {
  const result = [];
  for (let start = 0; ; start += 500) {
    let query = supabase.from(table).select(columns).order(order, { ascending }).range(start, start + 499);
    for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Account data could not be loaded.');
    result.push(...(data || []));
    if (!data || data.length < 500) return result;
  }
}
const profileFields = 'id, full_name, major, semester, education_level, graduation_year, created_at';
const journeyFields = 'user_id, career_stage, target_career_id, target_career_name';
const roadmapFields = 'id, user_id, career_id, roadmap_data, updated_at';
const taskFields = 'id, user_id, roadmap_id, task_key, completed';

export async function loadAdminData() {
  const [profiles, roles, assignments, journeys, roadmaps, tasks, history] = await Promise.all([
    rows('profiles', profileFields), rows('user_roles', 'user_id, role', { order: 'user_id' }),
    rows('supervisor_assignments', 'student_id, supervisor_id, updated_at', { order: 'student_id' }),
    rows('career_journeys', journeyFields, { order: 'user_id' }), rows('roadmaps', roadmapFields),
    rows('roadmap_tasks', taskFields),
    supabase.from('role_change_log').select('id, user_id, changed_by, old_role, new_role, created_at')
      .order('created_at', { ascending: false }).limit(10)
  ]);
  if (history.error) throw new Error(history.error.message);
  return { profiles, roles, assignments, journeys, roadmaps, tasks, history: history.data || [] };
}
export async function loadSupervisorData(userId) {
  const assignments = await rows('supervisor_assignments', 'student_id, supervisor_id',
    { filters: { supervisor_id: userId }, order: 'student_id' });
  const [profiles, journeys, roadmaps, tasks] = await Promise.all([
    rows('profiles', profileFields), rows('career_journeys', journeyFields, { order: 'user_id' }),
    rows('roadmaps', roadmapFields), rows('roadmap_tasks', taskFields)
  ]);
  const assignedIds = new Set(assignments.map((row) => row.student_id));
  return { profiles: profiles.filter((row) => assignedIds.has(row.id)), assignments, journeys, roadmaps, tasks };
}
export async function loadStudentDetails(studentId) {
  const [assessments, readiness, feedback] = await Promise.all([
    rows('assessments', 'id, career_id, career_name, answers, completed_at, updated_at', { filters: { user_id: studentId } }),
    rows('career_readiness', 'id, career_id, result, updated_at', { filters: { user_id: studentId } }),
    rows('supervisor_feedback', 'id, supervisor_id, career_id, career_name, body, created_at',
      { filters: { student_id: studentId }, order: 'created_at', ascending: false })
  ]);
  return { assessments, readiness, feedback };
}
export async function loadStudentDashboard(userId) {
  const [profiles, journeys, roadmaps, tasks, assignments, feedback, assessments] = await Promise.all([
    rows('profiles', profileFields, { filters: { id: userId } }),
    rows('career_journeys', journeyFields, { filters: { user_id: userId }, order: 'user_id' }),
    rows('roadmaps', roadmapFields, { filters: { user_id: userId } }),
    rows('roadmap_tasks', taskFields, { filters: { user_id: userId } }),
    rows('supervisor_assignments', 'student_id, supervisor_id', { filters: { student_id: userId }, order: 'student_id' }),
    rows('supervisor_feedback', 'id, supervisor_id, career_name, body, created_at',
      { filters: { student_id: userId }, order: 'created_at', ascending: false }),
    rows('assessments', 'id, completed_at', { filters: { user_id: userId } })
  ]);
  let supervisor = null;
  if (assignments[0]?.supervisor_id) {
    const result = await rows('profiles', 'id, full_name', { filters: { id: assignments[0].supervisor_id } });
    supervisor = result[0] || null;
  }
  return { profile: profiles[0], journeys, roadmaps, tasks, supervisor, feedback, assessments };
}
export async function setUserRole(userId, role) {
  const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
  if (error) throw new Error(error.message);
}
export async function assignSupervisor(studentId, supervisorId) {
  const { error } = await supabase.rpc('admin_assign_supervisor',
    { p_student_id: studentId, p_supervisor_id: supervisorId || null });
  if (error) throw new Error(error.message);
}
export async function sendFeedback({ studentId, supervisorId, careerId, careerName, body }) {
  const { error } = await supabase.from('supervisor_feedback').insert({ student_id: studentId,
    supervisor_id: supervisorId, career_id: careerId || null, career_name: careerName || 'General guidance', body: body.trim() });
  if (error) throw new Error(error.message);
}

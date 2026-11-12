export function roadmapProgress(roadmap, taskRows = []) {
  const taskIds = new Set((Array.isArray(roadmap?.roadmap_data?.tasks) ? roadmap.roadmap_data.tasks : [])
    .map((task) => String(task.id)));
  const completedIds = new Set(taskRows
    .filter((row) => row.roadmap_id === roadmap?.id && row.completed && taskIds.has(String(row.task_key)))
    .map((row) => String(row.task_key)));
  return { total: taskIds.size, completed: completedIds.size,
    percent: taskIds.size ? Math.round(completedIds.size / taskIds.size * 100) : 0 };
}
export function studentSummary(profile, journeys = [], roadmaps = [], tasks = []) {
  const journey = journeys.find((row) => row.user_id === profile.id);
  const roadmap = roadmaps.find((row) => row.user_id === profile.id && row.career_id === journey?.target_career_id);
  return { profile, journey, roadmap, progress: roadmapProgress(roadmap, tasks),
    career: journey?.target_career_name || 'No career target yet' };
}

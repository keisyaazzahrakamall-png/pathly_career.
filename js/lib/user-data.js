import { normalizeAssessmentLanguage, normalizeRoadmapLanguage } from "./legacy-language.js";
import { supabase } from "./supabase.js";

const CAREER_JOURNEY_CACHE_KEYS = [
  "pathlyCareerStage",
  "pathlyCareerTarget",
  "pathlyComparedCareers",
  "pathlyAssessmentResults",
  "pathlyScoringResult",
  "pathlyAdaptabilityCheck",
  "pathlyRoadmapData",
  "pathlyRoadmapId",
  "pathlyCompletedTasks",
  "pathlyCustomCareers",
  "pathlyCustomCareer"
];

const ACTIVE_CAREER_CACHE_KEYS = [
  "pathlyAssessmentResults",
  "pathlyScoringResult",
  "pathlyAdaptabilityCheck",
  "pathlyRoadmapData",
  "pathlyRoadmapId",
  "pathlyCompletedTasks"
];

const PATHLY_USER_CACHE_KEYS = [
  "pathlyProfile",
  ...CAREER_JOURNEY_CACHE_KEYS
];

const CACHE_OWNER_KEY = "pathlyCacheUserId";

function setCache(key, value) {
  if (key === "pathlyAssessmentResults") value = normalizeAssessmentLanguage(value);
  if (key === "pathlyRoadmapData") value = normalizeRoadmapLanguage(value);
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(
    key,
    typeof value === "string" ? value : JSON.stringify(value)
  );
}

async function getUserId() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user?.id || null;
}

function prepareCacheForUser(userId) {
  const cacheOwner = localStorage.getItem(CACHE_OWNER_KEY);

  if (cacheOwner !== userId) {
    PATHLY_USER_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  localStorage.setItem(CACHE_OWNER_KEY, userId);
}

export async function hydrateUserData() {
  const userId = await getUserId();
  if (!userId) return;

    prepareCacheForUser(userId);

  const [profileResponse, journeyResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, education_level, major, semester, graduation_year, experiences"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("career_journeys")
      .select(
        "career_stage, target_career_id, target_career_name, compared_career_ids, custom_career"
      )
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (profileResponse.error || journeyResponse.error) {
    throw new Error("Your account data could not be loaded.");
  }

  if (profileResponse.data) {
    const profile = profileResponse.data;
    setCache("pathlyProfile", {
      fullName: profile.full_name || "",
      educationLevel: profile.education_level || "",
      major: profile.major || "",
      semester: profile.semester ? String(profile.semester) : "",
      graduationYear: profile.graduation_year
        ? String(profile.graduation_year)
        : "",
      experience: Array.isArray(profile.experiences)
        ? profile.experiences
        : []
    });
  }

  const journey = journeyResponse.data;
  if (!journey) {
    [
      "pathlyCareerStage",
      "pathlyCareerTarget",
      "pathlyComparedCareers",
      "pathlyCustomCareers",
      "pathlyCustomCareer",
      "pathlyAssessmentResults",
      "pathlyAdaptabilityCheck",
      "pathlyScoringResult",
      "pathlyRoadmapData",
      "pathlyRoadmapId",
      "pathlyCompletedTasks"
    ].forEach((key) => setCache(key, null));
    return;
  }

  setCache("pathlyCareerStage", journey.career_stage || null);
  setCache("pathlyCareerTarget", journey.target_career_id || null);
  setCache(
    "pathlyComparedCareers",
    journey.compared_career_ids?.length
      ? journey.compared_career_ids
      : null
  );
  const customCareers = Array.isArray(journey.custom_career)
    ? journey.custom_career
    : journey.custom_career
      ? [journey.custom_career]
      : null;

  setCache("pathlyCustomCareers", customCareers?.length ? customCareers : null);
  setCache("pathlyCustomCareer", null);

  const careerId = journey.target_career_id;
  if (!careerId) {
    [
      "pathlyAssessmentResults",
      "pathlyAdaptabilityCheck",
      "pathlyScoringResult",
      "pathlyRoadmapData",
      "pathlyRoadmapId",
      "pathlyCompletedTasks"
    ].forEach((key) => setCache(key, null));
    return;
  }

  const [assessmentResponse, readinessResponse, roadmapResponse] =
    await Promise.all([
      supabase
        .from("assessments")
        .select("career_id, career_name, answers, updated_at")
        .eq("user_id", userId)
        .eq("career_id", careerId)
        .maybeSingle(),
      supabase
        .from("career_readiness")
        .select("responses, result")
        .eq("user_id", userId)
        .eq("career_id", careerId)
        .maybeSingle(),
      supabase
        .from("roadmaps")
        .select("id, roadmap_data")
        .eq("user_id", userId)
        .eq("career_id", careerId)
        .maybeSingle()
    ]);

  if (
    assessmentResponse.error ||
    readinessResponse.error ||
    roadmapResponse.error
  ) {
    throw new Error("Your career journey could not be loaded.");
  }

  if (!assessmentResponse.error) {
    const assessment = assessmentResponse.data;
    setCache(
      "pathlyAssessmentResults",
      assessment
        ? {
            careerId: assessment.career_id,
            careerName:
              assessment.career_name || journey.target_career_name || "",
            answers: assessment.answers || {},
            updatedAt: assessment.updated_at
          }
        : null
    );
  }

  if (!readinessResponse.error) {
    const readiness = readinessResponse.data;
    setCache(
      "pathlyAdaptabilityCheck",
      readiness?.responses && Object.keys(readiness.responses).length
        ? readiness.responses
        : null
    );
    setCache(
      "pathlyScoringResult",
      readiness?.result && Object.keys(readiness.result).length
        ? readiness.result
        : null
    );
  }

  const roadmap = roadmapResponse.data;
  setCache("pathlyRoadmapData", roadmap?.roadmap_data || null);
  setCache("pathlyRoadmapId", roadmap?.id || null);

  if (!roadmap?.id) {
    setCache("pathlyCompletedTasks", null);
    return;
  }

  const { data: taskRows, error: taskError } = await supabase
    .from("roadmap_tasks")
    .select("task_key")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmap.id)
    .eq("completed", true);

  if (taskError) {
    throw new Error("Your roadmap progress could not be loaded.");
  }

  setCache(
    "pathlyCompletedTasks",
    taskRows?.length ? taskRows.map((row) => row.task_key) : []
  );
}

export async function saveCareerJourney(changes) {
  const userId = await getUserId();
  if (!userId) return { error: new Error("No active sign-in session.") };

  return supabase.from("career_journeys").upsert(
    { user_id: userId, ...changes },
    { onConflict: "user_id" }
  );
}

export async function getCareerHistory() {
  const userId = await getUserId();
  if (!userId) {
    return { data: [], error: new Error("No active sign-in session.") };
  }

  const [assessmentResponse, roadmapResponse] = await Promise.all([
    supabase
      .from("assessments")
      .select("career_id, career_name, completed_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("roadmaps")
      .select("career_id")
      .eq("user_id", userId)
  ]);

  if (assessmentResponse.error || roadmapResponse.error) {
    return {
      data: [],
      error: assessmentResponse.error || roadmapResponse.error
    };
  }

  const careerIdsWithRoadmap = new Set(
    (roadmapResponse.data || []).map((row) => row.career_id)
  );

  return {
    data: (assessmentResponse.data || []).map((row) => ({
      careerId: row.career_id,
      careerName: row.career_name,
      completed: Boolean(row.completed_at),
      updatedAt: row.updated_at,
      hasRoadmap: careerIdsWithRoadmap.has(row.career_id)
    })),
    error: null
  };
}

export async function activateCareerTarget(career) {
  const careerId = String(career?.careerId || "").trim();
  const careerName = String(career?.careerName || "").trim();

  if (!careerId || !careerName) {
    return { error: new Error("Career information is incomplete.") };
  }

  const { error } = await saveCareerJourney({
    target_career_id: careerId,
    target_career_name: careerName
  });

  if (error) return { error };

  setCache("pathlyCareerTarget", careerId);
  ACTIVE_CAREER_CACHE_KEYS.forEach((key) => setCache(key, null));
  return { error: null };
}

export async function saveAssessmentRecord(data, completed = false) {
  const userId = await getUserId();
  if (!userId) return { error: new Error("No active sign-in session.") };

  return supabase.from("assessments").upsert(
    {
      user_id: userId,
      career_id: data.careerId,
      career_name: data.careerName,
      answers: data.answers,
      completed_at: completed ? new Date().toISOString() : null
    },
    { onConflict: "user_id,career_id" }
  );
}

export async function saveReadinessRecord(careerId, responses, result) {
  const userId = await getUserId();
  if (!userId) return { error: new Error("No active sign-in session.") };

  return supabase.from("career_readiness").upsert(
    {
      user_id: userId,
      career_id: careerId,
      responses,
      result: result || {}
    },
    { onConflict: "user_id,career_id" }
  );
}

export async function saveRoadmapRecord(data) {
  const userId = await getUserId();
  if (!userId) return { data: null, error: new Error("No active sign-in session.") };

  return supabase
    .from("roadmaps")
    .upsert(
      {
        user_id: userId,
        career_id: data.careerId,
        roadmap_data: data,
        source_assessment_updated_at: data.assessmentUpdatedAt || null
      },
      { onConflict: "user_id,career_id" }
    )
    .select("id")
    .single();
}

export async function saveTaskProgress(roadmapId, taskKey, completed) {
  const userId = await getUserId();
  if (!userId) return { error: new Error("No active sign-in session.") };

  return supabase.from("roadmap_tasks").upsert(
    {
      user_id: userId,
      roadmap_id: roadmapId,
      task_key: taskKey,
      completed,
      completed_at: completed ? new Date().toISOString() : null
    },
    { onConflict: "user_id,roadmap_id,task_key" }
  );
}

export function clearCareerJourneyCache() {
  CAREER_JOURNEY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export async function resetCareerJourney() {
  const userId = await getUserId();
  if (!userId) return { error: new Error("No active sign-in session.") };

   const tables = [
    "roadmap_tasks",
    "roadmaps",
    "career_readiness",
    "assessments",
    "career_journeys"
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId);

    if (error) return { error };
  }

  clearCareerJourneyCache();
  return { error: null };
}

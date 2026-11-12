import { normalizeAssessmentLanguage } from "./legacy-language.js";
export function calculateCoverage(userLevel, targetLevel) {
  if (targetLevel <= 0) return 0;
  return Math.min(Math.max(userLevel, 0) / targetLevel, 1);
}

export function getGapStatus(coverage) {
  if (coverage >= 1) return "Developed";
  if (coverage > 0) return "Developing";
  return "Missing";
}

export function hasRealEvidence(evidence) {
  return (
    Array.isArray(evidence) &&
    evidence.some((item) => item && item !== "None")
  );
}

function toNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(number, 0) : 0;
}

export function calculatePathlyScore({
  targetCareer,
  assessmentData,
  careerRequirements,
  calculatedAt = new Date().toISOString()
}) {
  if (
    !targetCareer ||
    !assessmentData ||
    assessmentData.careerId !== targetCareer.id ||
    !Array.isArray(careerRequirements)
  ) {
    return null;
  }

  assessmentData = normalizeAssessmentLanguage(assessmentData);

  const skillResults = [];
  let totalWeight = 0;
  let weightedCoverage = 0;

  careerRequirements.forEach((requirement) => {
    const answer = assessmentData.answers?.[requirement.skill];
    const userLevel = toNonNegativeNumber(answer?.level);
    const targetLevel = toNonNegativeNumber(requirement.targetLevel);
    const weight = toNonNegativeNumber(requirement.weight);
    const evidence = Array.isArray(answer?.evidence)
      ? answer.evidence
      : [];
    const evidenceDetail = typeof answer?.evidenceDetail === "string"
      ? answer.evidenceDetail
      : "";
    const coverage = calculateCoverage(userLevel, targetLevel);
    const status = getGapStatus(coverage);
    const levelGap = Math.max(targetLevel - userLevel, 0);
    const hasEvidence = hasRealEvidence(evidence);

    totalWeight += weight;
    weightedCoverage += weight * coverage;

    skillResults.push({
      skill: requirement.skill,
      importance: requirement.importance,
      weight,
      targetLevel,
      userLevel,
      coverage,
      status,
      levelGap,
      evidence,
      evidenceDetail,
      hasEvidence
    });
  });

  const alignment = totalWeight > 0
    ? Math.round((weightedCoverage / totalWeight) * 100)
    : 0;
  const countStatus = (status) =>
    skillResults.filter((skill) => skill.status === status).length;
  const priorityGaps = skillResults
    .filter((skill) => skill.status !== "Developed")
    .sort((first, second) => {
      if (second.weight !== first.weight) {
        return second.weight - first.weight;
      }
      if (second.levelGap !== first.levelGap) {
        return second.levelGap - first.levelGap;
      }
      if (first.status === "Missing" && second.status !== "Missing") {
        return -1;
      }
      if (second.status === "Missing" && first.status !== "Missing") {
        return 1;
      }
      return 0;
    });

  return {
    careerId: targetCareer.id,
    careerName: targetCareer.name,
    alignment,
    totalSkills: skillResults.length,
    developedCount: countStatus("Developed"),
    developingCount: countStatus("Developing"),
    missingCount: countStatus("Missing"),
    evidenceCount: skillResults.filter((skill) => skill.hasEvidence).length,
    skills: skillResults,
    priorityGaps,
    calculatedAt
  };
}

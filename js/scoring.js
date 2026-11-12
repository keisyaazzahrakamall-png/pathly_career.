import { calculatePathlyScore } from "./lib/scoring-core.js";

const careers = window.PATHLY_CAREERS || [];
const requirements = window.PATHLY_REQUIREMENTS || {};
const savedTarget = localStorage.getItem("pathlyCareerTarget");
const savedAssessment = localStorage.getItem("pathlyAssessmentResults");

const targetCareer = careers.find(c => c.id === savedTarget);

let assessmentData = null;
if (savedAssessment) {
    try { assessmentData = JSON.parse(savedAssessment); }
    catch (e) { console.log("error", e); }
}

const scoringResult = calculatePathlyScore({
    targetCareer,
    assessmentData,
    careerRequirements: targetCareer
        ? requirements[targetCareer.id]
        : null
});
if (scoringResult) {
    localStorage.setItem("pathlyScoringResult", JSON.stringify(scoringResult));
    console.log("Pathly Scoring Result:", scoringResult);
}
window.PATHLY_SCORING_RESULT = scoringResult;

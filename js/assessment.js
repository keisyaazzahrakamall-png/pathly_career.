import { normalizeAssessmentLanguage } from "./lib/legacy-language.js";
import { saveAssessmentRecord } from "./lib/user-data.js";
import { getSkillDescription } from "./skill-glossary.js";

const careers = window.PATHLY_CAREERS || [];
const dataProvenance = window.PATHLY_DATA_PROVENANCE || null;
const savedTarget = localStorage.getItem("pathlyCareerTarget");

const targetCareer = careers.find(function (career) {
    return career.id === savedTarget;
});

let currentSkillIndex = 0;
let answers = {};
let lastUpdatedAt = null;

const assessmentCard = document.getElementById("assessmentCard");
const assessmentComplete = document.getElementById("assessmentComplete");
const assessmentTitle = document.getElementById("assessmentTitle");
const careerTargetName = document.getElementById("careerTargetName");
const skillName = document.getElementById("skillName");
const skillDefinition = document.getElementById("skillDefinition");
const skillNumber = document.getElementById("skillNumber");
const questionCounter = document.getElementById("questionCounter");
const progressPercent = document.getElementById("progressPercent");
const questionProgressValue = document.getElementById("questionProgressValue");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const assessmentMessage = document.getElementById("assessmentMessage");
const completeCareer = document.getElementById("completeCareer");
const completeSkillCount = document.getElementById("completeSkillCount");
const completeEvidenceCount = document.getElementById("completeEvidenceCount");
const questionProgress = document.querySelector(".question-progress");
const otherEvidenceInput = document.getElementById("otherEvidence");
const otherEvidenceDetail = document.getElementById("otherEvidenceDetail");
const otherEvidenceText = document.getElementById("otherEvidenceText");
const evidenceProofDetail = document.getElementById("evidenceProofDetail");
const evidenceProofText = document.getElementById("evidenceProofText");

function readSavedAssessment() {
    const savedData = localStorage.getItem("pathlyAssessmentResults");

    if (!savedData) {
        return null;
    }

    try {
        return normalizeAssessmentLanguage(JSON.parse(savedData));
    } catch (error) {
        console.log("Could not read assessment data:", error);
        return null;
    }
}

function showMessage(message) {
    assessmentMessage.textContent = message;
    assessmentMessage.classList.add("show");
}

function hideMessage() {
    assessmentMessage.classList.remove("show");
}

function formatReviewDate(isoDate) {
    const parsed = new Date(isoDate);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function renderDataProvenanceNote() {
    const noteElement = document.getElementById("dataProvenanceNote");

    if (!noteElement || !dataProvenance) {
        return;
    }

    const formattedDate = formatReviewDate(dataProvenance.lastReviewed);

    noteElement.textContent = formattedDate
        ? `Targets & weights last reviewed: ${formattedDate} • Manually curated from O*NET, ESCO, SKKNI, and sample Indonesian job listings.`
        : "Targets and weights are manually curated from O*NET, ESCO, SKKNI, and sample Indonesian job listings.";

    noteElement.hidden = false;
    noteElement.title = dataProvenance.reviewCycle || "";
}

function startAssessment() {
    assessmentTitle.textContent = `${targetCareer.name} Assessment`;
    careerTargetName.textContent = targetCareer.name;
    renderDataProvenanceNote();

    const savedAssessment = readSavedAssessment();

    if (
        savedAssessment &&
        savedAssessment.careerId === targetCareer.id
    ) {
        answers = savedAssessment.answers || {};
        lastUpdatedAt = savedAssessment.updatedAt || null;
    }

    renderCurrentSkill();
}

function renderCurrentSkill() {
    hideMessage();

    const skills = targetCareer.skills;
    const currentSkill = skills[currentSkillIndex];
    const currentNumber = currentSkillIndex + 1;
    const totalSkills = skills.length;

    skillName.textContent = currentSkill;
    skillDefinition.textContent = getSkillDescription(currentSkill);
    skillNumber.textContent = String(currentNumber).padStart(2, "0");
    questionCounter.textContent =
        `Skill ${currentNumber} of ${totalSkills}`;

    const progress = Math.round(
        (currentNumber / totalSkills) * 100
    );

    progressPercent.textContent = `${progress}%`;
    questionProgressValue.style.width = `${progress}%`;
    previousButton.hidden = currentSkillIndex === 0;
    previousButton.disabled = false;

    const isLastSkill = currentNumber === totalSkills;

    nextButton.innerHTML = isLastSkill
        ? `Finish Assessment <span>→</span>`
        : `Save & Continue <span>→</span>`;

    clearInputs();
    restoreAnswer(currentSkill);
}

function clearInputs() {
    document
        .querySelectorAll(
            'input[name="skillLevel"], input[name="skillEvidence"]'
        )
        .forEach(function (input) {
            input.checked = false;
        });

    if (otherEvidenceText) otherEvidenceText.value = "";
    if (otherEvidenceDetail) otherEvidenceDetail.hidden = true;

    if (evidenceProofText) evidenceProofText.value = "";
    if (evidenceProofDetail) evidenceProofDetail.hidden = true;
}

function restoreAnswer(skill) {
    const savedAnswer = answers[skill];

    if (!savedAnswer) {
        return;
    }

    const levelInput = document.querySelector(
        `input[name="skillLevel"][value="${savedAnswer.level}"]`
    );

    if (levelInput) {
        levelInput.checked = true;
    }

    document
        .querySelectorAll('input[name="skillEvidence"]')
        .forEach(function (input) {
            const evidence = Array.isArray(savedAnswer.evidence)
                ? savedAnswer.evidence
                : [];

            input.checked = input.value === "Other"
                ? evidence.some(function (item) { return item.startsWith("Other:"); })
                : evidence.includes(input.value);
        });

    const savedOther = Array.isArray(savedAnswer.evidence)
        ? savedAnswer.evidence.find(function (item) { return item.startsWith("Other:"); })
        : null;

    if (savedOther && otherEvidenceText && otherEvidenceDetail) {
        otherEvidenceText.value = savedOther.slice("Other:".length).trim();
        otherEvidenceDetail.hidden = false;
    }

    const savedEvidence = Array.isArray(savedAnswer.evidence)
        ? savedAnswer.evidence
        : [];
    const hasProofRequiringEvidence = savedEvidence.some(function (item) {
        return item && item !== "None";
    });

    if (evidenceProofText && evidenceProofDetail) {
        evidenceProofText.value = savedAnswer.evidenceDetail || "";
        evidenceProofDetail.hidden = !hasProofRequiringEvidence;
    }
}

const evidenceInputs = document.querySelectorAll(
    'input[name="skillEvidence"]'
);

function refreshEvidenceProofVisibility() {
    if (!evidenceProofDetail) {
        return;
    }

    const hasRealEvidenceChecked = Array.from(evidenceInputs).some(
        function (input) {
            return input.checked && input.value !== "None";
        }
    );

    evidenceProofDetail.hidden = !hasRealEvidenceChecked;

    if (!hasRealEvidenceChecked && evidenceProofText) {
        evidenceProofText.value = "";
    }
}

evidenceInputs.forEach(function (input) {
    input.addEventListener("change", function () {
        if (input.value === "Other" && otherEvidenceDetail) {
            otherEvidenceDetail.hidden = !input.checked;
            if (input.checked) otherEvidenceText?.focus();
            if (!input.checked && otherEvidenceText) otherEvidenceText.value = "";
        }

        if (!input.checked) {
            refreshEvidenceProofVisibility();
            return;
        }

        if (input.value === "None") {
            evidenceInputs.forEach(function (otherInput) {
                if (otherInput.value !== "None") {
                    otherInput.checked = false;
                }
            });

            if (otherEvidenceDetail) otherEvidenceDetail.hidden = true;
            if (otherEvidenceText) otherEvidenceText.value = "";

            refreshEvidenceProofVisibility();
            return;
        }

        const noEvidenceInput = document.getElementById("noEvidence");

        if (noEvidenceInput) {
            noEvidenceInput.checked = false;
        }

        refreshEvidenceProofVisibility();
    });
});

function answersAreEqual(oldAnswer, newAnswer) {
    if (!oldAnswer) {
        return false;
    }

    const oldEvidence = Array.isArray(oldAnswer.evidence)
        ? [...oldAnswer.evidence].sort()
        : [];

    const newEvidence = [...newAnswer.evidence].sort();

    return (
        Number(oldAnswer.level) === Number(newAnswer.level) &&
        JSON.stringify(oldEvidence) === JSON.stringify(newEvidence) &&
        String(oldAnswer.evidenceDetail || "") ===
            String(newAnswer.evidenceDetail || "")
    );
}

async function saveCurrentAnswer() {
    const currentSkill = targetCareer.skills[currentSkillIndex];
    const oldAnswer = answers[currentSkill];

    const selectedLevel = document.querySelector(
        'input[name="skillLevel"]:checked'
    );

    if (!selectedLevel) {
        if (oldAnswer) {
            return true;
        }

        showMessage(
            "Please select your skill level before continuing."
        );

        return false;
    }

    const selectedEvidenceInputs = Array.from(
        document.querySelectorAll(
            'input[name="skillEvidence"]:checked'
        )
    );

    if (selectedEvidenceInputs.length === 0) {
        showMessage(
            "Select at least one evidence option before continuing."
        );
        return false;
    }

    const otherText = String(otherEvidenceText?.value || "")
        .normalize("NFKC")
        .replace(/[\u0000-\u001f\u007f<>`{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

    if (otherEvidenceInput?.checked && !otherText) {
        showMessage("Please describe your other evidence first.");
        otherEvidenceText?.focus();
        return false;
    }

    const hasRealEvidenceSelected = selectedEvidenceInputs.some(
        function (input) {
            return input.value !== "None";
        }
    );

    const proofText = String(evidenceProofText?.value || "")
        .normalize("NFKC")
        .replace(/[\u0000-\u001f\u007f<>`{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150);

    if (hasRealEvidenceSelected && !proofText) {
        showMessage(
            "Add a reference link or a short evidence note before continuing."
        );
        evidenceProofText?.focus();
        return false;
    }

    const evidence = selectedEvidenceInputs.map(function (input) {
        return input.value === "Other"
            ? `Other: ${otherText}`
            : input.value;
    });

    const newAnswer = {
        level: Number(selectedLevel.value),
        evidence: evidence,
        evidenceDetail: hasRealEvidenceSelected ? proofText : ""
    };

    if (!answersAreEqual(oldAnswer, newAnswer)) {
        lastUpdatedAt = new Date().toISOString();
    }

    answers[currentSkill] = newAnswer;
    const saved = await saveAssessment(false);

    return saved;
}

async function saveAssessment(completed) {
    if (!lastUpdatedAt) {
        lastUpdatedAt = new Date().toISOString();
    }

    const assessmentData = {
        careerId: targetCareer.id,
        careerName: targetCareer.name,
        answers: answers,
        updatedAt: lastUpdatedAt
    };

    const { error } = await saveAssessmentRecord(
        assessmentData,
        completed
    );

    if (error) {
        showMessage(
            "Your response could not be saved. Check your connection and try again."
        );
        return false;
    }

    localStorage.setItem(
        "pathlyAssessmentResults",
        JSON.stringify(assessmentData)
    );

    return true;
}

function assessmentIsComplete() {
    const missingSkill = targetCareer.skills.find(function (skill) {
        return !answers[skill];
    });

    if (!missingSkill) {
        return true;
    }

    currentSkillIndex =
        targetCareer.skills.indexOf(missingSkill);

    renderCurrentSkill();

    showMessage(
        `Please complete ${missingSkill} before finishing the assessment.`
    );

    return false;
}

if (nextButton) {
    nextButton.addEventListener("click", async function () {
        nextButton.disabled = true;

        if (!(await saveCurrentAnswer())) {
            nextButton.disabled = false;
            return;
        }

        const isLastSkill =
            currentSkillIndex === targetCareer.skills.length - 1;

        if (isLastSkill) {
            if (assessmentIsComplete()) {
                await finishAssessment();
            } else {
                nextButton.disabled = false;
            }

            return;
        }

        currentSkillIndex += 1;
        renderCurrentSkill();
        nextButton.disabled = false;
    });
}

if (previousButton) {
    previousButton.addEventListener("click", async function () {
        const currentSkill =
            targetCareer.skills[currentSkillIndex];

        const selectedLevel = document.querySelector(
            'input[name="skillLevel"]:checked'
        );

        if (selectedLevel || answers[currentSkill]) {
            if (!(await saveCurrentAnswer())) {
                return;
            }
        }

        if (currentSkillIndex > 0) {
            currentSkillIndex -= 1;
            renderCurrentSkill();
        }
    });
}

async function finishAssessment() {
    if (!(await saveAssessment(true))) {
        nextButton.disabled = false;
        return;
    }

    assessmentCard.style.display = "none";

    if (questionProgress) {
        questionProgress.style.display = "none";
    }

    assessmentComplete.classList.add("show");

    completeCareer.textContent = targetCareer.name;
    completeSkillCount.textContent =
        targetCareer.skills.length;

    const evidenceCount = targetCareer.skills.filter(function (skill) {
        const answer = answers[skill];

        return (
            answer &&
            Array.isArray(answer.evidence) &&
            answer.evidence.some(function (item) {
                return item !== "None";
            })
        );
    }).length;

    completeEvidenceCount.textContent = evidenceCount;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

if (!targetCareer) {
    assessmentCard.innerHTML = `
        <div class="skill-question pathly-empty-state">
            <h2>Career target not found.</h2>

            <p>
                Return to Explore Careers and choose a career target first.
            </p>

            <br>

            <a href="career.html" class="btn btn-primary">
                Choose a Career
            </a>
        </div>
    `;
} else {
    startAssessment();
}

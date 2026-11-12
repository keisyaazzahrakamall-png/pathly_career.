import { saveCareerJourney } from "./lib/user-data.js";

const careers = window.PATHLY_CAREERS || [];
const customCareerEngine = window.PATHLY_CUSTOM_CAREER_ENGINE;
const dataProvenance = window.PATHLY_DATA_PROVENANCE || null;
const careerGrid = document.getElementById("careerGrid");
const modeBadge = document.getElementById("modeBadge");
const modeTitle = document.getElementById("modeTitle");
const modeDescription = document.getElementById("modeDescription");
const modeHint = document.getElementById("modeHint");
const selectionCounter = document.getElementById("selectionCounter");
const continueButton = document.getElementById("careerContinueButton");
const careerMessage = document.getElementById("careerMessage");

const comparisonPanel = document.getElementById("comparisonPanel");
const comparisonGrid = document.getElementById("comparisonGrid");
const targetConfirmation = document.getElementById("targetConfirmation");
const targetConfirmationName = document.getElementById(
    "targetConfirmationName"
);

const dreamCareerForm = document.getElementById("dreamCareerForm");
const dreamCareerInput = document.getElementById("dreamCareerInput");
const careerClarification = document.getElementById(
    "careerClarification"
);
const clarificationTitle = document.getElementById(
    "clarificationTitle"
);
const clarificationDescription = document.getElementById(
    "clarificationDescription"
);
const specificCareerOptions = document.getElementById(
    "specificCareerOptions"
);
const unsureCareerButton = document.getElementById(
    "unsureCareerButton"
);
const writeAnotherCareerButton = document.getElementById(
    "writeAnotherCareerButton"
);
const careerPreferencePanel = document.getElementById(
    "careerPreferencePanel"
);
const careerPreferenceOptions = document.getElementById(
    "careerPreferenceOptions"
);

const modeConfig = {
    explore: {
        badge: "EXPLORE MODE",
        title: "Find a career direction worth exploring.",
        description:
            "Explore each role's focus and skills before making your choice.",
        hint: "Choose one career that interests you."
    },

    validate: {
        badge: "COMPARE MODE",
        title:
            "Compare the career paths you are considering.",
        description:
            "Choose two or three careers to compare their focus and core skills.",
        hint: "Choose 2–3 careers to compare."
    },

    prepare: {
        badge: "PREPARE MODE",
        title: "Choose the career you want to prepare for.",
        description:
            "Choose your career target, then continue to the skills assessment.",
        hint: "Choose your career target."
    }
};

const urlParams = new URLSearchParams(window.location.search);

let careerMode =
    urlParams.get("mode") ||
    localStorage.getItem("pathlyCareerStage") ||
    "explore";

if (!modeConfig[careerMode]) {
    careerMode = "explore";
}

const currentMode = modeConfig[careerMode];

modeBadge.textContent = currentMode.badge;
modeTitle.textContent = currentMode.title;
modeDescription.textContent = currentMode.description;
modeHint.textContent = currentMode.hint;
continueButton.hidden = careerMode === "validate";
let selectedCareerIds = [];
let activeClarificationGroup = null;

const savedTarget = localStorage.getItem("pathlyCareerTarget");
const savedComparison = localStorage.getItem(
    "pathlyComparedCareers"
);

if (careerMode === "validate" && savedComparison) {
    try {
        selectedCareerIds = JSON.parse(savedComparison);

        if (!Array.isArray(selectedCareerIds)) {
            selectedCareerIds = [];
        }
    } catch (error) {
        selectedCareerIds = [];
    }
} else if (savedTarget) {
    selectedCareerIds = [savedTarget];
}

function showMessage(message, isError) {
    careerMessage.textContent = message;
    careerMessage.classList.add("show");
    careerMessage.classList.toggle("error", Boolean(isError));
}

function hideMessage() {
    careerMessage.classList.remove("show", "error");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
        ? `Data last reviewed: ${formattedDate} • Manually curated from O*NET, ESCO, SKKNI, and sample Indonesian job listings.`
        : "Data is manually curated from O*NET, ESCO, SKKNI, and sample Indonesian job listings.";

    noteElement.hidden = false;
    noteElement.title = dataProvenance.reviewCycle || "";
}

function findCareer(careerId) {
    return careers.find(function (career) {
        return career.id === careerId;
    });
}

function createSkillTags(skills, limit) {
    const displayedSkills = limit
        ? skills.slice(0, limit)
        : skills;

    return displayedSkills
        .map(function (skill) {
            return `<span>${escapeHtml(skill)}</span>`;
        })
        .join("");
}

function renderCareers() {
    careerGrid.innerHTML = "";

    careers.forEach(function (career) {
        const card = document.createElement("label");
        const inputType =
            careerMode === "validate" ? "checkbox" : "radio";

        card.className = "career-option";

        card.innerHTML = `
            <input
                type="${inputType}"
                name="careerSelection"
                value="${escapeHtml(career.id)}"
                ${selectedCareerIds.includes(career.id) ? "checked" : ""}
            >

            <span class="career-option-content">
                <span class="option-top">
                    <span class="option-symbol">
                        ${escapeHtml(career.symbol)}
                    </span>

                    <span class="option-category">
                        ${escapeHtml(career.category)}
                    </span>
                </span>

                <h3>${escapeHtml(career.name)}</h3>

                <span class="option-description">
                    ${escapeHtml(career.description)}
                </span>

                <span class="option-focus">
                    <span>ROLE FOCUS</span>
                    <p>${escapeHtml(career.focus)}</p>
                </span>

                <span class="option-skills">
                    ${createSkillTags(career.skills, 5)}
                </span>
            </span>

            <span class="select-indicator">✓</span>
        `;

        const input = card.querySelector("input");

        input.addEventListener("change", function () {
            handleCareerSelection(career.id, input);
        });

        careerGrid.appendChild(card);
    });
}

function saveComparedCareers() {
    localStorage.setItem(
        "pathlyComparedCareers",
        JSON.stringify(selectedCareerIds)
    );

    saveCareerJourney({
        compared_career_ids: selectedCareerIds
    }).then(function ({ error }) {
        if (error) {
            showMessage(
                "Your comparison choices could not be saved. Please select them again.",
                true
            );
        }
    });
}

function handleCareerSelection(careerId, input) {
    hideMessage();

    if (careerMode !== "validate") {
        selectedCareerIds = [careerId];
        updateSingleSelection();
        return;
    }

    if (input.checked) {
        if (selectedCareerIds.length >= 3) {
            input.checked = false;

            showMessage(
                "You can compare up to three careers.",
                true
            );

            return;
        }

        if (!selectedCareerIds.includes(careerId)) {
            selectedCareerIds.push(careerId);
        }
    } else {
        selectedCareerIds = selectedCareerIds.filter(function (id) {
            return id !== careerId;
        });
    }

    saveComparedCareers();
    updateValidationSelection();
}

function updateSingleSelection() {
    const count = selectedCareerIds.length;

    selectionCounter.textContent = `${count} selected`;
    continueButton.disabled = count !== 1;

    if (count !== 1) {
        continueButton.innerHTML =
            `Continue <span>→</span>`;

        return;
    }

    const career = findCareer(selectedCareerIds[0]);

    if (!career) {
        return;
    }

    const buttonText =
        careerMode === "prepare"
            ? `Continue with ${career.name}`
            : `Explore ${career.name}`;

    continueButton.innerHTML =
        `${escapeHtml(buttonText)} <span>→</span>`;
}

function updateValidationSelection() {
    const count = selectedCareerIds.length;

    selectionCounter.textContent = `${count} of 3 selected`;

    if (count >= 2) {
        renderComparison();
    } else {
        comparisonPanel.classList.remove("show");
    }
}

function renderComparison() {
    if (selectedCareerIds.length < 2) {
        comparisonPanel.classList.remove("show");
        return;
    }

    comparisonGrid.innerHTML = "";

    selectedCareerIds.forEach(function (careerId) {
        const career = findCareer(careerId);

        if (!career) {
            return;
        }

        const card = document.createElement("article");

        card.className = "compare-card";

        card.innerHTML = `
            <span class="compare-category">
                ${escapeHtml(career.category)}
            </span>

            <h3>${escapeHtml(career.name)}</h3>

            <div class="compare-row">
                <span>ROLE FOCUS</span>
                <p>${escapeHtml(career.focus)}</p>
            </div>

            <div class="compare-row">
                <span>SKILL AREAS</span>

                <div class="option-skills">
                    ${createSkillTags(career.skills)}
                </div>
            </div>

            <button
                type="button"
                class="btn btn-primary choose-target-button"
                data-career-id="${escapeHtml(career.id)}"
            >
                Set as My Target
            </button>
        `;

        comparisonGrid.appendChild(card);
    });

    comparisonPanel.classList.add("show");

    comparisonGrid
        .querySelectorAll(".choose-target-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                chooseCareerTarget(button.dataset.careerId);
            });
        });
}

async function chooseCareerTarget(careerId) {
    const career = findCareer(careerId);

    if (!career) {
        return;
    }

    const { error } = await saveCareerJourney({
        target_career_id: career.id,
        target_career_name: career.name
    });

    if (error) {
        showMessage(
            "Your career target could not be saved. Please try again.",
            true
        );
        return;
    }

    localStorage.setItem("pathlyCareerTarget", career.id);

    targetConfirmationName.textContent = career.name;
    targetConfirmation.classList.add("show");

    showMessage(
        `${career.name} saved as your career target.`
    );

    setTimeout(function () {
        window.location.href = "assessment.html";
    }, 600);
}

function selectCustomCareer(data, message) {
    const career = customCareerEngine.saveCareer(data);

    if (!career) {
        showMessage(
            "This career could not be created. Please try another role.",
            true
        );

        return;
    }

    let resultMessage =
        message ||
        `${career.name} is ready to use in Pathly.`;

    if (careerMode === "validate") {
        selectedCareerIds = selectedCareerIds.filter(findCareer);

        if (!selectedCareerIds.includes(career.id)) {
            if (selectedCareerIds.length >= 3) {
                resultMessage =
                    `${career.name} was added to the career options. Deselect an earlier choice if you want to compare it.`;
            } else {
                selectedCareerIds.push(career.id);
            }
        }

        saveComparedCareers();
    } else {
        selectedCareerIds = [career.id];
    }

    renderCareers();

    if (careerMode === "validate") {
        updateValidationSelection();
    } else {
        updateSingleSelection();
    }

    careerClarification.classList.remove("show");
    careerPreferencePanel.classList.remove("show");

    showMessage(resultMessage);

    const selectedCard = careerGrid.querySelector(
        `input[value="${career.id}"]`
    );

    if (selectedCard) {
        selectedCard
            .closest(".career-option")
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
    }
}

function selectCareerTemplate(template, message) {
    const data = customCareerEngine.buildCareer(
        template.name,
        template
    );

    selectCustomCareer(
        data,
        message ||
        `${template.name} is selected and ready for assessment.`
    );
}

function showSpecificCareers(group) {
    activeClarificationGroup = group;

    clarificationTitle.textContent =
        `${group.name} has several career paths.`;

    clarificationDescription.textContent =
        "Choose the most suitable role for a more relevant assessment and roadmap.";

    specificCareerOptions.innerHTML = "";

    group.suggestions.forEach(function (suggestion) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "specific-career-option";

        button.innerHTML = `
            <span class="specific-career-symbol">
                ${escapeHtml(suggestion.symbol)}
            </span>

            <span>
                <strong>${escapeHtml(suggestion.name)}</strong>
                <small>${escapeHtml(suggestion.focus)}</small>
            </span>

            <span class="specific-career-arrow">→</span>
        `;

        button.addEventListener("click", function () {
            selectCareerTemplate(suggestion);
        });

        specificCareerOptions.appendChild(button);
    });

    careerPreferencePanel.classList.remove("show");
    careerClarification.classList.add("show");

    careerClarification.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function showPreferenceOptions() {
    careerPreferenceOptions.innerHTML = "";

    customCareerEngine.preferenceOptions.forEach(
        function (preference) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "career-preference-option";
            button.textContent = preference.label;

            button.addEventListener("click", function () {
                if (!activeClarificationGroup) {
                    return;
                }

                const recommendation =
                    customCareerEngine.recommend(
                        activeClarificationGroup,
                        preference.id
                    );

                selectCareerTemplate(
                    recommendation,
                    `Based on your choice, Pathly suggests ${recommendation.name}.`
                );
            });

            careerPreferenceOptions.appendChild(button);
        }
    );
}

if (dreamCareerForm && customCareerEngine) {
    dreamCareerInput.addEventListener("input", function () {
        if (dreamCareerInput.getAttribute("aria-invalid") === "true") {
            dreamCareerInput.setAttribute("aria-invalid", "false");
            hideMessage();
        }
    });

    dreamCareerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        hideMessage();

        const rawInput = dreamCareerInput.value;

        if (customCareerEngine.containsUnsafeInput(rawInput)) {
            showMessage(
                "Job titles cannot contain code, HTML tags, or unsafe characters.",
                true
            );
            dreamCareerInput.setAttribute("aria-invalid", "true");
            dreamCareerInput.focus();
            return;
        }

        const input = customCareerEngine.sanitizeName(rawInput);

        if (input.length < 2) {
            showMessage(
                "Enter a job title or career field first.",
                true
            );

            dreamCareerInput.focus();
            return;
        }

        dreamCareerInput.value = input;
        dreamCareerInput.setAttribute("aria-invalid", "false");

        const normalizedInput =
            customCareerEngine.normalize(input);

        const matchingCareers = careers.filter(function (career) {
            return (
                customCareerEngine.normalize(career.name) ===
                normalizedInput
            );
        });

        const existingCareer =
            matchingCareers.find(function (career) {
                return !career.isCustom;
            }) || matchingCareers[0];

        if (existingCareer) {
            showMessage(
                `${existingCareer.name} is already available. Select its card to continue.`
            );

            const existingInput = Array.from(
                careerGrid.querySelectorAll('input[name="careerSelection"]')
            ).find(function (inputElement) {
                return inputElement.value === existingCareer.id;
            });

            existingInput?.closest(".career-option")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            existingInput?.focus({ preventScroll: true });

            return;
        }

        const broadGroup =
            customCareerEngine.findBroadGroup(input) ||
            customCareerEngine.inferGroup(input);

        if (broadGroup) {
            showSpecificCareers(broadGroup);
            return;
        }

        showMessage(
            "This career is not yet in the Pathly catalog. Try another title or choose an available career.",
            true
        );
        dreamCareerInput.setAttribute("aria-invalid", "true");
        dreamCareerInput.focus();
    });

    unsureCareerButton.addEventListener("click", function () {
        if (!activeClarificationGroup) {
            return;
        }

        showPreferenceOptions();
        careerPreferencePanel.classList.add("show");

        careerPreferencePanel.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    writeAnotherCareerButton.addEventListener(
        "click",
        function () {
            careerClarification.classList.remove("show");
            careerPreferencePanel.classList.remove("show");
            dreamCareerInput.value = "";
            dreamCareerInput.focus();
        }
    );
}

continueButton.addEventListener("click", function () {
    if (careerMode === "validate") {
        return;
    }

    if (selectedCareerIds.length !== 1) {
        showMessage(
            "Please choose one career first.",
            true
        );

        return;
    }

    chooseCareerTarget(selectedCareerIds[0]);
});
renderCareers();
renderDataProvenanceNote();

if (careerMode === "validate") {
    updateValidationSelection();
} else {
    updateSingleSelection();
}

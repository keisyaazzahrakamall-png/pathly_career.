import { saveReadinessRecord } from "./lib/user-data.js";

(function () {
    const scoringResult = window.PATHLY_SCORING_RESULT;
    const careerStage = localStorage.getItem("pathlyCareerStage");
    const careerTarget = localStorage.getItem("pathlyCareerTarget");

    const readinessCareer =
        document.getElementById("readinessCareer");

    const readinessAlignment =
        document.getElementById("readinessAlignment");

    const clarityStatus =
        document.getElementById("clarityStatus");

    const clarityDescription =
        document.getElementById("clarityDescription");

    const evidenceStatus =
        document.getElementById("evidenceStatus");

    const evidenceDescription =
        document.getElementById("evidenceDescription");

    const adaptabilityStatus =
        document.getElementById("adaptabilityStatus");

    const adaptabilityDescription =
        document.getElementById("adaptabilityDescription");

    const adaptabilityForm =
        document.getElementById("adaptabilityForm");

    const adaptabilityMessage =
        document.getElementById("adaptabilityMessage");

    const dimensionResults =
        document.getElementById("dimensionResults");

    const roadmapButton =
        document.getElementById("roadmapButton");

    const adaptabilitySaveState =
        document.getElementById("adaptabilitySaveState");

    const dimensions = [
        "concern",
        "control",
        "curiosity",
        "confidence"
    ];

    const dimensionItems = {
        concern: ["concernPlan", "concernAction"],
        control: ["controlDecision", "controlAction"],
        curiosity: ["curiosityExplore", "curiosityCompare"],
        confidence: ["confidenceLearn", "confidenceRecover"]
    };

    const reflectionItems = Object.values(dimensionItems).flat();

    const dimensionLabels = {
        concern: "concern for the future",
        control: "control over decisions",
        curiosity: "curiosity",
        confidence: "confidence"
    };

    if (scoringResult) {
        readinessCareer.textContent =
            scoringResult.careerName;

        readinessAlignment.textContent =
            `${scoringResult.alignment}%`;
    } else {
        readinessCareer.textContent = "Not selected";
        readinessAlignment.textContent = "Unavailable";
    }

    function showCareerClarity() {
        if (!careerTarget || !scoringResult) {
            clarityStatus.textContent = "Not set";

            clarityDescription.textContent =
                "Choose a career target before continuing your Pathly journey.";

            return;
        }

        const careerName = scoringResult.careerName;

        if (careerStage === "prepare") {
            clarityStatus.textContent = "Target set";

            clarityDescription.textContent =
                `You have chosen ${careerName} as your career target.`;

            return;
        }

        if (careerStage === "validate") {
            clarityStatus.textContent = "Direction selected";

            clarityDescription.textContent =
                `After comparing your options, you chose ${careerName}.`;

            return;
        }

        clarityStatus.textContent = "Direction selected";

        clarityDescription.textContent =
            `After exploring, you chose to work toward ${careerName}.`;
    }

    function showEvidenceCoverage() {
        if (!scoringResult) {
            evidenceStatus.textContent = "Unavailable";

            evidenceDescription.textContent =
                "Complete the assessment to see your reference coverage.";

            return;
        }

        const totalSkills = scoringResult.totalSkills;
        const evidenceCount = scoringResult.evidenceCount;

        const ratio =
            totalSkills > 0
                ? evidenceCount / totalSkills
                : 0;

        let status = "No references yet";

        if (ratio >= 0.75) {
            status = "Broad coverage";
        } else if (ratio >= 0.4) {
            status = "Growing coverage";
        } else if (ratio > 0) {
            status = "Initial coverage";
        }

        evidenceStatus.textContent = status;

        evidenceDescription.textContent =
            `${evidenceCount} of ${totalSkills} skills have self-reported references. Pathly does not verify references or include them in your score.`;
    }

    function getReflectionLabel(value) {
        const score = Number(value);
        if (!Number.isFinite(score)) return "Not answered";
        if (score < 1.5) return "Not yet evident";
        if (score < 2.5) return "Emerging";
        if (score < 3.5) return "Fairly consistent";
        return "Consistent";
    }

    function showAdaptabilityResult(data) {
        dimensions.forEach(function (dimension) {
            const resultElement = document.getElementById(
                `${dimension}Result`
            );

            if (resultElement) {
                resultElement.textContent =
                    getReflectionLabel(data[dimension]);
            }
        });

        dimensionResults.classList.add("show");

        adaptabilityStatus.textContent =
            "Reflection complete";

        adaptabilityDescription.textContent =
            "Your four adaptability dimensions have been saved separately.";

        roadmapButton.disabled = false;
    }

    function loadSavedAdaptability() {
        const savedData = localStorage.getItem(
            "pathlyAdaptabilityCheck"
        );

        if (!savedData) {
            return;
        }

        try {
            const data = JSON.parse(savedData);

            if (!data.items) {
                adaptabilitySaveState.textContent =
                    "An older reflection was found. Complete it again using two statements per dimension.";
                return;
            }

            reflectionItems.forEach(function (itemName) {
                const input = document.querySelector(
                    `input[name="${itemName}"][value="${data.items[itemName]}"]`
                );

                if (input) {
                    input.checked = true;
                }
            });

            showAdaptabilityResult(data);
            adaptabilitySaveState.textContent =
                "Showing the last reflection saved to your account.";
        } catch (error) {
            console.log(
                "Could not read adaptability data:",
                error
            );
        }
    }

    if (adaptabilityForm) {
        const adaptabilitySubmitButton = adaptabilityForm.querySelector(
            'button[type="submit"]'
        );

        reflectionItems.forEach(function (itemName) {
            adaptabilityForm
                .querySelectorAll(`input[name="${itemName}"]`)
                .forEach(function (input) {
                    input.addEventListener("change", function () {
                        input.closest(".adaptability-question")?.classList.remove("field-invalid");
                        adaptabilityForm
                            .querySelectorAll(`input[name="${itemName}"]`)
                            .forEach(function (item) {
                                item.setAttribute("aria-invalid", "false");
                            });
                        adaptabilitySaveState.textContent =
                            "You have unsaved changes.";
                        adaptabilityStatus.textContent =
                            "Unsaved changes";
                        adaptabilityDescription.textContent =
                            "Press Save Reflection to save your new responses to your account.";
                        roadmapButton.disabled = true;
                    });
                });
        });

        adaptabilityForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const formData =
                    new FormData(adaptabilityForm);

                const missingItems = reflectionItems.filter(function (itemName) {
                    return !formData.get(itemName);
                });

                const missingDimensions = dimensions.filter(function (dimension) {
                    return dimensionItems[dimension].some(function (itemName) {
                        return missingItems.includes(itemName);
                    });
                });

                dimensions.forEach(function (dimension) {
                    const inputs = dimensionItems[dimension].flatMap(function (itemName) {
                        return Array.from(adaptabilityForm.querySelectorAll(
                            `input[name="${itemName}"]`
                        ));
                    });
                    const invalid = missingDimensions.includes(dimension);
                    inputs.forEach(function (input) {
                        input.setAttribute("aria-invalid", String(invalid));
                    });
                    inputs[0]?.closest(".adaptability-question")?.classList.toggle(
                        "field-invalid",
                        invalid
                    );
                });

                if (missingDimensions.length) {
                    adaptabilityMessage.textContent =
                        `Complete the following reflection sections: ${missingDimensions.map(function (dimension) {
                            return dimensionLabels[dimension];
                        }).join(", ")}.`;
                    adaptabilityMessage.className = "form-message show error";

                    const firstInput = adaptabilityForm.querySelector(
                        `input[name="${missingItems[0]}"]`
                    );
                    firstInput?.closest(".adaptability-question")?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    firstInput?.focus({ preventScroll: true });
                    return;
                }

                adaptabilityMessage.className = "form-message";

                const itemValues = Object.fromEntries(
                    reflectionItems.map(function (itemName) {
                        return [itemName, Number(formData.get(itemName))];
                    })
                );

                const dimensionScore = function (dimension) {
                    const values = dimensionItems[dimension].map(function (itemName) {
                        return itemValues[itemName];
                    });
                    return values.reduce(function (sum, value) {
                        return sum + value;
                    }, 0) / values.length;
                };

                const adaptabilityData = {
                    version: 2,
                    items: itemValues,
                    concern: dimensionScore("concern"),
                    control: dimensionScore("control"),
                    curiosity: dimensionScore("curiosity"),
                    confidence: dimensionScore("confidence"),
                    updatedAt: new Date().toISOString()
                };

                adaptabilitySubmitButton.disabled = true;

                const { error } = await saveReadinessRecord(
                    careerTarget,
                    adaptabilityData,
                    scoringResult
                );

                if (error) {
                    adaptabilitySubmitButton.disabled = false;
                    adaptabilityDescription.textContent =
                        "Your reflection could not be saved. Check your connection and try again.";
                    adaptabilityMessage.textContent =
                        "Your reflection could not be saved. Check your connection and try again.";
                    adaptabilityMessage.className = "form-message show error";
                    return;
                }

                localStorage.setItem(
                    "pathlyAdaptabilityCheck",
                    JSON.stringify(adaptabilityData)
                );

                showAdaptabilityResult(
                    adaptabilityData
                );

                adaptabilitySaveState.textContent =
                    "Reflection saved to your account.";

                adaptabilitySubmitButton.disabled = false;

                dimensionResults.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        );
    }

    if (roadmapButton) {
        roadmapButton.addEventListener(
            "click",
            function () {
                if (!roadmapButton.disabled) {
                    window.location.href =
                        "roadmap.html";
                }
            }
        );
    }

    showCareerClarity();
    showEvidenceCoverage();
    loadSavedAdaptability();
})();

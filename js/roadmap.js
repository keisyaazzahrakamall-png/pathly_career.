import { saveRoadmapRecord } from "./lib/user-data.js";
import { getSkillDescription } from "./skill-glossary.js";

function getStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch (error) {
        return {};
    }
}

const result = window.PATHLY_SCORING_RESULT;
const profile = getStorage("pathlyProfile");
const assessment = getStorage("pathlyAssessmentResults");
const specialActions = {
    "Data Analysis": {
        learn: "Understand the data analysis workflow",
        apply: "Complete a simple analysis",
        prove: "Publish an analysis case study"
    },

    SQL: {
        learn: "Learn SQL fundamentals",
        apply: "Analyze a dataset using SQL",
        prove: "Document your SQL project"
    },

    "BI / Data Visualization": {
        learn: "Learn effective data visualization",
        apply: "Build a simple dashboard",
        prove: "Document your dashboard project"
    },

    Figma: {
        learn: "Learn Figma fundamentals",
        apply: "Design a simple interface",
        prove: "Create a UI design case study"
    },

    "HTML / CSS": {
        learn: "Learn HTML and CSS fundamentals",
        apply: "Build a responsive web page",
        prove: "Add the project to your portfolio"
    },

    "Requirements Analysis": {
        learn: "Learn requirements analysis fundamentals",
        apply: "Analyze a system's requirements",
        prove: "Create a requirements case study"
    }
};

const taskDetails = {
    Learn: {
        estimate: {
            Missing: "3–4 hours",
            Developing: "1–2 hours",
            Developed: "about 1 hour"
        },
        doneWhen: (skill) =>
            `Explain the main concepts of ${skill} and record three key takeaways.`
    },
    Apply: {
        estimate: {
            Missing: "4–6 hours",
            Developing: "2–4 hours",
            Developed: "1–2 hours"
        },
        doneWhen: (skill) =>
            `Produce one exercise, assignment, or small project using ${skill}.`
    },
    Prove: {
        estimate: {
            Missing: "2–3 hours",
            Developing: "1–2 hours",
            Developed: "about 1 hour"
        },
        doneWhen: () =>
            "Save the result, project context, and your individual contribution in your portfolio."
    }
};

function createActions(skill) {
    if (specialActions[skill]) {
        return specialActions[skill];
    }

    return {
        learn: `Learn the fundamentals of ${skill}`,
        apply: `Use ${skill} in a simple project`,
        prove: `Create portfolio evidence for ${skill}`
    };
}

function createTask(priority, number, type, title) {
    const detail = taskDetails[type];
    const status = priority.status || "Missing";
    const estimateExplanations = {
        Missing: "Allow more time because you have not developed this skill yet.",
        Developing: "Allow less time because you have already started developing this skill.",
        Developed: "Focus this time on reviewing and strengthening your existing work."
    };

    return {
        id: `p${number}-${type.toLowerCase()}`,
        priority: number,
        skill: priority.skill,
        type,
        title,
        estimate: detail.estimate[status] || detail.estimate.Missing,
        estimateExplanation:
            estimateExplanations[status] || estimateExplanations.Missing,
        doneWhen: detail.doneWhen(priority.skill),
    };
}

function getPace() {
    const semester = Number(profile.semester || 0);

    if (semester >= 6) {
        return {
            label: "Accelerated",
            duration: "1–2 weeks per priority"
        };
    }

    if (semester >= 3) {
        return {
            label: "Focused",
            duration: "2–3 weeks per priority"
        };
    }

    return {
        label: "Foundation",
        duration: "3–4 weeks per priority"
    };
}

function buildRoadmap() {
    const priorities = result.priorityGaps.slice(0, 3);
    const tasks = [];

    priorities.forEach(function (priority, index) {
        const number = index + 1;
        const actions = createActions(priority.skill);

        const learnTask = createTask(priority, number, "Learn", actions.learn);
        learnTask.id = `p${number}-learn`;
        tasks.push(learnTask);

        const applyTask = createTask(priority, number, "Apply", actions.apply);
        applyTask.id = `p${number}-apply`;
        tasks.push(applyTask);

        const proveTask = createTask(priority, number, "Prove", actions.prove);
        proveTask.id = `p${number}-prove`;
        tasks.push(proveTask);
    });

    return {
        careerId: result.careerId,
        careerName: result.careerName,
        alignment: result.alignment,
        priorities: priorities,
        tasks: tasks,
        pace: getPace(),

        signature:
            result.careerId +
            "|" +
            (assessment.updatedAt || "no-date"),

        assessmentUpdatedAt: assessment.updatedAt || null,

        generatedAt: new Date().toISOString()
    };
}

function renderRoadmap(data) {
    document.getElementById("roadmapCareer").textContent =
        data.careerName;

    document.getElementById("roadmapAlignment").textContent =
        `${data.alignment}%`;

    document.getElementById("roadmapPriorityCount").textContent =
        data.priorities.length;

    document.getElementById("roadmapPace").textContent =
        data.pace.label;

    const education = profile.educationLevel || "Student";

    const semester = profile.semester
        ? `Semester ${profile.semester}`
        : "Semester -";

    document.getElementById("roadmapProfile").textContent =
        `${education} • ${semester}`;

    showNextAction(data);
    showPriorities(data);
    showEvidenceMessage();
}

function showNextAction(data) {
    const title = document.getElementById("nextActionTitle");
    const description =
        document.getElementById("nextActionDescription");

    if (data.tasks.length > 0) {
        title.textContent = data.tasks[0].title;

        description.textContent =
            `${data.tasks[0].skill} • ${data.pace.duration}`;

        return;
    }

    title.textContent = "Strengthen your evidence";

    description.textContent =
        "All your skills have reached the target level.";
}

function showPriorities(data) {
    const roadmapList =
        document.getElementById("roadmapList");

    roadmapList.innerHTML = "";

    const statusNames = {
        Developed: "Developed",
        Developing: "Developing",
        Missing: "Missing"
    };

    function renderStep(task, number) {
        return `
            <div class="roadmap-step">
                <span class="roadmap-step-number">${number}</span>
                <span class="roadmap-step-type">${task.type.toUpperCase()}</span>
                <h3>${task.title}</h3>
                <p class="roadmap-step-meta"><strong>Initial activity estimate:</strong> ${task.estimate}</p>
                <p class="roadmap-step-meta">${task.estimateExplanation}</p>
                <p><strong>Done when:</strong> ${task.doneWhen}</p>
            </div>
        `;
    }

    data.priorities.forEach(function (priority, index) {
        const status =
            statusNames[priority.status] || priority.status;
        const priorityTasks = data.tasks.filter(function (task) {
            return task.priority === index + 1;
        });

        const card = document.createElement("article");
        card.className = "roadmap-track";

        card.innerHTML = `
            <div class="roadmap-priority">
                <div class="priority-index">
                    ${String(index + 1).padStart(2, "0")}
                </div>

                <span>PRIORITY</span>

                <strong>${priority.skill}</strong>

                <span class="priority-gap-status ${priority.status.toLowerCase()}">
                    ${status}
                </span>
            </div>

            <div class="roadmap-steps">
                <p class="roadmap-skill-definition">
                    <strong>What is ${priority.skill}?</strong>
                    ${getSkillDescription(priority.skill)}
                </p>

                ${priorityTasks.map(function (task, taskIndex) {
                    return renderStep(task, taskIndex + 1);
                }).join("")}
            </div>
        `;

        roadmapList.appendChild(card);
    });
}

function showEvidenceMessage() {
    const message =
        document.getElementById("evidenceBoosterText");

    const missingEvidence = result.skills.filter(
        function (skill) {
            return !skill.hasEvidence;
        }
    );

    if (missingEvidence.length === 0) {
        message.textContent =
            "All skills have self-reported references. Pathly has not verified them.";

        return;
    }

    const names = missingEvidence
        .slice(0, 3)
        .map(function (skill) {
            return skill.skill;
        })
        .join(", ");

    message.textContent =
        `No references yet for: ${names}. You can continue and add notes when you have relevant work.`;
}

async function startRoadmap() {
    const container =
        document.querySelector(".roadmap-container");

    if (!result) {
        container.innerHTML = `
            <div class="roadmap-error pathly-empty-state">
                <h2>Roadmap data not found.</h2>

                <p>
                    Complete the assessment first.
                </p>

                <a
                    href="assessment.html"
                    class="btn btn-primary"
                >
                    Open Assessment
                </a>
            </div>
        `;

        return;
    }

    const roadmapData = buildRoadmap();

    const { data, error } = await saveRoadmapRecord(roadmapData);

    if (error || !data?.id) {
        container.innerHTML = `
            <div class="roadmap-error pathly-error-state">
                <h2>Your roadmap could not be saved.</h2>
                <p>Check your connection and reload this page.</p>
                <a href="roadmap.html" class="btn btn-primary">
                    Try Again
                </a>
            </div>
        `;
        return;
    }

    localStorage.setItem(
        "pathlyRoadmapData",
        JSON.stringify(roadmapData)
    );
    localStorage.setItem("pathlyRoadmapId", data.id);

    renderRoadmap(roadmapData);
}

startRoadmap();

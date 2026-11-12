import { normalizeRoadmapLanguage } from "./lib/legacy-language.js";
import {
    activateCareerTarget,
    getCareerHistory,
    saveTaskProgress
} from "./lib/user-data.js";

const result = window.PATHLY_SCORING_RESULT;

let roadmap = null;
let completedTasks = [];
const roadmapId = localStorage.getItem("pathlyRoadmapId");
const activeCareerId = localStorage.getItem("pathlyCareerTarget");

try {
    roadmap = normalizeRoadmapLanguage(JSON.parse(
        localStorage.getItem("pathlyRoadmapData")
    ));

    completedTasks =
        JSON.parse(
            localStorage.getItem("pathlyCompletedTasks")
        ) || [];
} catch (error) {
    roadmap = null;
    completedTasks = [];
}

if (!Array.isArray(completedTasks)) {
    completedTasks = [];
}

function renderDashboard() {
    if (!result || !roadmap) {
        document.getElementById(
            "myPathContainer"
        ).innerHTML = `
            <div class="my-path-error pathly-empty-state">
                <h2>No data available yet.</h2>

                <p>
                    Complete the assessment and build a roadmap first.
                </p>

                <a
                    href="roadmap.html"
                    class="btn btn-primary"
                >
                    Build Roadmap
                </a>
            </div>
        `;

        return;
    }

    showSummary();
    showNextTask();
    showTasks();
    showSkills();
}

function showSummary() {
    const totalTasks = roadmap.tasks.length;

    const finishedTasks = completedTasks.length;

    let progress = 0;

    if (totalTasks > 0) {
        progress = Math.round(
            (finishedTasks / totalTasks) * 100
        );
    }

    document.getElementById(
        "dashboardCareer"
    ).textContent = result.careerName;

    document.getElementById(
        "dashboardAlignment"
    ).textContent = `${result.alignment}%`;

    document.getElementById(
        "dashboardDeveloped"
    ).textContent =
        `${result.developedCount}/${result.totalSkills}`;

    document.getElementById(
        "dashboardEvidence"
    ).textContent =
        `${result.evidenceCount}/${result.totalSkills}`;

    document.getElementById(
        "dashboardProgress"
    ).textContent = `${progress}%`;

    document.getElementById(
        "dashboardProgressText"
    ).textContent =
        `${finishedTasks} of ${totalTasks} tasks complete`;

    document.getElementById(
        "pathProgressPercent"
    ).textContent = `${progress}%`;

    document.getElementById(
        "pathProgressValue"
    ).style.width = `${progress}%`;
}

function showNextTask() {
    const nextTask = roadmap.tasks.find(
        function (task) {
            return !completedTasks.includes(task.id);
        }
    );

    const title =
        document.getElementById("dashboardNextTitle");

    const information =
        document.getElementById("dashboardNextMeta");

    if (nextTask) {
        title.textContent = nextTask.title;

        information.textContent =
            `${nextTask.skill} • ${nextTask.type} • ${nextTask.estimate || "No estimate available"}`;
    } else {
        title.textContent = "All tasks complete";

        information.textContent =
            "You have completed your roadmap.";
    }
}

function showTasks() {
    const container =
        document.getElementById("dashboardRoadmap");
    const saveMessage =
        document.getElementById("taskSaveMessage");

    container.innerHTML = "";

    const taskGuidance = {
        Learn: "Understand the concepts and record the learning resources you use.",
        Apply: "Use this skill in an exercise, assignment, or small project.",
        Prove: "Save your work as evidence to share in your portfolio."
    };

    const groupedTasks = roadmap.tasks.reduce(function (groups, task) {
        const key = `${task.priority}-${task.skill}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(task);
        return groups;
    }, new Map());

    groupedTasks.forEach(function (tasks) {
        const firstTask = tasks[0];
        const priority = document.createElement("article");
        priority.className = "dashboard-priority";
        priority.innerHTML = `
            <div class="dashboard-priority-header">
                <div>
                    <span>PRIORITY ${String(firstTask.priority).padStart(2, "0")}</span>
                    <h3>${firstTask.skill}</h3>
                </div>
                <strong>${tasks.filter(function (task) {
                    return completedTasks.includes(task.id);
                }).length}/${tasks.length} complete</strong>
            </div>
            <div class="dashboard-task-list"></div>
        `;

        const taskList = priority.querySelector(".dashboard-task-list");

        tasks.forEach(function (task) {
            const checked = completedTasks.includes(task.id);

            const taskElement = document.createElement("label");

            taskElement.className = checked
                ? "dashboard-task completed"
                : "dashboard-task";

            taskElement.innerHTML = `
                <input
                    class="task-check"
                    type="checkbox"
                    ${checked ? "checked" : ""}
                >

                <span class="task-type">${task.type}</span>

                <span class="task-copy">
                    <strong class="task-title">${task.title}</strong>
                    <small>${taskGuidance[task.type] || "Complete this step at your own pace."}</small>
                    <small><strong>Initial activity estimate:</strong> ${task.estimate || "Not available yet"}</small>
                    <small><strong>Done when:</strong> ${task.doneWhen || "The result of this step has been saved."}</small>
                </span>
            `;

            const checkbox = taskElement.querySelector("input");

            checkbox.addEventListener("change", async function () {
                checkbox.disabled = true;
                saveMessage.textContent = "Saving changes...";
                const saved = await updateTask(task.id, checkbox.checked);

                if (!saved) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.disabled = false;
                    saveMessage.textContent =
                        "Your changes could not be saved. Check your connection and try again.";
                    return;
                }

                document.getElementById("taskSaveMessage").textContent = checkbox.checked
                    ? "Task marked complete."
                    : "Task marked incomplete.";
            });

            taskList.appendChild(taskElement);
        });

        container.appendChild(priority);
    });
}

async function updateTask(taskId, checked) {
    if (!roadmapId) {
        return false;
    }

    const { error } = await saveTaskProgress(
        roadmapId,
        taskId,
        checked
    );

    if (error) {
        return false;
    }

    if (checked) {
        if (!completedTasks.includes(taskId)) {
            completedTasks.push(taskId);
        }
    } else {
        completedTasks = completedTasks.filter(
            function (id) {
                return id !== taskId;
            }
        );
    }

    localStorage.setItem(
        "pathlyCompletedTasks",
        JSON.stringify(completedTasks)
    );
    renderDashboard();
    return true;
}

function showSkills() {
    const container =
        document.getElementById("dashboardSkills");

    container.innerHTML = "";

    result.skills.forEach(function (skill) {
        const row =
            document.createElement("div");

        row.className = "dashboard-skill";

        row.innerHTML = `
            <strong>${skill.skill}</strong>

            <span>
                Current: ${skill.userLevel}
            </span>

            <span>
                Target: ${skill.targetLevel}
            </span>

            <span>
                References: ${skill.hasEvidence ? "Recorded" : "Not recorded"}
            </span>
        `;

        container.appendChild(row);
    });
}

function formatHistoryDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return `Updated ${date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    })}`;
}

function getCareerDestination(career) {
    if (career.hasRoadmap) return "my-path.html";
    if (career.completed) return "results.html";
    return "assessment.html";
}

function createCareerHistoryItem(career) {
    const isActive = career.careerId === activeCareerId;
    const item = document.createElement("article");
    item.className = isActive
        ? "career-history-item active"
        : "career-history-item";

    const information = document.createElement("div");
    information.className = "career-history-info";

    const status = document.createElement("span");
    status.className = "career-history-status";
    status.textContent = isActive
        ? "Active target"
        : career.hasRoadmap
            ? "Roadmap available"
            : career.completed
                ? "Assessment complete"
                : "Assessment incomplete";

    const name = document.createElement("h3");
    name.textContent = career.careerName;

    const updatedAt = document.createElement("p");
    updatedAt.textContent = formatHistoryDate(career.updatedAt);

    information.append(status, name, updatedAt);

    const button = document.createElement("button");
    button.type = "button";
    button.className = isActive
        ? "btn btn-secondary career-history-button active"
        : "btn btn-primary career-history-button";
    button.textContent = isActive ? "Currently Active" : "Set as Target";
    button.disabled = isActive;

    if (!isActive) {
        button.addEventListener("click", async function () {
            const historyButtons = document.querySelectorAll(
                ".career-history-button"
            );
            historyButtons.forEach(function (historyButton) {
                historyButton.disabled = true;
            });
            button.textContent = "Changing Target...";

            const { error } = await activateCareerTarget(career);

            if (error) {
                historyButtons.forEach(function (historyButton) {
                    historyButton.disabled = historyButton.classList.contains("active");
                });
                button.textContent = "Try Again";
                document.getElementById("careerHistoryMessage").textContent =
                    "Your target could not be changed. Check your connection and try again.";
                document.getElementById("careerHistoryMessage").classList.add("error");
                return;
            }

            window.location.assign(getCareerDestination(career));
        });
    }

    item.append(information, button);
    return item;
}

async function showCareerHistory() {
    const list = document.getElementById("careerHistoryList");
    const message = document.getElementById("careerHistoryMessage");
    if (!list || !message) return;

    const { data, error } = await getCareerHistory();

    if (error) {
        message.textContent =
            "Career history could not be loaded. Your active target data is still safe.";
        message.classList.add("error");
        return;
    }

    if (!data.length) {
        message.textContent = "You have not assessed any other careers yet.";
        return;
    }

    message.textContent =
        "One target is active at a time. Changing targets does not delete your previous data.";
    list.replaceChildren(...data.map(createCareerHistoryItem));
}

function setupTabs() {
    const tabs =
        document.querySelectorAll(".dashboard-tab");

    tabs.forEach(function (tab) {
        tab.addEventListener(
            "click",
            function () {
                document
                    .querySelector(".dashboard-tab.active")
                    .classList.remove("active");

                document
                    .querySelector(".dashboard-panel.active")
                    .classList.remove("active");

                tab.classList.add("active");

                const panelId =
                    `${tab.dataset.tab}Panel`;

                document
                    .getElementById(panelId)
                    .classList.add("active");
            }
        );
    });
}

renderDashboard();
setupTabs();
showCareerHistory();

const result = window.PATHLY_SCORING_RESULT;
const container = document.getElementById("resultsContainer");

const statusLabels = {
  Developed: "Developed",
  Developing: "Developing",
  Missing: "Missing"
};

function getElement(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAlignmentMessage(score) {
  if (score >= 80) {
    return {
      title: "You meet most of the skill requirements.",
      description:
        "Focus on the remaining gaps and build your portfolio."
    };
  }

  if (score >= 50) {
    return {
      title: "You have a foundation to build on.",
      description:
        "You meet some skill requirements, with others still to develop."
    };
  }

  return {
    title: "You have clear areas to develop.",
    description: "Work on the most important gaps one step at a time."
  };
}

function showError() {
  container.innerHTML = `
    <div class="results-error pathly-empty-state">
      <h2>Assessment results not found.</h2>
      <p>Complete the assessment before viewing your results.</p>
      <a href="assessment.html" class="btn btn-primary">Open Assessment</a>
    </div>
  `;
}

function showSummary() {
  const score = `${result.alignment}%`;
  const message = getAlignmentMessage(result.alignment);

  getElement("resultCareerName").textContent = result.careerName;
  getElement("alignmentScore").textContent = score;
  getElement("alignmentBarPercent").textContent = score;
  getElement("alignmentBarValue").style.width = score;
  getElement("scoreCircle").style.setProperty(
    "--score-angle",
    `${result.alignment * 3.6}deg`
  );
  getElement("alignmentHeadline").textContent = message.title;
  getElement("alignmentDescription").textContent = message.description;
  getElement("developedCount").textContent = result.developedCount;
  getElement("developingCount").textContent = result.developingCount;
  getElement("missingCount").textContent = result.missingCount;
  getElement("evidenceCount").textContent =
    `${result.evidenceCount}/${result.totalSkills}`;
}

function showPriorities() {
  const priorities = result.priorityGaps.slice(0, 3);
  const priorityGrid = getElement("priorityGrid");

  if (priorities.length === 0) {
    priorityGrid.innerHTML = `
      <article class="priority-card">
        <span class="priority-rank">✓</span>
        <h3>All target levels reached</h3>
        <p class="priority-meta">Keep developing your skills and documenting your work.</p>
      </article>
    `;
    return;
  }

  priorityGrid.innerHTML = priorities
    .map(function (skill, index) {
      return `
        <article class="priority-card">
          <span class="priority-rank">${index + 1}</span>
          <h3>${skill.skill}</h3>
          <p class="priority-meta">
            Current ${skill.userLevel}/${skill.targetLevel} • ${skill.importance}
          </p>
          <span class="priority-status ${skill.status.toLowerCase()}">
            ${statusLabels[skill.status] || skill.status}
          </span>
        </article>
      `;
    })
    .join("");
}

function showSkills() {
  getElement("skillResultList").innerHTML = result.skills
    .map(function (skill) {
      const evidence = skill.hasEvidence ? "Recorded" : "Not recorded";
      const proof = skill.evidenceDetail
        ? `<div class="evidence-proof-note">"${escapeHtml(skill.evidenceDetail)}"</div>`
        : "";

      return `
        <div class="skill-result-row">
          <div class="skill-result-name">
            <strong>${skill.skill}</strong>
            <small>${skill.importance} • Weight ${skill.weight}</small>
          </div>
          <div class="level-display">Current: ${skill.userLevel}</div>
          <div class="level-display">Target: ${skill.targetLevel}</div>
          <span class="status-badge ${skill.status.toLowerCase()}">
            ${statusLabels[skill.status] || skill.status}
          </span>
          <div class="evidence-display">
            References: ${evidence}
            ${proof}
          </div>
        </div>
      `;
    })
    .join("");
}

if (!result) {
  showError();
} else {
  showSummary();
  showPriorities();
  showSkills();
}

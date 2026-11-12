function coreSkill(skill) {
    return {
        skill: skill,
        importance: "Core",
        weight: 3,
        targetLevel: 2
    };
}

function importantSkill(skill) {
    return {
        skill: skill,
        importance: "Important",
        weight: 2,
        targetLevel: 1
    };
}

window.PATHLY_REQUIREMENTS = {
    "data-analyst": [
        coreSkill("SQL"),
        coreSkill("Excel / Google Sheets"),
        coreSkill("Data Analysis"),
        coreSkill("BI / Data Visualization"),
        coreSkill("Analytical Thinking"),
        importantSkill("Communication")
    ],

    "business-analyst": [
        coreSkill("Requirements Analysis"),
        coreSkill("BRD / FSD"),
        coreSkill("Process Mapping"),
        coreSkill("Stakeholder Communication"),
        importantSkill("UAT"),
        importantSkill("SDLC / Agile")
    ],

    "frontend-developer": [
        coreSkill("HTML / CSS"),
        coreSkill("JavaScript"),
        coreSkill("React / Modern Frameworks"),
        coreSkill("Responsive Design"),
        importantSkill("API Integration"),
        importantSkill("Git")
    ],

    "uiux-designer": [
        coreSkill("UX Research"),
        coreSkill("User Flows"),
        coreSkill("Wireframing"),
        coreSkill("Prototyping"),
        coreSkill("Usability"),
        importantSkill("Figma"),
        importantSkill("Visual / UI Design"),
        importantSkill("Collaboration")
    ],

    "digital-marketing": [
        coreSkill("Analytics"),
        coreSkill("SEO / SEM"),
        coreSkill("Campaign Optimization"),
        coreSkill("Content"),
        coreSkill("Data-driven Thinking"),
        importantSkill("Google Ads"),
        importantSkill("Meta Ads")
    ]
};

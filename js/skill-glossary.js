const SKILL_DESCRIPTIONS = {
  "SQL": "A language for retrieving, filtering, and processing data in a database.",
  "Excel / Google Sheets": "Spreadsheets for calculating, cleaning, analyzing, and presenting data.",
  "Data Analysis": "The process of turning raw data into findings that support decisions.",
  "BI / Data Visualization": "Presenting data through charts or dashboards to make patterns easier to understand.",
  "Data Visualization": "Presenting data through charts or dashboards to make patterns easier to understand.",
  "Analytical Thinking": "Breaking down problems, finding patterns, and drawing evidence-based conclusions.",
  "Data-driven Thinking": "Using data, rather than assumptions alone, to guide decisions.",
  "Communication": "Communicating ideas and results clearly to others.",
  "Requirements Analysis": "Investigating problems and defining user or business requirements.",
  "BRD / FSD": "Documents describing business requirements and detailed system functions.",
  "UAT": "Testing by users to check that a system meets their requirements.",
  "Process Mapping": "Mapping work steps to reveal workflows, bottlenecks, and opportunities for improvement.",
  "SDLC / Agile": "Approaches for planning, building, testing, and improving software.",
  "Stakeholder Communication": "Aligning requirements and decisions with the people involved.",
  "HTML / CSS": "HTML structures web content, while CSS controls its appearance and layout.",
  "JavaScript": "A programming language that makes web pages interactive.",
  "React / Modern Frameworks": "Tools for building web interfaces from reusable components.",
  "API Integration": "Connecting an application to services or data from other systems.",
  "Git": "A tool for tracking code changes and collaborating on software development.",
  "Responsive Design": "Techniques for making interfaces work well on phones, tablets, and computers.",
  "Figma": "A collaborative application for designing interfaces and digital prototypes.",
  "UX Research": "Researching user needs, habits, and problems.",
  "User Flows": "The sequence of steps a user takes to achieve a goal in a product.",
  "Wireframing": "Sketching screen structures to test content layout before detailed design.",
  "Prototyping": "Creating interactive simulations to test ideas and flows before building a product.",
  "Usability": "The quality of being easy to understand, use, and learn.",
  "Visual / UI Design": "Arranging colors, typography, icons, and layouts for clear, consistent interfaces.",
  "Collaboration": "Working together, sharing context, and achieving team goals.",
  "Google Ads": "Google's platform for creating and measuring paid advertising.",
  "Meta Ads": "A platform for creating and measuring ads on Facebook and Instagram.",
  "Analytics": "Measuring data to understand audience behavior and marketing results.",
  "SEO / SEM": "SEO improves organic search visibility; SEM uses paid search strategies.",
  "Campaign Optimization": "Improving campaign targeting, creative, costs, and results using data.",
  "Content": "Informational or promotional material created to engage and help an audience."
};

export function getSkillDescription(skill) {
  if (SKILL_DESCRIPTIONS[skill]) return SKILL_DESCRIPTIONS[skill];

  const normalized = String(skill || "").toLowerCase();

  if (normalized.includes("data")) {
    return "Collecting, processing, or interpreting data to produce useful information.";
  }

  if (normalized.includes("desain") || normalized.includes("design")) {
    return "Designing visual solutions or experiences that are easy to understand and use.";
  }

  if (normalized.includes("komunikasi") || normalized.includes("reporting")) {
    return "Presenting information and results clearly to others.";
  }

  if (normalized.includes("testing") || normalized.includes("pengujian")) {
    return "Checking work to identify problems and confirm that requirements are met.";
  }

  return `A skill used in ${skill} work that can be demonstrated through exercises or projects.`;
}

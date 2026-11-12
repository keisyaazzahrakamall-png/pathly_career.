// Compatibility with assessments and roadmaps saved before the English UI.
const SKILL_NAMES = {
  "Analisis Data": "Data Analysis",
  "BI / Visualisasi Data": "BI / Data Visualization",
  "Visualisasi Data": "Data Visualization",
  "Berpikir Analitis": "Analytical Thinking",
  "Berpikir Berbasis Data": "Data-driven Thinking",
  "Komunikasi": "Communication",
  "Analisis Kebutuhan": "Requirements Analysis",
  "Pemetaan Proses": "Process Mapping",
  "Komunikasi Pemangku Kepentingan": "Stakeholder Communication",
  "React / Framework Modern": "React / Modern Frameworks",
  "Integrasi API": "API Integration",
  "Desain Responsif": "Responsive Design",
  "Riset UX": "UX Research",
  "Alur Pengguna": "User Flows",
  "Pembuatan Purwarupa": "Prototyping",
  "Kemudahan Penggunaan": "Usability",
  "Desain Visual / UI": "Visual / UI Design",
  "Kolaborasi": "Collaboration",
  "Analitik": "Analytics",
  "Optimalisasi Kampanye": "Campaign Optimization",
  "Konten": "Content",
  "Proses Rekrutmen": "Recruitment Process",
  "Teknik Wawancara": "Interviewing Skills",
  "Desain Pembelajaran": "Learning Design",
  "Fasilitasi": "Facilitation",
  "Evaluasi Pelatihan": "Training Evaluation",
  "Manajemen Program": "Program Management",
  "Administrasi SDM": "HR Administration",
  "Kebijakan Karyawan": "Employee Policies",
  "Payroll Dasar": "Payroll Fundamentals",
  "Manajemen Dokumen": "Document Management",
  "Ketelitian": "Attention to Detail",
  "Analisis Data SDM": "HR Data Analysis",
  "Komunikasi Wawasan": "Communicating Insights",
  "Struktur Data": "Data Structures",
  "System Design Dasar": "System Design Fundamentals",
  "Statistik": "Statistics",
  "MLOps Dasar": "MLOps Fundamentals",
  "Pemecahan Masalah": "Problem Solving",
  "Komunikasi Profesional": "Professional Communication",
  "Manajemen Waktu": "Time Management"
};
const GENERATED_TEXT = {
  "Pahami alur kerja analisis data": "Understand the data analysis workflow",
  "Selesaikan analisis sederhana": "Complete a simple analysis",
  "Publikasikan studi kasus analisis": "Publish an analysis case study",
  "Pelajari dasar-dasar SQL": "Learn SQL fundamentals",
  "Analisis dataset menggunakan SQL": "Analyze a dataset using SQL",
  "Dokumentasikan proyek SQL": "Document your SQL project",
  "Pelajari visualisasi data yang efektif": "Learn effective data visualization",
  "Buat dasbor sederhana": "Build a simple dashboard",
  "Dokumentasikan proyek dasbor": "Document your dashboard project",
  "Pelajari dasar-dasar Figma": "Learn Figma fundamentals",
  "Rancang antarmuka sederhana": "Design a simple interface",
  "Buat studi kasus desain UI": "Create a UI design case study",
  "Pelajari dasar-dasar HTML dan CSS": "Learn HTML and CSS fundamentals",
  "Buat halaman web responsif": "Build a responsive web page",
  "Simpan proyek sebagai portofolio": "Add the project to your portfolio",
  "Pelajari dasar-dasar analisis kebutuhan": "Learn requirements analysis fundamentals",
  "Analisis kebutuhan sebuah sistem": "Analyze a system's requirements",
  "Buat studi kasus kebutuhan": "Create a requirements case study",
  "Pelajari": "Learn",
  "Terapkan": "Apply",
  "Buktikan": "Prove",
  "3–4 jam": "3–4 hours",
  "1–2 jam": "1–2 hours",
  "sekitar 1 jam": "about 1 hour",
  "4–6 jam": "4–6 hours",
  "2–4 jam": "2–4 hours",
  "2–3 jam": "2–3 hours",
  "Dapat menjelaskan konsep utama ${skill} dan mencatat tiga poin penting.": "Explain the main concepts of ${skill} and record three key takeaways.",
  "Menghasilkan satu latihan, tugas, atau proyek kecil yang menggunakan ${skill}.": "Produce one exercise, assignment, or small project using ${skill}.",
  "Menyimpan hasil, konteks pengerjaan, dan peran pribadi dalam portofolio.": "Save the result, project context, and your individual contribution in your portfolio.",
  "Pelajari dasar-dasar ${skill}": "Learn the fundamentals of ${skill}",
  "Gunakan ${skill} dalam proyek sederhana": "Use ${skill} in a simple project",
  "Buat bukti portofolio untuk ${skill}": "Create portfolio evidence for ${skill}",
  "Waktu lebih panjang karena keahlian ini belum kamu kuasai.": "Allow more time because you have not developed this skill yet.",
  "Waktu lebih singkat karena kamu sudah mulai mengembangkan keahlian ini.": "Allow less time because you have already started developing this skill.",
  "Waktu difokuskan untuk meninjau dan memperkuat hasil yang sudah kamu miliki.": "Focus this time on reviewing and strengthening your existing work.",
  "Dipercepat": "Accelerated",
  "1–2 minggu per prioritas": "1–2 weeks per priority",
  "Terfokus": "Focused",
  "2–3 minggu per prioritas": "2–3 weeks per priority",
  "Fondasi": "Foundation",
  "3–4 minggu per prioritas": "3–4 weeks per priority",
  "Mahasiswa": "Student",
  "Perkuat buktimu": "Strengthen your evidence",
  "Inti": "Core",
  "Penting": "Important"
};

export function englishSkillName(value) {
  if (typeof value !== "string") return value;
  if (Object.hasOwn(SKILL_NAMES, value)) return SKILL_NAMES[value];
  if (value.startsWith("Pengetahuan Dasar ")) return `${value.slice("Pengetahuan Dasar ".length)} Fundamentals`;
  if (value.startsWith("Keahlian Teknis ")) return `${value.slice("Keahlian Teknis ".length)} Technical Skills`;
  return value;
}

function englishGeneratedText(value) {
  if (typeof value !== "string") return value;
  if (Object.hasOwn(GENERATED_TEXT, value)) return GENERATED_TEXT[value];
  for (const [source, target] of Object.entries(GENERATED_TEXT)) {
    if (!source.includes("${skill}")) continue;
    const [before, after] = source.split("${skill}");
    if (value.startsWith(before) && value.endsWith(after)) {
      const skill = value.slice(before.length, after ? -after.length : undefined);
      return target.replace("${skill}", englishSkillName(skill));
    }
  }
  return value;
}

export function normalizeAssessmentLanguage(assessment) {
  if (!assessment?.answers) return assessment;
  const answers = {};
  // Preserve an existing English answer if both old and new keys are present.
  for (const [skill, answer] of Object.entries(assessment.answers)) {
    const key = englishSkillName(skill);
    if (!(key in answers) || skill === key) answers[key] = answer;
  }
  return { ...assessment, answers };
}

function normalizeSkill(skill) {
  return {
    ...skill,
    skill: englishSkillName(skill.skill),
    importance: englishGeneratedText(skill.importance)
  };
}

export function normalizeRoadmapLanguage(roadmap) {
  if (!roadmap || typeof roadmap !== "object") return roadmap;
  return {
    ...roadmap,
    priorities: Array.isArray(roadmap.priorities)
      ? roadmap.priorities.map(normalizeSkill) : [],
    tasks: Array.isArray(roadmap.tasks) ? roadmap.tasks.map(task => ({
      ...task,
      skill: englishSkillName(task.skill),
      type: englishGeneratedText(task.type),
      title: englishGeneratedText(task.title),
      estimate: englishGeneratedText(task.estimate),
      estimateExplanation: englishGeneratedText(task.estimateExplanation),
      doneWhen: englishGeneratedText(task.doneWhen)
    })) : [],
    pace: roadmap.pace ? {
      ...roadmap.pace,
      label: englishGeneratedText(roadmap.pace.label),
      duration: englishGeneratedText(roadmap.pace.duration)
    } : roadmap.pace
  };
}

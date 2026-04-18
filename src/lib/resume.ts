export type SectionId = "summary" | "skills" | "projects" | "experience" | "education";

export type TemplateId =
  | "modern"
  | "sidebar"
  | "creative"
  | "classic"
  | "minimal"
  | "compact";

export type ResumeData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  summary: string;
  skills: string[];
  projects: { title: string; description: string }[];
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { school: string; degree: string; year: string }[];
  template: TemplateId;
  sectionOrder: SectionId[];
  /** base64 data URL */
  photo?: string;
  /** primary accent color (hex) — used for headings, lines, accents */
  primaryColor: string;
  /** secondary accent (hex) */
  secondaryColor: string;
  /** show lucide icons next to section titles in the resume */
  showIcons: boolean;
};

export const DEFAULT_SECTION_ORDER: SectionId[] = ["summary", "skills", "projects", "experience", "education"];

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
};

export const COLOR_PRESETS: { name: string; primary: string; secondary: string }[] = [
  { name: "Yellow", primary: "#CA8A04", secondary: "#FACC15" },
  { name: "Blue", primary: "#1D4ED8", secondary: "#60A5FA" },
  { name: "Green", primary: "#047857", secondary: "#34D399" },
  { name: "Black", primary: "#111111", secondary: "#444444" },
  { name: "Plum", primary: "#7C3AED", secondary: "#C4B5FD" },
  { name: "Crimson", primary: "#BE123C", secondary: "#FB7185" },
];

export const ROLE_SKILLS: Record<string, string[]> = {
  "Frontend Developer": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Vite", "Jest", "Figma"],
  "Backend Developer": ["Node.js", "Express", "PostgreSQL", "MongoDB", "Docker", "REST APIs", "GraphQL", "Redis"],
  "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "Docker", "AWS", "GraphQL"],
  "Data Scientist": ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "SQL", "Tableau", "Jupyter"],
  "Mobile Developer": ["React Native", "Swift", "Kotlin", "Flutter", "Firebase", "REST APIs", "Redux", "Xcode"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "Prometheus"],
  "UI/UX Designer": ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research", "Wireframing", "Design Systems", "InVision"],
  "AI/ML Engineer": ["Python", "PyTorch", "TensorFlow", "Hugging Face", "LangChain", "MLOps", "Pandas", "OpenCV"],
};

export const ROLES = Object.keys(ROLE_SKILLS);

export function improveBullet(text: string): string {
  if (!text.trim()) return text;
  const verbs = ["Architected", "Engineered", "Spearheaded", "Optimized", "Designed", "Implemented", "Delivered"];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const metrics = ["improving performance by 40%", "reducing load time by 35%", "increasing user engagement by 25%", "scaling to 10k+ users", "cutting costs by 30%"];
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  let cleaned = text.trim().replace(/^(i |I |we |made |did |created |built )/i, "").replace(/\.$/, "");
  cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  return `${verb} ${cleaned}, ${metric}.`;
}

export function calculateAtsScore(data: ResumeData): { score: number; suggestions: string[]; warnings: string[] } {
  let score = 0;
  const suggestions: string[] = [];
  const warnings: string[] = [];

  if (data.name) score += 5; else suggestions.push("Add your full name");
  if (data.email) score += 5; else suggestions.push("Add a contact email");
  if (data.phone) score += 5;
  if (data.role) score += 5; else suggestions.push("Select a target role");
  if (data.summary && data.summary.length > 40) score += 10;
  else suggestions.push("Write a 1–2 line professional summary");

  if (data.skills.length >= 6) score += 20;
  else if (data.skills.length >= 3) { score += 10; suggestions.push("Add more relevant skills (aim for 6+)"); }
  else { suggestions.push("Add at least 6 skills"); warnings.push("Less than 3 skills"); }

  if (data.projects.length >= 2) score += 25;
  else if (data.projects.length === 1) { score += 12; suggestions.push("Add another project to strengthen your resume"); }
  else { suggestions.push("Include at least 1 project"); warnings.push("No projects added"); }

  const shortDescs = data.projects.filter(p => p.description.length > 0 && p.description.length <= 50).length;
  if (data.projects.length > 0 && shortDescs === 0) score += 10;
  else if (shortDescs > 0) warnings.push(`${shortDescs} project description${shortDescs > 1 ? "s" : ""} too short`);

  if (data.experience.length > 0) score += 10;
  if (data.education.length > 0) score += 5;
  else warnings.push("No education added");

  if (data.role && ROLE_SKILLS[data.role]) {
    const target = ROLE_SKILLS[data.role].map(s => s.toLowerCase());
    const matched = data.skills.filter(s => target.includes(s.toLowerCase())).length;
    if (matched >= 4) score += 5;
    else if (matched > 0) suggestions.push(`Add more ${data.role}-specific keywords`);
  }

  return { score: Math.min(100, score), suggestions: suggestions.slice(0, 5), warnings };
}

export function completionPercent(data: ResumeData): number {
  const checks = [
    !!data.name, !!data.email, !!data.role, !!data.summary,
    data.skills.length >= 3, data.projects.length >= 1,
    data.experience.length >= 0 ? data.experience.length > 0 || data.projects.length >= 2 : false,
    data.education.length >= 1,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export const DEMO_DATA: ResumeData = {
  name: "Aanya Sharma",
  email: "aanya.sharma@email.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  role: "Frontend Developer",
  summary: "Final-year CS student passionate about building delightful, accessible web experiences. Strong fundamentals in React, TypeScript and modern UI engineering.",
  skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Vite", "Figma", "Jest", "GraphQL"],
  projects: [
    { title: "Pulse — Realtime Dashboard", description: "Engineered a real-time analytics dashboard with React and WebSockets, reducing perceived load time by 40% and supporting 10k concurrent users." },
    { title: "StudyHive — Collab Notes", description: "Designed a collaborative notes platform with offline sync and rich-text editing, growing to 2,000 weekly active student users." },
  ],
  experience: [
    { company: "Lumen Labs", role: "Frontend Intern", duration: "Jun 2024 – Aug 2024", description: "Shipped 12+ UI components used across 3 products, improving design-system coverage by 60%." },
  ],
  education: [
    { school: "BITS Pilani", degree: "B.E. Computer Science", year: "2022 – 2026" },
  ],
  template: "modern",
  sectionOrder: DEFAULT_SECTION_ORDER,
  primaryColor: "#CA8A04",
  secondaryColor: "#FACC15",
  showIcons: true,
};

export const STORAGE_KEY = "cvify.resume.v3";

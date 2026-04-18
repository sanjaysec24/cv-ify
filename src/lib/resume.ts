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
};

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

export function calculateAtsScore(data: ResumeData): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  if (data.name) score += 5; else suggestions.push("Add your full name");
  if (data.email) score += 5; else suggestions.push("Add a contact email");
  if (data.phone) score += 5;
  if (data.role) score += 5; else suggestions.push("Select a target role");
  if (data.summary && data.summary.length > 40) score += 10;
  else suggestions.push("Write a 1–2 line professional summary");

  if (data.skills.length >= 6) score += 20;
  else if (data.skills.length >= 3) { score += 10; suggestions.push("Add more relevant skills (aim for 6+)"); }
  else suggestions.push("Add at least 6 skills");

  if (data.projects.length >= 2) score += 25;
  else if (data.projects.length === 1) { score += 12; suggestions.push("Add another project to strengthen your resume"); }
  else suggestions.push("Include at least 1 project");

  const projDescOk = data.projects.every(p => p.description.length > 50);
  if (data.projects.length > 0 && projDescOk) score += 10;
  else if (data.projects.length > 0) suggestions.push("Expand short project descriptions");

  if (data.experience.length > 0) score += 10;
  if (data.education.length > 0) score += 5;

  return { score: Math.min(100, score), suggestions: suggestions.slice(0, 5) };
}

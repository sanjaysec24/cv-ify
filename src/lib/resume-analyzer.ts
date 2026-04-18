import { ROLE_SKILLS, ROLES, improveBullet } from "./resume";

export type AnalyzedResume = {
  rawText: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  detectedRole: string | null;
  hasSummary: boolean;
  hasSkillsSection: boolean;
  hasProjectsSection: boolean;
  hasExperienceSection: boolean;
  hasEducationSection: boolean;
  skills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordMatchPct: number;
  wordCount: number;
  bullets: string[];
  weakBullets: string[];
  improvedBullets: { original: string; improved: string }[];
  score: number;
  suggestions: string[];
  warnings: string[];
};

const SECTION_KEYWORDS = {
  summary: ["summary", "profile", "objective", "about me"],
  skills: ["skills", "technical skills", "technologies", "tech stack"],
  projects: ["projects", "personal projects", "selected projects"],
  experience: ["experience", "work experience", "employment", "internship"],
  education: ["education", "academic", "qualification"],
};

function hasSection(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => new RegExp(`(^|\\n|\\s)${w}\\b`, "i").test(lower));
}

function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/(\+?\d[\d\s().-]{8,}\d)/);
  return m ? m[0].trim() : null;
}

function extractName(text: string): string | null {
  // Heuristic: first non-empty line with 2-4 capitalized words, no email/phone
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.includes("@") || /\d{3,}/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const allCapsLike = words.every((w) => /^[A-Z][a-zA-Z'’-]+$/.test(w) || /^[A-Z]+$/.test(w));
    if (allCapsLike) return line;
  }
  return null;
}

function detectRoleAndSkills(text: string): { role: string | null; skills: string[]; matched: string[]; missing: string[]; pct: number } {
  const lower = text.toLowerCase();
  let bestRole: string | null = null;
  let bestMatched: string[] = [];
  let bestMissing: string[] = [];
  let bestPct = 0;
  let bestCount = 0;
  const allFound = new Set<string>();

  for (const role of ROLES) {
    const target = ROLE_SKILLS[role];
    const matched = target.filter((s) => new RegExp(`\\b${s.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower));
    matched.forEach((s) => allFound.add(s));
    if (matched.length > bestCount) {
      bestCount = matched.length;
      bestRole = role;
      bestMatched = matched;
      bestMissing = target.filter((s) => !matched.includes(s));
      bestPct = Math.round((matched.length / target.length) * 100);
    }
  }

  return {
    role: bestCount >= 2 ? bestRole : null,
    skills: Array.from(allFound),
    matched: bestMatched,
    missing: bestMissing,
    pct: bestPct,
  };
}

function extractBullets(text: string): string[] {
  // Lines starting with bullet chars OR meaningful sentences
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[•\-*●▪►◦·]\s*/, "");
    if (cleaned !== line && cleaned.length > 10) bullets.push(cleaned);
    else if (line.length > 40 && line.length < 220 && /[a-z]/.test(line) && !/@/.test(line)) {
      // heuristic sentence-ish line in experience/projects area
      bullets.push(line);
    }
  }
  return bullets.slice(0, 40);
}

const WEAK_VERBS = ["worked on", "helped", "did", "made", "responsible for", "involved in", "assisted", "participated"];

function isWeak(bullet: string): boolean {
  const lower = bullet.toLowerCase();
  if (bullet.length < 60) return true;
  if (!/\d/.test(bullet)) return true; // no metric
  if (WEAK_VERBS.some((v) => lower.startsWith(v) || lower.includes(` ${v} `))) return true;
  return false;
}

export function analyzeResumeText(rawText: string): AnalyzedResume {
  const text = rawText.replace(/\u00a0/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);

  const hasSummary = hasSection(text, SECTION_KEYWORDS.summary);
  const hasSkillsSection = hasSection(text, SECTION_KEYWORDS.skills);
  const hasProjectsSection = hasSection(text, SECTION_KEYWORDS.projects);
  const hasExperienceSection = hasSection(text, SECTION_KEYWORDS.experience);
  const hasEducationSection = hasSection(text, SECTION_KEYWORDS.education);

  const { role, skills, matched, missing, pct } = detectRoleAndSkills(text);

  const bullets = extractBullets(text);
  const weakBullets = bullets.filter(isWeak).slice(0, 6);
  const improvedBullets = weakBullets.map((b) => ({ original: b, improved: improveBullet(b) }));

  // Scoring
  let score = 0;
  const suggestions: string[] = [];
  const warnings: string[] = [];

  if (name) score += 5; else { suggestions.push("Add your full name at the top"); warnings.push("Name not detected"); }
  if (email) score += 8; else { suggestions.push("Add a professional email"); warnings.push("Email missing"); }
  if (phone) score += 7; else suggestions.push("Add a contact phone number");

  if (hasSummary) score += 8; else suggestions.push("Add a 2–3 line professional summary");
  if (hasSkillsSection) score += 10; else { suggestions.push("Add a clear Skills section"); warnings.push("No Skills section"); }
  if (hasProjectsSection) score += 12; else { suggestions.push("Include at least 1 project with impact"); warnings.push("No Projects section"); }
  if (hasExperienceSection) score += 10; else suggestions.push("Add an Experience or Internship section");
  if (hasEducationSection) score += 5; else warnings.push("No Education section");

  if (skills.length >= 8) score += 10;
  else if (skills.length >= 4) { score += 6; suggestions.push("Add more relevant skills (aim for 8+)"); }
  else { suggestions.push("Add more recognized skill keywords"); warnings.push("Very few skill keywords"); }

  // Keyword match boost
  if (pct >= 60) score += 15;
  else if (pct >= 30) { score += 8; suggestions.push(`Add more ${role ?? "role"}-specific keywords`); }
  else suggestions.push("Tailor keywords to a specific role");

  // Length quality
  if (wordCount >= 250 && wordCount <= 850) score += 10;
  else if (wordCount < 250) { suggestions.push("Resume looks too short — expand experience and projects"); warnings.push("Resume too short"); }
  else { suggestions.push("Resume is long — keep it to 1 page for freshers"); warnings.push("Resume too long"); }

  // Quantified bullets
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  if (quantified >= 3) score += 5;
  else suggestions.push("Add measurable impact (e.g. %, users, time saved) to bullets");

  if (weakBullets.length > 0) suggestions.push("Replace weak phrases like 'worked on' with strong action verbs");

  return {
    rawText: text,
    name,
    email,
    phone,
    detectedRole: role,
    hasSummary,
    hasSkillsSection,
    hasProjectsSection,
    hasExperienceSection,
    hasEducationSection,
    skills,
    matchedKeywords: matched,
    missingKeywords: missing.slice(0, 8),
    keywordMatchPct: pct,
    wordCount,
    bullets,
    weakBullets,
    improvedBullets,
    score: Math.min(100, score),
    suggestions: suggestions.slice(0, 7),
    warnings,
  };
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  if (name.endsWith(".txt")) return file.text();
  throw new Error("Unsupported file. Please upload a PDF, DOCX, or TXT file.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => ("str" in it ? it.str : ""));
    text += strings.join(" ") + "\n";
  }
  return text;
}

async function extractDocx(file: File): Promise<string> {
  // @ts-expect-error - mammoth browser bundle ships without types
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value as string;
}

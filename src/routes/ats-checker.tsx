import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Loader2, RefreshCw, Wand2, Target, Briefcase, GraduationCap, FolderGit2, BadgeCheck, ArrowRight,
} from "lucide-react";
import { extractTextFromFile, analyzeResumeText, type AnalyzedResume } from "@/lib/resume-analyzer";

export const Route = createFileRoute("/ats-checker")({
  head: () => ({
    meta: [
      { title: "ATS Resume Checker — CVify.AI" },
      { name: "description", content: "Upload your resume and get an instant ATS score, keyword match, and AI-powered suggestions to improve it." },
      { property: "og:title", content: "ATS Resume Checker — CVify.AI" },
      { property: "og:description", content: "Drop your PDF or DOCX resume to get an instant ATS score, role detection, and actionable improvements." },
    ],
  }),
  component: ATSCheckerPage,
});

type Status = "idle" | "parsing" | "analyzing" | "done" | "error";

function ATSCheckerPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzedResume | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      setStatus("error");
      return;
    }
    try {
      setStatus("parsing");
      const text = await extractTextFromFile(file);
      if (!text.trim() || text.trim().length < 50) {
        throw new Error("Could not read meaningful text from this file. Try a different export.");
      }
      setStatus("analyzing");
      // small delay so the analyzing animation is perceivable
      await new Promise((r) => setTimeout(r, 500));
      const r = analyzeResumeText(text);
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 grid-bg radial-fade opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-neon" />
            ATS Resume Checker
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Is your resume <span className="text-neon">ATS-ready?</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground">
            Drop your PDF or DOCX. We analyze keywords, structure, and impact — instantly.
          </p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          layout
          className="mx-auto mt-10 max-w-3xl"
        >
          <label
            htmlFor="resume-file"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-all
              ${dragOver ? "border-neon bg-neon/10 scale-[1.01] shadow-glow" : "border-border bg-card hover:border-neon/60 hover:bg-accent/40"}
            `}
          >
            <motion.div
              animate={dragOver ? { y: -6 } : { y: 0 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neon text-neon-foreground"
            >
              {status === "parsing" || status === "analyzing"
                ? <Loader2 className="h-7 w-7 animate-spin" />
                : <Upload className="h-7 w-7" strokeWidth={2.4} />}
            </motion.div>
            <div>
              <p className="text-lg font-bold">
                {status === "parsing" ? "Reading your file…"
                  : status === "analyzing" ? "Analyzing content…"
                  : "Upload your resume"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag & drop, or click to browse — PDF, DOCX, TXT (max 10MB)
              </p>
            </div>
            {fileName && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">
                <FileText className="h-3.5 w-3.5" /> {fileName}
              </div>
            )}
            <input
              ref={inputRef}
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {status === "done" && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Re-upload
              </button>
            </div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && status === "done" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <ResultsDashboard result={result} fileName={fileName} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function scoreColor(score: number) {
  if (score < 50) return "text-destructive";
  if (score < 75) return "text-amber-500";
  return "text-neon";
}
function scoreStroke(score: number) {
  if (score < 50) return "var(--destructive)";
  if (score < 75) return "#f59e0b";
  return "var(--neon)";
}
function scoreLabel(score: number) {
  if (score < 50) return "Needs work";
  if (score < 75) return "Decent";
  return "Strong";
}

function ResultsDashboard({ result, fileName }: { result: AnalyzedResume; fileName: string | null }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-3xl p-7 text-center shadow-soft"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">ATS Score</p>
        <CircularScore score={result.score} />
        <p className={`mt-3 text-lg font-bold ${scoreColor(result.score)}`}>{scoreLabel(result.score)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {result.detectedRole ? <>Detected role: <span className="font-semibold text-foreground">{result.detectedRole}</span></> : "Role not detected"}
        </p>

        <div className="mt-6 space-y-3 text-left">
          <StrengthMeter label="Keyword match" value={result.keywordMatchPct} />
          <StrengthMeter label="Resume strength" value={result.score} />
        </div>
      </motion.div>

      {/* Detected fields */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="glass rounded-3xl p-7 shadow-soft lg:col-span-2"
      >
        <h2 className="font-display text-xl font-bold">What we found</h2>
        <p className="mt-1 text-sm text-muted-foreground">{fileName} • {result.wordCount} words</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Check label="Name" value={result.name ?? "Not detected"} ok={!!result.name} />
          <Check label="Email" value={result.email ?? "Not detected"} ok={!!result.email} />
          <Check label="Phone" value={result.phone ?? "Not detected"} ok={!!result.phone} />
          <Check label="Summary section" value={result.hasSummary ? "Present" : "Missing"} ok={result.hasSummary} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SectionPill icon={BadgeCheck} label="Skills" present={result.hasSkillsSection} />
          <SectionPill icon={FolderGit2} label="Projects" present={result.hasProjectsSection} />
          <SectionPill icon={Briefcase} label="Experience" present={result.hasExperienceSection} />
          <SectionPill icon={GraduationCap} label="Education" present={result.hasEducationSection} />
        </div>

        {result.skills.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detected skills ({result.skills.length})</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.skills.map((s) => (
                <span key={s} className="rounded-full bg-neon/20 px-2.5 py-1 text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {result.missingKeywords.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Missing keywords {result.detectedRole && `for ${result.detectedRole}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.missingKeywords.map((s) => (
                <span key={s} className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  + {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass rounded-3xl p-7 shadow-soft lg:col-span-2"
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-neon" />
          <h2 className="font-display text-xl font-bold">Suggestions</h2>
        </div>
        {result.suggestions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Looking great — no critical issues found.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                {s}
              </li>
            ))}
          </ul>
        )}

        {result.warnings.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Warnings
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Improve */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass rounded-3xl p-7 shadow-soft"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-neon" />
          <h2 className="font-display text-xl font-bold">Improve Resume</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the builder pre-filled to refine sections, switch templates, and re-export a stronger PDF.
        </p>
        <Link
          to="/builder"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-sm font-bold text-neon-foreground shadow-glow hover:opacity-90 transition-all"
        >
          ✨ Open in Builder <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* Improved bullets */}
      {result.improvedBullets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-3xl p-7 shadow-soft lg:col-span-3"
        >
          <h2 className="font-display text-xl font-bold">AI-rewritten bullets</h2>
          <p className="mt-1 text-sm text-muted-foreground">We found {result.weakBullets.length} weak lines and rewrote them with stronger verbs and metrics.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.improvedBullets.map((b, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original</p>
                <p className="mt-1 text-sm line-through opacity-70">{b.original}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-neon">Improved</p>
                <p className="mt-1 text-sm font-medium">{b.improved}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CircularScore({ score }: { score: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative mx-auto mt-4 h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} stroke="var(--border)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70" cy="70" r={r}
          stroke={scoreStroke(score)} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function StrengthMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-neon"
        />
      </div>
    </div>
  );
}

function Check({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      {ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-neon" /> : <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function SectionPill({ icon: Icon, label, present }: { icon: React.ComponentType<{ className?: string }>; label: string; present: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors ${present ? "border-neon/40 bg-neon/10" : "border-border bg-background opacity-70"}`}>
      <Icon className={`h-5 w-5 ${present ? "text-neon" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{present ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}

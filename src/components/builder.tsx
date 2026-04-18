import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  User, Wrench, FolderGit2, Briefcase, GraduationCap,
  Sparkles, Plus, X, Download, Check, AlertTriangle, Loader2, ArrowRight, ArrowLeft,
} from "lucide-react";
import { ResumePreview } from "./resume-preview";
import {
  type ResumeData, ROLES, ROLE_SKILLS, calculateAtsScore, improveBullet,
} from "@/lib/resume";

const STEPS = [
  { id: 1, label: "Basics", icon: User },
  { id: 2, label: "Skills", icon: Wrench },
  { id: 3, label: "Projects", icon: FolderGit2 },
  { id: 4, label: "Experience", icon: Briefcase },
  { id: 5, label: "Education", icon: GraduationCap },
];

const initial: ResumeData = {
  name: "", email: "", phone: "", location: "", role: "", summary: "",
  skills: [], projects: [], experience: [], education: [],
};

export function Builder() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(initial);
  const [skillInput, setSkillInput] = useState("");
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { score, suggestions } = calculateAtsScore(data);
  const suggestedSkills = data.role ? ROLE_SKILLS[data.role] ?? [] : [];

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || data.skills.includes(v)) return;
    update("skills", [...data.skills, v]);
    setSkillInput("");
  };

  const improveProject = async (i: number) => {
    setImprovingIdx(i);
    await new Promise((r) => setTimeout(r, 900));
    setData((d) => {
      const projects = [...d.projects];
      projects[i] = { ...projects[i], description: improveBullet(projects[i].description) };
      return { ...d, projects };
    });
    setImprovingIdx(null);
  };

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`${data.name || "resume"}.pdf`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      {/* Top: Progress + ATS */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <button
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                      active ? "bg-neon text-neon-foreground shadow-glow" : done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      active ? "bg-neon-foreground/10" : done ? "bg-neon/20 text-neon" : "bg-muted"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden text-sm font-semibold sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 rounded ${done ? "bg-neon" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <AtsCard score={score} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: form */}
        <div className="glass rounded-3xl p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <StepWrap title="Basic Information" desc="Let's start with the essentials.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name" value={data.name} onChange={(v) => update("name", v)} placeholder="Jane Doe" />
                    <Field label="Email" value={data.email} onChange={(v) => update("email", v)} placeholder="jane@email.com" />
                    <Field label="Phone" value={data.phone} onChange={(v) => update("phone", v)} placeholder="+1 555 010 0000" />
                    <Field label="Location" value={data.location} onChange={(v) => update("location", v)} placeholder="San Francisco, CA" />
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Role</label>
                    <select
                      value={data.role}
                      onChange={(e) => update("role", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                    >
                      <option value="">Select a role…</option>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</label>
                    <textarea
                      value={data.summary}
                      onChange={(e) => update("summary", e.target.value)}
                      placeholder="Final-year CS student passionate about building scalable web apps…"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                    />
                  </div>
                </StepWrap>
              )}

              {step === 2 && (
                <StepWrap title="Skills" desc="Add skills relevant to your target role.">
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                    />
                    <button onClick={() => addSkill(skillInput)} className="rounded-xl bg-foreground px-4 text-background hover:opacity-90">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {data.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {data.skills.map((s) => (
                        <motion.span
                          layout
                          key={s}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-neon px-3 py-1 text-xs font-semibold text-neon-foreground"
                        >
                          {s}
                          <button onClick={() => update("skills", data.skills.filter((x) => x !== s))}>
                            <X className="h-3 w-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {suggestedSkills.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-neon" /> AI Suggested for {data.role}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSkills.filter((s) => !data.skills.includes(s)).map((s) => (
                          <button
                            key={s}
                            onClick={() => addSkill(s)}
                            className="rounded-full border border-dashed border-neon/60 px-3 py-1 text-xs font-medium text-foreground hover:bg-neon hover:text-neon-foreground transition-colors"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </StepWrap>
              )}

              {step === 3 && (
                <StepWrap title="Projects" desc="Showcase what you've built.">
                  <div className="space-y-4">
                    {data.projects.map((p, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-background/50 p-4">
                        <div className="flex items-center justify-between">
                          <input
                            value={p.title}
                            onChange={(e) => {
                              const ps = [...data.projects]; ps[i] = { ...ps[i], title: e.target.value };
                              update("projects", ps);
                            }}
                            placeholder="Project name"
                            className="flex-1 bg-transparent text-base font-semibold focus:outline-none"
                          />
                          <button onClick={() => update("projects", data.projects.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          value={p.description}
                          onChange={(e) => {
                            const ps = [...data.projects]; ps[i] = { ...ps[i], description: e.target.value };
                            update("projects", ps);
                          }}
                          rows={3}
                          placeholder="What did you build? What technologies? What was the impact?"
                          className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-neon focus:outline-none"
                        />
                        <button
                          onClick={() => improveProject(i)}
                          disabled={improvingIdx === i || !p.description}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-neon px-3 py-1.5 text-xs font-semibold text-neon-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {improvingIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Improve with AI
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => update("projects", [...data.projects, { title: "", description: "" }])}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-neon hover:text-neon transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Project
                    </button>
                  </div>
                </StepWrap>
              )}

              {step === 4 && (
                <StepWrap title="Experience" desc="Internships and jobs (optional).">
                  <div className="space-y-4">
                    {data.experience.map((e, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-background/50 p-4 space-y-2">
                        <div className="flex gap-2">
                          <input value={e.role} onChange={(ev) => { const a=[...data.experience]; a[i]={...a[i],role:ev.target.value}; update("experience",a);}} placeholder="Role" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                          <button onClick={() => update("experience", data.experience.filter((_,x)=>x!==i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4"/></button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={e.company} onChange={(ev) => { const a=[...data.experience]; a[i]={...a[i],company:ev.target.value}; update("experience",a);}} placeholder="Company" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                          <input value={e.duration} onChange={(ev) => { const a=[...data.experience]; a[i]={...a[i],duration:ev.target.value}; update("experience",a);}} placeholder="Jun 2024 – Present" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                        </div>
                        <textarea value={e.description} onChange={(ev) => { const a=[...data.experience]; a[i]={...a[i],description:ev.target.value}; update("experience",a);}} rows={2} placeholder="Key achievements…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                      </div>
                    ))}
                    <button onClick={() => update("experience", [...data.experience, { role:"",company:"",duration:"",description:""}])} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-neon hover:text-neon transition-colors">
                      <Plus className="h-4 w-4" /> Add Experience
                    </button>
                  </div>
                </StepWrap>
              )}

              {step === 5 && (
                <StepWrap title="Education" desc="Your academic background.">
                  <div className="space-y-4">
                    {data.education.map((e, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-background/50 p-4 space-y-2">
                        <div className="flex gap-2">
                          <input value={e.school} onChange={(ev) => { const a=[...data.education]; a[i]={...a[i],school:ev.target.value}; update("education",a);}} placeholder="School / University" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                          <button onClick={() => update("education", data.education.filter((_,x)=>x!==i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4"/></button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={e.degree} onChange={(ev) => { const a=[...data.education]; a[i]={...a[i],degree:ev.target.value}; update("education",a);}} placeholder="B.Sc. Computer Science" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                          <input value={e.year} onChange={(ev) => { const a=[...data.education]; a[i]={...a[i],year:ev.target.value}; update("education",a);}} placeholder="2022 – 2026" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-neon" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => update("education", [...data.education, { school:"",degree:"",year:""}])} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-neon hover:text-neon transition-colors">
                      <Plus className="h-4 w-4" /> Add Education
                    </button>
                  </div>
                </StepWrap>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < STEPS.length ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                className="inline-flex items-center gap-1.5 rounded-full bg-neon px-5 py-2 text-sm font-semibold text-neon-foreground hover:opacity-90"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={downloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Resume
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-neon" /> Resume Health
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {suggestions.map((s) => <li key={s}>• {s}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: preview */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl bg-muted/40 p-4 lg:p-6 overflow-auto">
            <div className="origin-top scale-[0.78] sm:scale-90 lg:scale-[0.72] xl:scale-90 -mb-[20%]">
              <ResumePreview ref={previewRef} data={data} />
            </div>
          </div>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="mt-4 hidden lg:inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-sm font-bold text-neon-foreground hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download as PDF
          </button>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-neon px-5 py-3 text-sm font-bold text-neon-foreground shadow-glow"
          >
            <Check className="h-4 w-4" /> Resume downloaded successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepWrap({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
      />
    </div>
  );
}

function AtsCard({ score }: { score: number }) {
  const color = score >= 75 ? "text-neon" : score >= 45 ? "text-amber-500" : "text-destructive";
  return (
    <div className="glass rounded-2xl p-4 lg:min-w-[260px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ATS Score</p>
          <p className={`mt-0.5 font-display text-3xl font-bold ${color}`}>{score}<span className="text-base text-muted-foreground">/100</span></p>
        </div>
        <Sparkles className="h-6 w-6 text-neon" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-neon"
        />
      </div>
    </div>
  );
}

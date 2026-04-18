import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  User, Wrench, FolderGit2, Briefcase, GraduationCap,
  Sparkles, Plus, X, Download, Check, AlertTriangle, Loader2, ArrowRight, ArrowLeft,
  GripVertical, Wand2, LayoutTemplate, Image as ImageIcon, Palette,
  ZoomIn, ZoomOut, Eye, Linkedin, Github, Globe, ExternalLink,
} from "lucide-react";
import { ResumePreview } from "./resume-preview";
import {
  type ResumeData, type SectionId, type TemplateId,
  ROLES, ROLE_SKILLS, SECTION_LABELS, COLOR_PRESETS,
  DEFAULT_SECTION_ORDER, DEMO_DATA, STORAGE_KEY,
  calculateAtsScore, completionPercent, improveBullet, isValidUrl,
} from "@/lib/resume";
import { exportResumePdf } from "@/lib/pdf-export";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth-provider";
import { saveResume, loadResume } from "@/lib/resume-store";

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
  template: "modern", sectionOrder: DEFAULT_SECTION_ORDER,
  photo: undefined,
  primaryColor: COLOR_PRESETS[0].primary,
  secondaryColor: COLOR_PRESETS[0].secondary,
  showIcons: true,
};

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "modern", label: "Modern", desc: "Clean & professional" },
  { id: "sidebar", label: "Sidebar", desc: "Photo sidebar" },
  { id: "creative", label: "Creative", desc: "Card style" },
  { id: "classic", label: "Classic ATS", desc: "Pure B&W" },
  { id: "minimal", label: "Minimal", desc: "Centered & airy" },
  { id: "compact", label: "Compact", desc: "One-page dense" },
];

export function Builder() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [zoom, setZoom] = useState(0.78);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Hydrate: prefer Firestore, fall back to localStorage
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const cloud = await loadResume(user.uid);
        if (cancelled) return;
        if (cloud) {
          setData((d) => ({ ...d, ...cloud, sectionOrder: cloud.sectionOrder ?? d.sectionOrder }));
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<ResumeData>;
            setData((d) => ({ ...d, ...parsed, sectionOrder: parsed.sectionOrder ?? d.sectionOrder }));
          }
        }
      } catch (e) {
        console.warn("Failed to load resume:", e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Auto-save to localStorage + Firestore (debounced)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setCloudStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await saveResume(user.uid, data);
        setCloudStatus("saved");
      } catch (e) {
        console.warn("Cloud save failed:", e);
        setCloudStatus("error");
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, hydrated, user]);

  const { score, suggestions, warnings } = calculateAtsScore(data);
  const completion = completionPercent(data);
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
    await new Promise((r) => setTimeout(r, 700));
    setData((d) => {
      const projects = [...d.projects];
      projects[i] = { ...projects[i], description: improveBullet(projects[i].description) };
      return { ...d, projects };
    });
    setImprovingIdx(null);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      await exportResumePdf(data.name);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setDownloading(false);
    }
  };

  const onPhoto = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is larger than 2MB. Please pick a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("photo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const loadDemo = () => setData({
    ...DEMO_DATA,
    template: data.template,
    sectionOrder: data.sectionOrder,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    showIcons: data.showIcons,
    photo: data.photo,
  });
  const resetAll = () => { if (confirm("Clear all resume data?")) setData(initial); };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = data.sectionOrder.indexOf(active.id as SectionId);
    const newIdx = data.sectionOrder.indexOf(over.id as SectionId);
    update("sectionOrder", arrayMove(data.sectionOrder, oldIdx, newIdx));
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      {/* Top toolbar */}
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
        <AtsCard score={score} completion={completion} />
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={loadDemo} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
          <Wand2 className="h-3.5 w-3.5" /> Try Demo Resume
        </button>
        {user && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
              cloudStatus === "saving"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : cloudStatus === "saved"
                ? "border-neon/30 bg-neon/10 text-neon"
                : cloudStatus === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-muted text-muted-foreground"
            }`}
            title="Auto-saving to your Google account"
          >
            {cloudStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
            {cloudStatus === "saved" && <Check className="h-3 w-3" />}
            {cloudStatus === "error" && <AlertTriangle className="h-3 w-3" />}
            {cloudStatus === "saving" ? "Saving…" : cloudStatus === "saved" ? "Saved to cloud" : cloudStatus === "error" ? "Save failed" : "Cloud sync"}
          </span>
        )}
        <button className="hidden">_</button>
        </button>
        <button onClick={resetAll} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
          <X className="h-3.5 w-3.5" /> Reset
        </button>
        <label className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
          <input type="checkbox" checked={data.showIcons} onChange={(e) => update("showIcons", e.target.checked)} className="accent-current" />
          Section icons
        </label>
      </div>

      {/* Template gallery */}
      <div className="mb-4 glass rounded-2xl p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <LayoutTemplate className="h-3.5 w-3.5 text-neon" /> Template
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => update("template", t.id)}
              className={`group relative rounded-xl border-2 p-3 text-left transition-all ${
                data.template === t.id
                  ? "border-neon bg-neon/10 shadow-glow"
                  : "border-border bg-background hover:border-neon/50"
              }`}
              title={t.desc}
            >
              <div className="text-sm font-bold">{t.label}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{t.desc}</div>
              {data.template === t.id && (
                <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-neon text-neon-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Color customization */}
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Palette className="h-3.5 w-3.5 text-neon" /> Color Theme
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((p) => {
              const active = data.primaryColor.toLowerCase() === p.primary.toLowerCase();
              return (
                <button
                  key={p.name}
                  onClick={() => { update("primaryColor", p.primary); update("secondaryColor", p.secondary); }}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-all ${
                    active ? "border-foreground" : "border-border hover:border-foreground/50"
                  }`}
                  title={p.name}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: p.primary }} />
                  {p.name}
                </button>
              );
            })}
            <label className="flex items-center gap-1.5 rounded-full border-2 border-border px-2.5 py-1 text-xs font-semibold cursor-pointer hover:border-foreground/50">
              <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: data.primaryColor }} />
              Custom
              <input type="color" value={data.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-0 w-0 opacity-0" />
            </label>
          </div>
        </div>
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
                  {/* Photo */}
                  <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-background/50 p-4">
                    {data.photo ? (
                      <img src={data.photo} alt="profile" className="h-16 w-16 rounded-full object-cover border-2 border-neon" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Profile photo</p>
                      <p className="text-xs text-muted-foreground">Optional. Shown on Sidebar / Modern / Creative templates.</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90">
                          <Plus className="h-3.5 w-3.5" /> {data.photo ? "Change" : "Upload"}
                        </button>
                        {data.photo && (
                          <button onClick={() => update("photo", undefined)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                            <X className="h-3.5 w-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

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

                  {/* Professional links */}
                  <div className="mt-5">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 text-neon" /> Professional Links
                    </p>
                    <div className="space-y-3">
                      <UrlField icon={Linkedin} label="LinkedIn" value={data.linkedin ?? ""} onChange={(v) => update("linkedin", v)} placeholder="https://linkedin.com/in/yourname" />
                      <UrlField icon={Github} label="GitHub" value={data.github ?? ""} onChange={(v) => update("github", v)} placeholder="https://github.com/yourname" />
                      <UrlField icon={Globe} label="Portfolio / Website" value={data.website ?? ""} onChange={(v) => update("website", v)} placeholder="https://yourname.dev" />
                    </div>
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
                          placeholder="What did you build? What was the impact?"
                          className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-neon focus:outline-none"
                        />
                        <input
                          value={p.tech ?? ""}
                          onChange={(e) => {
                            const ps = [...data.projects]; ps[i] = { ...ps[i], tech: e.target.value };
                            update("projects", ps);
                          }}
                          placeholder="Tech stack — e.g. React, Node.js, PostgreSQL"
                          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-neon focus:outline-none"
                        />
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <UrlField
                            icon={Github}
                            label="GitHub"
                            value={p.github ?? ""}
                            onChange={(v) => {
                              const ps = [...data.projects]; ps[i] = { ...ps[i], github: v };
                              update("projects", ps);
                            }}
                            placeholder="https://github.com/you/project"
                            compact
                          />
                          <UrlField
                            icon={ExternalLink}
                            label="Live Demo"
                            value={p.demo ?? ""}
                            onChange={(v) => {
                              const ps = [...data.projects]; ps[i] = { ...ps[i], demo: v };
                              update("projects", ps);
                            }}
                            placeholder="https://project.vercel.app"
                            compact
                          />
                        </div>
                        <button
                          onClick={() => improveProject(i)}
                          disabled={improvingIdx === i || !p.description}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neon px-3 py-1.5 text-xs font-semibold text-neon-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {improvingIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Improve with AI
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => update("projects", [...data.projects, { title: "", description: "", tech: "", github: "", demo: "" }])}
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
                className="inline-flex items-center gap-1.5 rounded-full bg-neon px-5 py-2 text-sm font-semibold text-neon-foreground hover:opacity-90 hover:shadow-glow transition-all"
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

          {/* Section reordering */}
          <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5 text-neon" /> Reorder Sections (drag)
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {data.sectionOrder.map((id) => (
                    <SortableRow key={id} id={id} label={SECTION_LABELS[id]} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {warnings.length > 0 && (
            <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Weak Resume Detector
              </p>
              <ul className="space-y-1 text-sm text-foreground/80">
                {warnings.map((w) => <li key={w}>⚠ {w}</li>)}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-neon" /> Suggestions to Improve Score
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {suggestions.map((s) => <li key={s}>• {s}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: preview */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          {/* Zoom controls */}
          <div className="mb-2 flex items-center justify-between rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Live Preview
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))} className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-accent">
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-accent">
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div ref={previewWrapRef} className="rounded-3xl bg-muted/40 p-4 lg:p-6 overflow-auto">
            <motion.div
              key={data.template}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="origin-top"
              style={{ transform: `scale(${zoom})`, marginBottom: `${-(1 - zoom) * 100}%` }}
            >
              <ResumePreview data={data} />
            </motion.div>
          </div>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="mt-4 hidden lg:inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-sm font-bold text-neon-foreground hover:opacity-90 hover:shadow-glow disabled:opacity-50 transition-all"
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

function SortableRow({ id, label }: { id: SectionId; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-neon active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      {label}
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
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30 transition-colors"
      />
    </div>
  );
}

function UrlField({
  icon: Icon, label, value, onChange, placeholder, compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const valid = isValidUrl(value);
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className={`flex items-center gap-2 rounded-xl border bg-background px-3 ${compact ? "py-1.5" : "py-2.5"} focus-within:border-neon focus-within:ring-2 focus-within:ring-neon/30 ${valid ? "border-border" : "border-destructive"}`}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm focus:outline-none"
          inputMode="url"
        />
      </div>
      {!valid && <p className="mt-1 text-[11px] font-medium text-destructive">Enter a valid URL starting with http:// or https://</p>}
    </div>
  );
}

function AtsCard({ score, completion }: { score: number; completion: number }) {
  const color = score >= 75 ? "text-neon" : score >= 45 ? "text-amber-500" : "text-destructive";
  return (
    <div className="glass rounded-2xl p-4 lg:min-w-[280px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ATS Score</p>
          <p className={`mt-0.5 font-display text-3xl font-bold ${color}`}>{score}<span className="text-base text-muted-foreground">/100</span></p>
        </div>
        <Sparkles className="h-6 w-6 text-neon animate-pulse-glow rounded-full" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-neon"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Resume Strength</span>
        <span className="font-semibold text-foreground">{completion}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-foreground"
        />
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Calendar,
  FileText,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  MessageSquare,
  Send,
  Check,
  AlertTriangle,
  Sparkles,
  Inbox,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Github,
  Save,
  X,
  Activity,
  User as UserIcon,
  ListChecks,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  listResumes,
  deleteResumeById,
  submitFeedback,
  saveResume,
  type ResumeListItem,
} from "@/lib/resume-store";
import {
  getOrCreateUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/user-profile";
import { calculateAtsScore, STORAGE_KEY, type ResumeData } from "@/lib/resume";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — CVify.AI" },
      {
        name: "description",
        content:
          "Your CVify dashboard — manage profile details, saved resumes, activity, and share feedback.",
      },
    ],
  }),
  component: ProfilePage,
});

type TabId = "info" | "resumes" | "activity" | "feedback";

const TABS: { id: TabId; label: string; icon: typeof UserIcon }[] = [
  { id: "info", label: "Profile Info", icon: UserIcon },
  { id: "resumes", label: "My Resumes", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("info");

  // profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // resumes
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  

  // feedback toast
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // load profile
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setProfileLoading(true);
    getOrCreateUserProfile({
      uid: user.uid,
      name: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
    })
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => console.warn("profile load failed", e))
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // load resumes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingResumes(true);
    listResumes(user.uid)
      .then((items) => {
        if (!cancelled) setResumes(items);
      })
      .catch((e) => {
        console.warn("listResumes failed", e);
        if (!cancelled) setResumes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingResumes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function showToast(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2800);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    setDeleteId(id);
    try {
      await deleteResumeById(id);
      setResumes((r) => (r ? r.filter((x) => x.id !== id) : r));
      showToast("ok", "Resume deleted");
    } catch (e) {
      console.warn("delete failed", e);
      showToast("err", "Failed to delete resume");
    } finally {
      setDeleteId(null);
    }
  }

  function handleEdit(item: ResumeListItem) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item.resumeData));
    } catch {
      /* ignore */
    }
    navigate({ to: "/builder" });
  }


  async function handleNewResume() {
    if (!user) return;
    const blank: ResumeData = {
      name: profile?.name ?? user.displayName ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      role: profile?.role ?? "",
      summary: profile?.bio ?? "",
      linkedin: profile?.linkedin ?? "",
      github: profile?.github ?? "",
      skills: [],
      projects: [],
      experience: [],
      education: [],
      template: "modern",
      sectionOrder: ["summary", "skills", "projects", "experience", "education"],
      primaryColor: "#CA8A04",
      secondaryColor: "#FACC15",
      showIcons: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blank));
      await saveResume(user.uid, blank);
    } catch {
      /* ignore */
    }
    navigate({ to: "/builder" });
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  // activity stats
  const totalResumes = resumes?.length ?? 0;
  const lastEdited = resumes?.[0]?.updatedAt ?? null;
  const avgStrength =
    resumes && resumes.length
      ? Math.round(
          resumes.reduce((sum, r) => sum + calculateAtsScore(r.resumeData).score, 0) /
            resumes.length
        )
      : 0;

  const joined = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastLogin = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg ${
              toast.kind === "ok"
                ? "bg-neon text-neon-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {toast.kind === "ok" ? (
              <Check className="mr-1.5 inline h-4 w-4" />
            ) : (
              <AlertTriangle className="mr-1.5 inline h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-3xl border border-border p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon/20 blur-3xl" />
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {(profile?.photoURL || user.photoURL) ? (
            <img
              src={profile?.photoURL || user.photoURL!}
              alt={profile?.name ?? user.displayName ?? "Profile"}
              referrerPolicy="no-referrer"
              className="h-24 w-24 rounded-full border-2 border-neon object-cover shadow-glow"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neon text-3xl font-bold text-neon-foreground">
              {(profile?.name ?? user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {profile?.name || user.displayName || "Welcome"}
            </h1>
            {profile?.role && (
              <p className="mt-1 text-sm font-medium text-neon">{profile.role}</p>
            )}
            <div className="mt-2 flex flex-col items-center gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              {joined && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Joined{" "}
                  {joined.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleNewResume}
            className="inline-flex items-center gap-2 rounded-full bg-neon px-5 py-2.5 text-sm font-semibold text-neon-foreground shadow-glow transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> New Resume
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Resumes" value={totalResumes.toString()} />
          <Stat
            label="Avg. ATS Score"
            value={resumes && resumes.length ? `${avgStrength}%` : "—"}
          />
          <Stat
            label="Last Edited"
            value={
              lastEdited
                ? lastEdited.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition ${
                active ? "text-neon" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {active && (
                <motion.span
                  layoutId="profile-tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-neon"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "info" && (
          <ProfileInfoTab
            profile={profile}
            loading={profileLoading}
            onSaved={(p) => {
              setProfile(p);
              showToast("ok", "Profile updated successfully");
            }}
            onError={(m) => showToast("err", m)}
          />
        )}

        {tab === "resumes" && (
          <ResumesTab
            loading={loadingResumes}
            resumes={resumes}
            deleteId={deleteId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {tab === "activity" && (
          <ActivityTab
            totalResumes={totalResumes}
            avgStrength={avgStrength}
            lastEdited={lastEdited}
            lastLogin={lastLogin}
            joined={joined}
          />
        )}

        {tab === "feedback" && (
          <FeedbackTab
            user={{
              uid: user.uid,
              name: profile?.name ?? user.displayName ?? "",
              email: user.email ?? "",
            }}
            onResult={(ok) =>
              showToast(ok ? "ok" : "err", ok ? "Thanks for the feedback!" : "Could not send feedback")
            }
          />
        )}
      </div>
    </main>
  );
}

/* -------------------- Profile Info Tab -------------------- */

function ProfileInfoTab({
  profile,
  loading,
  onSaved,
  onError,
}: {
  profile: UserProfile | null;
  loading: boolean;
  onSaved: (p: UserProfile) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const dirty = useMemo(() => {
    if (!form || !profile) return false;
    return (
      form.name !== profile.name ||
      form.phone !== profile.phone ||
      form.location !== profile.location ||
      form.role !== profile.role ||
      form.bio !== profile.bio ||
      form.linkedin !== profile.linkedin ||
      form.github !== profile.github
    );
  }, [form, profile]);

  if (loading || !form || !profile) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-muted/40" />
        ))}
      </div>
    );
  }

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form!.name.trim()) e.name = "Name is required";
    if (form!.phone && !/^[\d+\-()\s]{6,}$/.test(form!.phone))
      e.phone = "Enter a valid phone number";
    if (form!.linkedin && !/^https?:\/\//i.test(form!.linkedin))
      e.linkedin = "Must start with http(s)://";
    if (form!.github && !/^https?:\/\//i.test(form!.github))
      e.github = "Must start with http(s)://";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!form) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await updateUserProfile(form.uid, {
        uid: form.uid,
        name: form.name.trim(),
        email: form.email,
        photoURL: form.photoURL,
        phone: form.phone.trim(),
        location: form.location.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        linkedin: form.linkedin.trim(),
        github: form.github.trim(),
      });
      onSaved({ ...form, updatedAt: new Date() });
      setEditing(false);
    } catch (e) {
      console.warn("save profile failed", e);
      onError("Could not save profile. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(profile);
    setErrors({});
    setEditing(false);
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">Personal details</h2>
          <p className="text-sm text-muted-foreground">
            Keep your info up to date — it auto-fills new resumes.
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-full bg-neon px-4 py-2 text-sm font-semibold text-neon-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full Name"
          icon={UserIcon}
          editing={editing}
          value={form.name}
          error={errors.name}
          onChange={(v) => update("name", v)}
          placeholder="Jane Doe"
        />
        <Field
          label="Email"
          icon={Mail}
          editing={false}
          value={form.email}
          readOnlyHint="from Google"
        />
        <Field
          label="Phone Number"
          icon={Phone}
          editing={editing}
          value={form.phone}
          error={errors.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+1 555 123 4567"
        />
        <Field
          label="Location"
          icon={MapPin}
          editing={editing}
          value={form.location}
          onChange={(v) => update("location", v)}
          placeholder="San Francisco, CA"
        />
        <Field
          label="Role / Title"
          icon={Briefcase}
          editing={editing}
          value={form.role}
          onChange={(v) => update("role", v)}
          placeholder="Senior Frontend Engineer"
        />
        <Field
          label="LinkedIn"
          icon={Linkedin}
          editing={editing}
          value={form.linkedin}
          error={errors.linkedin}
          onChange={(v) => update("linkedin", v)}
          placeholder="https://linkedin.com/in/your-handle"
          link
        />
        <Field
          label="GitHub"
          icon={Github}
          editing={editing}
          value={form.github}
          error={errors.github}
          onChange={(v) => update("github", v)}
          placeholder="https://github.com/your-handle"
          link
        />
      </div>

      <div className="mt-5">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" /> Bio / About
        </label>
        {editing ? (
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={4}
            maxLength={400}
            placeholder="A short, punchy description of who you are and what you build."
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
            {form.bio || "No bio yet. Click Edit Profile to add one."}
          </p>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  editing,
  value,
  onChange,
  error,
  placeholder,
  readOnlyHint,
  link,
}: {
  label: string;
  icon: typeof UserIcon;
  editing: boolean;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
  placeholder?: string;
  readOnlyHint?: string;
  link?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
        {readOnlyHint && (
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal">
            {readOnlyHint}
          </span>
        )}
      </label>
      {editing && onChange ? (
        <>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                : "border-border focus:border-neon focus:ring-neon/30"
            }`}
          />
          {error && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}
        </>
      ) : link && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="block truncate rounded-xl border border-dashed border-border bg-background/50 px-3 py-2.5 text-sm text-neon hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="truncate rounded-xl border border-dashed border-border bg-background/50 px-3 py-2.5 text-sm text-muted-foreground">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

/* -------------------- Resumes Tab -------------------- */

function ResumesTab({
  loading,
  resumes,
  deleteId,
  downloadingId,
  onEdit,
  onDelete,
  onDownload,
}: {
function ResumesTab({
  loading,
  resumes,
  deleteId,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  resumes: ResumeListItem[] | null;
  deleteId: string | null;
  onEdit: (r: ResumeListItem) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40"
          />
        ))}
      </div>
    );
  }
  if (!resumes || resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon/10 text-neon">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold">No resumes yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Start building your first ATS-friendly resume in minutes.
        </p>
        <Link
          to="/builder"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-neon px-5 py-2.5 text-sm font-semibold text-neon-foreground shadow-glow hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> Start Building
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resumes.map((r) => {
        const ats = calculateAtsScore(r.resumeData).score;
        return (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-neon hover:shadow-glow"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neon/10 text-neon">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{r.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Template: <span className="capitalize">{r.template}</span>
                </p>
              </div>
              <span className="rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-bold text-neon">
                {ats}%
              </span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Last edited:{" "}
              {r.updatedAt
                ? r.updatedAt.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Just now"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(r)}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => onEdit(r)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              <button
                onClick={() => onDownload(r)}
                disabled={downloadingId === r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-60"
              >
                {downloadingId === r.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                PDF
              </button>
              <button
                onClick={() => onDelete(r.id)}
                disabled={deleteId === r.id}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
              >
                {deleteId === r.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

/* -------------------- Activity Tab -------------------- */

function ActivityTab({
  totalResumes,
  avgStrength,
  lastEdited,
  lastLogin,
  joined,
}: {
  totalResumes: number;
  avgStrength: number;
  lastEdited: Date | null;
  lastLogin: Date | null;
  joined: Date | null;
}) {
  const items: { label: string; value: string; icon: typeof Activity }[] = [
    { label: "Total Resumes", value: totalResumes.toString(), icon: FileText },
    {
      label: "Average ATS Score",
      value: totalResumes ? `${avgStrength}%` : "—",
      icon: Sparkles,
    },
    {
      label: "Last Resume Edit",
      value: lastEdited ? lastEdited.toLocaleString() : "—",
      icon: Pencil,
    },
    {
      label: "Last Login",
      value: lastLogin ? lastLogin.toLocaleString() : "—",
      icon: Activity,
    },
    {
      label: "Member Since",
      value: joined ? joined.toLocaleDateString() : "—",
      icon: Calendar,
    },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon/10 text-neon">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {it.label}
              </p>
              <p className="font-display text-lg font-bold">{it.value}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* -------------------- Feedback Tab -------------------- */

function FeedbackTab({
  user,
  onResult,
}: {
  user: { uid: string; name: string; email: string };
  onResult: (ok: boolean) => void;
}) {
  const [fb, setFb] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [fbErr, setFbErr] = useState<string | null>(null);

  const MAX = 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = fb.trim();
    if (message.length < 4) {
      setFbErr("Please write a bit more (min 4 characters).");
      return;
    }
    setFbErr(null);
    setSending(true);
    try {
      await submitFeedback({
        userId: user.uid,
        name: user.name,
        email: user.email,
        message,
      });
      setFb("");
      setSent(true);
      onResult(true);
      setTimeout(() => setSent(false), 2500);
    } catch (e) {
      console.warn("feedback failed", e);
      setFbErr("Could not send feedback. Please try again.");
      onResult(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon/10 text-neon">
          <MessageSquare className="h-4 w-4" />
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight">
          Share your feedback
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Found a bug or have an idea? We read every message.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <textarea
          value={fb}
          onChange={(e) => setFb(e.target.value.slice(0, MAX))}
          rows={5}
          placeholder="Tell us what you think…"
          className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
        />
        {fbErr && (
          <p className="inline-flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> {fbErr}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{fb.length}/{MAX}</span>
          <button
            type="submit"
            disabled={sending || sent || fb.trim().length < 4}
            className="inline-flex items-center gap-2 rounded-full bg-neon px-5 py-2.5 text-sm font-semibold text-neon-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sent ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sent ? "Thanks!" : "Send feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------- Shared -------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  listResumes,
  deleteResumeById,
  submitFeedback,
  saveResume,
  type ResumeListItem,
} from "@/lib/resume-store";
import { calculateAtsScore, STORAGE_KEY, type ResumeData } from "@/lib/resume";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — CVify.AI" },
      {
        name: "description",
        content: "Your CVify dashboard — view saved resumes, activity, and share feedback.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // feedback
  const [fb, setFb] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [fbErr, setFbErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    setDeleteId(id);
    try {
      await deleteResumeById(id);
      setResumes((r) => (r ? r.filter((x) => x.id !== id) : r));
    } catch (e) {
      console.warn("delete failed", e);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleteId(null);
    }
  }

  function handleEdit(item: ResumeListItem) {
    // Seed localStorage so the builder hydrates this resume on mount
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item.resumeData));
    } catch {
      /* ignore */
    }
    navigate({ to: "/builder" });
  }

  async function handleNewResume() {
    if (!user) return;
    // create a blank resume cloud entry by saving current local data (or empty)
    const blank: ResumeData = {
      name: user.displayName ?? "",
      email: user.email ?? "",
      phone: "",
      location: "",
      role: "",
      summary: "",
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

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
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
        name: user.displayName ?? "",
        email: user.email ?? "",
        message,
      });
      setFb("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch (e) {
      console.warn("feedback failed", e);
      setFbErr("Could not send feedback. Please try again.");
    } finally {
      setSending(false);
    }
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      {/* Header / profile card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-3xl border border-border p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon/20 blur-3xl" />
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "Profile"}
              referrerPolicy="no-referrer"
              className="h-24 w-24 rounded-full border-2 border-neon object-cover shadow-glow"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neon text-3xl font-bold text-neon-foreground">
              {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {user.displayName ?? "Welcome"}
            </h1>
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

        {/* Activity */}
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

      {/* Resume history */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Your Resumes</h2>
            <p className="text-sm text-muted-foreground">
              All resumes saved to your CVify cloud account.
            </p>
          </div>
        </div>

        {loadingResumes ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : resumes && resumes.length > 0 ? (
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
                      onClick={() => handleEdit(r)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleEdit(r)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
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
        ) : (
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
        )}
      </section>

      {/* Feedback */}
      <section className="mt-12">
        <div className="glass rounded-3xl border border-border p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon/10 text-neon">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Your Feedback / Suggestions
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Found a bug or have an idea? We read every message.
          </p>

          <form onSubmit={handleFeedback} className="mt-5 flex flex-col gap-3">
            <textarea
              value={fb}
              onChange={(e) => setFb(e.target.value)}
              rows={4}
              placeholder="Tell us what you think…"
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
            />
            {fbErr && (
              <p className="inline-flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> {fbErr}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{fb.length}/500</span>
              <button
                type="submit"
                disabled={sending || sent}
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
        </div>
      </section>
    </main>
  );
}

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

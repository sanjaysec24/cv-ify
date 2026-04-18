import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Linkedin, Github } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CVify.AI" },
      { name: "description", content: "Sign in to CVify.AI to save and sync your resumes across devices." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile" });
  }, [user, loading, navigate]);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate({ to: "/profile" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon text-neon-foreground">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold">CVify<span className="text-neon">.AI</span></span>
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to save your resumes to the cloud and access them anywhere.
        </p>

        <button
          onClick={handleGoogle}
          disabled={busy || loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39 16.3 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {err && (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {err}
          </p>
        )}

        {/* Social icons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="https://www.linkedin.com/in/sanjay-kumar-b-67b7b532a/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-neon hover:text-neon hover:shadow-[0_0_20px_rgba(202,138,4,0.55)]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/sanjaysec24"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-neon hover:text-neon hover:shadow-[0_0_20px_rgba(202,138,4,0.55)]"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Just exploring?{" "}
          <Link to="/" className="text-neon hover:underline">Back to home</Link>
        </p>
      </motion.div>
    </main>
  );
}

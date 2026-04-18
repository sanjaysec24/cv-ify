import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Gauge, Download, ArrowRight, Wand2, FileCheck2, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CVify.AI — Build ATS-Friendly Resumes in Minutes" },
      { name: "description", content: "Smart AI-powered resume builder for students. Real-time ATS scoring, role-based skill suggestions, instant PDF export." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg radial-fade opacity-60" />
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-neon/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-neon" />
            AI-powered • Built for students
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-balance font-display text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl"
          >
            Build <span className="relative inline-block">
              <span className="relative z-10">ATS-friendly</span>
              <span className="absolute inset-x-0 bottom-2 h-3 bg-neon/70 -z-0" />
            </span>{" "}
            resumes
            <br /> in <em className="not-italic text-neon">minutes</em>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            Smart AI-powered resume builder for students and freshers. Get role-based suggestions,
            real-time ATS scoring, and beautiful PDFs — instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/builder"
              className="group inline-flex items-center gap-2 rounded-full bg-neon px-6 py-3 text-sm font-bold text-neon-foreground shadow-glow hover:shadow-[0_0_80px_-5px_var(--neon)] transition-all animate-pulse-glow"
            >
              Start Building <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors">
              See features
            </a>
          </motion.div>

          {/* Floating preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="glass rounded-3xl p-3 shadow-soft animate-float">
              <div className="rounded-2xl bg-muted/40 p-6 text-left">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-destructive/60" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <span className="h-3 w-3 rounded-full bg-neon" />
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="h-2 w-1/3 rounded bg-foreground/30" />
                    <div className="h-8 rounded bg-foreground/10" />
                    <div className="h-8 rounded bg-foreground/10" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-neon" />
                      <div className="h-6 w-20 rounded-full bg-neon/30" />
                      <div className="h-6 w-14 rounded-full bg-neon/30" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-background p-4">
                    <div className="h-3 w-1/2 rounded bg-foreground/40" />
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-foreground/10" />
                      <div className="h-1.5 w-5/6 rounded bg-foreground/10" />
                      <div className="h-1.5 w-4/6 rounded bg-foreground/10" />
                    </div>
                    <div className="mt-3 h-2 w-3/4 rounded-full bg-neon" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon">Why students love it</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">Everything you need. Nothing you don't.</h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group glass relative overflow-hidden rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neon text-neon-foreground">
                  <f.icon className="h-6 w-6" strokeWidth={2.4} />
                </div>
                <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Your dream job is one resume away.</h2>
          <p className="mt-4 text-muted-foreground">Free. No signup. No watermark.</p>
          <Link
            to="/builder"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neon px-7 py-3.5 text-sm font-bold text-neon-foreground shadow-glow hover:opacity-90 transition-all"
          >
            Build my resume <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CVify.AI — Built with ✨ for students.
      </footer>
    </main>
  );
}

const features = [
  { icon: Wand2, title: "AI Suggestions", desc: "Pick a role and get instant skill recommendations and bullet-point rewrites that recruiters love." },
  { icon: Gauge, title: "Live ATS Score", desc: "Real-time scoring (0–100) with actionable hints so your resume passes applicant tracking systems." },
  { icon: Download, title: "Instant PDF", desc: "Pixel-perfect PDF export in one click. Clean layouts, perfect spacing, ATS-readable structure." },
  { icon: Zap, title: "Step-by-Step", desc: "A friendly 5-step wizard that guides you from blank page to polished resume — no guesswork." },
  { icon: FileCheck2, title: "Health Checks", desc: "Smart warnings for thin descriptions, missing skills, and weak sections before you export." },
  { icon: Sparkles, title: "Premium Feel", desc: "Glassmorphism, smooth animations, dark mode. Designed to make you proud to share." },
];

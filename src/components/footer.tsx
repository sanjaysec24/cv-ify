import { Linkedin, Github, Sparkles } from "lucide-react";

const LINKEDIN = "https://www.linkedin.com/in/sanjay-kumar-b-67b7b532a/";
const GITHUB = "https://github.com/sanjaysec24";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neon text-neon-foreground">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>
            Built by <span className="font-semibold text-foreground">Zyphra</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-neon hover:text-neon hover:shadow-[0_0_18px_rgba(202,138,4,0.5)]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-neon hover:text-neon hover:shadow-[0_0_18px_rgba(202,138,4,0.5)]"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CVify.AI — All rights reserved.
        </p>
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "./theme-provider";
import { motion } from "framer-motion";

export function Navbar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 12 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon text-neon-foreground"
            >
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight">
              Resume<span className="text-neon dark:text-neon">.AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link to="/" activeOptions={{ exact: true }} className="hover:text-neon transition-colors" activeProps={{ className: "text-neon" }}>
              Home
            </Link>
            <Link to="/builder" className="hover:text-neon transition-colors" activeProps={{ className: "text-neon" }}>
              Builder
            </Link>
            <a href="#features" className="hover:text-neon transition-colors">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/builder"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Start Building
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

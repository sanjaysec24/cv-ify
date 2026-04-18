import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Sparkles, LogOut, FileText, ChevronDown } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate({ to: "/" });
  }

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
              CVify<span className="text-neon dark:text-neon">.AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link to="/" activeOptions={{ exact: true }} className="hover:text-neon transition-colors" activeProps={{ className: "text-neon" }}>
              Home
            </Link>
            <Link to="/builder" className="hover:text-neon transition-colors" activeProps={{ className: "text-neon" }}>
              Builder
            </Link>
            <Link to="/ats-checker" className="hover:text-neon transition-colors" activeProps={{ className: "text-neon" }}>
              ATS Checker
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

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <div ref={ref} className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1 hover:bg-accent transition"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? "Profile"}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neon text-neon-foreground text-xs font-bold">
                      {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {user.displayName?.split(" ")[0] ?? "Account"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
                      role="menu"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user.displayName ?? "User"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link
                        to="/builder"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent"
                        role="menuitem"
                      >
                        <FileText className="h-4 w-4" /> My Resume
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-accent"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

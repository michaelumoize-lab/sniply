"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Scissors, ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { toast } from "sonner";

interface LandingNavbarProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSignIn = async (provider: "github" | "google") => {
    try {
      setLoadingProvider(provider);
      await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err: any) {
      console.error(`Sign in with ${provider} failed:`, err);
      toast.error(`Sign in with ${provider} failed. Please try again.`);
      setLoadingProvider(null);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  return (
    <header className="w-full border-b border-border/80 bg-background/70 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur-xs opacity-50 group-hover:opacity-80 transition duration-300" />
            <div className="relative w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-sm text-foreground shadow-sm">
              <Scissors className="w-4 h-4 text-emerald-500 dark:text-emerald-400 -rotate-45" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg tracking-tight text-foreground">Sniply</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/60">
              v1.0
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#workflow"
            className="hover:text-foreground transition-colors"
          >
            Workflow
          </a>
          <a
            href="#stack"
            className="hover:text-foreground transition-colors"
          >
            Architecture
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="gap-1.5 font-medium shadow-xs cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Button
                size="sm"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="gap-1.5 font-medium shadow-xs cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <span>Get Started</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full pt-2 w-56 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-xl text-card-foreground flex flex-col gap-1">
                    <button
                      onClick={() => handleSignIn("github")}
                      disabled={loadingProvider !== null}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left disabled:opacity-50"
                    >
                      {loadingProvider === "github" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">Continue with GitHub</span>
                        <span className="text-[10px] text-muted-foreground">Developer-first OAuth</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSignIn("google")}
                      disabled={loadingProvider !== null}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left disabled:opacity-50"
                    >
                      {loadingProvider === "google" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          />
                        </svg>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">Continue with Google</span>
                        <span className="text-[10px] text-muted-foreground">Standard Google Account</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { getAuthenticatedUser } from "@/lib/auth/server";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingAuthButtons } from "@/components/landing-auth-buttons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Zap, Shield, Search, Copy, Check, Sparkles, Folder, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors selection:bg-muted selection:text-foreground">
      {/* Premium Glassmorphic Navbar */}
      <LandingNavbar user={user ? { id: user.id, name: user.name, email: user.email } : null} />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border bg-card/80 text-xs text-muted-foreground mb-6 font-mono shadow-xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Save → Search → Copy in under 3 seconds</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.15]">
          Your developer memory, <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">instant</span>.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Quickly capture terminal commands, code snippets, SQL queries, and AI prompts that you frequently forget or reuse. Organization is optional; retrieval is effortless.
        </p>

        {/* CTA: Open Dashboard when authenticated, otherwise OAuth Get Started buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 w-full">
          {user ? (
            <div className="flex flex-col items-center gap-2.5">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl shadow-lg gap-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground font-mono">
                Signed in as <span className="text-foreground font-medium">{user.name || user.email}</span>
              </p>
            </div>
          ) : (
            <LandingAuthButtons />
          )}
        </div>

        {/* Interactive Keyboard & Library Preview Card */}
        <div
          id="workflow"
          className="mt-16 w-full max-w-3xl rounded-2xl border border-border bg-card/70 p-5 shadow-2xl backdrop-blur-md flex flex-col text-left transition-colors"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">sniply.local — personal library</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-0.5 rounded text-foreground font-semibold border border-border">
                Cmd + K
              </span>
              <span>Search</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-4">
            <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-foreground mb-2">
                  <span className="font-semibold text-foreground">Docker cleanup</span>
                  <Badge variant="terminal">Terminal</Badge>
                </div>
                <code className="text-xs font-mono text-foreground block bg-muted/60 p-2.5 rounded-lg border border-border/80">
                  docker system prune -a
                </code>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>#docker #cleanup</span>
                <span className="text-foreground font-medium">[Copy]</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-foreground mb-2">
                  <span className="font-semibold text-foreground">Undo last commit</span>
                  <Badge variant="code">Git</Badge>
                </div>
                <code className="text-xs font-mono text-foreground block bg-muted/60 p-2.5 rounded-lg border border-border/80">
                  git reset --soft HEAD~1
                </code>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>#git #undo</span>
                <span className="text-foreground font-medium">[Copy]</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-foreground mb-2">
                  <span className="font-semibold text-foreground">FastAPI Install</span>
                  <Badge variant="prompt">Python</Badge>
                </div>
                <code className="text-xs font-mono text-foreground block bg-muted/60 p-2.5 rounded-lg border border-border/80">
                  pip install fastapi uvicorn
                </code>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>#python #backend</span>
                <span className="text-foreground font-medium">[Copy]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          <div className="p-6 rounded-2xl bg-card/60 border border-border flex flex-col gap-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Instant Cmd+K Search</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hybrid client-side Fuse.js search runs sub-5ms across titles, tags, and code previews with exact prefix matching.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/60 border border-border flex flex-col gap-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Frictionless Capture</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Press Alt+N (or N), paste, and press Cmd+S / Ctrl+S. Auto-detects terminal and code types and derives titles without forcing forms.
            </p>
          </div>

          <div id="stack" className="p-6 rounded-2xl bg-card/60 border border-border flex flex-col gap-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Neon Lakebase Postgres</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Protected by Neon Auth and isolated with per-user relational security. Safe folder re-parenting with zero snippet loss.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-8 text-center text-xs text-muted-foreground font-mono">
        Sniply — built for developers who value speed and simplicity.
      </footer>
    </div>
  );
}

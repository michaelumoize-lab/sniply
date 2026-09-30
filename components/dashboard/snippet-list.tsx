"use client";

import * as React from "react";
import {
  Copy,
  Check,
  Star,
  Search,
  Plus,
  Terminal,
  Code,
  Database,
  MessageSquare,
  Regex,
  FileText,
  Sparkles,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface SnippetListItem {
  id: string;
  title: string;
  description?: string | null;
  content?: string;
  contentPreview: string;
  type: string;
  language?: string | null;
  isFavorite: boolean;
  folderId?: string | null;
  folderName?: string | null;
  tags: string[];
  tagObjects?: { id: string; name: string }[];
  createdAt?: string;
  updatedAt: string;
  syncStatus?: "synced" | "syncing" | "failed";
}

interface SnippetListProps {
  snippets: SnippetListItem[];
  activeSnippetId: string | null;
  onSelectSnippet: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onOpenNewModal: () => void;
  onOpenSearch: () => void;
  filterLabel: string;
  width?: number;
}

export function SnippetList({
  snippets,
  activeSnippetId,
  onSelectSnippet,
  onToggleFavorite,
  onOpenNewModal,
  onOpenSearch,
  filterLabel,
  width = 360,
}: SnippetListProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (snippet: SnippetListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.contentPreview);
    setCopiedId(snippet.id);
    toast.success("Copied to clipboard", { description: snippet.title });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "terminal":
        return {
          icon: <Terminal className="w-3.5 h-3.5 text-amber-500" />,
          borderLeft: "border-l-amber-500/80",
          badgeVariant: "terminal" as const,
        };
      case "sql":
        return {
          icon: <Database className="w-3.5 h-3.5 text-cyan-500" />,
          borderLeft: "border-l-cyan-500/80",
          badgeVariant: "sql" as const,
        };
      case "prompt":
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-purple-500" />,
          borderLeft: "border-l-purple-500/80",
          badgeVariant: "prompt" as const,
        };
      case "regex":
        return {
          icon: <Regex className="w-3.5 h-3.5 text-pink-500" />,
          borderLeft: "border-l-pink-500/80",
          badgeVariant: "outline" as const,
        };
      case "text":
        return {
          icon: <FileText className="w-3.5 h-3.5 text-muted-foreground" />,
          borderLeft: "border-l-muted-foreground/60",
          badgeVariant: "secondary" as const,
        };
      default:
        return {
          icon: <Code className="w-3.5 h-3.5 text-emerald-500" />,
          borderLeft: "border-l-emerald-500/80",
          badgeVariant: "code" as const,
        };
    }
  };

  return (
    <section
      style={{ width }}
      className="h-full bg-card/30 flex flex-col shrink-0 text-foreground overflow-hidden select-none"
    >
      {/* Top Header Bar — Aligned exact h-14 height with Sidebar and Inspector */}
      <div className="h-14 px-3.5 border-b border-border flex items-center justify-between gap-2.5 bg-card/50 backdrop-blur-md shrink-0">
        <button
          onClick={onOpenSearch}
          className="flex-1 h-9 flex items-center justify-between px-3 bg-background/80 hover:bg-background border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-input transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search snippets...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        <Button
          size="sm"
          onClick={onOpenNewModal}
          title="New Snippet (Alt+N or N)"
          className="h-9 px-3 gap-1.5 rounded-lg shrink-0 shadow-xs text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      {/* Subheader / Status Bar */}
      <div className="h-9 px-4 bg-muted/20 border-b border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-foreground truncate">{filterLabel}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground shrink-0 bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
          {snippets.length} item{snippets.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Premium Snippet Feed List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {snippets.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2.5 select-none h-48">
            <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/60">
              <Code className="w-5 h-5 stroke-1" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">No snippets found</span>
            <span className="text-[11px] text-muted-foreground/60 max-w-[240px]">
              Press <kbd className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Alt+N</kbd> or <kbd className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">N</kbd> to save your first code snippet.
            </span>
          </div>
        ) : (
          snippets.map((snippet) => {
            const isSelected = activeSnippetId === snippet.id;
            const isCopied = copiedId === snippet.id;
            const typeStyle = getTypeStyle(snippet.type);

            return (
              <div
                key={snippet.id}
                onClick={() => onSelectSnippet(snippet.id)}
                className={`group relative rounded-xl border p-3.5 transition-all duration-150 cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-accent/70 border-primary/50 text-accent-foreground shadow-xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-full before:bg-primary"
                    : "border-border/70 hover:border-primary/30 bg-card/50 hover:bg-card/90 text-foreground"
                }`}
              >
                {/* Top Row: Type Icon, Title & Quick Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="p-1 rounded-md bg-background border border-border shrink-0 shadow-2xs">
                      {typeStyle.icon}
                    </span>
                    <h3 className="font-semibold text-xs truncate text-foreground leading-tight">
                      {snippet.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Favorite toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(snippet.id, !snippet.isFavorite);
                      }}
                      title="Favorite snippet (F)"
                      className={`p-1 rounded-md hover:bg-muted transition-colors ${
                        snippet.isFavorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground/60 hover:text-foreground opacity-60 group-hover:opacity-100"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${snippet.isFavorite ? "fill-amber-500" : ""}`} />
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopy(snippet, e)}
                      title="Quick Copy (C)"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border ${
                        isCopied
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border shadow-xs"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Monospace Code Preview Box with Tinted Accent Left Border */}
                <div
                  className={`font-mono text-[11px] leading-relaxed text-muted-foreground bg-background/90 p-2.5 rounded-lg border border-border/60 ${typeStyle.borderLeft} line-clamp-2 mb-2.5 shadow-2xs`}
                >
                  {snippet.contentPreview}
                </div>

                {/* Metadata Row: Language, Tags, Sync Status */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {snippet.language && (
                      <Badge variant="outline" className="font-mono text-[9px] uppercase px-1.5 py-0">
                        {snippet.language}
                      </Badge>
                    )}
                    {snippet.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-muted-foreground truncate hover:text-foreground">
                        #{tag}
                      </span>
                    ))}
                    {snippet.tags.length > 2 && (
                      <span className="text-muted-foreground/60 text-[9px]">
                        +{snippet.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {snippet.syncStatus === "syncing" && (
                      <span className="text-[10px] text-amber-500 flex items-center gap-1 font-sans">
                        ↻ Syncing
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 font-sans">
                      {new Date(snippet.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

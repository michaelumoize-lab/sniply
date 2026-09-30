"use client";

import * as React from "react";
import {
  Copy,
  Check,
  Star,
  Edit3,
  CopyPlus,
  Trash2,
  Folder as FolderIcon,
  Calendar,
  Hash,
} from "lucide-react";
import { highlightCode } from "@/lib/shiki/highlighter";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SnippetInspectorSkeleton } from "./snippet-loading-skeleton";
import { toast } from "sonner";

export interface FullSnippetDetail {
  id: string;
  title: string;
  content: string;
  description?: string | null;
  type: string;
  language?: string | null;
  isFavorite: boolean;
  folderId?: string | null;
  folderName?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
}

interface SnippetInspectorProps {
  snippet: FullSnippetDetail | null;
  isLoading: boolean;
  onEdit: (snippet: FullSnippetDetail) => void;
  onDuplicate: (snippetId: string) => void;
  onDelete: (snippetId: string) => void;
  onToggleFavorite: (snippetId: string, isFav: boolean) => void;
}

export function SnippetInspector({
  snippet,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: SnippetInspectorProps) {
  const { resolvedTheme } = useTheme();
  const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Trigger Shiki dynamic highlighting when snippet changes
  React.useEffect(() => {
    if (!snippet) {
      setHighlightedHtml(null);
      return;
    }

    let active = true;
    const themeMode = resolvedTheme === "light" ? "light" : "dark";

    highlightCode(snippet.content, snippet.language, themeMode)
      .then((html) => {
        if (active) setHighlightedHtml(html);
      })
      .catch(() => {
        if (active) setHighlightedHtml(null);
      });

    return () => {
      active = false;
    };
  }, [snippet, resolvedTheme]);

  const handleCopyVerbatim = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet.content);
    setIsCopied(true);
    toast.success("Copied to clipboard", { description: snippet.title });
    setTimeout(() => setIsCopied(false), 1500);
  };

  if (isLoading) {
    return <SnippetInspectorSkeleton />;
  }

  if (!snippet) {
    return (
      <div className="flex-1 h-full bg-background flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center mb-3">
          <Copy className="w-6 h-6 text-muted-foreground/60" />
        </div>
        <span className="text-sm font-semibold text-foreground">No snippet selected</span>
        <span className="text-xs text-muted-foreground max-w-xs mt-1">
          Select a snippet from the list or press <kbd className="text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">Alt+N</kbd> (or <kbd className="text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">N</kbd>) to capture a new one.
        </span>
      </div>
    );
  }

  return (
    <main className="flex-1 h-full bg-background flex flex-col min-w-0 text-foreground overflow-hidden">
      {/* Top Inspector Bar — Aligned exact h-14 height with Sidebar and Snippet List */}
      <div className="h-14 px-5 border-b border-border flex items-center justify-between gap-4 bg-card/50 backdrop-blur-md shrink-0">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground truncate">
              {snippet.title}
            </h1>
            {snippet.language && (
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {snippet.language}
              </Badge>
            )}
          </div>

          {snippet.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{snippet.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Favorite */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onToggleFavorite(snippet.id, !snippet.isFavorite)}
            title="Favorite snippet (F)"
            className={
              snippet.isFavorite
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            <Star className={`w-4 h-4 ${snippet.isFavorite ? "fill-amber-500 dark:fill-amber-400" : ""}`} />
          </Button>

          {/* Edit */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(snippet)}
            title="Edit snippet (E)"
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="w-4 h-4" />
          </Button>

          {/* Duplicate */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDuplicate(snippet.id)}
            title="Duplicate snippet"
            className="text-muted-foreground hover:text-foreground"
          >
            <CopyPlus className="w-4 h-4" />
          </Button>

          {/* Delete */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(snippet.id)}
            title="Delete snippet"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Primary Copy Button */}
          <Button
            onClick={handleCopyVerbatim}
            className={`transition-all shadow-xs ${
              isCopied
                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Display Body */}
      <div className="flex-1 overflow-auto p-5 font-mono text-xs sm:text-sm">
        {highlightedHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className="[&>pre]:p-4.5 [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-border [&>pre]:overflow-x-auto [&>pre]:leading-relaxed shadow-xs"
          />
        ) : (
          <pre className="p-4.5 rounded-xl border border-border bg-card/60 overflow-x-auto text-foreground leading-relaxed font-mono shadow-xs">
            <code>{snippet.content}</code>
          </pre>
        )}
      </div>

      {/* Footer Metadata */}
      <div className="px-5 py-3 border-t border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {snippet.folderName && (
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>{snippet.folderName}</span>
            </span>
          )}

          <div className="flex items-center gap-1">
            {snippet.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="gap-1 font-mono text-[10px]">
                <Hash className="w-2.5 h-2.5 opacity-60" />
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>Updated {new Date(snippet.updatedAt).toLocaleDateString()}</span>
          </span>
          <span>{snippet.content.length} chars</span>
        </div>
      </div>
    </main>
  );
}

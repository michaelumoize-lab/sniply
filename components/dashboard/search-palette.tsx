"use client";

import * as React from "react";
import { Search, Copy, Check, Terminal, Code, Database, MessageSquare, Regex, FileText } from "lucide-react";
import { searchSnippets, SnippetSearchIndexItem } from "@/lib/search/fuse";
import { Badge } from "@/components/ui/badge";
import Fuse from "fuse.js";
import { toast } from "sonner";

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  fuse: Fuse<SnippetSearchIndexItem> | null;
  items: SnippetSearchIndexItem[];
  onSelectSnippet: (id: string) => void;
}

export function SearchPalette({
  isOpen,
  onClose,
  fuse,
  items,
  onSelectSnippet,
}: SearchPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!fuse) return items.slice(0, 15);
    return searchSnippets(fuse, items, query).slice(0, 20);
  }, [fuse, items, query]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      return;
    }
    if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      onSelectSnippet(filteredItems[selectedIndex].id);
      onClose();
      return;
    }
  };

  const handleCopy = (snippet: SnippetSearchIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.contentPreview);
    setCopiedId(snippet.id);
    toast.success("Copied to clipboard", { description: snippet.title });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "terminal":
        return <Terminal className="w-3.5 h-3.5 text-amber-500" />;
      case "sql":
        return <Database className="w-3.5 h-3.5 text-cyan-500" />;
      case "prompt":
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      case "regex":
        return <Regex className="w-3.5 h-3.5 text-pink-500" />;
      case "text":
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <Code className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-card-foreground"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/30">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search snippets by title, tag (#docker), code, or type..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-mono select-none">
              No snippets matching &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSnippet(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="p-1.5 rounded-md bg-background border border-border shrink-0 shadow-2xs">
                      {renderTypeIcon(item.type)}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate text-foreground">
                          {item.title}
                        </span>
                        {item.language && (
                          <Badge variant="outline" className="font-mono text-[9px] uppercase px-1 py-0">
                            {item.language}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground truncate">
                        {item.contentPreview.replace(/\n/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Tags and Action */}
                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1">
                      {item.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => handleCopy(item, e)}
                      title="Copy content"
                      className={`p-1.5 rounded-md transition-colors border ${
                        isCopied
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="text-foreground bg-muted px-1 py-0.5 rounded border border-border">↑</kbd> <kbd className="text-foreground bg-muted px-1 py-0.5 rounded border border-border">↓</kbd> navigate</span>
            <span><kbd className="text-foreground bg-muted px-1 py-0.5 rounded border border-border">Enter</kbd> open</span>
          </div>
          <span>{filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

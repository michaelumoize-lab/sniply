"use client";

import * as React from "react";
import { X, Sparkles, Folder as FolderIcon, Tag, Loader2 } from "lucide-react";
import { detectSnippetMetadata, SnippetType } from "@/lib/utils/auto-detect";
import { deriveTitleFromContent } from "@/lib/utils/title-generator";
import { getUtf8ByteLength, MAX_SNIPPET_BYTES, formatByteSize } from "@/lib/utils/bytes";
import { saveLocalDraft, removeLocalDraft } from "@/lib/storage/outbox";
import { createSnippet } from "@/actions/snippets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FolderOption {
  id: string;
  name: string;
}

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderOption[];
  existingTags: string[];
  onSnippetSaved?: (newSnippet: any) => void;
}

const SNIPPET_TYPES: { value: SnippetType; label: string }[] = [
  { value: "code", label: "Code" },
  { value: "terminal", label: "Terminal" },
  { value: "sql", label: "SQL" },
  { value: "prompt", label: "AI Prompt" },
  { value: "regex", label: "Regex" },
  { value: "text", label: "Text" },
  { value: "other", label: "Other" },
];

export function QuickCaptureModal({
  isOpen,
  onClose,
  folders,
  existingTags,
  onSnippetSaved,
}: QuickCaptureModalProps) {
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<SnippetType>("code");
  const [language, setLanguage] = React.useState("");
  const [selectedFolderId, setSelectedFolderId] = React.useState<string>("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [detectedConfidence, setDetectedConfidence] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        contentRef.current?.focus();
      }, 50);
    } else {
      setTitle("");
      setContent("");
      setDescription("");
      setType("code");
      setLanguage("");
      setSelectedFolderId("");
      setTagsInput("");
      setDetectedConfidence(null);
    }
  }, [isOpen]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim()) {
      const detection = detectSnippetMetadata(val);
      if (detection.confidence === "high" || detection.confidence === "medium") {
        setType(detection.type);
        if (detection.language) {
          setLanguage(detection.language);
        }
        setDetectedConfidence(detection.confidence);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key === "s")) {
      e.preventDefault();
      handleSave();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = contentRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        if (content.slice(start - 2, start) === "  ") {
          const next = content.substring(0, start - 2) + content.substring(end);
          setContent(next);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        const next = content.substring(0, start) + "  " + content.substring(end);
        setContent(next);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const byteLength = getUtf8ByteLength(content);
  const isOverLimit = byteLength > MAX_SNIPPET_BYTES;

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Snippet content cannot be empty");
      return;
    }

    if (isOverLimit) {
      toast.error(`Snippet exceeds 64 KB limit (${formatByteSize(byteLength)})`);
      return;
    }

    setIsSubmitting(true);
    const derivedTitle = title.trim() || deriveTitleFromContent(content);
    const clientTempId = crypto.randomUUID();

    const tagsList = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    const optimisticSnippet = {
      id: clientTempId,
      title: derivedTitle,
      content,
      description: description.trim() || null,
      contentPreview: content.slice(0, 250),
      type,
      language: language.trim() || null,
      tags: tagsList,
      folderId: selectedFolderId || null,
      folderName: folders.find((f) => f.id === selectedFolderId)?.name || null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "syncing",
    };

    // 1. Write immediately to local IndexedDB
    await saveLocalDraft({
      id: clientTempId,
      title: derivedTitle,
      content,
      description: description.trim() || null,
      type,
      language: language.trim() || null,
      tags: tagsList,
      folderId: selectedFolderId || null,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: "syncing",
    });

    // 2. Immediate UI update & notification
    if (onSnippetSaved) {
      onSnippetSaved(optimisticSnippet);
    }
    toast.success("Snippet captured", { description: derivedTitle });
    onClose();

    // 3. Background server synchronization
    try {
      await createSnippet({
        id: clientTempId,
        title: derivedTitle,
        content,
        description: description.trim() || null,
        type,
        language: language.trim() || null,
        tags: tagsList,
        folderId: selectedFolderId || null,
      });

      await removeLocalDraft(clientTempId);
    } catch (err: any) {
      console.error("Server sync failed:", err);
      toast.error("Failed to sync snippet to cloud. Retained locally.", {
        action: {
          label: "Retry",
          onClick: () => handleSave(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-card-foreground"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">New Snippet</span>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
              Alt + N
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Input
              type="text"
              placeholder="Title (optional, auto-derived on save)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-medium h-10"
            />
          </div>

          {/* Content Area */}
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <textarea
                ref={contentRef}
                rows={9}
                placeholder="Paste code snippet, terminal command, SQL, or AI prompt here..."
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="w-full px-3.5 py-3 bg-background border border-input rounded-lg font-mono text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all resize-y leading-relaxed shadow-2xs"
                spellCheck={false}
              />
              <div
                className={`absolute bottom-2.5 right-3 text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isOverLimit
                    ? "text-destructive border-destructive bg-destructive/10"
                    : "text-muted-foreground border-border bg-card/90"
                }`}
              >
                {formatByteSize(byteLength)} / 64 KB
              </div>
            </div>
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                <span>Snippet Type</span>
                {detectedConfidence && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-mono lowercase">
                    <Sparkles className="w-3 h-3" /> auto-suggested
                  </span>
                )}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SnippetType)}
                className="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {SNIPPET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Language
              </label>
              <Input
                type="text"
                placeholder="e.g. bash, ts, python, sql"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="font-mono text-xs h-9"
              />
            </div>
          </div>

          {/* Folder & Tags Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <FolderIcon className="w-3 h-3" /> Folder (Optional)
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">(No folder - Root)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags (Space separated)
              </label>
              <Input
                type="text"
                placeholder="#docker #git #backend"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="font-mono text-xs h-9"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
            <span>Press <kbd className="text-foreground bg-muted px-1 py-0.5 rounded border border-border">Cmd+S</kbd> to save</span>
            <span>·</span>
            <span><kbd className="text-foreground bg-muted px-1 py-0.5 rounded border border-border">Tab</kbd> indent</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || isOverLimit || !content.trim()}
              onClick={handleSave}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Snippet"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

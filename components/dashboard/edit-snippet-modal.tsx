"use client";

import * as React from "react";
import { X, Folder as FolderIcon, Tag, Loader2 } from "lucide-react";
import { SnippetType } from "@/lib/utils/auto-detect";
import { getUtf8ByteLength, MAX_SNIPPET_BYTES, formatByteSize } from "@/lib/utils/bytes";
import { updateSnippet } from "@/actions/snippets";
import { FullSnippetDetail } from "./snippet-inspector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FolderOption {
  id: string;
  name: string;
}

interface EditSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippet: FullSnippetDetail | null;
  folders: FolderOption[];
  onSnippetUpdated: (updated: any) => void;
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

export function EditSnippetModal({
  isOpen,
  onClose,
  snippet,
  folders,
  onSnippetUpdated,
}: EditSnippetModalProps) {
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<SnippetType>("code");
  const [language, setLanguage] = React.useState("");
  const [selectedFolderId, setSelectedFolderId] = React.useState<string>("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (snippet && isOpen) {
      setTitle(snippet.title || "");
      setContent(snippet.content || "");
      setDescription(snippet.description || "");
      setType((snippet.type as SnippetType) || "code");
      setLanguage(snippet.language || "");
      setSelectedFolderId(snippet.folderId || "");
      setTagsInput(snippet.tags.map((t) => t.name).join(" "));
    }
  }, [snippet, isOpen]);

  if (!isOpen || !snippet) return null;

  const byteLength = getUtf8ByteLength(content);
  const isOverLimit = byteLength > MAX_SNIPPET_BYTES;

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
    const tagsList = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    const updatedData = {
      title: title.trim() || snippet.title,
      content,
      description: description.trim() || null,
      type,
      language: language.trim() || null,
      folderId: selectedFolderId || null,
      folderName: folders.find((f) => f.id === selectedFolderId)?.name || null,
      tags: tagsList,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateSnippet(snippet.id, {
        title: updatedData.title,
        content: updatedData.content,
        description: updatedData.description,
        type: updatedData.type,
        language: updatedData.language,
        folderId: updatedData.folderId,
        tags: updatedData.tags,
      });

      onSnippetUpdated({
        ...snippet,
        ...updatedData,
        tags: tagsList.map((name) => ({ id: name, name })),
      });
      toast.success("Snippet updated");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update snippet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-card-foreground"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">Edit Snippet</span>
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

        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-medium"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Description (Optional)</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about what this snippet does..."
              className="text-xs"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <textarea
                ref={contentRef}
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3.5 py-3 bg-background border border-input rounded-lg font-mono text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed shadow-2xs"
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

          {/* Type & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</label>
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
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Language</label>
              <Input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Folder & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <FolderIcon className="w-3 h-3" /> Folder
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
                <Tag className="w-3 h-3" /> Tags
              </label>
              <Input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#docker #git"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || isOverLimit || !content.trim()}
            onClick={handleSave}
            className="gap-1.5"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

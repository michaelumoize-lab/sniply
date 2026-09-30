"use client";

import * as React from "react";
import {
  Folder as FolderIcon,
  Star,
  Layers,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  LogOut,
  Hash,
  Scissors,
} from "lucide-react";
import { createFolder, deleteFolder } from "@/actions/folders";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
}

interface SidebarProps {
  folders: FolderNode[];
  tags: { id: string; name: string; count: number }[];
  totalSnippets: number;
  favoritesCount: number;
  activeFilter: {
    type: "all" | "favorites" | "folder" | "tag";
    value?: string;
  };
  onSelectFilter: (filter: { type: "all" | "favorites" | "folder" | "tag"; value?: string }) => void;
  onFolderCreated?: (folder: FolderNode) => void;
  onFolderDeleted?: (folderId: string) => void;
  width?: number;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({
  folders,
  tags,
  totalSnippets,
  favoritesCount,
  activeFilter,
  onSelectFilter,
  onFolderCreated,
  onFolderDeleted,
  width = 250,
  user,
}: SidebarProps) {
  const router = useRouter();
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const created = await createFolder(newFolderName.trim(), selectedParentId);
      if (created && onFolderCreated) {
        onFolderCreated({
          id: created.id,
          name: created.name,
          parentId: created.parentId,
        });
      }
      toast.success("Folder created", { description: newFolderName.trim() });
      setNewFolderName("");
      setIsCreatingFolder(false);
      setSelectedParentId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder");
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Delete folder "${folderName}"?\nYour snippets will NOT be deleted. They will move to the root or parent folder.`
      )
    ) {
      try {
        await deleteFolder(folderId);
        if (onFolderDeleted) {
          onFolderDeleted(folderId);
        }
        toast.success("Folder deleted. Contained snippets preserved.");
        if (activeFilter.type === "folder" && activeFilter.value === folderId) {
          onSelectFilter({ type: "all" });
        }
      } catch (err: any) {
        toast.error("Failed to delete folder");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/");
    } catch (err) {
      router.push("/");
    }
  };

  // Build recursive tree
  const folderTree = React.useMemo(() => {
    const map: Record<string, FolderNode[]> = { root: [] };
    folders.forEach((f) => {
      const pid = f.parentId || "root";
      if (!map[pid]) map[pid] = [];
      map[pid].push(f);
    });
    return map;
  }, [folders]);

  const renderFolderItems = (parentId = "root", depth = 0) => {
    const nodes = folderTree[parentId] || [];
    return nodes.map((node) => {
      const isExpanded = expandedFolders[node.id] !== false; // default open
      const hasChildren = (folderTree[node.id] || []).length > 0;
      const isSelected = activeFilter.type === "folder" && activeFilter.value === node.id;

      return (
        <div key={node.id} className="flex flex-col">
          <div
            onClick={() => onSelectFilter({ type: "folder", value: node.id })}
            style={{ paddingLeft: `${depth * 12 + 10}px` }}
            className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer text-xs transition-colors ${
              isSelected
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.id);
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <FolderIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{node.name}</span>
            </div>

            <button
              onClick={(e) => handleDeleteFolder(node.id, node.name, e)}
              title="Delete folder"
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {hasChildren && isExpanded && renderFolderItems(node.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside
      style={{ width }}
      className="h-full bg-card/60 backdrop-blur-md flex flex-col shrink-0 text-foreground select-none overflow-hidden"
    >
      {/* Brand & Action Header — Aligned exact h-14 height */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">Sniply</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {/* Core Views */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSelectFilter({ type: "all" })}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              activeFilter.type === "all"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span>All Snippets</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">{totalSnippets}</span>
          </button>

          <button
            onClick={() => onSelectFilter({ type: "favorites" })}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              activeFilter.type === "favorites"
                ? "bg-accent text-amber-500 dark:text-amber-400 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span>Favorites</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">{favoritesCount}</span>
          </button>
        </div>

        {/* Folders Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Folders</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreatingFolder((prev) => !prev)}
              title="Add new folder"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* New Folder Form */}
          {isCreatingFolder && (
            <form
              onSubmit={handleCreateFolder}
              className="px-2 py-2 flex flex-col gap-2 bg-card border border-border rounded-lg shadow-sm"
            >
              <input
                type="text"
                autoFocus
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingFolder(false)}
                  className="h-6 px-2 text-[10px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFolderName.trim()}
                  className="h-6 px-2.5 text-[10px]"
                >
                  Create
                </Button>
              </div>
            </form>
          )}

          {/* Folder Tree */}
          <div className="flex flex-col">
            {folders.length === 0 ? (
              <span className="px-3 py-1 text-xs text-muted-foreground/70 italic">No folders yet</span>
            ) : (
              renderFolderItems("root")
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="flex flex-col gap-2">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Tags</span>
            <span className="font-mono text-[10px]">{tags.length}</span>
          </div>

          <div className="flex flex-wrap gap-1 px-2">
            {tags.length === 0 ? (
              <span className="text-xs text-muted-foreground/70 italic">No tags</span>
            ) : (
              tags.map((t) => {
                const isSelected = activeFilter.type === "tag" && activeFilter.value === t.name;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectFilter({ type: "tag", value: t.name })}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5 opacity-60" />
                    <span>{t.name}</span>
                    <span className="text-[10px] opacity-60">({t.count})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 border border-border">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">{user.name || "Developer"}</span>
            <span className="text-[10px] text-muted-foreground truncate">{user.email || ""}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign out"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  );
}

"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { SnippetList, SnippetListItem } from "./snippet-list";
import { SnippetInspector, FullSnippetDetail } from "./snippet-inspector";
import { QuickCaptureModal } from "./quick-capture-modal";
import { SearchPalette } from "./search-palette";
import { EditSnippetModal } from "./edit-snippet-modal";
import { ResizeHandle } from "./resize-handle";
import { createSnippetSearchIndex } from "@/lib/search/fuse";
import {
  getSnippetFullContent,
  toggleFavorite,
  deleteSnippet,
  duplicateSnippet,
} from "@/actions/snippets";
import { toast } from "sonner";
import Fuse from "fuse.js";

interface DashboardViewProps {
  initialData: {
    folders: { id: string; name: string; parentId: string | null }[];
    tags: { id: string; name: string; count: number }[];
    snippets: any[];
  };
  initialActiveSnippetId?: string | null;
  initialActiveSnippetDetail?: FullSnippetDetail | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardView({
  initialData,
  initialActiveSnippetId,
  initialActiveSnippetDetail,
  user,
}: DashboardViewProps) {
  const [folders, setFolders] = React.useState(initialData.folders);
  const [snippets, setSnippets] = React.useState<SnippetListItem[]>(initialData.snippets);
  const [activeSnippetId, setActiveSnippetId] = React.useState<string | null>(
    initialActiveSnippetId ?? (initialData.snippets.length > 0 ? initialData.snippets[0].id : null)
  );

  // Dynamically derive active tags and their true snippet counts from in-memory snippets
  const dynamicTags = React.useMemo(() => {
    const tagMap: Record<string, { id: string; name: string; count: number }> = {};
    for (const s of snippets) {
      const tagList =
        s.tagObjects && s.tagObjects.length > 0
          ? s.tagObjects
          : (s.tags || []).map((t) => ({ id: t, name: t }));

      for (const t of tagList) {
        const key = t.name.toLowerCase();
        if (!tagMap[key]) {
          tagMap[key] = { id: t.id || key, name: t.name, count: 0 };
        }
        tagMap[key].count += 1;
      }
    }
    return Object.values(tagMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [snippets]);

  // Initialized directly with the server-rendered snippet detail (zero loading flicker)
  const [activeSnippetDetail, setActiveSnippetDetail] = React.useState<FullSnippetDetail | null>(
    initialActiveSnippetDetail ?? null
  );
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  const [activeFilter, setActiveFilter] = React.useState<{
    type: "all" | "favorites" | "folder" | "tag";
    value?: string;
  }>({ type: "all" });

  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = React.useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Default section widths (resets on every page refresh as requested)
  const DEFAULT_SIDEBAR_WIDTH = 250;
  const DEFAULT_LIST_WIDTH = 360;

  const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_SIDEBAR_WIDTH);
  const [listWidth, setListWidth] = React.useState(DEFAULT_LIST_WIDTH);
  const [isDraggingSidebar, setIsDraggingSidebar] = React.useState(false);
  const [isDraggingList, setIsDraggingList] = React.useState(false);

  // Clear any previously saved widths so page always starts fresh at default sizing
  React.useEffect(() => {
    try {
      localStorage.removeItem("sniply_sidebar_width");
      localStorage.removeItem("sniply_list_width");
    } catch {}
  }, []);

  // Drag handler for Sidebar width (live during session, resets on reload)
  const handleStartResizeSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextW = Math.min(380, Math.max(180, startW + delta));
      setSidebarWidth(nextW);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };

    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Drag handler for Snippet List width (live during session, resets on reload)
  const handleStartResizeList = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingList(true);
    const startX = e.clientX;
    const startW = listWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextW = Math.min(600, Math.max(280, startW + delta));
      setListWidth(nextW);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };

    const onMouseUp = () => {
      setIsDraggingList(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Fuse.js client search index
  const fuseIndex = React.useMemo(() => {
    return createSnippetSearchIndex(snippets);
  }, [snippets]);

  // Instant in-memory snippet selection (0ms switch, zero skeleton states)
  const handleSelectSnippet = React.useCallback(
    (id: string) => {
      setActiveSnippetId(id);
      const found = snippets.find((s) => s.id === id);
      if (found && found.content !== undefined) {
        setActiveSnippetDetail({
          id: found.id,
          title: found.title,
          content: found.content,
          description: found.description,
          type: found.type,
          language: found.language,
          isFavorite: found.isFavorite,
          folderId: found.folderId,
          folderName: found.folderName,
          createdAt: found.createdAt || new Date().toISOString(),
          updatedAt: found.updatedAt || new Date().toISOString(),
          tags: found.tagObjects || found.tags.map((t) => ({ id: t, name: t })),
        });
        setIsLoadingDetail(false);
      } else {
        // Fallback only if content is not loaded in memory
        setIsLoadingDetail(true);
        getSnippetFullContent(id)
          .then((detail) => {
            if (detail) {
              setActiveSnippetDetail({
                ...detail,
                createdAt: detail.createdAt ? new Date(detail.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: detail.updatedAt ? new Date(detail.updatedAt).toISOString() : new Date().toISOString(),
              });
            }
            setIsLoadingDetail(false);
          })
          .catch((err) => {
            console.error("Failed to load snippet details:", err);
            setIsLoadingDetail(false);
          });
      }
    },
    [snippets]
  );

  // Filtered snippet list according to sidebar view
  const filteredSnippets = React.useMemo(() => {
    if (activeFilter.type === "favorites") {
      return snippets.filter((s) => s.isFavorite);
    }
    if (activeFilter.type === "folder" && activeFilter.value) {
      return snippets.filter((s) => s.folderId === activeFilter.value);
    }
    if (activeFilter.type === "tag" && activeFilter.value) {
      return snippets.filter((s) => s.tags.includes(activeFilter.value!));
    }
    return snippets;
  }, [snippets, activeFilter]);

  // Filter label for Column 2 header
  const filterLabel = React.useMemo(() => {
    if (activeFilter.type === "favorites") return "Favorites";
    if (activeFilter.type === "folder" && activeFilter.value) {
      const folder = folders.find((f) => f.id === activeFilter.value);
      return folder ? `Folder: ${folder.name}` : "Folder";
    }
    if (activeFilter.type === "tag" && activeFilter.value) {
      return `Tag: #${activeFilter.value}`;
    }
    return "All Snippets";
  }, [activeFilter, folders]);

  // Immediate state updates for folder creation & deletion
  const handleFolderCreated = (newFolder: { id: string; name: string; parentId: string | null }) => {
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleFolderDeleted = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setSnippets((prev) =>
      prev.map((s) => (s.folderId === folderId ? { ...s, folderId: null, folderName: null } : s))
    );
  };

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Cmd+K: Search Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchPaletteOpen(true);
        return;
      }

      // Quick Capture: Alt+N (Option+N on Mac) or Cmd+N (Mac) avoids browser Ctrl+N window conflict
      if (
        (e.altKey && (e.key === "n" || e.key === "N")) ||
        (e.metaKey && (e.key === "n" || e.key === "N"))
      ) {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
        return;
      }

      // Escape: Close modals
      if (e.key === "Escape") {
        setIsQuickCaptureOpen(false);
        setIsSearchPaletteOpen(false);
        setIsEditModalOpen(false);
        return;
      }

      if (isInput) return;

      // 'n' or 'N': Instant quick capture when browsing list (not in an input)
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = filteredSnippets.findIndex((s) => s.id === activeSnippetId);
        if (currentIndex < filteredSnippets.length - 1) {
          handleSelectSnippet(filteredSnippets[currentIndex + 1].id);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = filteredSnippets.findIndex((s) => s.id === activeSnippetId);
        if (currentIndex > 0) {
          handleSelectSnippet(filteredSnippets[currentIndex - 1].id);
        }
      }

      // 'c' or 'C': Copy active snippet
      if (e.key === "c" || e.key === "C") {
        if (activeSnippetDetail) {
          navigator.clipboard.writeText(activeSnippetDetail.content);
          toast.success("Copied to clipboard", { description: activeSnippetDetail.title });
        }
      }

      // 'f' or 'F': Favorite active snippet
      if (e.key === "f" || e.key === "F") {
        if (activeSnippetId) {
          const current = snippets.find((s) => s.id === activeSnippetId);
          if (current) {
            handleToggleFavorite(activeSnippetId, !current.isFavorite);
          }
        }
      }

      // 'e' or 'E': Edit active snippet
      if (e.key === "e" || e.key === "E") {
        if (activeSnippetDetail) {
          setIsEditModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [filteredSnippets, activeSnippetId, activeSnippetDetail, snippets, handleSelectSnippet]);

  // Optimistic favorite toggle
  const handleToggleFavorite = async (snippetId: string, isFav: boolean) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === snippetId ? { ...s, isFavorite: isFav } : s))
    );
    if (activeSnippetDetail && activeSnippetDetail.id === snippetId) {
      setActiveSnippetDetail((prev) => (prev ? { ...prev, isFavorite: isFav } : null));
    }

    try {
      await toggleFavorite(snippetId, isFav);
    } catch (err) {
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? { ...s, isFavorite: !isFav } : s))
      );
      toast.error("Failed to update favorite");
    }
  };

  // Optimistic delete with 5-second undo toast
  const handleDeleteSnippet = (snippetId: string) => {
    const deletedSnippet = snippets.find((s) => s.id === snippetId);
    if (!deletedSnippet) return;

    const previousIndex = snippets.findIndex((s) => s.id === snippetId);

    setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
    if (activeSnippetId === snippetId) {
      const remaining = snippets.filter((s) => s.id !== snippetId);
      if (remaining.length > 0) {
        handleSelectSnippet(remaining[0].id);
      } else {
        setActiveSnippetId(null);
        setActiveSnippetDetail(null);
      }
    }

    if (activeFilter.type === "tag" && activeFilter.value) {
      const remainingTagMatches = snippets
        .filter((s) => s.id !== snippetId)
        .filter((s) => s.tags?.some((t) => t.toLowerCase() === activeFilter.value?.toLowerCase()));
      if (remainingTagMatches.length === 0) {
        setActiveFilter({ type: "all" });
      }
    }

    let isUndone = false;

    const undoTimeout = setTimeout(async () => {
      if (!isUndone) {
        try {
          await deleteSnippet(snippetId);
        } catch (err) {
          console.error("Delete failed on server:", err);
        }
      }
    }, 5000);

    toast("Snippet deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          isUndone = true;
          clearTimeout(undoTimeout);
          setSnippets((prev) => {
            const next = [...prev];
            next.splice(previousIndex, 0, deletedSnippet);
            return next;
          });
          handleSelectSnippet(deletedSnippet.id);
          toast.success("Deletion undone");
        },
      },
    });
  };

  // Duplicate action
  const handleDuplicate = async (snippetId: string) => {
    try {
      const res = await duplicateSnippet(snippetId);
      toast.success("Snippet duplicated", { description: res.title });
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate snippet");
    }
  };

  // When a new snippet is captured
  const handleSnippetSaved = (newSnippet: any) => {
    const tagObjects = (newSnippet.tags || []).map((t: string) => ({ id: t, name: t }));
    const snippetItem: SnippetListItem = {
      ...newSnippet,
      content: newSnippet.content,
      contentPreview: newSnippet.content.slice(0, 250),
      tagObjects,
    };
    setSnippets((prev) => [snippetItem, ...prev]);
    setActiveSnippetId(newSnippet.id);
    setActiveSnippetDetail({
      ...newSnippet,
      tags: tagObjects,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* Column 1: Folders, Views, Tags */}
      <Sidebar
        folders={folders}
        tags={dynamicTags}
        totalSnippets={snippets.length}
        favoritesCount={snippets.filter((s) => s.isFavorite).length}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onFolderCreated={handleFolderCreated}
        onFolderDeleted={handleFolderDeleted}
        width={sidebarWidth}
        user={user}
      />

      {/* Resize Handle between Col 1 and Col 2 */}
      <ResizeHandle
        onMouseDown={handleStartResizeSidebar}
        onDoubleClick={() => setSidebarWidth(250)}
        isDragging={isDraggingSidebar}
      />

      {/* Column 2: Snippet Feed */}
      <SnippetList
        snippets={filteredSnippets}
        activeSnippetId={activeSnippetId}
        onSelectSnippet={handleSelectSnippet}
        onToggleFavorite={handleToggleFavorite}
        onOpenNewModal={() => setIsQuickCaptureOpen(true)}
        onOpenSearch={() => setIsSearchPaletteOpen(true)}
        filterLabel={filterLabel}
        width={listWidth}
      />

      {/* Resize Handle between Col 2 and Col 3 */}
      <ResizeHandle
        onMouseDown={handleStartResizeList}
        onDoubleClick={() => setListWidth(360)}
        isDragging={isDraggingList}
      />

      {/* Column 3: Active Inspector */}
      <SnippetInspector
        snippet={activeSnippetDetail}
        isLoading={isLoadingDetail}
        onEdit={() => setIsEditModalOpen(true)}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteSnippet}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Quick Capture Modal (Alt+N / N) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        folders={folders}
        existingTags={dynamicTags.map((t) => t.name)}
        onSnippetSaved={handleSnippetSaved}
      />

      {/* Command Search Palette (Cmd+K) */}
      <SearchPalette
        isOpen={isSearchPaletteOpen}
        onClose={() => setIsSearchPaletteOpen(false)}
        fuse={fuseIndex}
        items={snippets}
        onSelectSnippet={(id) => handleSelectSnippet(id)}
      />

      {/* Edit Snippet Modal */}
      <EditSnippetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        snippet={activeSnippetDetail}
        folders={folders}
        onSnippetUpdated={(updated) => {
          setActiveSnippetDetail(updated);
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === updated.id
                ? {
                    ...s,
                    title: updated.title,
                    content: updated.content,
                    contentPreview: updated.content.slice(0, 250),
                    description: updated.description,
                    type: updated.type,
                    language: updated.language,
                    folderId: updated.folderId,
                    folderName: updated.folderName,
                    tags: updated.tags.map((t: any) => t.name),
                    tagObjects: updated.tags,
                  }
                : s
            )
          );
        }}
      />
    </div>
  );
}

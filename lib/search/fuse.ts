import Fuse, { IFuseOptions } from "fuse.js";

export interface SnippetSearchIndexItem {
  id: string;
  title: string;
  description?: string | null;
  contentPreview: string;
  type: string;
  language?: string | null;
  tags: string[];
  folderName?: string | null;
  isFavorite: boolean;
  updatedAt: string;
}

const fuseOptions: IFuseOptions<SnippetSearchIndexItem> = {
  keys: [
    { name: "title", weight: 0.45 },
    { name: "tags", weight: 0.25 },
    { name: "contentPreview", weight: 0.20 },
    { name: "language", weight: 0.05 },
    { name: "type", weight: 0.05 },
  ],
  threshold: 0.35, // Balanced tolerance for fuzzy typos while prioritizing exact hits
  ignoreLocation: true,
  includeMatches: true,
  findAllMatches: true,
  minMatchCharLength: 2,
};

export function createSnippetSearchIndex(items: SnippetSearchIndexItem[]): Fuse<SnippetSearchIndexItem> {
  return new Fuse(items, fuseOptions);
}

/**
 * Searches the Fuse index with exact and prefix boost:
 * If a query matches the start of a title or tag exactly, we bubble it to the top.
 */
export function searchSnippets(
  fuse: Fuse<SnippetSearchIndexItem>,
  items: SnippetSearchIndexItem[],
  query: string
): SnippetSearchIndexItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return items;
  }

  const results = fuse.search(trimmed);
  const matchedItems = results.map((r) => r.item);

  // Apply exact prefix boost
  matchedItems.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    const aExact = aTitle === trimmed;
    const bExact = bTitle === trimmed;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = aTitle.startsWith(trimmed);
    const bStarts = bTitle.startsWith(trimmed);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aTagStarts = a.tags.some((t) => t.toLowerCase().startsWith(trimmed));
    const bTagStarts = b.tags.some((t) => t.toLowerCase().startsWith(trimmed));
    if (aTagStarts && !bTagStarts) return -1;
    if (!aTagStarts && bTagStarts) return 1;

    return 0;
  });

  return matchedItems;
}

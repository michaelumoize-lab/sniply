/**
 * Automatically derives a clean, human-readable title from snippet content.
 */
export function deriveTitleFromContent(content: string): string {
  if (!content || !content.trim()) {
    return "Untitled Snippet";
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return "Untitled Snippet";
  }

  const firstLine = lines[0];

  // Try extracting name from JSON if first line looks like JSON or starts with {
  if (firstLine.startsWith("{") || firstLine.includes('"name":')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && typeof parsed.name === "string" && parsed.name.trim()) {
        return truncateTitle(parsed.name.trim());
      }
    } catch {
      // Ignore JSON parse errors and continue to standard line cleanup
    }
  }

  // Strip common comment characters and prompt prefixes
  let cleaned = firstLine
    .replace(/^(\$|>)\s+/, "") // Terminal prompts: $ or >
    .replace(/^(\/\/|#|--|\/\*|\*)\s*/, "") // Comments: //, #, --, /*, *
    .replace(/\*\/$/, "") // Ending comment */
    .trim();

  if (!cleaned) {
    return "Untitled Snippet";
  }

  return truncateTitle(cleaned);
}

function truncateTitle(title: string, maxLength = 50): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength - 3).trim() + "...";
}

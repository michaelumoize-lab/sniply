import { createHighlighter, Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;
const highlightCache = new Map<string, string>();

const SUPPORTED_LANGS = [
  "bash",
  "sh",
  "shell",
  "zsh",
  "typescript",
  "ts",
  "javascript",
  "js",
  "tsx",
  "jsx",
  "python",
  "py",
  "sql",
  "json",
  "yaml",
  "yml",
  "dockerfile",
  "docker",
  "markdown",
  "md",
  "html",
  "css",
  "rust",
  "rs",
  "go",
  "cpp",
  "c",
  "java",
  "ruby",
  "text",
];

export async function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default", "github-light"],
      langs: [
        "bash",
        "shell",
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "python",
        "sql",
        "json",
        "yaml",
        "dockerfile",
        "markdown",
        "html",
        "css",
        "rust",
        "go",
        "cpp",
        "c",
        "java",
        "ruby",
        "text",
      ],
    });
  }
  return highlighterPromise;
}

function normalizeLanguage(lang?: string | null): string {
  if (!lang) return "text";
  const l = lang.toLowerCase().trim();
  if (l === "sh" || l === "zsh" || l === "terminal") return "bash";
  if (l === "ts") return "typescript";
  if (l === "js") return "javascript";
  if (l === "py") return "python";
  if (l === "yml") return "yaml";
  if (l === "docker") return "dockerfile";
  if (l === "md") return "markdown";
  if (l === "rs") return "rust";
  if (SUPPORTED_LANGS.includes(l)) return l;
  return "text";
}

/**
 * Highlights code string and caches the result.
 */
export async function highlightCode(
  code: string,
  lang?: string | null,
  theme: "dark" | "light" = "dark"
): Promise<string> {
  const normalizedLang = normalizeLanguage(lang);
  const selectedTheme = theme === "dark" ? "github-dark-default" : "github-light";
  const cacheKey = `${selectedTheme}:${normalizedLang}:${code.length}:${code.slice(0, 100)}:${code.slice(-100)}`;

  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!;
  }

  try {
    const highlighter = await getHighlighterInstance();
    const html = highlighter.codeToHtml(code, {
      lang: normalizedLang,
      theme: selectedTheme,
    });
    highlightCache.set(cacheKey, html);
    return html;
  } catch (err) {
    console.warn("Shiki highlight error, falling back to plaintext:", err);
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

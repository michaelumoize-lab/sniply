export const MAX_SNIPPET_BYTES = 65536; // 64 KiB

/**
 * Returns the exact byte length of a string in UTF-8.
 */
export function getUtf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Checks if snippet content is within the 64 KiB UTF-8 limit.
 */
export function isWithinByteLimit(text: string, maxBytes = MAX_SNIPPET_BYTES): boolean {
  return getUtf8ByteLength(text) <= maxBytes;
}

/**
 * Formats byte size for friendly UI display (e.g., "1.4 KB / 64 KB").
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

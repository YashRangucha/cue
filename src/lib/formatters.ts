/**
 * Formats a Date object into a human-readable time string
 * e.g. "02:34:51 PM"
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Truncates text safely at sentence or newline boundaries
 */
export function truncateToLastN(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(-maxChars);

  const breakIndex = truncated.search(/[\n\.!?]/);
  if (breakIndex > 0 && breakIndex < 100) {
    return truncated.slice(breakIndex + 1);
  }

  return truncated;
}

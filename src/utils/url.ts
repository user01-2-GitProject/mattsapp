/**
 * Sanitizes a URL to prevent Cross-Site Scripting (XSS) via dangerous URI schemes
 * like `javascript:`, `data:`, or `vbscript:` when rendered in `href` attributes.
 *
 * Only allows `http://`, `https://`, or relative paths (`/` or `#`).
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return "#";
  }

  const trimmed = url.trim();
  const normalized = trimmed.toLowerCase();

  // Block dangerous pseudo-protocols
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  ) {
    return "#";
  }

  // Allow standard safe protocols and relative paths
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  ) {
    return trimmed;
  }

  // Default fallback for unrecognized schemes or unsafe input
  return "#";
}

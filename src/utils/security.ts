/**
 * Sanitizes external URLs to prevent Cross-Site Scripting (XSS) via javascript:, data:, or vbscript: schemes.
 * Only allows http: and https: protocols or safe relative URLs.
 * Returns '#' if the URL is invalid or uses an unsafe scheme.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";

  // Block explicit XSS pseudo-protocols
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }

  // If the URL contains a protocol/scheme (e.g., scheme:...), only allow http or https
  if (/^[a-z0-9+-.]+:/i.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return "#";
    }
  }

  return trimmed;
}

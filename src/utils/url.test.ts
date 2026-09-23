import { sanitizeUrl } from "./url";

function assertEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("Running URL sanitization security tests...\n");

// 1. Safe HTTP and HTTPS URLs
assertEqual(
  sanitizeUrl("https://130point.com/sales/"),
  "https://130point.com/sales/",
  "Allows valid https:// URLs"
);

assertEqual(
  sanitizeUrl("http://ebay.com"),
  "http://ebay.com",
  "Allows valid http:// URLs"
);

// 2. Relative URLs
assertEqual(
  sanitizeUrl("/dashboard"),
  "/dashboard",
  "Allows relative path starting with '/'"
);

assertEqual(
  sanitizeUrl("#section"),
  "#section",
  "Allows anchor fragment starting with '#'"
);

// 3. XSS vectors via pseudo-protocols
assertEqual(
  sanitizeUrl("javascript:alert('XSS')"),
  "#",
  "Blocks javascript: protocol scheme"
);

assertEqual(
  sanitizeUrl("JAVASCRIPT:alert(document.cookie)"),
  "#",
  "Blocks case-insensitive JAVASCRIPT: protocol scheme"
);

assertEqual(
  sanitizeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="),
  "#",
  "Blocks data: protocol scheme"
);

assertEqual(
  sanitizeUrl("vbscript:msgbox('XSS')"),
  "#",
  "Blocks vbscript: protocol scheme"
);

// 4. Null, undefined, and non-string values
assertEqual(
  sanitizeUrl(null),
  "#",
  "Returns '#' for null input"
);

assertEqual(
  sanitizeUrl(undefined),
  "#",
  "Returns '#' for undefined input"
);

assertEqual(
  sanitizeUrl(""),
  "#",
  "Returns '#' for empty string input"
);

console.log("\nAll URL sanitization tests passed successfully!");

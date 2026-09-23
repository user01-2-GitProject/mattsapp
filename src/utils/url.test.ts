import { describe, it, expect } from "vitest";
import { sanitizeUrl } from "./url";

describe("URL Sanitization Security", () => {
  it("allows valid https:// URLs", () => {
    expect(sanitizeUrl("https://130point.com/sales/")).toBe("https://130point.com/sales/");
  });

  it("allows valid http:// URLs", () => {
    expect(sanitizeUrl("http://ebay.com")).toBe("http://ebay.com");
  });

  it("allows relative path starting with '/'", () => {
    expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
  });

  it("allows anchor fragment starting with '#'", () => {
    expect(sanitizeUrl("#section")).toBe("#section");
  });

  it("blocks javascript: protocol scheme", () => {
    expect(sanitizeUrl("javascript:alert('XSS')")).toBe("#");
  });

  it("blocks case-insensitive JAVASCRIPT: protocol scheme", () => {
    expect(sanitizeUrl("JAVASCRIPT:alert(document.cookie)")).toBe("#");
  });

  it("blocks data: protocol scheme", () => {
    expect(sanitizeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe("#");
  });

  it("blocks vbscript: protocol scheme", () => {
    expect(sanitizeUrl("vbscript:msgbox('XSS')")).toBe("#");
  });

  it("returns '#' for null input", () => {
    expect(sanitizeUrl(null)).toBe("#");
  });

  it("returns '#' for undefined input", () => {
    expect(sanitizeUrl(undefined)).toBe("#");
  });

  it("returns '#' for empty string input", () => {
    expect(sanitizeUrl("")).toBe("#");
  });
});

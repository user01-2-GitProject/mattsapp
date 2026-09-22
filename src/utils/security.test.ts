import assert from "node:assert";
import test from "node:test";
import { sanitizeUrl } from "./security";

test("sanitizeUrl - URL Sanitization Tests", async (t) => {
  await t.test("allows valid http and https URLs", () => {
    assert.strictEqual(sanitizeUrl("https://130point.com/sales/"), "https://130point.com/sales/");
    assert.strictEqual(sanitizeUrl("http://ebay.com/itm/12345"), "http://ebay.com/itm/12345");
  });

  await t.test("blocks javascript: protocol XSS attacks", () => {
    assert.strictEqual(sanitizeUrl("javascript:alert(1)"), "#");
    assert.strictEqual(sanitizeUrl("JAVASCRIPT:alert(document.cookie)"), "#");
    assert.strictEqual(sanitizeUrl("   javascript:alert('xss')  "), "#");
  });

  await t.test("blocks data: and vbscript: protocols", () => {
    assert.strictEqual(sanitizeUrl("data:text/html,<script>alert(1)</script>"), "#");
    assert.strictEqual(sanitizeUrl("vbscript:msgbox(1)"), "#");
    assert.strictEqual(sanitizeUrl("blob:https://example.com/uuid"), "#");
  });

  await t.test("handles null, undefined, empty, and relative strings safely", () => {
    assert.strictEqual(sanitizeUrl(null), "#");
    assert.strictEqual(sanitizeUrl(undefined), "#");
    assert.strictEqual(sanitizeUrl(""), "#");
    assert.strictEqual(sanitizeUrl("   "), "#");
    assert.strictEqual(sanitizeUrl("#anchor"), "#anchor");
    assert.strictEqual(sanitizeUrl("/relative/path"), "/relative/path");
  });
});

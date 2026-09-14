# Sentinel Security Journal

## 2025-02-18 - Transmit Gemini API key via HTTP Header
**Vulnerability:** API key transmitted via URL query parameter `?key=${activeKey}` in `src/services/geminiGateway.ts`, causing credential leakage in HTTP logs, proxies, and browser histories.
**Learning:** Google Gemini REST API supports passing API keys securely in the `x-goog-api-key` header instead of URL query parameters.
**Prevention:** Always transmit sensitive authentication keys in HTTP headers rather than URL query parameters.

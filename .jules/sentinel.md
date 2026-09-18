## 2025-05-20 - Gemini API Key Transmission via HTTP Header
**Vulnerability:** Transmitting API keys as query parameters (`?key=...`) in fetch URLs exposes credentials in HTTP server logs, browser history, proxy logs, and error stack traces.
**Learning:** Google Gemini REST API supports passing API keys securely in the `x-goog-api-key` HTTP header.
**Prevention:** Always transmit sensitive API credentials in request headers rather than URL query parameters to avoid URI-based credential logging.

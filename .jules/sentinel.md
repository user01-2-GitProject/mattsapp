## 2025-05-18 - Gemini API Key Leakage via Query Parameters
**Vulnerability:** API key was transmitted as a URL query parameter (`?key=${activeKey}`) in `geminiGateway.ts`, exposing credentials in proxy logs, browser histories, and server access logs.
**Learning:** Google Generative Language REST APIs support `x-goog-api-key` header authentication.
**Prevention:** Always pass API keys in HTTP request headers rather than URL query parameters.

## 2.15.2025 - Untrusted LLM Grounding Citation URI Scheme XSS
**Vulnerability:** External search grounding citation URIs returned from AI/LLM models (`src.uri`) were rendered directly into anchor tags `<a href={src.uri}>` without scheme validation. If an AI response or manipulated grounding payload contains pseudo-protocols such as `javascript:` or `data:`, user clicks execute arbitrary script in the client browser context.
**Learning:** LLM grounding metadata and external web outputs cannot be trusted as pure `http(s)` URLs. Attackers or hallucinating model output can return executable URI payloads.
**Prevention:** Always filter and validate URI protocol schemes using a strict sanitizer (`sanitizeUrl`) before binding untrusted external strings to `href` attributes in React components.

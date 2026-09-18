# mattsapp

A sports-card valuation terminal built as a React single-page app. Type a card description — or pick from the sample archetypes — and the app runs a deterministic econometric pipeline that returns a floor / fair-value / ceiling band, an IAS 38 dual-floor accounting view, and a SHAP decomposition of what drove the number.

The app ships with eight seed cards (Jayden Daniels, Victor Wembanyama, Anthony Edwards, Patrick Mahomes, Michael Jordan, Lionel Messi, Derek Jeter, Elly De La Cruz) so it produces real valuations immediately, with no API keys required.

## What it does

- **Search / Scan tab** — natural-language card queries, plus quick-fill sample archetypes and an inline "scanner helper" with canned queries.
- **Slab Intel tab** — the Digital Slab Mirror: card image mock, valuation band (floor / fair / ceiling), confirmed attributes, missing-attribute heuristics, SHAP attribution breakdown, and a market-comp audit panel with shill/Damaged/UNPAID filtering and trimmed-outlier reporting.
- **My Vault tab** — personal card inventory with CSV / JSON export, watchlist tagging, high-value and raw grading filters, and inline add/delete.

## The valuation engine (`src/engine/valuationEngine.ts`)

The pipeline is fully deterministic and self-contained. Given card metadata + a list of marketplace comps + optional market context, it runs:

1. **K-means latent parameter clustering** — a 4-cluster model (liquid base, numbered parallel, grail auto, vintage HOF) maps a card's serial-number / rookie / autograph / age feature vector to scarcity (Sc), rivalry (beta), accuracy (Ac), and dataset footprint (Sz) parameters.
2. **IQR shill sanitizer** — normalizes comp prices to the target grade/company, flags shill / lot / damaged / unpaid entries, then trims statistical outliers outside the 1.5×IQR band.
3. **IAS 38 dual-floor** — computes a historical-cost floor (`dVal`, depreciated acquisition proxy) and a recoverable amount (`aVal`), then enforces `fairValue = max(dVal, Vs)` so a card never revalues below its IAS 38 floor.
4. **Integrated Value Score (Vs)** — median qualified comp × time-compounding × sentiment multiplier × scarcity factor × macro index, with a 4% risk-free reference rate.
5. **SHAP decomposition** — attributes the final fair value back to base comp median, scarcity lift, grade premium, hype, sentiment, macro, and IAS 38 floor lift.
6. **Floor / ceiling band** — 20th / 85th percentile of qualified comps, clamped against the IAS 38 floor and the calculated fair value.

## Tech stack

- React 19 + TypeScript
- Vite 6 + Tailwind CSS v4 (via `@tailwindcss/vite`)
- Firebase v12 (Auth + Firestore) — anonymous sign-in, vault stored under `users/{uid}/vault`
- Google Gemini 3.8 Flash + Google Search grounding (optional; falls back to the deterministic engine when no key is configured)
- Lucide React icons, Motion (used lightly)

## Quick start

```bash
cd mattsapp
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:3000`). The app runs immediately in local-buffer mode with no keys.

### Environment variables

Copy `.env.example` to `.env` and fill in the values you care about:

```bash
cp .env.example .env
```

| Variable | Purpose | Required? |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Gemini 3.8 Flash + Google Search grounding for live market recon | No — app falls back to deterministic engine |
| `VITE_API_GATEWAY_URL` | Optional zero-trust proxy that mediates Gemini calls | No |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key for Firestore vault sync | No — vault stays local without it |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | No |
| `VITE_FIREBASE_DATABASE_ID` | Firestore database ID (defaults to `(default)`) | No |

Keys can also be entered at runtime through the Config Drawer (gear icon in the header). Runtime entries live in React state only and are lost on page reload — for a persistent setup use a `.env` file or the deployment platform's environment config.

### Build

```bash
npm run build      # produces dist/
npm run preview    # serve the build locally
npm run lint       # TypeScript type-check (noEmit)
```

## Firebase setup (optional)

If you want the vault synced to Firestore:

1. Create a Firebase project and enable **Authentication** (Anonymous provider) and **Firestore**.
2. Register a web app and copy the config values into `.env` (or paste them in the Config Drawer).
3. Set Firestore rules so each user can only access their own vault subcollection. The app writes to `users/{uid}/vault`; a minimal ruleset:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/vault/{cardId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. The app signs in anonymously on mount and subscribes to `users/{uid}/vault`. When Firebase isn't configured it stores cards in local component state and shows a "BUFFER" indicator in the header.

## Gemini setup (optional)

1. Enable the Google AI Studio API and create an API key with the Generative Language API enabled.
2. Set `VITE_GEMINI_API_KEY` in `.env` or paste it in the Config Drawer.
3. When a key is present, the app routes search queries through Gemini 3.8 Flash with Google Search grounding, parses the structured JSON block the model returns, and feeds the comps into the valuation engine.
4. When no key is present (or the Gemini call fails), it falls through to the Autonomous Econometric Engine — either matching the query against the seed-card list or synthesizing a hedonic estimate from the query text.

## Deployment

The app is a static SPA. Any host that serves `dist/` works. Vercel is the intended target — see the task list below for what's needed before a Vercel preview is usable.

### Vercel (intended)

- Connect the repo to a Vercel project.
- Set the environment variables in the Vercel project settings (same names as `.env.example`).
- Deploy. Vercel auto-detects the Vite app.
- Firestore rules and Gemini keys are configured in their respective platforms, not in the repo.

A `vercel.json` is not in the repo yet; for a SPA fallback on refresh you typically need either a `vercel.json` with a rewrite rule or the Vercel SPA handling enabled.

## Project structure

```
mattsapp/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vite-env.d.ts
├── .env.example
├── firebase-applet-config.json     # template config (keys are empty in repo)
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component, state, Firebase + Gemini orchestration
│   ├── index.css                   # Tailwind import + globals
│   ├── types.ts                    # Shared TypeScript types
│   ├── data.ts                     # Seed cards + grade multipliers + seasonality tables
│   ├── utils.ts
│   ├── utils/csv.ts                # CSV field sanitizer (OWASP formula-injection defense)
│   ├── utils/csv.test.ts
│   ├── engine/
│   │   └── valuationEngine.ts      # Full deterministic valuation pipeline
│   ├── services/
│   │   ├── firebaseService.ts      # Firebase init + error logger
│   │   ├── firebaseService.test.ts
│   │   └── geminiGateway.ts        # Gemini + search-grounding adapter
│   └── components/
│       ├── Header.tsx
│       ├── SearchTab.tsx
│       ├── SlabMirror.tsx
│       ├── VaultTab.tsx
│       ├── ConfigDrawer.tsx
│       └── RapidEntryModal.tsx
└── dist/                           # build output (gitignored)
```

## Security notes

- The Firebase config file in the repo carries empty key fields by design. Project identifiers are non-secret config, but if you fork this for a real project, populate keys via environment variables only — never commit live API keys.
- CSV export uses `sanitizeCsvField` to prepend a single-quote escape on values that start with `=`, `+`, `-`, `@`, or whitespace, defeating formula-injection attacks in Excel/Sheets.
- Firestore error logs strip email addresses before printing. Review `firebaseService.ts` if you extend the logger.

## Notes / caveats

- The Gemini prompt performs light input sanitization (trim + length cap + quote/backslash escaping) before interpolating the user query. It is not a full prompt-injection defense — treat the Gemini path as prototype-grade.
- The SHAP breakdown, IAS 38 accounting, and K-means clusters are deterministic heuristics, not a live market feed. Treat valuations as indicative unless backed by real comps.
- The seed comps are illustrative sample data.

## License

Not specified yet.

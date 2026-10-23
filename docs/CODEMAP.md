# Code map — OpenWorldX vs legacy

This repo holds **two products** in one deploy. Folders are split so you know what to touch for Mira/hire vs the old social app.

## Frontend (`src/`)

| Area | Path | Routes | What it is |
| --- | --- | --- | --- |
| **OpenWorldX** | `src/openworld/` | `/`, `/hire`, `/upload-resume` | Marketing landing, recruiter hire portal, web resume upload |
| **Legacy app** | `src/legacy/` | `/home`, `/auth`, `/dashboard`, `/:username`, `/messages`, … | Original “time seller” feed, profiles, dashboard |
| **Shared UI** | `src/components/`, `src/hooks/`, `src/firebase/`, `src/Layouts/` | Used mainly by legacy; OpenWorld pages are mostly self-contained |

Entry: `src/App.jsx` composes `openworld/routes.jsx` + `legacy/routes.jsx`.

## Cloud Functions (`functions/`)

| Area | Path | Firebase exports | What it is |
| --- | --- | --- | --- |
| **Deploy entry** | `functions/index.js` | All HTTP/scheduled functions | Do not move; update import paths only |
| **OpenWorld / Mira** | `functions/openworld/` | `metaWhatsappWebhook`, `hireApi`, `whatsappResumeUpload`, `dailyCandidateJobs` | Meta WhatsApp, candidates, JD match, intros, email |
| **Legacy WhatsApp** | `functions/legacy/` | `whatsappWebhook` | Gupshup adapter (kept; not primary in prod) |
| **Shared** | `functions/shared/` | (imported only) | Firestore admin, Groq helpers, chat history, Mira prompt, candidate schema |

Local dev: `functions/local.js` (same handlers on port 8080).

## What to edit for common tasks

- **Hire page UI** → `src/openworld/pages/HirePage/`
- **Landing / openworldx.com home** → `src/openworld/pages/LandingPage/`
- **WhatsApp bot behavior** → `functions/openworld/handleMetaWebhook.js`, `functions/shared/mira.js`
- **Matching / reach-out API** → `functions/openworld/hireMatch.js`, `intros.js`
- **Old feed or dashboard** → `src/legacy/pages/` and `src/components/`

## Secrets & deploy

- `functions/.env` — local only (gitignored). Template: `functions/.env.example`
- Hosting: `npm run build` → `dist/`
- Functions: `firebase deploy --only functions:whatsapp`

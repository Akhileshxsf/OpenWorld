# OpenWorldX (OpenWorld)

React site + **Mira**, a WhatsApp agent for candidates, and a **recruiter hire portal** at `/hire`. Production WhatsApp uses the **Meta Cloud API**. Firebase project: `openworld-8f410`, region `asia-south1`.

Live WhatsApp: **+91 98771 74681**. New texters get a welcome with **Upload resume** → `/upload-resume`. Legacy Gupshup (`whatsappWebhook`) stays in the repo but is not the live path.

**Deeper folder reference:** [`docs/CODEMAP.md`](docs/CODEMAP.md) · **Product overview PDF:** [`docs/OpenWorldX-Mira-Overview.pdf`](docs/OpenWorldX-Mira-Overview.pdf)

---

## Repository structure

Two products share one deploy. **OpenWorldX** is what you ship today; **legacy** is the older social “time seller” app.

```
DAA/
├── firebase.json          # Hosting rewrites + functions codebase "whatsapp"
├── src/
│   ├── App.jsx            # Wires openworld + legacy routes
│   ├── main.jsx
│   ├── openworld/         # Current product (landing, hire, resume upload)
│   │   ├── routes.jsx
│   │   └── pages/
│   │       ├── LandingPage/
│   │       ├── HirePage/
│   │       └── ResumeUploadPage/
│   ├── legacy/            # Old feed / profiles / dashboard
│   │   ├── routes.jsx
│   │   └── pages/
│   ├── components/        # Mostly legacy UI
│   ├── hooks/             # Mostly legacy data hooks
│   ├── firebase/          # Client Firebase config
│   └── Layouts/
├── functions/
│   ├── index.js           # Firebase exports (HTTP + scheduler)
│   ├── local.js           # Express on :8080 for local webhook tests
│   ├── openworld/         # Meta WhatsApp, candidates, hire API, email
│   ├── shared/            # Mira brain, chat store, Groq, Firestore admin, schema
│   └── legacy/            # Gupshup webhook adapter
├── docs/
│   └── CODEMAP.md
├── public/                # Static assets (logo, etc.)
└── dist/                  # Vite build output (gitignored) → Firebase Hosting
```

| Firebase export | Source | Public URL (via hosting rewrite) |
| --- | --- | --- |
| `metaWhatsappWebhook` | `openworld/handleMetaWebhook.js` | `/api/whatsapp/meta` |
| `hireApi` | `openworld/hireMatch.js` | `/api/hire/**` |
| `whatsappResumeUpload` | `openworld/uploadResume.js` | `/api/upload-resume` |
| `dailyCandidateJobs` | `openworld/scheduled.js` | (scheduler only) |
| `whatsappWebhook` | `legacy/handleWebhook.js` | `/api/whatsapp` |

---

## End-to-end flows

### 1. Candidate on WhatsApp (primary)

```
Phone → Meta → metaWhatsappWebhook (index.js)
  → openworld/handleMetaWebhook.js
      → openworld/meta.js          (parse message, send text/buttons)
      → shared/chatStore.js        (last messages)
      → shared/mira.js             (Groq reply + profile context)
      → openworld/candidateStore.js (profile + resume metadata)
      → openworld/resumeProcessor.js / chatResume.js (PDF in chat)
      → openworld/intros.js        (recruiter intro buttons + answers)
  → Meta → Phone
```

First contact may hit `openworld/welcomeMessage.js` (template + signed upload link).

### 2. Recruiter hire portal

```
Browser /hire → HirePage.jsx
  → POST /api/hire/match     → openworld/hireMatch.js (parse JD, score candidates)
  → POST /api/hire/job       → reload saved job + matches (?job=&k=)
  → POST /api/hire/reach-out → openworld/hireMatch.js + intros.js
      → openworld/outbound.js → Meta WhatsApp to candidate
      → openworld/introEmails.js → shared/email.js (Resend)
```

Candidates are stored under Firestore (see `candidateStore.js`). Matching uses Groq JSON extraction + scoring in `hireMatch.js`.

### 3. Web resume upload

```
/upload-resume?token=… → ResumeUploadPage.jsx
  → POST /api/upload-resume → openworld/uploadResume.js
      → verify token (uploadToken.js) → Storage + resumeProcessor.js
```

### 4. Legacy social app (optional)

```
/auth, /home, /dashboard, /:username → src/legacy/pages/*
  → src/components/* + src/hooks/* + src/firebase/firebase.js
```

Does not share the WhatsApp `whatsappChats` collection with the in-app chatbot (`ChatbotPage.jsx` uses its own Firestore usage).

---

## How to read the codebase (recommended order)

Read in this order once; skip legacy sections if you only care about OpenWorldX.

### A. Orientation (15 min)

1. **`README.md`** (this file) — structure and flows.
2. **`docs/CODEMAP.md`** — which folder to edit for common tasks.
3. **`firebase.json`** — hosting rewrites and function names.
4. **`src/App.jsx`** — how routes split between products.
5. **`functions/index.js`** — every deployed endpoint and dynamic imports.

### B. OpenWorldX frontend (30 min)

6. **`src/openworld/routes.jsx`** — `/`, `/hire`, `/upload-resume`.
7. **`src/openworld/pages/LandingPage/LandingPage.jsx`** — marketing entry.
8. **`src/openworld/pages/HirePage/HirePage.jsx`** — JD upload, match UI, reach-out (large file; skim sections).
9. **`src/openworld/pages/ResumeUploadPage/ResumeUploadPage.jsx`** — tokenized upload UX.

### C. WhatsApp + candidate backend (45–60 min)

10. **`functions/openworld/handleMetaWebhook.js`** — main event router (messages, resume, intros).
11. **`functions/shared/mira.js`** — system prompt, Groq, profile gaps.
12. **`functions/shared/chatStore.js`** — `whatsappChats` documents.
13. **`functions/shared/candidateSchema.js`** — candidate field shape + sanitizers.
14. **`functions/openworld/candidateStore.js`** — Firestore read/write for candidates/resumes.
15. **`functions/openworld/meta.js`** — Meta Graph API send/receive helpers.
16. **`functions/openworld/resumeProcessor.js`** + **`chatResume.js`** — PDF → profile.
17. **`functions/openworld/welcomeMessage.js`** — first-message template + upload URL.

### D. Recruiter intros + email (30 min)

18. **`functions/openworld/hireMatch.js`** — JD parsing, match, job persistence, reach-out API.
19. **`functions/openworld/intros.js`** — WhatsApp intro flow state machine.
20. **`functions/openworld/introQuestions.js`** — parse recruiter questions / candidate answers.
21. **`functions/openworld/introEmails.js`** + **`openworld/email.js`** — Resend templates.
22. **`functions/openworld/outbound.js`** — proactive WhatsApp sends (allowlist in env).
23. **`functions/openworld/scheduled.js`** — reminders / nudges (cron).

### E. Shared infrastructure

24. **`functions/shared/firebaseAdmin.js`** — Admin SDK + Storage bucket.
25. **`functions/shared/groqJson.js`** — structured JSON from Groq.
26. **`functions/.env.example`** — required secrets (copy to `functions/.env`, never commit).

### F. Legacy (only if you maintain the old app)

27. **`src/legacy/routes.jsx`** then **`src/legacy/pages/HomePage/HomePage.jsx`**.
28. **`functions/legacy/handleWebhook.js`** + **`gupshup.js`** — old provider path.

### G. Local run

29. **`functions/local.js`** — hit the same handlers without deploying.

---

## WhatsApp agent (detail)

Someone texts the business number. Meta POSTs to `metaWhatsappWebhook`. The handler loads chat history, builds context (including resume state from `candidateStore`), calls Groq via `mira.js`, sends the reply, and appends both sides to Firestore.

| Path | Function | Caller |
| --- | --- | --- |
| Meta (live) | `metaWhatsappWebhook` | Meta Cloud API |
| Gupshup (legacy) | `whatsappWebhook` | Gupshup |

Meta function URL: `https://asia-south1-openworld-8f410.cloudfunctions.net/metaWhatsappWebhook`

Steps on each inbound text:

1. **`functions/index.js`** — verify GET for Meta; POST always ends in `200` where required to avoid double delivery.
2. **`openworld/handleMetaWebhook.js`** — ignore receipts/reactions; route text, media, intro callbacks.
3. **`openworld/meta.js`** — normalize inbound payload.
4. **`shared/chatStore.js`** — load history.
5. **`shared/mira.js`** — Groq (`openai/gpt-oss-120b` via env).
6. **`openworld/meta.js`** — mark read + send reply.

## How chats are stored

Firestore collection: **`whatsappChats`**. Document id = phone (e.g. `919618069125`).

```json
{
  "phone": "919618069125",
  "name": "Akhilesh",
  "updatedAt": "<server time>",
  "messages": [
    { "sender": "user", "text": "Hi", "timestamp": "2026-09-26T05:56:00.000Z" },
    { "sender": "bot", "text": "Hey! …", "timestamp": "2026-09-26T05:56:01.000Z" }
  ]
}
```

Mira reads the **last 8** messages per reply. Non-text inbound types are handled or ignored in `handleMetaWebhook.js`.

---

## Run locally

**Website**

```bash
npm install
npm run dev
```

→ `http://localhost:5173` (hire API calls production unless you proxy; see `vite.config.js`).

**WhatsApp handlers** (from `functions/`):

```bash
npm install
npm run dev
```

→ Express **`local.js`** on port **8080**.

**Deploy**

```bash
npm run build
npx firebase-tools deploy --only hosting,functions:whatsapp --project openworld-8f410
```

Env templates: **`.env.example`** (frontend) and **`functions/.env.example`** (backend). Copy to `.env` / `functions/.env` locally; do not commit real keys.

---

## GitHub

Remote: **`https://github.com/Akhileshxsf/OpenWorld.git`** · default branch **`main`**.

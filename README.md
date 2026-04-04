# SIGNAL

An AI-powered autonomous media company. SIGNAL discovers, researches, interviews, writes about, and distributes content for founders and operators building companies in healthcare, oil & gas, and construction — then monetizes that coverage through paid authority packages.

---

## What It Does

1. **Scouts** operators worth covering using a qualification scoring system
2. **Interviews** them via an AI voice assistant (VAPI)
3. **Researches** their background, claims, and industry context
4. **Writes** long-form features, spotlights, and thought leadership in their voice
5. **Validates** all content against editorial and accuracy standards
6. **Packages** social content (LinkedIn, Twitter, YouTube, podcast) around the feature
7. **Distributes** across platforms on a scheduled cadence
8. **Converts** covered founders into paying clients through a deal pipeline

Human editorial review is required at 4 gate points before the pipeline advances.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    npm workspaces                        │
│                  /AI-Media-Company                       │
│                                                          │
│  src/agents/     — 8 Claude-powered pipeline agents      │
│  admin-dashboard/ — Next.js 14 command center (port 3001)│
│  public-site/    — Next.js 14 editorial site (port 3000) │
│  data/           — 9 SQLite databases (gitignored)       │
└─────────────────────────────────────────────────────────┘
```

### The 8-Agent Pipeline

| Agent | Role |
|---|---|
| **Lead** | Orchestrates the pipeline, routes messages, manages gates |
| **Signal Scout** | Qualifies entities, scores confidence, manages intake |
| **Interview Engine** | Runs AI voice interviews via VAPI |
| **Backgrounder** | Web research, fact-checking, industry context |
| **Journalist** | Writes all long-form content using Claude |
| **Validator** | Checks editorial standards, accuracy, compliance |
| **Media Producer** | Assembles social packages (LinkedIn, Twitter, YouTube, podcast) |
| **Distributor** | Publishes to platforms on a scheduled cadence |

### Human Control Gates

The pipeline cannot auto-advance past any gate. All four require explicit human approval via the admin dashboard, API, or voice assistant.

| Gate | Trigger | What's Reviewed |
|---|---|---|
| Gate 1 | After Scout qualifies | Entity profile and confidence score |
| Gate 2 | After Interview + Research | Interview transcript and background research |
| Gate 3 | After Journalist + Validator | Feature article and validation report |
| Gate 4 | After Media Producer | Full social distribution package |

---

## Stack

- **AI**: Claude (`claude-opus-4-6`) via Anthropic SDK — adaptive thinking enabled
- **Voice**: VAPI for founder interviews and admin voice control
- **Database**: SQLite (`better-sqlite3`) — one database per agent
- **Admin**: Next.js 14 App Router, Tailwind CSS, Framer Motion, SWR
- **Public site**: Next.js 14 with ISR (60s revalidation)
- **Runtime**: Node.js 18+ / TypeScript
- **Monorepo**: npm workspaces

---

## Prerequisites

- Node.js 18+
- npm 9+
- An [Anthropic API key](https://console.anthropic.com)
- A [VAPI account](https://vapi.ai) (optional — for voice interviews and admin voice control)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
# Admin dashboard
cp .env.example admin-dashboard/.env.local

# Public site
cp .env.example public-site/.env.local
```

Edit `admin-dashboard/.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_PASSWORD=your-secure-password
NEXTAUTH_SECRET=any-32-char-random-string

# Optional — for platform distribution
VAPI_API_KEY=...
LINKEDIN_ACCESS_TOKEN=...
TWITTER_BEARER_TOKEN=...
YOUTUBE_API_KEY=...
```

Edit `public-site/.env.local`:

```env
ADMIN_SITE_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### 3. Initialize databases

Creates all 9 SQLite databases and seeds the default admin user:

```bash
npx ts-node src/lib/init-db.ts
```

Default credentials: `admin` / `signal-admin-2024`
Change immediately — set `ADMIN_PASSWORD` in `.env.local` and re-run.

### 4. Start the system

```bash
# Admin dashboard — http://localhost:3001
npm run dev:admin

# Public editorial site — http://localhost:3000
npm run dev:public

# Agent pipeline
npm run agents
```

---

## Usage

### Via Admin Dashboard

1. Go to `http://localhost:3001` and log in
2. **Intake** → submit a founder profile to start the pipeline
3. **Dashboard** → monitor real-time agent activity and message stream
4. **Pipeline** → review active tasks, approve or reject gates
5. **Content** → review and approve generated articles
6. **Distribution** → monitor platform posting activity
7. **Deals** → manage monetization outreach queue

### Via Voice (VAPI)

Connect the VAPI assistant to the webhook at `/api/vapi/webhook`. Available voice commands:

- "Add a new founder — [name], [company], [industry]"
- "What's the pipeline status?"
- "Approve gate 2 for [task]"
- "What gates are pending?"
- "Show me the deal queue"

### Via API

```bash
# Start a pipeline
curl -X POST http://localhost:3001/api/signal \
  -H "Content-Type: application/json" \
  -b "signal_session=<your-session>" \
  -d '{"name":"Jane Smith","company":"MedFlow","industry":"healthcare"}'

# Approve a gate
curl -X POST http://localhost:3001/api/signal/approve \
  -H "Content-Type: application/json" \
  -b "signal_session=<your-session>" \
  -d '{"taskId":"<uuid>","gate":2,"decision":"approved","notes":"Strong credibility."}'
```

Full API reference: [`docs/api-reference.md`](docs/api-reference.md)

---

## Monetization Tiers

| Tier | Price | Deliverables |
|---|---|---|
| **Starter** | $300–500 | Spotlight article + LinkedIn post + Twitter thread + newsletter mention |
| **Growth** | $800–1,500 | Feature article + podcast episode + full social package + thought leadership |
| **Authority** | $2,000+** | Everything in Growth + video interview + monthly ongoing coverage + syndication |

---

## Project Structure

```
AI-Media-Company/
├── src/
│   ├── agents/
│   │   ├── lead/               # Lead orchestrator
│   │   ├── signal-scout/       # Entity qualification
│   │   ├── interview-engine/   # VAPI voice interviews
│   │   ├── backgrounder/       # Research + fact-check
│   │   ├── journalist/         # Content writing
│   │   ├── validator/          # Editorial validation
│   │   ├── media-producer/     # Social package assembly
│   │   └── distributor/        # Platform distribution
│   ├── lib/
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   ├── db.ts               # SQLite helpers
│   │   ├── message-tool.ts     # Inter-agent messaging
│   │   ├── scoring.ts          # Confidence scoring
│   │   ├── editorial-rules.ts  # Content validation rules
│   │   ├── sector-rules.ts     # Industry-specific rules
│   │   ├── platform-apis.ts    # LinkedIn/Twitter/YouTube wrappers
│   │   └── init-db.ts          # Database initialization
│   └── templates/
│       ├── feature-article.md
│       ├── spotlight.md
│       ├── podcast-script.md
│       ├── thought-leadership.md
│       ├── youtube-script.md
│       ├── linkedin-post.md
│       ├── twitter-thread.md
│       └── social-package.md
├── admin-dashboard/            # Next.js 14 — port 3001
│   ├── app/
│   │   ├── api/                # REST API routes
│   │   ├── dashboard/          # Protected dashboard pages
│   │   └── login/
│   ├── components/             # UI components
│   └── middleware.ts           # Session-based auth
├── public-site/                # Next.js 14 — port 3000
│   ├── app/
│   │   ├── founders/
│   │   ├── articles/
│   │   ├── sectors/
│   │   ├── podcast/
│   │   └── get-featured/
│   └── components/
├── docs/
│   ├── build-summary.md        # System overview
│   ├── message-log.md          # Inter-agent message protocol
│   └── api-reference.md        # Full API docs
├── data/                       # SQLite databases (gitignored)
├── .env.example
└── package.json
```

---

## Documentation

- [`docs/build-summary.md`](docs/build-summary.md) — Full system architecture and design decisions
- [`docs/message-log.md`](docs/message-log.md) — Inter-agent message protocol and pipeline flow
- [`docs/api-reference.md`](docs/api-reference.md) — REST API reference for all endpoints

---

## Security Notes

- All admin routes require a valid session cookie (`signal_session`)
- Sessions are stored in SQLite, expire after 24 hours
- Passwords are hashed with bcrypt (12 rounds)
- SQLite databases are gitignored — they contain founder PII and admin credentials
- Never commit `.env*` files — use `.env.example` as the template
- Change the default admin password before any non-local deployment

# SIGNAL — Build Summary

**Version**: 1.0.0
**Build Date**: April 2025
**Model**: claude-opus-4-6

---

## What Was Built

SIGNAL is an AI-powered autonomous media company and authority infrastructure platform. It discovers, researches, interviews, writes about, and distributes content about founders and operators building companies in healthcare, oil & gas, and construction — then monetizes that coverage through paid packages.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    MONOREPO ROOT                     │
│                  /AI-Media-Company                   │
└─────────────────────────────────────────────────────┘
         │                 │                 │
    ┌────┴────┐      ┌──────┴──────┐   ┌─────┴──────┐
    │   src/  │      │admin-dash/  │   │public-site/│
    │ agents  │      │  port 3001  │   │  port 3000 │
    └─────────┘      └─────────────┘   └────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │           8-Agent Pipeline                  │
    │  Scout → Interview → Backgrounder →         │
    │  Journalist → Validator → Media Producer →  │
    │  Distributor   (Lead orchestrates all)      │
    └─────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │           9 SQLite Databases                │
    │  data/signal-scout.db  data/interview.db   │
    │  data/backgrounder.db  data/journalist.db  │
    │  data/media-producer.db data/validator.db  │
    │  data/distributor.db   data/lead.db        │
    │  data/admin.db                             │
    └─────────────────────────────────────────────┘
```

---

## File Inventory

### Shared Libraries (`src/lib/`)

| File | Purpose |
|---|---|
| `types.ts` | TypeScript interfaces for all data structures |
| `db.ts` | SQLite connection helpers, query utilities |
| `message-tool.ts` | Inter-agent message passing functions |
| `scoring.ts` | Confidence scoring algorithms |
| `editorial-rules.ts` | Content quality validation rules |
| `sector-rules.ts` | Industry-specific scoring and rules |
| `platform-apis.ts` | LinkedIn, Twitter, YouTube API wrappers |
| `init-db.ts` | Database initialization script |

### Agent Files (`src/agents/`)

Each agent directory contains:
- `index.ts` — Agent runtime, message polling loop, Claude API calls
- `prompts.ts` — System prompts and task-specific prompt templates

| Agent | Directory | Primary Function |
|---|---|---|
| Lead Orchestrator | `lead/` | Pipeline routing, gate management, VAPI coordination |
| Signal Scout | `signal-scout/` | Entity discovery, qualification scoring |
| Interview Engine | `interview/` | VAPI-powered founder interviews |
| Backgrounder | `backgrounder/` | Web research, fact-checking |
| Journalist | `journalist/` | Long-form content writing |
| Media Producer | `media-producer/` | Social content package assembly |
| Validator | `validator/` | Editorial + accuracy validation |
| Distributor | `distributor/` | Multi-platform content distribution |

### Content Templates (`src/templates/`)

| Template | Use Case |
|---|---|
| `feature-article.md` | Long-form founder profile (1,200–2,000 words) |
| `spotlight.md` | Short founder spotlight (400–600 words) |
| `podcast-script.md` | The SIGNAL Sessions podcast episode |
| `thought-leadership.md` | Bylined opinion piece in founder's voice |
| `youtube-script.md` | Video interview script + production notes |
| `linkedin-post.md` | 3-post LinkedIn package |
| `twitter-thread.md` | 10–15 tweet thread |
| `social-package.md` | Master distribution package coordinator |

### Admin Dashboard (`admin-dashboard/`)

**Config**:
- `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`
- `middleware.ts` — Route protection, session validation

**API Routes** (`app/api/`):
- `auth/login`, `auth/logout`, `auth/session`
- `signal/route`, `signal/status`, `signal/approve`, `signal/intake`, `signal/messages`
- `cms/articles`, `cms/founders`, `cms/publish`
- `vapi/webhook`

**Components** (`components/`):
- `SectorBadge`, `MetricsCard`, `AgentCard`, `PipelineProgress`
- `GateApprovalModal`, `MessageStream`, `IntakeForm`
- `ContentDraftPanel`, `VoiceIndicator`, `DealCard`

**Pages** (`app/`):
- `login/page.tsx`
- `dashboard/page.tsx` (Command Center)
- `dashboard/intake/page.tsx`
- `dashboard/pipeline/page.tsx`
- `dashboard/content/page.tsx`
- `dashboard/distribution/page.tsx`
- `dashboard/deals/page.tsx`

### Public Site (`public-site/`)

**Config**:
- `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`

**Components** (`components/`):
- `SiteHeader`, `SiteFooter`, `FounderCard`, `ArticleCard`, `SectorHero`

**Pages** (`app/`):
- `/` — Homepage
- `/founders` — Founder directory
- `/founders/[id]` — Founder profile
- `/articles` — Articles listing
- `/articles/[id]` — Article detail
- `/podcast` — The SIGNAL Sessions
- `/sectors/healthcare` — Healthcare sector
- `/sectors/oil-gas` — Oil & Gas sector
- `/sectors/construction` — Construction sector
- `/get-featured` — Application form

### Documentation (`docs/`)

| File | Contents |
|---|---|
| `build-summary.md` | This file — system overview |
| `message-log.md` | Inter-agent message protocol reference |
| `api-reference.md` | Full API documentation |

---

## Technology Stack

| Layer | Technology |
|---|---|
| AI Model | Claude (claude-opus-4-6) via Anthropic SDK |
| Agent Runtime | Node.js + TypeScript |
| Database | SQLite via better-sqlite3 (synchronous) |
| Admin Frontend | Next.js 14 App Router |
| Public Frontend | Next.js 14 App Router with ISR |
| Styling | Tailwind CSS |
| Animations | Framer Motion (admin) |
| Data Fetching | SWR (admin client-side), Next.js fetch with ISR (public) |
| Voice AI | VAPI |
| Monorepo | npm workspaces |

---

## Human Control Gates

Four mandatory review points where a human must approve before the pipeline advances:

| Gate | Trigger Point | Decision Options |
|---|---|---|
| Gate 1 — Entity Review | After Scout qualifies entity | Approve / Reject / Revision |
| Gate 2 — Research Review | After Interview + Backgrounder complete | Approve / Reject / Revision |
| Gate 3 — Content Review | After Journalist + Validator complete | Approve / Reject / Revision |
| Gate 4 — Distribution Review | After Media Producer assembles package | Approve / Reject / Revision |

Gates can be managed via:
- Admin dashboard (web UI)
- VAPI voice assistant ("approve gate 2 for task...")
- API: `POST /api/signal/approve`

---

## Monetization Tiers

| Tier | Price | Deliverables |
|---|---|---|
| Starter | $300–500 | Spotlight article + LinkedIn post + Twitter thread + newsletter mention |
| Growth | $800–1,500 | Feature article + podcast + full social package + thought leadership |
| Authority | $2,000+ | Everything in Growth + video + monthly ongoing + syndication |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Anthropic API key
- VAPI API key (optional, for voice features)

### Setup

```bash
# Clone and install
cd AI-Media-Company
npm install

# Initialize all databases
npx ts-node src/lib/init-db.ts

# Set environment variables
cp admin-dashboard/.env.example admin-dashboard/.env.local
# Edit admin-dashboard/.env.local with your keys

cp public-site/.env.example public-site/.env.local
# ADMIN_SITE_URL=http://localhost:3001

# Start admin dashboard (port 3001)
npm run dev:admin

# Start public site (port 3000)
npm run dev:public

# Start agent pipeline
npm run agents
```

### Default Credentials
- **Admin URL**: http://localhost:3001
- **Username**: `admin`
- **Password**: `signal-admin-2024`

⚠️ Change the admin password immediately: set `ADMIN_PASSWORD` in `.env.local` and re-run `init-db.ts`.

---

## Running the Pipeline

1. **Open admin dashboard** at http://localhost:3001
2. **Log in** with admin credentials
3. **Go to Intake** → fill out the intake form for a new founder
4. **Monitor Dashboard** → watch agents process the pipeline in real-time
5. **Approve gates** as they appear in the dashboard
6. **Review content** in the Content tab
7. **Approve distribution** at Gate 4
8. **Track deals** in the Deals tab

Or manage entirely via voice: connect the VAPI assistant and use voice commands.

---

## Key Design Decisions

**SQLite per agent**: Each agent owns its database. No shared state, no race conditions. Agents communicate only through message passing. Simple, debuggable, fast.

**ISR for public site**: Public site fetches from admin API with 60-second revalidation. No separate database access, no data duplication. One source of truth.

**Human gates required**: The pipeline cannot auto-advance past any gate. All 4 gates require explicit human approval. The system surfaces information and drafts content — humans make all publish decisions.

**Synchronous SQLite**: Using `better-sqlite3` (synchronous) in agents keeps code simple and eliminates callback/promise complexity in the agent loop. Appropriate for single-process agents.

**claude-opus-4-6 throughout**: All 8 agents use the same model. Consistency in output quality, no optimization complexity. Cost optimization can be added later for simpler tasks (Haiku for scout scoring, etc.).

# SIGNAL API Reference

Base URL (admin dashboard): `http://localhost:3001`
Base URL (public site): `http://localhost:3000`

All admin API endpoints require a valid session cookie (`signal_session`) unless noted.

---

## Authentication

### POST /api/auth/login
Login to the admin dashboard.

**Request** (no auth required):
```json
{
  "username": "admin",
  "password": "signal-admin-2024"
}
```

**Response 200**:
```json
{
  "success": true,
  "username": "admin"
}
```
Sets HTTP-only cookie: `signal_session={session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`

**Response 401**:
```json
{ "error": "Invalid credentials" }
```

---

### POST /api/auth/logout
Logout and clear session.

**Response 200**:
```json
{ "success": true }
```

---

### GET /api/auth/session
Check current session status.

**Response 200 (authenticated)**:
```json
{
  "authenticated": true,
  "username": "admin"
}
```

**Response 200 (not authenticated)**:
```json
{ "authenticated": false }
```

---

## Pipeline Control

### POST /api/signal
Start a new pipeline task for a founder.

**Request**:
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "company": "MedFlow",
  "title": "CEO",
  "industry": "healthcare",
  "website": "https://medflow.io",
  "linkedin_url": "https://linkedin.com/in/janesmith",
  "hook": "Cut OR turnover from 22 to 9 minutes in 14 hospitals.",
  "notes": "Referred by Dr. Williams at Mass General"
}
```

**Required fields**: `name`, `company`, `industry`

**Response 200**:
```json
{
  "taskId": "uuid-v4",
  "entityId": "uuid-v4",
  "status": "started",
  "message": "Pipeline started for Jane Smith"
}
```

---

### GET /api/signal/status
Get pipeline status summary or specific view.

**Query params**:
- `view=active` — Returns active pipelines only
- `view=all` — Returns all pipeline tasks
- *(no param)* — Returns summary metrics

**Response (summary)**:
```json
{
  "summary": {
    "activePipelines": 3,
    "pendingGates": 1,
    "completedToday": 2,
    "totalEntities": 47,
    "dealQueueSize": 8
  }
}
```

**Response (active)**:
```json
{
  "active": [
    {
      "id": "uuid",
      "entity_id": "uuid",
      "founder_name": "Jane Smith",
      "company_name": "MedFlow",
      "industry": "healthcare",
      "current_stage": "interview",
      "status": "active",
      "gate_1_status": "approved",
      "gate_2_status": "pending",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/signal/approve
Submit a gate decision (approve, reject, or request revision).

**Request**:
```json
{
  "taskId": "uuid",
  "gate": 2,
  "decision": "approved",
  "notes": "Strong credibility signals, solid interview answers. Proceed."
}
```

**Fields**:
- `taskId` (string, required) — Pipeline task ID
- `gate` (1–4, required) — Gate number
- `decision` (required) — `"approved"` | `"rejected"` | `"revision"`
- `notes` (string, optional) — Reviewer notes passed to agents

**Response 200**:
```json
{
  "success": true,
  "taskId": "uuid",
  "gate": 2,
  "decision": "approved"
}
```

---

### GET /api/signal/intake
Get the current intake queue (entities in the pipeline).

**Response 200**:
```json
{
  "intake": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "company": "MedFlow",
      "industry": "healthcare",
      "status": "qualifying",
      "confidence_score": 82,
      "task_id": "uuid",
      "current_stage": "interview",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /api/signal/messages
Get agent message stream.

**Query params**:
- `taskId={uuid}` — Returns message trace for a specific task
- *(no param)* — Returns last 50 messages across all tasks

**Response 200**:
```json
{
  "messages": [
    {
      "id": 42,
      "from_agent": "journalist",
      "to_agent": "lead",
      "task_id": "uuid",
      "type": "CONTENT_COMPLETE",
      "payload": "{\"articleId\": \"uuid\", \"wordCount\": 1847}",
      "created_at": "2024-01-15T10:05:30Z"
    }
  ]
}
```

---

## CMS

### GET /api/cms/articles
Fetch published articles.

**Query params**:
- `entityId={uuid}` — Filter by founder entity
- `status={draft|approved|published}` — Filter by status
- `docType={feature-article|spotlight|...}` — Filter by content type

**Response 200**:
```json
[
  {
    "id": "uuid",
    "task_id": "uuid",
    "entity_id": "uuid",
    "doc_type": "feature-article",
    "title": "How Jane Smith Cut OR Turnover in Half",
    "content": "...",
    "word_count": 1847,
    "status": "approved",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### PATCH /api/cms/articles
Update an article's status.

**Request**:
```json
{
  "id": "uuid",
  "status": "approved"
}
```

**Valid status values**: `draft`, `approved`, `rejected`, `published`

**Response 200**:
```json
{ "success": true }
```

---

### GET /api/cms/founders
Fetch founder profiles.

**Query params**:
- `status={new|qualifying|qualified|featured}` — Filter by status
- `industry={healthcare|oil_gas|construction|other}` — Filter by industry

**Response 200**:
```json
[
  {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@medflow.io",
    "company": "MedFlow",
    "title": "CEO",
    "industry": "healthcare",
    "website": "https://medflow.io",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "hook": "Cut OR turnover from 22 to 9 minutes in 14 hospitals.",
    "status": "featured",
    "confidence_score": 92,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### POST /api/cms/publish
Publish content to the internal CMS.

**Request**:
```json
{
  "taskId": "uuid",
  "entityId": "uuid",
  "docType": "feature-article",
  "title": "How Jane Smith Cut OR Turnover in Half",
  "content": "...",
  "status": "approved"
}
```

**Response 200**:
```json
{
  "success": true,
  "postId": "uuid"
}
```

---

## VAPI Webhook

### POST /api/vapi/webhook
Receives voice function calls from the VAPI voice assistant.

**Request** (from VAPI):
```json
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "name": "function_name",
      "parameters": {}
    }
  }
}
```

**Response**:
```json
{
  "result": "Human-readable result string"
}
```

### Available Voice Functions

#### `intake_founder`
Add a new founder to the pipeline via voice.
```json
{
  "name": "string (required)",
  "company": "string (required)",
  "industry": "string (required)",
  "email": "string (optional)",
  "hook": "string (optional)"
}
```

#### `check_pipeline_status`
Get current pipeline metrics summary.
```json
{}
```

#### `approve_gate`
Approve or reject a pipeline gate.
```json
{
  "taskId": "string",
  "gate": "number (1-4)",
  "decision": "approved | rejected | revision",
  "notes": "string (optional)"
}
```

#### `get_pending_gates`
List all tasks waiting on gate decisions.
```json
{}
```

#### `get_distribution_status`
Get distribution metrics for a task.
```json
{
  "taskId": "string (optional — omit for summary)"
}
```

#### `flag_monetization`
Flag a completed pipeline task for monetization outreach.
```json
{
  "taskId": "string",
  "notes": "string (optional)"
}
```

#### `get_deal_queue`
Get current deal queue with recommended tiers.
```json
{}
```

---

## Public Site API Passthrough

The public site fetches data from the admin API. These endpoints are read-only and used by public Next.js pages with ISR (revalidate: 60s).

| Public Page | Admin Endpoint Called |
|---|---|
| `/` (homepage) | `GET /api/cms/founders?status=featured` + `GET /api/cms/articles?status=approved` |
| `/founders` | `GET /api/cms/founders?status=featured&industry={filter}` |
| `/founders/[id]` | `GET /api/cms/founders?status=featured` + `GET /api/cms/articles?entityId={id}&status=approved` |
| `/articles` | `GET /api/cms/articles?status=approved` |
| `/articles/[id]` | `GET /api/cms/articles?status=approved` |
| `/podcast` | `GET /api/cms/articles?status=approved` (filtered client-side for podcast-script) |
| `/sectors/healthcare` | `GET /api/cms/founders?status=featured&industry=healthcare` + articles |
| `/sectors/oil-gas` | `GET /api/cms/founders?status=featured&industry=oil_gas` + articles |
| `/sectors/construction` | `GET /api/cms/founders?status=featured&industry=construction` + articles |

---

## Environment Variables

### Admin Dashboard (`admin-dashboard/.env.local`)
```
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_PASSWORD=your-secure-password
NEXTAUTH_SECRET=your-random-secret-32-chars
VAPI_API_KEY=your-vapi-key
LINKEDIN_ACCESS_TOKEN=your-linkedin-token
TWITTER_BEARER_TOKEN=your-twitter-token
YOUTUBE_API_KEY=your-youtube-key
```

### Public Site (`public-site/.env.local`)
```
ADMIN_SITE_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Human readable error message"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request — missing or invalid fields |
| 401 | Unauthorized — invalid or missing session |
| 404 | Not found |
| 405 | Method not allowed |
| 500 | Internal server error |

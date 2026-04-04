# SIGNAL Inter-Agent Message Protocol

## Overview

All 8 agents communicate through a SQLite-based message passing system. Each agent has its own database containing `messages_in` and `messages_out` tables. The Lead Orchestrator routes messages between agents and maintains the pipeline state.

---

## Message Schema

```typescript
interface Message {
  id: number;           // Auto-incremented
  from_agent: string;   // Sending agent name
  to_agent: string;     // Receiving agent name
  task_id: string;      // Pipeline task UUID
  type: string;         // Message type (see types below)
  payload: string;      // JSON string
  status: string;       // 'pending' | 'processed' | 'failed'
  created_at: string;   // ISO datetime
  processed_at: string; // ISO datetime, null until processed
}
```

---

## Agent Names

| Agent | Name Constant | Database |
|---|---|---|
| Lead Orchestrator | `lead` | `data/lead.db` |
| Signal Scout | `signal-scout` | `data/signal-scout.db` |
| Interview Engine | `interview` | `data/interview.db` |
| Backgrounder | `backgrounder` | `data/backgrounder.db` |
| Journalist | `journalist` | `data/journalist.db` |
| Media Producer | `media-producer` | `data/media-producer.db` |
| Validator | `validator` | `data/validator.db` |
| Distributor | `distributor` | `data/distributor.db` |

---

## Message Types

### Lead → Scout

| Type | Payload | Description |
|---|---|---|
| `START_QUALIFICATION` | `{ entityId, founderData }` | Begin entity qualification |
| `REQUEST_RESCORE` | `{ entityId, reason }` | Re-evaluate entity score |

### Scout → Lead

| Type | Payload | Description |
|---|---|---|
| `QUALIFICATION_COMPLETE` | `{ entityId, score, recommendation }` | Qualification finished |
| `QUALIFICATION_FAILED` | `{ entityId, reason }` | Unable to qualify |
| `ENTITY_REJECTED` | `{ entityId, reason, score }` | Below threshold, rejected |

---

### Lead → Interview

| Type | Payload | Description |
|---|---|---|
| `START_INTERVIEW` | `{ taskId, entityId, founderData, sessionType }` | Begin interview process |

### Interview → Lead

| Type | Payload | Description |
|---|---|---|
| `INTERVIEW_COMPLETE` | `{ taskId, sessionId, summaryId, keyThemes, hooks }` | Interview finished |
| `INTERVIEW_FAILED` | `{ taskId, sessionId, reason }` | Interview could not complete |
| `INTERVIEW_NEEDS_FOLLOWUP` | `{ taskId, sessionId, missingTopics }` | Partial completion, needs more data |

---

### Lead → Backgrounder

| Type | Payload | Description |
|---|---|---|
| `START_RESEARCH` | `{ taskId, entityId, founderData, interviewSummaryId }` | Begin background research |

### Backgrounder → Lead

| Type | Payload | Description |
|---|---|---|
| `RESEARCH_COMPLETE` | `{ taskId, profileId, confidenceScore, flags }` | Research finished |
| `RESEARCH_FAILED` | `{ taskId, reason }` | Research could not complete |
| `FACT_CHECK_FAILED` | `{ taskId, profileId, failedClaims }` | Critical fact check failure |

---

### Lead → Journalist

| Type | Payload | Description |
|---|---|---|
| `START_WRITING` | `{ taskId, entityId, docType, founderData, interviewSummaryId, researchProfileId }` | Begin content creation |
| `REVISION_REQUEST` | `{ taskId, articleId, revisionNotes, gateNumber }` | Revise content after gate review |

### Journalist → Lead

| Type | Payload | Description |
|---|---|---|
| `CONTENT_COMPLETE` | `{ taskId, articleId, docType, wordCount, confidenceScore }` | Writing finished |
| `CONTENT_FAILED` | `{ taskId, reason }` | Writing could not complete |
| `REVISION_COMPLETE` | `{ taskId, articleId, version }` | Revision finished |

---

### Lead → Validator

| Type | Payload | Description |
|---|---|---|
| `START_VALIDATION` | `{ taskId, entityId, contentId, contentType }` | Begin validation |

### Validator → Lead

| Type | Payload | Description |
|---|---|---|
| `VALIDATION_COMPLETE` | `{ taskId, reportId, verdict, overallScore, issues }` | Validation finished |
| `VALIDATION_FAILED` | `{ taskId, reason }` | Validation error |

---

### Lead → Media Producer

| Type | Payload | Description |
|---|---|---|
| `START_MEDIA_PACKAGE` | `{ taskId, entityId, tier, articleId, founderData }` | Begin social package creation |

### Media Producer → Lead

| Type | Payload | Description |
|---|---|---|
| `PACKAGE_COMPLETE` | `{ taskId, packageId, deliverables }` | Package assembled |
| `PACKAGE_FAILED` | `{ taskId, reason }` | Package could not assemble |

---

### Lead → Distributor

| Type | Payload | Description |
|---|---|---|
| `START_DISTRIBUTION` | `{ taskId, entityId, packageId, tier, schedule }` | Begin distribution |

### Distributor → Lead

| Type | Payload | Description |
|---|---|---|
| `DISTRIBUTION_COMPLETE` | `{ taskId, jobId, platforms, urls }` | Distribution finished |
| `DISTRIBUTION_PARTIAL` | `{ taskId, jobId, succeeded, failed }` | Partial completion |
| `DISTRIBUTION_FAILED` | `{ taskId, reason }` | Distribution failed |

---

## Gate Messages

Gate decisions are injected by the admin dashboard API (`/api/signal/approve`) directly into the lead agent's database.

| Type | Payload | Source |
|---|---|---|
| `GATE_DECISION` | `{ taskId, gate: 1-4, decision: 'approved'|'rejected'|'revision', notes }` | Admin API |

---

## Pipeline Flow Sequence

```
Admin/VAPI → Lead: START_PIPELINE(founder data)
  Lead → Scout: START_QUALIFICATION
    Scout → Lead: QUALIFICATION_COMPLETE (score ≥ 70)

  [GATE 1: Human reviews entity profile]
  Admin → Lead: GATE_DECISION(gate=1, approved)

  Lead → Interview: START_INTERVIEW
    Interview → Lead: INTERVIEW_COMPLETE

  Lead → Backgrounder: START_RESEARCH
    Backgrounder → Lead: RESEARCH_COMPLETE

  [GATE 2: Human reviews interview + research]
  Admin → Lead: GATE_DECISION(gate=2, approved)

  Lead → Journalist: START_WRITING(feature-article)
    Journalist → Lead: CONTENT_COMPLETE

  Lead → Validator: START_VALIDATION
    Validator → Lead: VALIDATION_COMPLETE(approved)

  [GATE 3: Human reviews content draft]
  Admin → Lead: GATE_DECISION(gate=3, approved)

  Lead → Journalist: START_WRITING(spotlight, thought-leadership)
  Lead → Media Producer: START_MEDIA_PACKAGE
    Journalist → Lead: CONTENT_COMPLETE
    Media Producer → Lead: PACKAGE_COMPLETE

  [GATE 4: Human approves distribution package]
  Admin → Lead: GATE_DECISION(gate=4, approved)

  Lead → Distributor: START_DISTRIBUTION
    Distributor → Lead: DISTRIBUTION_COMPLETE

  Lead: PIPELINE_COMPLETE → deals flagged for monetization outreach
```

---

## Confidence Score Thresholds

| Score Range | Tier | Action |
|---|---|---|
| 90–100 | High | Auto-advance if gate approves |
| 70–89 | Medium | Advance with human gate approval |
| 50–69 | Low | Flag for revision before gate |
| < 50 | Revision | Return to previous agent for rework |

---

## Message Processing

Each agent polls its `messages_in` table every 5-30 seconds (configurable). When a message is found with `status = 'pending'`:

1. Agent sets `status = 'processing'`
2. Executes the task
3. Writes result to its own data tables
4. Inserts response into `messages_out`
5. Sets `status = 'processed'` and records `processed_at`
6. Lead reads the agent's `messages_out` and routes next step

---

## Error Handling

If an agent fails to process a message:
- Sets `status = 'failed'` in `messages_in`
- Writes error details to `messages_out` with type `*_FAILED`
- Lead orchestrator receives failure, logs to `agent_activity_log`
- Lead may retry (up to 3 times) or escalate to human review

---

## Viewing Message Logs

Via admin dashboard:
- **Dashboard → Command Center**: Live message stream (last 50 messages)
- **Dashboard → Pipeline**: Task-specific message trace
- **API**: `GET /api/signal/messages?taskId={id}`

Via SQLite directly:
```sql
-- View all messages for a task
SELECT * FROM messages_out WHERE task_id = '{task_id}' ORDER BY created_at;

-- View pending messages for an agent
SELECT * FROM messages_in WHERE to_agent = 'journalist' AND status = 'pending';
```

import { v4 as uuidv4 } from 'uuid';
import { getDb, getLeadDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { runSignalScout } from '../signal-scout';
import { dispatchToContentAgents } from '../backgrounder';
import { runDistribution } from '../distributor';
import type {
  GateNumber, GateDecision, IntakeRequest,
  PipelineStatusResponse, PipelineState
} from '../../lib/types';

// ============================================================
// Pipeline State Management
// ============================================================

export async function startPipeline(intake: IntakeRequest): Promise<string> {
  const taskId = uuidv4();
  const db = getLeadDb();

  // Create pipeline state
  db.prepare(`
    INSERT INTO pipeline_state (task_id, entity_id, entity_name, current_stage, gate_status, created_at, updated_at)
    VALUES (?, 'pending', ?, 'signal-scout', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId, intake.name);

  // Create lead task record
  db.prepare(`
    INSERT INTO tasks (id, agent, status, created_at, updated_at)
    VALUES (?, 'lead', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId);

  // Start signal scout
  const { entityId } = await runSignalScout(intake, taskId);

  // Update pipeline with entity ID
  db.prepare(`
    UPDATE pipeline_state SET entity_id = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
  `).run(entityId, taskId);

  return taskId;
}

export async function processGateDecision(
  taskId: string,
  gate: GateNumber,
  decision: GateDecision,
  notes?: string
): Promise<void> {
  const db = getLeadDb();
  const decisionId = uuidv4();

  // Record gate decision
  db.prepare(`
    INSERT INTO gate_decisions (id, task_id, gate_number, decision, notes, decided_by, created_at)
    VALUES (?, ?, ?, ?, ?, 'human', CURRENT_TIMESTAMP)
  `).run(decisionId, taskId, gate, decision, notes || null);

  // Get pipeline state
  const state = db.prepare('SELECT * FROM pipeline_state WHERE task_id = ?').get(taskId) as {
    entity_id: string; gate_status: string; entity_name: string;
  } | undefined;

  if (!state) throw new Error(`Pipeline state not found for task ${taskId}`);

  const gateStatus = JSON.parse(state.gate_status || '{}');
  gateStatus[gate] = decision;

  db.prepare(`
    UPDATE pipeline_state SET gate_status = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
  `).run(JSON.stringify(gateStatus), taskId);

  const entityId = state.entity_id;

  if (decision === 'approved') {
    switch (gate) {
      case 1: {
        // Gate 1 approved → start interview engine (Mode B assumed — transcript upload or Mode A)
        db.prepare(`UPDATE pipeline_state SET current_stage = 'interview-engine', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);
        sendMessage({
          taskId, from: 'lead', to: 'interview-engine', type: 'gate_approved',
          payload: { entity_id: entityId, gate: 1, summary: 'Gate 1 approved. Begin interview collection.' },
        });
        break;
      }
      case 2: {
        // Gate 2 approved → trigger journalist + media-producer
        const bgDb = getDb('backgrounder');
        const bg = bgDb.prepare(
          'SELECT id FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
        ).get(entityId) as { id: string } | undefined;

        if (bg) {
          db.prepare(`UPDATE pipeline_state SET current_stage = 'journalist', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);
          await dispatchToContentAgents(taskId, entityId, bg.id);
        }
        break;
      }
      case 3: {
        // Gate 3 approved → trigger distribution
        db.prepare(`UPDATE pipeline_state SET current_stage = 'distributor', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);

        // Gather all approved content IDs
        const journalistDb = getDb('journalist');
        const mediaDb = getDb('media-producer');
        const journalistOutputs = journalistDb.prepare(
          'SELECT id FROM outputs WHERE entity_id = ? AND status = "draft"'
        ).all(entityId) as Array<{ id: string }>;
        const mediaOutputs = mediaDb.prepare(
          'SELECT id FROM outputs WHERE entity_id = ? AND status = "draft"'
        ).all(entityId) as Array<{ id: string }>;

        const allContentIds = [...journalistOutputs, ...mediaOutputs].map(o => o.id);

        // Update all to approved
        journalistDb.prepare(`UPDATE outputs SET status = 'approved' WHERE entity_id = ?`).run(entityId);
        mediaDb.prepare(`UPDATE outputs SET status = 'approved' WHERE entity_id = ?`).run(entityId);

        const { distributionUrls } = await runDistribution(taskId, entityId, allContentIds);

        db.prepare(`
          UPDATE pipeline_state SET
            current_stage = 'complete',
            distribution_urls = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ?
        `).run(JSON.stringify(distributionUrls), taskId);

        // Update entity status to 'featured'
        const scoutDb = getDb('signal-scout');
        scoutDb.prepare(`UPDATE entities SET status = 'featured', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(entityId);
        break;
      }
      case 4: {
        // Gate 4 — flag for monetization
        const scoutDb = getDb('signal-scout');
        scoutDb.prepare(`UPDATE entities SET monetization_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(entityId);
        db.prepare(`UPDATE pipeline_state SET monetization_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);
        break;
      }
    }
  } else if (decision === 'rejected') {
    db.prepare(`UPDATE pipeline_state SET current_stage = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);
    const scoutDb = getDb('signal-scout');
    scoutDb.prepare(`UPDATE entities SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(entityId);
  } else if (decision === 'revision') {
    // Route back for revision based on current gate
    const revisionTarget = gate === 1 ? 'signal-scout' : gate === 2 ? 'backgrounder' : 'journalist';
    sendMessage({
      taskId, from: 'lead', to: revisionTarget, type: 'revision_required',
      payload: { entity_id: entityId, gate, revision_notes: [notes || 'Revision requested by human reviewer'], summary: `Gate ${gate} returned for revision.` },
    });
  }
}

export function getPipelineStatus(): PipelineStatusResponse {
  const db = getLeadDb();

  const activePipelines = (db.prepare(
    "SELECT COUNT(*) as c FROM pipeline_state WHERE current_stage NOT IN ('complete', 'rejected')"
  ).get() as { c: number }).c;

  const pendingGates = db.prepare(`
    SELECT ps.task_id, ps.entity_name, mi.message_type, mi.payload
    FROM pipeline_state ps
    JOIN messages_in mi ON JSON_EXTRACT(mi.payload, '$.taskId') = ps.task_id
    WHERE mi.message_type = 'gate_pending' AND mi.processed = 0
    ORDER BY mi.created_at ASC
  `).all() as Array<{ task_id: string; entity_name: string; payload: string }>;

  const gates = pendingGates.map(r => {
    const p = JSON.parse(r.payload);
    return { taskId: r.task_id, gate: p.gate as GateNumber, entityName: r.entity_name };
  });

  const highConfidence = (db.prepare(`
    SELECT COUNT(DISTINCT task_id) as c FROM messages_in
    WHERE message_type = 'validation_pass' AND processed = 0
  `).get() as { c: number }).c;

  const recentlyPublished = (db.prepare(`
    SELECT COUNT(*) as c FROM pipeline_state
    WHERE current_stage = 'complete' AND updated_at > datetime('now', '-7 days')
  `).get() as { c: number }).c;

  return {
    activePipelines,
    pendingGates: gates,
    highConfidenceItems: highConfidence,
    recentlyPublished,
  };
}

export function getActivePipelines(): PipelineState[] {
  const db = getLeadDb();
  const rows = db.prepare(`
    SELECT * FROM pipeline_state
    WHERE current_stage NOT IN ('complete', 'rejected')
    ORDER BY created_at DESC
    LIMIT 50
  `).all() as Array<Record<string, unknown>>;

  return rows.map(r => ({
    taskId: r.task_id as string,
    entityId: r.entity_id as string,
    entityName: r.entity_name as string,
    currentStage: r.current_stage as string,
    gateStatus: JSON.parse(r.gate_status as string || '{}'),
    validationScores: JSON.parse(r.validation_scores as string || '{}'),
    contentIds: JSON.parse(r.content_ids as string || '[]'),
    distributionUrls: JSON.parse(r.distribution_urls as string || '{}'),
    monetizationFlag: Boolean(r.monetization_flag),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export function getAllPipelines() {
  const db = getLeadDb();
  return db.prepare('SELECT * FROM pipeline_state ORDER BY created_at DESC LIMIT 100').all();
}

export function getDealQueue() {
  const scoutDb = getDb('signal-scout');
  return scoutDb.prepare(`
    SELECT e.*, ps.current_stage, ps.task_id
    FROM entities e
    LEFT JOIN pipeline_state ps ON ps.entity_id = e.id
    WHERE e.monetization_flag = 1
    ORDER BY e.score DESC
  `).all();
}

export function flagForMonetization(entityId: string): void {
  const scoutDb = getDb('signal-scout');
  scoutDb.prepare('UPDATE entities SET monetization_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(entityId);
}

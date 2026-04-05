import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { extractJson } from '../../lib/json-utils';
import { SIGNAL_SCOUT_SYSTEM, ENTITY_RESEARCH_PROMPT } from './prompts';
import type { IntakeRequest, Industry } from '../../lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runSignalScout(
  intake: IntakeRequest,
  taskId: string
): Promise<{ entityId: string; score: number; hook: string }> {
  const db = getDb('signal-scout');
  const entityId = uuidv4();

  // Create task record
  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'signal-scout', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  `).run(taskId, entityId);

  try {
    // Call Claude to qualify the entity
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SIGNAL_SCOUT_SYSTEM,
      messages: [{
        role: 'user',
        content: ENTITY_RESEARCH_PROMPT(intake),
      }],
    });

    const response = await stream.finalMessage();
    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Parse JSON from response
    const result = extractJson(rawText);

    // Write entity to db
    db.prepare(`
      INSERT INTO entities (id, name, company, industry, source, status, score, monetization_flag, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      entityId,
      intake.name,
      intake.company,
      result.entity_data.industry as Industry,
      intake.source,
      result.scoring.total
    );

    // Write output record
    const outputId = uuidv4();
    db.prepare(`
      INSERT INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, version, status, created_at)
      VALUES (?, ?, ?, 'backgrounder', ?, ?, 1, 'draft', CURRENT_TIMESTAMP)
    `).run(outputId, taskId, entityId, JSON.stringify(result), result.scoring.total);

    // Update task status
    db.prepare(`UPDATE tasks SET status = 'awaiting_approval', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    // Send Gate 1 pending to lead
    sendMessage({
      taskId,
      from: 'signal-scout',
      to: 'lead',
      type: 'gate_pending',
      payload: {
        entity_id: entityId,
        gate: 1,
        summary: `New entity qualified: ${intake.name} (${intake.company}) — Score: ${result.scoring.total}/100. ${result.hook}`,
        industry_tag: result.entity_data.industry,
        hook: result.hook,
      },
    });

    console.log(`[SignalScout] Entity ${entityId} qualified. Score: ${result.scoring.total}`);

    return { entityId, score: result.scoring.total, hook: result.hook };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

export function getSignalScoutQueue() {
  const db = getDb('signal-scout');
  return db.prepare(`
    SELECT e.*, t.id as task_id, t.status as task_status
    FROM entities e
    LEFT JOIN tasks t ON t.entity_id = e.id AND t.agent = 'signal-scout'
    ORDER BY e.created_at DESC
    LIMIT 50
  `).all();
}

export function getEntityById(entityId: string) {
  const db = getDb('signal-scout');
  return db.prepare('SELECT * FROM entities WHERE id = ?').get(entityId);
}

export function getSignalScoutOutput(taskId: string) {
  const db = getDb('signal-scout');
  return db.prepare('SELECT * FROM outputs WHERE task_id = ?').get(taskId);
}

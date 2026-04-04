import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { BACKGROUNDER_SYSTEM, BACKGROUNDER_SYNTHESIS_PROMPT } from './prompts';
import { getSectorContext } from '../../lib/sector-rules';
import type { Industry } from '../../lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runBackgrounder(
  entityId: string,
  taskId: string,
  transcriptId: string,
  keyQuotes: string[],
  insightTags: string[]
): Promise<{ backgrounderId: string; validationScore: number }> {
  const db = getDb('backgrounder');
  const bgId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'backgrounder', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId, entityId);

  try {
    // Read entity from signal-scout (read-only access)
    const scoutDb = getDb('signal-scout');
    const entity = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(entityId) as {
      name: string; company: string; industry: string;
    } | undefined;

    if (!entity) throw new Error(`Entity ${entityId} not found in signal-scout db`);

    // Read interview output (read-only)
    const interviewDb = getDb('interview-engine');
    const interviewOutput = interviewDb.prepare(
      'SELECT content FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(entityId) as { content: string } | undefined;

    const industry = entity.industry as Industry;
    const sectorCtx = getSectorContext(industry);

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: BACKGROUNDER_SYSTEM,
      messages: [{
        role: 'user',
        content: BACKGROUNDER_SYNTHESIS_PROMPT({
          entityData: JSON.stringify(entity, null, 2),
          interviewTranscript: interviewOutput?.content || 'No transcript available',
          keyQuotes,
          insightTags,
          sectorContext: sectorCtx.sectorContext,
        }),
      }],
    });

    const response = await stream.finalMessage();
    const rawText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Backgrounder: failed to parse JSON');

    const backgrounder = JSON.parse(jsonMatch[0]);
    const validationScore = backgrounder.validation_score || 70;

    // Write backgrounder to db
    db.prepare(`
      INSERT INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, version, status, created_at)
      VALUES (?, ?, ?, 'backgrounder', ?, ?, 1, 'draft', CURRENT_TIMESTAMP)
    `).run(bgId, taskId, entityId, JSON.stringify(backgrounder), validationScore);

    db.prepare(`UPDATE tasks SET status = 'awaiting_approval', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    // Send to Gate 2 (lead)
    sendMessage({
      taskId,
      from: 'backgrounder',
      to: 'lead',
      type: 'gate_pending',
      payload: {
        entity_id: entityId,
        backgrounder_id: bgId,
        gate: 2,
        validation_scores: { backgrounder: validationScore },
        summary: `Backgrounder ready for ${entity.name} (${entity.company}). Validation: ${validationScore}/100. ${backgrounder.narrative_angles?.[0]?.hook || ''}`,
      },
    });

    console.log(`[Backgrounder] ${bgId} created. Score: ${validationScore}`);

    return { backgrounderId: bgId, validationScore };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

// Called by Lead after Gate 2 approval — triggers journalist + media-producer in parallel
export async function dispatchToContentAgents(
  taskId: string,
  entityId: string,
  backgrounderId: string
): Promise<void> {
  sendMessage({
    taskId, from: 'backgrounder', to: 'journalist', type: 'handoff',
    payload: { entity_id: entityId, backgrounder_id: backgrounderId, summary: 'Gate 2 approved. Begin content production.' },
  });
  sendMessage({
    taskId, from: 'backgrounder', to: 'media-producer', type: 'handoff',
    payload: { entity_id: entityId, backgrounder_id: backgrounderId, summary: 'Gate 2 approved. Begin media production.' },
  });
}

export function getBackgrounder(backgrounderId: string) {
  const db = getDb('backgrounder');
  return db.prepare('SELECT * FROM outputs WHERE id = ?').get(backgrounderId);
}

export function getBackgrounderByEntity(entityId: string) {
  const db = getDb('backgrounder');
  return db.prepare(
    'SELECT * FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(entityId);
}

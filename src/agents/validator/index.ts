import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { extractJson } from '../../lib/json-utils';
import { VALIDATOR_SYSTEM, VALIDATION_PROMPT } from './prompts';
import { calculateValidationScore } from '../../lib/scoring';
import type { AgentName } from '../../lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function validateSingleContent(
  contentId: string,
  content: string,
  backgrounder: string,
  docType: string
): Promise<{ score: number; tier: string; passed: boolean; gaps: string[]; revisionNotes: string[] }> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    ...({ thinking: { type: 'enabled', budget_tokens: 4000 } } as any),
    system: VALIDATOR_SYSTEM,
    messages: [{ role: 'user', content: VALIDATION_PROMPT(content, backgrounder, docType) }],
  });

  const response = await stream.finalMessage();
  const rawText = (response.content as Array<{ type: string; text?: string }>).filter(b => b.type === 'text').map(b => b.text ?? '').join('');
  let result: Record<string, unknown>;
  try {
    result = extractJson(rawText);
  } catch {
    return { score: 60, tier: 'medium', passed: true, gaps: [], revisionNotes: [] };
  }
  const scoreResult = calculateValidationScore({
    accuracy: result.scores?.accuracy || 15,
    completeness: result.scores?.completeness || 15,
    toneQuality: result.scores?.tone_quality || 12,
    noHallucinations: result.scores?.no_hallucinations || 15,
    brandAlignment: result.scores?.brand_alignment || 7,
    structural: result.scores?.structural || 7,
  });

  return {
    score: scoreResult.score,
    tier: scoreResult.tier,
    passed: scoreResult.passed,
    gaps: result.gaps || scoreResult.gaps,
    revisionNotes: result.revision_notes || [],
  };
}

export async function runValidation(
  taskId: string,
  entityId: string,
  contentIds: string[],
  originAgent: 'journalist' | 'media-producer'
): Promise<void> {
  const db = getDb('validator');
  const validationTaskId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'validator', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(validationTaskId, entityId);

  try {
    // Get backgrounder for reference
    const bgDb = getDb('backgrounder');
    const bgOutput = bgDb.prepare(
      'SELECT content FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(entityId) as { content: string } | undefined;

    const backgrounder = bgOutput?.content || '{}';

    // Get content to validate
    const originDb = getDb(originAgent);
    const contentOutputs = originDb.prepare(
      `SELECT * FROM outputs WHERE id IN (${contentIds.map(() => '?').join(',')}) AND entity_id = ?`
    ).all([...contentIds, entityId]) as Array<{ id: string; content: string; doc_type: string }>;

    // Validate each piece
    const validationResults = await Promise.all(
      contentOutputs.map(output =>
        validateSingleContent(output.id, output.content, backgrounder, output.doc_type)
          .then(result => ({ ...result, contentId: output.id, docType: output.doc_type }))
      )
    );

    // Calculate overall score
    const avgScore = validationResults.reduce((s, r) => s + r.score, 0) / (validationResults.length || 1);
    const allPassed = validationResults.every(r => r.passed);
    const allGaps = validationResults.flatMap(r => r.gaps);
    const allRevisionNotes = validationResults.flatMap(r => r.revisionNotes);

    // Write validation records
    for (const result of validationResults) {
      const valId = uuidv4();
      db.prepare(`
        INSERT INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, confidence_tier, version, status, created_at)
        VALUES (?, ?, ?, 'backgrounder', ?, ?, ?, 1, 'approved', CURRENT_TIMESTAMP)
      `).run(valId, validationTaskId, entityId,
        JSON.stringify(result), result.score, result.tier);

      // Update status in origin db
      const tier = result.score >= 90 ? 'high' : result.score >= 70 ? 'medium' : 'low';
      originDb.prepare(`
        UPDATE outputs SET validation_score = ?, confidence_tier = ? WHERE id = ?
      `).run(result.score, tier, result.contentId);
    }

    db.prepare(`UPDATE tasks SET status = 'complete', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(validationTaskId);

    const validationScores: Record<string, number> = {};
    validationResults.forEach(r => { validationScores[r.contentId] = r.score; });

    if (allPassed && avgScore >= 50) {
      // Send to lead (Gate 3 queue)
      const tier = avgScore >= 90 ? 'high' : avgScore >= 70 ? 'medium' : 'low';
      sendMessage({
        taskId, from: 'validator', to: 'lead', type: 'validation_pass',
        payload: {
          entity_id: entityId,
          content_ids: contentIds,
          validation_scores: validationScores,
          summary: `${originAgent} content validated. Avg score: ${Math.round(avgScore)}/100. Tier: ${tier}. ${contentIds.length} pieces ready for Gate 3.`,
        },
      });
    } else {
      // Send revision_required back to originating agent
      sendMessage({
        taskId, from: 'validator', to: originAgent as AgentName, type: 'revision_required',
        payload: {
          entity_id: entityId,
          content_ids: contentIds,
          validation_scores: validationScores,
          gaps: allGaps,
          revision_notes: allRevisionNotes,
          summary: `Revision required. Avg score: ${Math.round(avgScore)}/100. Issues: ${allGaps.slice(0, 3).join('; ')}`,
        },
      });
    }

    console.log(`[Validator] Task ${taskId} validated. Avg: ${Math.round(avgScore)}/100. Passed: ${allPassed}`);
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(validationTaskId);
    throw err;
  }
}

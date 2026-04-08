import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { sendInterviewQuestions } from '../../lib/mail';
import { extractJson } from '../../lib/json-utils';
import { INTERVIEW_MODE_A_SYSTEM, INTERVIEW_MODE_B_SYSTEM, MODE_A_QUESTION_PROMPT, MODE_B_PARSE_PROMPT } from './prompts';
import { getSectorContext } from '../../lib/sector-rules';
import type { Industry } from '../../lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runInterviewModeA(
  entityId: string,
  taskId: string,
  entityData: Record<string, unknown>
): Promise<{ transcriptId: string }> {
  const db = getDb('interview-engine');
  const transcriptId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'interview-engine', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  `).run(taskId, entityId);

  try {
    const industry = (entityData.industry as Industry) || 'other';
    const sectorCtx = getSectorContext(industry);

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      ...({ thinking: { type: 'enabled', budget_tokens: 4000 } } as any),
      system: INTERVIEW_MODE_A_SYSTEM,
      messages: [{
        role: 'user',
        content: MODE_A_QUESTION_PROMPT(JSON.stringify(entityData, null, 2), sectorCtx.sectorContext),
      }],
    });

    const response = await stream.finalMessage();
    const rawText = (response.content as Array<{ type: string; text?: string }>).filter(b => b.type === 'text').map(b => b.text ?? '').join('');
    const questionSet = extractJson<{ intro_message: string; sections: Array<{ section_name: string; section_intro?: string; questions: Array<{ id: string; question: string; expected_length?: string }> }>; closing_message: string; response_deadline: string }>(rawText);

    // Store the question set as transcript
    db.prepare(`
      INSERT INTO outputs (id, task_id, entity_id, doc_type, content, version, status, created_at)
      VALUES (?, ?, ?, 'backgrounder', ?, 1, 'draft', CURRENT_TIMESTAMP)
    `).run(transcriptId, taskId, entityId, JSON.stringify(questionSet));

    db.prepare(`UPDATE tasks SET status = 'awaiting_validation', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    // Email question set to founder if an email address is available
    const founderEmail = entityData.email as string | undefined;
    if (founderEmail) {
      await sendInterviewQuestions({
        toEmail: founderEmail,
        founderName: (entityData.name as string) || 'Founder',
        questionSet,
      });
      console.log(`[InterviewEngine Mode A] Questions emailed to ${founderEmail}`);
    } else {
      console.log(`[InterviewEngine Mode A] Question set generated for entity ${entityId} — no email on file`);
    }

    // Send handoff to backgrounder
    sendMessage({
      taskId,
      from: 'interview-engine',
      to: 'backgrounder',
      type: 'handoff',
      payload: {
        entity_id: entityId,
        transcript_id: transcriptId,
        key_quotes: questionSet.sections?.[0]?.questions?.map((q: { question: string }) => q.question) || [],
        insight_tags: ['pending_response'],
        summary: 'Mode A: Interview questions sent to founder. Awaiting responses.',
      },
    });

    return { transcriptId };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

export async function runInterviewModeB(
  entityId: string,
  taskId: string,
  transcript: string,
  entityName: string
): Promise<{ transcriptId: string; keyQuotes: string[]; insightTags: string[] }> {
  const db = getDb('interview-engine');
  const transcriptId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'interview-engine', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  `).run(taskId, entityId);

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      ...({ thinking: { type: 'enabled', budget_tokens: 8000 } } as any),
      system: INTERVIEW_MODE_B_SYSTEM,
      messages: [{
        role: 'user',
        content: MODE_B_PARSE_PROMPT(transcript, entityName),
      }],
    });

    const response = await stream.finalMessage();
    const rawText = (response.content as Array<{ type: string; text?: string }>).filter(b => b.type === 'text').map(b => b.text ?? '').join('');
    const parsed = extractJson<{ key_quotes?: string[]; insight_tags?: string[]; [key: string]: unknown }>(rawText);

    db.prepare(`
      INSERT INTO outputs (id, task_id, entity_id, doc_type, content, version, status, created_at)
      VALUES (?, ?, ?, 'backgrounder', ?, 1, 'draft', CURRENT_TIMESTAMP)
    `).run(transcriptId, taskId, entityId, JSON.stringify(parsed));

    db.prepare(`UPDATE tasks SET status = 'complete', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    // Send handoff to backgrounder
    sendMessage({
      taskId,
      from: 'interview-engine',
      to: 'backgrounder',
      type: 'handoff',
      payload: {
        entity_id: entityId,
        transcript_id: transcriptId,
        key_quotes: parsed.key_quotes || [],
        insight_tags: parsed.insight_tags || [],
        summary: `Mode B transcript parsed. ${parsed.key_quotes?.length || 0} quotes extracted. Quality score: ${parsed.interview_quality_score || 'N/A'}`,
      },
    });

    console.log(`[InterviewEngine Mode B] Transcript parsed for entity ${entityId}`);

    return {
      transcriptId,
      keyQuotes: parsed.key_quotes || [],
      insightTags: parsed.insight_tags || [],
    };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

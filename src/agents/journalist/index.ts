import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import {
  JOURNALIST_SYSTEM,
  FEATURE_ARTICLE_PROMPT,
  SPOTLIGHT_PROMPT,
  THOUGHT_LEADERSHIP_PROMPT,
} from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OUTPUT_DIR = path.join(__dirname, '../../output/signal');

async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 6000
): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const response = await stream.finalMessage();
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('');
}

export async function runJournalist(
  entityId: string,
  taskId: string,
  backgrounderId: string
): Promise<{ articleIds: string[] }> {
  const db = getDb('journalist');

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'journalist', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId, entityId);

  try {
    // Read backgrounder (read-only)
    const bgDb = getDb('backgrounder');
    const bgOutput = bgDb.prepare('SELECT * FROM outputs WHERE id = ?').get(backgrounderId) as {
      content: string; entity_id: string;
    } | undefined;

    if (!bgOutput) throw new Error(`Backgrounder ${backgrounderId} not found`);

    const backgrounderText = bgOutput.content;

    // Generate all 3 content types in parallel
    const [featureArticle, spotlight, thoughtLeadership] = await Promise.all([
      generateContent(JOURNALIST_SYSTEM, FEATURE_ARTICLE_PROMPT(backgrounderText, '')),
      generateContent(JOURNALIST_SYSTEM, SPOTLIGHT_PROMPT(backgrounderText), 3000),
      generateContent(JOURNALIST_SYSTEM, THOUGHT_LEADERSHIP_PROMPT(backgrounderText), 4000),
    ]);

    const articleIds: string[] = [];

    const contentPieces = [
      { type: 'feature_article', content: featureArticle, minWords: 800, maxWords: 1500 },
      { type: 'spotlight', content: spotlight, minWords: 300, maxWords: 500 },
      { type: 'thought_leadership', content: thoughtLeadership, minWords: 600, maxWords: 900 },
    ] as const;

    for (const piece of contentPieces) {
      const articleId = uuidv4();
      articleIds.push(articleId);

      db.prepare(`
        INSERT INTO outputs (id, task_id, entity_id, doc_type, content, version, status, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 'draft', CURRENT_TIMESTAMP)
      `).run(articleId, taskId, entityId, piece.type, piece.content);
    }

    db.prepare(`UPDATE tasks SET status = 'awaiting_validation', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    // Save to output directory
    const taskOutputDir = path.join(OUTPUT_DIR, taskId);
    fs.mkdirSync(taskOutputDir, { recursive: true });
    fs.writeFileSync(path.join(taskOutputDir, 'feature-article.md'), featureArticle);
    fs.writeFileSync(path.join(taskOutputDir, 'spotlight.md'), spotlight);
    fs.writeFileSync(path.join(taskOutputDir, 'thought-leadership.md'), thoughtLeadership);

    // Send validation request
    sendMessage({
      taskId, from: 'journalist', to: 'validator', type: 'validation_request',
      payload: {
        entity_id: entityId,
        content_ids: articleIds,
        summary: `3 content pieces ready for validation: feature article, spotlight, thought leadership.`,
      },
    });

    console.log(`[Journalist] Generated ${articleIds.length} content pieces for task ${taskId}`);

    return { articleIds };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

export function getJournalistOutputs(taskId: string) {
  const db = getDb('journalist');
  return db.prepare('SELECT * FROM outputs WHERE task_id = ?').all(taskId);
}

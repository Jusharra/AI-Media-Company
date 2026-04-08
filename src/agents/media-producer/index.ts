import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import {
  MEDIA_PRODUCER_SYSTEM,
  PODCAST_SCRIPT_PROMPT,
  YOUTUBE_SCRIPT_PROMPT,
  SHORTS_PROMPT,
  SOCIAL_PACKAGE_PROMPT,
} from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OUTPUT_DIR = path.join(__dirname, '../../output/signal');

async function generate(systemPrompt: string, userPrompt: string, maxTokens = 6000): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: maxTokens,
    ...({ thinking: { type: 'enabled', budget_tokens: 5000 } } as any),
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const response = await stream.finalMessage();
  return (response.content as Array<{ type: string; text?: string }>).filter(b => b.type === 'text').map(b => b.text ?? '').join('');
}

export async function runMediaProducer(
  entityId: string,
  taskId: string,
  backgrounderId: string
): Promise<{ mediaPackageId: string }> {
  const db = getDb('media-producer');
  const mediaPackageId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'media-producer', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  `).run(taskId, entityId);

  try {
    const bgDb = getDb('backgrounder');
    const bgOutput = bgDb.prepare('SELECT content FROM outputs WHERE id = ?').get(backgrounderId) as { content: string } | undefined;
    if (!bgOutput) throw new Error(`Backgrounder ${backgrounderId} not found`);

    const bg = bgOutput.content;

    // Generate all media in parallel
    const [podcastScript, youtubeScript, shorts, socialPackage] = await Promise.all([
      generate(MEDIA_PRODUCER_SYSTEM, PODCAST_SCRIPT_PROMPT(bg), 8000),
      generate(MEDIA_PRODUCER_SYSTEM, YOUTUBE_SCRIPT_PROMPT(bg), 6000),
      generate(MEDIA_PRODUCER_SYSTEM, SHORTS_PROMPT(bg), 4000),
      generate(MEDIA_PRODUCER_SYSTEM, SOCIAL_PACKAGE_PROMPT(bg), 6000),
    ]);

    const contentMap = [
      { type: 'podcast_script', content: podcastScript, filename: 'podcast-script.md' },
      { type: 'youtube_script', content: youtubeScript, filename: 'youtube-script.md' },
      { type: 'twitter_thread', content: shorts, filename: 'shorts-scripts.md' },
      { type: 'social_package', content: socialPackage, filename: 'social-package.md' },
    ] as const;

    const contentIds: string[] = [];

    for (const item of contentMap) {
      const contentId = uuidv4();
      contentIds.push(contentId);
      db.prepare(`
        INSERT INTO outputs (id, task_id, entity_id, doc_type, content, version, status, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 'draft', CURRENT_TIMESTAMP)
      `).run(contentId, taskId, entityId, item.type, item.content);
    }

    // Save to output directory
    const taskOutputDir = path.join(OUTPUT_DIR, taskId);
    fs.mkdirSync(taskOutputDir, { recursive: true });
    for (const item of contentMap) {
      fs.writeFileSync(path.join(taskOutputDir, item.filename), item.content);
    }

    // Also save social package as JSON
    const socialJson = { linkedin: [], twitter: [], quoteGraphics: [], instagramCarousel: [], raw: socialPackage };
    fs.writeFileSync(path.join(taskOutputDir, 'social-package.json'), JSON.stringify(socialJson, null, 2));

    db.prepare(`UPDATE tasks SET status = 'awaiting_validation', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);

    sendMessage({
      taskId, from: 'media-producer', to: 'validator', type: 'validation_request',
      payload: {
        entity_id: entityId,
        media_package_id: mediaPackageId,
        content_ids: contentIds,
        summary: `Media package ready: podcast script, YouTube script, 3 Shorts, full social package.`,
      },
    });

    console.log(`[MediaProducer] Media package ${mediaPackageId} generated for task ${taskId}`);

    return { mediaPackageId };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
    throw err;
  }
}

export function getMediaOutputs(taskId: string) {
  const db = getDb('media-producer');
  return db.prepare('SELECT * FROM outputs WHERE task_id = ?').all(taskId);
}

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../lib/db';
import { sendMessage } from '../../lib/message-tool';
import { batchPublish, getEngagementMetrics } from '../../lib/platform-apis';
import type { Platform } from '../../lib/types';

export async function runDistribution(
  taskId: string,
  entityId: string,
  approvedContentIds: string[]
): Promise<{ distributionUrls: Record<string, string> }> {
  const db = getDb('distributor');
  const distTaskId = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'distributor', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(distTaskId, entityId);

  const distributionUrls: Record<string, string> = {};

  try {
    // Gather approved content from journalist and media-producer dbs
    const journalistDb = getDb('journalist');
    const mediaDb = getDb('media-producer');

    const contents: Array<{ type: string; content: string }> = [];

    for (const contentId of approvedContentIds) {
      const journalistOutput = journalistDb.prepare('SELECT * FROM outputs WHERE id = ?').get(contentId) as { doc_type: string; content: string } | undefined;
      const mediaOutput = mediaDb.prepare('SELECT * FROM outputs WHERE id = ?').get(contentId) as { doc_type: string; content: string } | undefined;
      const output = journalistOutput || mediaOutput;
      if (output) contents.push({ type: output.doc_type, content: output.content });
    }

    // Build publish queue
    const publishQueue: Array<{ platform: Platform; content: Record<string, string> }> = [];

    for (const item of contents) {
      switch (item.type) {
        case 'feature_article':
          publishQueue.push({ platform: 'website', content: { text: item.content, type: 'article' } });
          break;
        case 'linkedin_post':
        case 'social_package':
          publishQueue.push({ platform: 'linkedin', content: { text: item.content.substring(0, 2900) } });
          break;
        case 'twitter_thread':
          publishQueue.push({ platform: 'twitter', content: { text: item.content.substring(0, 270) } });
          break;
        case 'youtube_script':
          publishQueue.push({ platform: 'youtube', content: { title: `SIGNAL Feature`, description: item.content.substring(0, 4900) } });
          break;
      }
    }

    // Execute publishing
    const results = await batchPublish(publishQueue);

    // Log distribution records
    for (const result of results) {
      const logId = uuidv4();
      const contentId = approvedContentIds[0] || entityId;

      db.prepare(`
        INSERT INTO distribution_logs (id, task_id, content_id, platform, post_url, status, published_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(logId, distTaskId, contentId, result.platform,
        result.postUrl || null, result.success ? 'published' : 'failed');

      if (result.success && result.postUrl) {
        distributionUrls[result.platform] = result.postUrl;
      }
    }

    db.prepare(`UPDATE tasks SET status = 'complete', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(distTaskId);

    sendMessage({
      taskId, from: 'distributor', to: 'lead', type: 'distribution_complete',
      payload: {
        entity_id: entityId,
        content_ids: approvedContentIds,
        distribution_urls: distributionUrls,
        summary: `Distribution complete. Published to: ${Object.keys(distributionUrls).join(', ')}`,
      },
    });

    // Schedule metric tracking (in production, use a job queue)
    setTimeout(() => trackMetrics(distTaskId, distributionUrls), 86400000); // 24h

    console.log(`[Distributor] Task ${distTaskId} complete. Published to ${Object.keys(distributionUrls).length} platforms.`);

    return { distributionUrls };
  } catch (err) {
    db.prepare(`UPDATE tasks SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(distTaskId);
    throw err;
  }
}

async function trackMetrics(taskId: string, distributionUrls: Record<string, string>): Promise<void> {
  const db = getDb('distributor');

  for (const [platform, url] of Object.entries(distributionUrls)) {
    const postId = url.split('/').pop() || '';
    const metrics = await getEngagementMetrics(platform as Platform, postId);

    db.prepare(`
      UPDATE distribution_logs SET performance_metrics = ?
      WHERE task_id = ? AND platform = ?
    `).run(JSON.stringify(metrics), taskId, platform);
  }
}

export function getDistributionLogs(taskId?: string) {
  const db = getDb('distributor');
  if (taskId) {
    return db.prepare('SELECT * FROM distribution_logs WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
  }
  return db.prepare('SELECT * FROM distribution_logs ORDER BY published_at DESC LIMIT 100').all();
}

export function getEntityDistributionStats(entityId: string) {
  const db = getDb('distributor');
  return db.prepare(`
    SELECT platform, COUNT(*) as posts, SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
    FROM distribution_logs
    WHERE task_id IN (
      SELECT id FROM tasks WHERE entity_id = ?
    )
    GROUP BY platform
  `).all(entityId);
}

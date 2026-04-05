import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function POST(request: Request) {
  try {
    const { entityId, outputIds, platform } = await request.json() as {
      entityId: string;
      outputIds?: string[];
      platform?: string;
    };

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 });
    }

    const leadDb = getLeadDb();
    const pipeline = leadDb.prepare(
      'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found for entity' }, { status: 404 });
    }

    const journalistDb = getDb('journalist');
    const mediaDb = getDb('media-producer');

    // Mark specified outputs or all approved outputs as published
    if (outputIds && outputIds.length > 0) {
      for (const id of outputIds) {
        for (const db of [journalistDb, mediaDb]) {
          db.prepare(`UPDATE outputs SET status = 'published' WHERE id = ?`).run(id);
        }
      }
    } else {
      for (const db of [journalistDb, mediaDb]) {
        db.prepare(
          `UPDATE outputs SET status = 'published' WHERE entity_id = ? AND status = 'approved'`
        ).run(entityId);
      }
    }

    // Update pipeline stage
    leadDb.prepare(
      `UPDATE pipeline_state SET current_stage = 'distributor', updated_at = CURRENT_TIMESTAMP WHERE entity_id = ?`
    ).run(entityId);

    console.log(`[Content] Published content for entity ${entityId}${platform ? ` on ${platform}` : ''}`);
    return NextResponse.json({ success: true, entityId, taskId: pipeline.task_id });
  } catch (err) {
    console.error('Publish error:', err);
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 });
  }
}

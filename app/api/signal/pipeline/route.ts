import { NextResponse } from 'next/server';
import { getLeadDb, getDb } from '@signal/lib/db';
import { runSignalScout } from '@signal/agents/signal-scout';
import type { Industry } from '@signal/lib/types';

export async function POST(request: Request) {
  try {
    const { taskId, action } = await request.json() as { taskId: string; action: 'stop' | 'restart' };

    if (!taskId || !action) {
      return NextResponse.json({ error: 'taskId and action are required' }, { status: 400 });
    }

    const db = getLeadDb();
    const pipeline = db.prepare('SELECT * FROM pipeline_state WHERE task_id = ?').get(taskId) as {
      task_id: string;
      entity_id: string;
      entity_name: string;
      current_stage: string;
    } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    if (action === 'stop') {
      db.prepare(`
        UPDATE pipeline_state SET current_stage = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
      `).run(taskId);

      // Mark entity rejected in signal-scout
      if (pipeline.entity_id && pipeline.entity_id !== 'pending') {
        const scoutDb = getDb('signal-scout');
        scoutDb.prepare(`
          UPDATE entities SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(pipeline.entity_id);
      }

      return NextResponse.json({ success: true, action: 'stop', taskId });
    }

    if (action === 'restart') {
      // Get entity details for re-run
      const scoutDb = getDb('signal-scout');
      const entity = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(pipeline.entity_id) as {
        name: string; company: string; industry: Industry;
      } | undefined;

      // Reset pipeline state
      db.prepare(`
        UPDATE pipeline_state SET
          current_stage = 'signal-scout',
          gate_status = '{}',
          validation_scores = '{}',
          content_ids = '[]',
          distribution_urls = '{}',
          monetization_flag = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE task_id = ?
      `).run(taskId);

      if (entity) {
        scoutDb.prepare(`
          UPDATE entities SET status = 'pending', score = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(pipeline.entity_id);
      }

      // Re-run signal scout asynchronously (don't await — let it run in background)
      const intake = {
        name: entity?.name ?? pipeline.entity_name,
        company: entity?.company,
        industry: entity?.industry ?? 'other',
      };

      runSignalScout(intake as Parameters<typeof runSignalScout>[0], taskId).catch(err => {
        console.error(`[pipeline/restart] signal-scout failed for ${taskId}:`, err);
      });

      return NextResponse.json({ success: true, action: 'restart', taskId });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Pipeline action error:', err);
    return NextResponse.json({ error: 'Failed to execute pipeline action' }, { status: 500 });
  }
}

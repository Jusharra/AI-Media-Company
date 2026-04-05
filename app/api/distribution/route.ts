import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET() {
  try {
    const distributorDb = getDb('distributor');
    const leadDb = getLeadDb();

    const logs = distributorDb.prepare(
      'SELECT * FROM distribution_logs ORDER BY created_at DESC LIMIT 100'
    ).all() as Array<{
      id: string; task_id: string; content_id: string; platform: string;
      post_url: string | null; status: string; performance_metrics: string | null;
      published_at: string | null; created_at: string;
    }>;

    const pipelines = leadDb.prepare(
      'SELECT task_id, entity_id, entity_name FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; entity_name: string }>;

    const nameByTask: Record<string, string> = {};
    const entityByTask: Record<string, string> = {};
    for (const p of pipelines) {
      nameByTask[p.task_id] = p.entity_name;
      entityByTask[p.task_id] = p.entity_id;
    }

    return NextResponse.json(
      logs.map(l => ({
        ...l,
        entity_name: nameByTask[l.task_id] ?? null,
        entity_id: entityByTask[l.task_id] ?? null,
        performance_metrics: l.performance_metrics
          ? (() => { try { return JSON.parse(l.performance_metrics!); } catch { return l.performance_metrics; } })()
          : null,
      }))
    );
  } catch (err) {
    console.error('Distribution list error:', err);
    return NextResponse.json({ error: 'Failed to fetch distribution logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { taskId, contentId, platform, postUrl } = await request.json() as {
      taskId: string;
      contentId: string;
      platform: string;
      postUrl?: string;
    };

    if (!taskId || !contentId || !platform) {
      return NextResponse.json({ error: 'taskId, contentId, and platform are required' }, { status: 400 });
    }

    const validPlatforms = ['website', 'linkedin', 'twitter', 'youtube', 'instagram'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: `platform must be one of: ${validPlatforms.join(', ')}` }, { status: 400 });
    }

    const { v4: uuidv4 } = await import('uuid');
    const distributorDb = getDb('distributor');

    const id = uuidv4();
    distributorDb.prepare(`
      INSERT INTO distribution_logs (id, task_id, content_id, platform, post_url, status, published_at)
      VALUES (?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
    `).run(id, taskId, contentId, platform, postUrl ?? null);

    // Update pipeline distribution_urls
    const leadDb = getLeadDb();
    const pipeline = leadDb.prepare(
      'SELECT distribution_urls FROM pipeline_state WHERE task_id = ?'
    ).get(taskId) as { distribution_urls: string } | undefined;

    if (pipeline) {
      let urls: Record<string, string> = {};
      try { urls = JSON.parse(pipeline.distribution_urls); } catch { /* ignore */ }
      if (postUrl) urls[platform] = postUrl;
      leadDb.prepare(
        'UPDATE pipeline_state SET distribution_urls = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?'
      ).run(JSON.stringify(urls), taskId);
    }

    return NextResponse.json({ success: true, id, taskId, platform }, { status: 201 });
  } catch (err) {
    console.error('Distribution POST error:', err);
    return NextResponse.json({ error: 'Failed to log distribution' }, { status: 500 });
  }
}

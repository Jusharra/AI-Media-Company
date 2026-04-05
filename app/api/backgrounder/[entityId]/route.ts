import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';
import { runBackgrounder } from '@signal/agents/backgrounder';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const bgDb = getDb('backgrounder');
    const leadDb = getLeadDb();

    const pipeline = leadDb.prepare(
      'SELECT task_id, entity_name, current_stage FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string; entity_name: string; current_stage: string } | undefined;

    const output = bgDb.prepare(
      `SELECT * FROM outputs WHERE entity_id = ? AND doc_type = 'backgrounder' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { id: string; content: string; validation_score: number | null; confidence_tier: string | null; status: string; created_at: string } | undefined;

    if (!output) {
      return NextResponse.json({ error: 'No backgrounder found' }, { status: 404 });
    }

    return NextResponse.json({
      entityId,
      entityName: pipeline?.entity_name ?? null,
      taskId: pipeline?.task_id ?? null,
      currentStage: pipeline?.current_stage ?? null,
      backgrounder: {
        ...output,
        content: (() => { try { return JSON.parse(output.content); } catch { return output.content; } })(),
      },
    });
  } catch (err) {
    console.error('Backgrounder GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch backgrounder' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { taskId, transcriptId, keyQuotes, insightTags } = await request.json() as {
      taskId: string;
      transcriptId: string;
      keyQuotes?: string[];
      insightTags?: string[];
    };

    if (!taskId || !transcriptId) {
      return NextResponse.json({ error: 'taskId and transcriptId are required' }, { status: 400 });
    }

    await runBackgrounder(entityId, taskId, transcriptId, keyQuotes ?? [], insightTags ?? []);
    return NextResponse.json({ success: true, entityId, taskId }, { status: 201 });
  } catch (err) {
    console.error('Backgrounder POST error:', err);
    return NextResponse.json({ error: 'Failed to run backgrounder' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { outputId, status, notes } = await request.json() as { outputId: string; status?: string; notes?: string };

    if (!outputId) {
      return NextResponse.json({ error: 'outputId is required' }, { status: 400 });
    }

    const bgDb = getDb('backgrounder');
    const output = bgDb.prepare('SELECT id FROM outputs WHERE id = ? AND entity_id = ?').get(outputId, entityId);
    if (!output) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    if (status) {
      bgDb.prepare('UPDATE outputs SET status = ? WHERE id = ?').run(status, outputId);
    }

    console.log(`[Backgrounder] Patched output ${outputId}${notes ? `: ${notes}` : ''}`);
    return NextResponse.json({ success: true, outputId });
  } catch (err) {
    console.error('Backgrounder PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update backgrounder' }, { status: 500 });
  }
}

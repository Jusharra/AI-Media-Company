import { NextResponse } from 'next/server';
import { getLeadDb, getDb } from '@signal/lib/db';
import { runInterviewModeA, runInterviewModeB } from '@signal/agents/interview-engine';
import { runBackgrounder } from '@signal/agents/backgrounder';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    const db = getLeadDb();
    const pipeline = db.prepare('SELECT * FROM pipeline_state WHERE task_id = ?').get(taskId) as {
      entity_id: string; entity_name: string;
    } | undefined;

    if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

    const interviewDb = getDb('interview-engine');
    const output = interviewDb.prepare(
      'SELECT * FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(pipeline.entity_id) as { id: string; content: string; doc_type: string; created_at: string } | undefined;

    return NextResponse.json({
      entityId: pipeline.entity_id,
      entityName: pipeline.entity_name,
      output: output ? { ...output, content: JSON.parse(output.content) } : null,
    });
  } catch (err) {
    console.error('Interview GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch interview data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { taskId, mode, transcript } = await request.json() as {
      taskId: string;
      mode: 'A' | 'B';
      transcript?: string;
    };

    if (!taskId || !mode) {
      return NextResponse.json({ error: 'taskId and mode are required' }, { status: 400 });
    }

    const db = getLeadDb();
    const pipeline = db.prepare('SELECT * FROM pipeline_state WHERE task_id = ?').get(taskId) as {
      entity_id: string; entity_name: string;
    } | undefined;

    if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

    const scoutDb = getDb('signal-scout');
    const entity = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(pipeline.entity_id) as
      Record<string, unknown> | undefined;

    if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

    if (mode === 'A') {
      // Generate AI interview questions — pipeline stays at interview-engine
      const { transcriptId } = await runInterviewModeA(pipeline.entity_id, taskId, entity);

      // Fetch the generated questions to return to the UI
      const interviewDb = getDb('interview-engine');
      const output = interviewDb.prepare('SELECT content FROM outputs WHERE id = ?').get(transcriptId) as
        { content: string } | undefined;

      return NextResponse.json({
        success: true,
        mode: 'A',
        transcriptId,
        questions: output ? JSON.parse(output.content) : null,
      });
    }

    if (mode === 'B') {
      if (!transcript || transcript.trim().length < 50) {
        return NextResponse.json({ error: 'Transcript must be at least 50 characters' }, { status: 400 });
      }

      // Parse the transcript
      const { transcriptId, keyQuotes, insightTags } = await runInterviewModeB(
        pipeline.entity_id,
        taskId,
        transcript,
        pipeline.entity_name
      );

      // Immediately run backgrounder — it will send gate_pending to lead (Gate 2)
      db.prepare(`
        UPDATE pipeline_state SET current_stage = 'backgrounder', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
      `).run(taskId);

      await runBackgrounder(pipeline.entity_id, taskId, transcriptId, keyQuotes, insightTags);

      // Backgrounder sends gate_pending(2) to lead — pipeline now awaiting Gate 2
      db.prepare(`
        UPDATE pipeline_state SET current_stage = 'backgrounder', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
      `).run(taskId);

      return NextResponse.json({ success: true, mode: 'B', taskId });
    }

    return NextResponse.json({ error: 'mode must be A or B' }, { status: 400 });
  } catch (err) {
    console.error('Interview POST error:', err);
    const msg = String(err);
    // Surface Anthropic billing errors directly so the client can display them helpfully
    if (msg.includes('credit balance') || msg.includes('invalid_request_error')) {
      try {
        const json = msg.match(/\{[\s\S]*\}/)?.[0];
        const parsed = json ? JSON.parse(json) : null;
        const detail = parsed?.error?.message ?? 'Anthropic API credits exhausted';
        return NextResponse.json({ error: detail }, { status: 402 });
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: msg.replace(/^Error:\s*/i, '') }, { status: 500 });
  }
}

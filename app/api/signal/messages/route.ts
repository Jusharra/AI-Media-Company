import { NextResponse } from 'next/server';
import { getTaskMessageTrace } from '@signal/lib/message-tool';
import { getLeadDb } from '@signal/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const messages = getTaskMessageTrace(taskId);
      return NextResponse.json(messages);
    }

    // Return recent messages across all tasks
    const db = getLeadDb();
    const recent = db.prepare(`
      SELECT mo.*, ps.entity_name
      FROM messages_out mo
      LEFT JOIN pipeline_state ps ON JSON_EXTRACT(mo.payload, '$.taskId') = ps.task_id
      ORDER BY mo.created_at DESC
      LIMIT 50
    `).all();

    return NextResponse.json(recent);
  } catch (err) {
    console.error('Messages error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

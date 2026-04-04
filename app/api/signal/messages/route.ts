import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

const AGENTS = [
  'signal-scout', 'interview-engine', 'backgrounder',
  'journalist', 'media-producer', 'validator', 'distributor', 'lead',
];

interface MsgRow {
  id: string;
  from_agent: string;
  to_agent: string;
  message_type: string;
  payload: string;
  created_at: string;
}

function collectOutbox(filter: { entityId?: string; taskId?: string }): MsgRow[] {
  const all: MsgRow[] = [];
  const seen = new Set<string>();

  for (const agent of AGENTS) {
    try {
      const db = getDb(agent);
      let rows: MsgRow[];

      if (filter.entityId) {
        // Search by entity_id in payload (works for existing messages)
        rows = db.prepare(`
          SELECT id, ? AS from_agent, to_agent, message_type, payload, created_at
          FROM messages_out
          WHERE JSON_EXTRACT(payload, '$.entity_id') = ?
             OR JSON_EXTRACT(payload, '$.taskId') = ?
          ORDER BY created_at ASC
        `).all(agent, filter.entityId, filter.taskId ?? '') as MsgRow[];
      } else {
        rows = db.prepare(`
          SELECT id, ? AS from_agent, to_agent, message_type, payload, created_at
          FROM messages_out
          ORDER BY created_at DESC
          LIMIT 20
        `).all(agent) as MsgRow[];
      }

      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          all.push(row);
        }
      }
    } catch {
      // agent DB may not exist yet
    }
  }

  return all;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const leadDb = getLeadDb();
      const row = leadDb.prepare('SELECT entity_id FROM pipeline_state WHERE task_id = ?').get(taskId) as { entity_id: string } | undefined;
      const entityId = row?.entity_id;

      if (!entityId) {
        return NextResponse.json([]);
      }

      const messages = collectOutbox({ entityId, taskId });
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return NextResponse.json(messages);
    }

    // All-tasks view: recent messages across all agents
    const messages = collectOutbox({});
    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json(messages.slice(0, 50));
  } catch (err) {
    console.error('Messages error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

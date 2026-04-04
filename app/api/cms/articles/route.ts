import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status') || 'draft';

    const db = getDb('journalist');
    let query = 'SELECT * FROM outputs WHERE 1=1';
    const params: string[] = [];

    if (entityId) {
      query += ' AND entity_id = ?';
      params.push(entityId);
    }
    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';
    const articles = db.prepare(query).all(...params);

    return NextResponse.json(articles);
  } catch (err) {
    console.error('Articles error:', err);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const db = getDb('journalist');
    db.prepare('UPDATE outputs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Article update error:', err);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

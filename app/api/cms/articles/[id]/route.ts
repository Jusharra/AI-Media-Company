import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb('journalist');

    const article = db.prepare('SELECT * FROM outputs WHERE id = ?').get(id) as {
      id: string; task_id: string; entity_id: string; doc_type: string;
      content: string; validation_score: number | null; confidence_tier: string | null;
      version: number; status: string; created_at: string;
    } | undefined;

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...article,
      content: (() => { try { return JSON.parse(article.content); } catch { return article.content; } })(),
    });
  } catch (err) {
    console.error('Article GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, content } = await request.json() as { status?: string; content?: unknown };
    const db = getDb('journalist');

    const article = db.prepare('SELECT id FROM outputs WHERE id = ?').get(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (status) {
      db.prepare('UPDATE outputs SET status = ? WHERE id = ?').run(status, id);
    }

    if (content !== undefined) {
      db.prepare('UPDATE outputs SET content = ? WHERE id = ?').run(
        typeof content === 'string' ? content : JSON.stringify(content),
        id
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Article PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb('journalist');

    const article = db.prepare('SELECT id FROM outputs WHERE id = ?').get(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM outputs WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Article DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}

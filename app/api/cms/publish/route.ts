import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

// Internal CMS publish endpoint — receives content from distributor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityId, taskId, contentType, content, title, author } = body;

    if (!entityId || !content || !contentType) {
      return NextResponse.json({ error: 'entityId, content, and contentType are required' }, { status: 400 });
    }

    // In a real deployment this would write to a headless CMS (Sanity, Contentful, etc.)
    // For now we store in a local cms_posts table within the journalist db
    const db = getDb('journalist');

    // Ensure cms_posts table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS cms_posts (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        task_id TEXT,
        content_type TEXT NOT NULL,
        title TEXT,
        author TEXT,
        content TEXT NOT NULL,
        published_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { v4: uuidv4 } = await import('uuid');
    const postId = uuidv4();

    db.prepare(`
      INSERT INTO cms_posts (id, entity_id, task_id, content_type, title, author, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(postId, entityId, taskId || null, contentType, title || null, author || 'SIGNAL Editorial', content);

    return NextResponse.json({ success: true, postId, url: `/founders/${entityId}` });
  } catch (err) {
    console.error('CMS publish error:', err);
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 });
  }
}

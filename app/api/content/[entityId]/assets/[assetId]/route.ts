import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string; assetId: string }> }
) {
  try {
    const { entityId, assetId } = await params;
    const mediaDb = getDb('media-producer');

    const asset = mediaDb.prepare(
      'SELECT * FROM outputs WHERE id = ? AND entity_id = ?'
    ).get(assetId, entityId) as {
      id: string; doc_type: string; content: string;
      validation_score: number | null; status: string; created_at: string;
    } | undefined;

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...asset,
      content: (() => { try { return JSON.parse(asset.content); } catch { return asset.content; } })(),
    });
  } catch (err) {
    console.error('Asset GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ entityId: string; assetId: string }> }
) {
  try {
    const { entityId, assetId } = await params;
    const mediaDb = getDb('media-producer');

    const asset = mediaDb.prepare('SELECT id FROM outputs WHERE id = ? AND entity_id = ?').get(assetId, entityId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    mediaDb.prepare('DELETE FROM outputs WHERE id = ?').run(assetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Asset DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}

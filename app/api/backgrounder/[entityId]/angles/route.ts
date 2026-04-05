import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const bgDb = getDb('backgrounder');

    const output = bgDb.prepare(
      `SELECT content FROM outputs WHERE entity_id = ? AND doc_type = 'backgrounder' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { content: string } | undefined;

    if (!output) {
      return NextResponse.json({ error: 'No backgrounder found' }, { status: 404 });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output.content);
    } catch {
      return NextResponse.json({ error: 'Backgrounder content is not parseable' }, { status: 500 });
    }

    const angles =
      parsed.editorial_angles ??
      parsed.story_angles ??
      parsed.angles ??
      (parsed.stories ? (parsed.stories as unknown[]).slice(0, 5) : null);

    return NextResponse.json({
      entityId,
      angles: angles ?? [],
      industryTag: parsed.industry_tag ?? null,
      insightTags: parsed.insight_tags ?? [],
      keyQuotes: parsed.key_quotes ?? [],
    });
  } catch (err) {
    console.error('Backgrounder angles error:', err);
    return NextResponse.json({ error: 'Failed to fetch angles' }, { status: 500 });
  }
}

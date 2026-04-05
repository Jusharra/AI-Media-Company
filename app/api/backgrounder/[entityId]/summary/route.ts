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
      `SELECT content, validation_score, confidence_tier, created_at FROM outputs WHERE entity_id = ? AND doc_type = 'backgrounder' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { content: string; validation_score: number | null; confidence_tier: string | null; created_at: string } | undefined;

    if (!output) {
      return NextResponse.json({ error: 'No backgrounder found' }, { status: 404 });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output.content);
    } catch {
      return NextResponse.json({ error: 'Backgrounder content is not parseable' }, { status: 500 });
    }

    return NextResponse.json({
      summary: parsed.summary ?? parsed.executive_summary ?? null,
      hook: parsed.hook ?? null,
      keyFacts: parsed.key_facts ?? parsed.keyFacts ?? null,
      validationScore: output.validation_score,
      confidenceTier: output.confidence_tier,
      created_at: output.created_at,
    });
  } catch (err) {
    console.error('Backgrounder summary error:', err);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}

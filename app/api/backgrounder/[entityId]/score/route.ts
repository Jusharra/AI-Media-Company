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
      `SELECT validation_score, confidence_tier, created_at FROM outputs WHERE entity_id = ? AND doc_type = 'backgrounder' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { validation_score: number | null; confidence_tier: string | null; created_at: string } | undefined;

    if (!output) {
      return NextResponse.json({ error: 'No backgrounder found' }, { status: 404 });
    }

    // Also fetch validation messages from validator agent
    const validatorDb = getDb('validator');
    const validationOutput = validatorDb.prepare(
      `SELECT content FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { content: string } | undefined;

    let validationDetails: unknown = null;
    if (validationOutput) {
      try { validationDetails = JSON.parse(validationOutput.content); } catch { /* ignore */ }
    }

    return NextResponse.json({
      entityId,
      validationScore: output.validation_score,
      confidenceTier: output.confidence_tier,
      validationDetails,
      scoredAt: output.created_at,
    });
  } catch (err) {
    console.error('Backgrounder score error:', err);
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 });
  }
}

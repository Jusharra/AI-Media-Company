import { NextResponse } from 'next/server';
import { getPipelineStatus, getActivePipelines, getAllPipelines } from '@signal/agents/lead';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'active') {
      return NextResponse.json(getActivePipelines());
    }

    if (view === 'all') {
      return NextResponse.json(getAllPipelines());
    }

    if (view === 'distribution') {
      // Distribution logs come from the distributor agent when it's running.
      // Return empty array until the pipeline produces distributions.
      return NextResponse.json([]);
    }

    if (view === 'deals') {
      // Deal queue is populated by the lead agent after Gate 4 approval.
      // Return empty array until pipelines complete.
      return NextResponse.json([]);
    }

    return NextResponse.json(getPipelineStatus());
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

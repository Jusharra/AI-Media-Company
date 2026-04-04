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

    return NextResponse.json(getPipelineStatus());
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

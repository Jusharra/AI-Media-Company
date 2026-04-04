import { NextResponse } from 'next/server';
import { processGateDecision } from '@signal/agents/lead';
import type { GateNumber, GateDecision } from '@signal/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, gate, decision, notes } = body as {
      taskId: string;
      gate: GateNumber;
      decision: GateDecision;
      notes?: string;
    };

    if (!taskId || !gate || !decision) {
      return NextResponse.json({ error: 'taskId, gate, and decision are required' }, { status: 400 });
    }

    if (![1, 2, 3, 4].includes(gate)) {
      return NextResponse.json({ error: 'gate must be 1, 2, 3, or 4' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'revision'].includes(decision)) {
      return NextResponse.json({ error: 'decision must be approved, rejected, or revision' }, { status: 400 });
    }

    await processGateDecision(taskId, gate, decision, notes);
    return NextResponse.json({ success: true, taskId, gate, decision });
  } catch (err) {
    console.error('Gate decision error:', err);
    return NextResponse.json({ error: 'Failed to process gate decision' }, { status: 500 });
  }
}

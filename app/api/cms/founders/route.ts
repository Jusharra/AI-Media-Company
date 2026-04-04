import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');

    const db = getDb('signal-scout');
    let query = 'SELECT * FROM entities WHERE 1=1';
    const params: string[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }

    query += ' ORDER BY score DESC, created_at DESC LIMIT 100';
    const founders = db.prepare(query).all(...params);

    return NextResponse.json(founders);
  } catch (err) {
    console.error('Founders error:', err);
    return NextResponse.json({ error: 'Failed to fetch founders' }, { status: 500 });
  }
}

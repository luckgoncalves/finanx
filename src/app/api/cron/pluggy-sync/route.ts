import { NextResponse } from 'next/server';
import { isPluggyConfigured } from '@/lib/pluggy';
import { syncAll } from '@/lib/pluggy-sync';

export const maxDuration = 60;

// Sincroniza todas as conexões Open Finance. Protegido pelo mesmo CRON_SECRET do daily-due.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : new URL(request.url).searchParams.get('secret');
  if (!secret || token !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isPluggyConfigured()) return NextResponse.json({ ok: true, skipped: 'pluggy not configured' });

  try {
    const results = await syncAll();
    const failed = results.filter((r) => r.error).length;
    return NextResponse.json({ ok: failed === 0, connections: results.length, failed, results }, { status: failed ? 207 : 200 });
  } catch (error) {
    console.error('Cron pluggy-sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

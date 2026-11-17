import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isPluggyConfigured } from '@/lib/pluggy';
import { syncUser } from '@/lib/pluggy-sync';

export const maxDuration = 60;

// POST → sincroniza agora os bancos do usuário logado
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!isPluggyConfigured()) return NextResponse.json({ error: 'Pluggy não configurada no servidor' }, { status: 503 });
  try {
    const results = await syncUser(session.userId);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[bank-connections/sync] error:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar' }, { status: 500 });
  }
}

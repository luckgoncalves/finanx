import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getItem, isPluggyConfigured } from '@/lib/pluggy';

function format(c: { id: string; itemId: string; bankName: string | null; status: string | null; lastSyncAt: Date | null; lastError: string | null }) {
  return {
    id: c.id,
    itemId: c.itemId,
    bankName: c.bankName,
    status: c.status,
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
    lastError: c.lastError,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const conns = await prisma.bankConnection.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ configured: isPluggyConfigured(), connections: conns.map(format) });
}

// POST { itemId } → vincula um item do Meu Pluggy à conta do usuário
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!isPluggyConfigured()) return NextResponse.json({ error: 'Pluggy não configurada no servidor' }, { status: 503 });

  const { itemId } = (await request.json().catch(() => ({}))) as { itemId?: string };
  const id = itemId?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Informe um Item ID válido da Pluggy' }, { status: 400 });
  }

  const existing = await prisma.bankConnection.findUnique({ where: { itemId: id } });
  if (existing) {
    return NextResponse.json({ error: existing.userId === session.userId ? 'Banco já conectado' : 'Item já vinculado a outra conta' }, { status: 409 });
  }

  try {
    const item = await getItem(id);
    const conn = await prisma.bankConnection.create({
      data: { userId: session.userId, itemId: id, bankName: item.connector?.name ?? null, status: item.status },
    });
    return NextResponse.json({ connection: format(conn) }, { status: 201 });
  } catch (error) {
    console.error('[bank-connections] create error:', error);
    return NextResponse.json({ error: 'Não foi possível validar esse item na Pluggy' }, { status: 422 });
  }
}

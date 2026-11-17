import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Remove só o vínculo no app; faturas já importadas continuam.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const conn = await prisma.bankConnection.findFirst({ where: { id, userId: session.userId } });
  if (!conn) return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
  await prisma.bankConnection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

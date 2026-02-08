import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Remove todas as inscrições de push do usuário logado.
 * Use para "zerar" e inscrever de novo com a chave atual (evita 403 por inscrição antiga).
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await prisma.pushSubscription.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Push clear all error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover inscrições' },
      { status: 500 }
    );
  }
}

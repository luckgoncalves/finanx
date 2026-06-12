import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/transactions/bulk-paid
// Marca todas as transações de um cartão no mês/ano como pagas ou pendentes
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { creditCardId, month, year, paid } = await request.json();

    if (!creditCardId || !month || !year || typeof paid !== 'boolean') {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const result = await prisma.transaction.updateMany({
      where: {
        userId: session.userId,
        creditCardId,
        month,
        year,
      },
      data: {
        paid,
        paidAt: paid ? new Date() : null,
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('[bulk-paid] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar transações' }, { status: 500 });
  }
}

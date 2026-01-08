import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT - Update transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        month: data.month,
        year: data.year,
      },
    });

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date.toISOString().split('T')[0],
        month: transaction.month,
        year: transaction.year,
        createdAt: transaction.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir transação' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper to format transaction for response
function formatTransaction(t: {
  id: string;
  description: string;
  amount: { toString(): string } | number;
  type: string;
  category: string;
  date: Date;
  month: number;
  year: number;
  paid: boolean;
  paidAt: Date | null;
  isInstallment: boolean;
  installmentNumber: number | null;
  totalInstallments: number | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
  createdAt: Date;
}) {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
    date: t.date.toISOString().split('T')[0],
    month: t.month,
    year: t.year,
    paid: t.paid,
    paidAt: t.paidAt?.toISOString() || null,
    isInstallment: t.isInstallment,
    installmentNumber: t.installmentNumber,
    totalInstallments: t.totalInstallments,
    isRecurring: t.isRecurring,
    recurringGroupId: t.recurringGroupId,
    createdAt: t.createdAt.toISOString(),
  };
}

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
        paid: data.paid ?? existing.paid,
        paidAt: data.paid ? (existing.paidAt || new Date()) : null,
      },
    });

    return NextResponse.json({
      transaction: formatTransaction(transaction),
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle paid status
export async function PATCH(
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
    const { paid } = await request.json();

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
        paid,
        paidAt: paid ? new Date() : null,
      },
    });

    return NextResponse.json({
      transaction: formatTransaction(transaction),
    });
  } catch (error) {
    console.error('Toggle paid error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
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

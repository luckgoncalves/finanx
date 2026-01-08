import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List transactions
export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where: { userId: string; year?: number; month?: number } = { userId: session.userId };
    
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Convert Decimal to number for JSON
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      date: t.date.toISOString().split('T')[0],
      month: t.month,
      year: t.year,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}

// POST - Create transaction
export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
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
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}


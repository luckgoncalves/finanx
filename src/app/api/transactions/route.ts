import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveOwnerId } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
    const viewAs = searchParams.get('viewAs');

    const effective = await getEffectiveOwnerId(session, viewAs);
    if (!effective) {
      if (viewAs) {
        return NextResponse.json(
          { error: 'Você não tem permissão para visualizar esta conta' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const where: { userId: string; year?: number; month?: number } = { userId: effective.userId };
    
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const formattedTransactions = transactions.map(formatTransaction);

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}

// POST - Create transaction (supports installments and recurring)
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
    const { 
      description, 
      amount, 
      type, 
      category, 
      date, 
      month, 
      year,
      isInstallment,
      totalInstallments,
      isRecurring,
      recurringMonths,
    } = data;

    const transactions = [];
    const recurringGroupId = (isInstallment || isRecurring) ? uuidv4() : null;

    if (isInstallment && totalInstallments > 1) {
      // Create multiple transactions for installments
      const currentDate = new Date(date);
      
      for (let i = 1; i <= totalInstallments; i++) {
        const installmentMonth = currentDate.getMonth() + 1;
        const installmentYear = currentDate.getFullYear();
        
        const transaction = await prisma.transaction.create({
          data: {
            userId: session.userId,
            description: `${description} (${i}/${totalInstallments})`,
            amount,
            type,
            category,
            date: new Date(currentDate),
            month: installmentMonth,
            year: installmentYear,
            paid: false,
            isInstallment: true,
            installmentNumber: i,
            totalInstallments,
            isRecurring: false,
            recurringGroupId,
          },
        });
        
        transactions.push(formatTransaction(transaction));
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (isRecurring && recurringMonths > 1) {
      // Create multiple transactions for recurring
      const currentDate = new Date(date);
      
      for (let i = 0; i < recurringMonths; i++) {
        const recurringMonth = currentDate.getMonth() + 1;
        const recurringYear = currentDate.getFullYear();
        
        const transaction = await prisma.transaction.create({
          data: {
            userId: session.userId,
            description,
            amount,
            type,
            category,
            date: new Date(currentDate),
            month: recurringMonth,
            year: recurringYear,
            paid: false,
            isInstallment: false,
            isRecurring: true,
            recurringGroupId,
          },
        });
        
        transactions.push(formatTransaction(transaction));
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else {
      // Single transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: session.userId,
          description,
          amount,
          type,
          category,
          date: new Date(date),
          month,
          year,
          paid: false,
          isInstallment: false,
          isRecurring: false,
        },
      });
      
      transactions.push(formatTransaction(transaction));
    }

    return NextResponse.json({
      transactions,
      transaction: transactions[0], // For backwards compatibility
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function formatCard(c: {
  id: string;
  name: string;
  lastDigits: string | null;
  brand: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    lastDigits: c.lastDigits,
    brand: c.brand,
    color: c.color,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const cards = await prisma.creditCard.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ creditCards: cards.map(formatCard) });
  } catch (error) {
    console.error('Get credit cards error:', error);
    return NextResponse.json({ error: 'Erro ao buscar cartões' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { name, lastDigits, brand, color } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome do cartão é obrigatório' }, { status: 400 });
    }

    const card = await prisma.creditCard.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        lastDigits: lastDigits?.trim() || null,
        brand: brand?.trim() || null,
        color: color || '#6366f1',
      },
    });

    return NextResponse.json({ creditCard: formatCard(card) }, { status: 201 });
  } catch (error) {
    console.error('Create credit card error:', error);
    return NextResponse.json({ error: 'Erro ao criar cartão' }, { status: 500 });
  }
}

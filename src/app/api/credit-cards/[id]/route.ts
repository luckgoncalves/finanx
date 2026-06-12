import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: session.userId },
    });

    if (!card) return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });

    await prisma.creditCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete credit card error:', error);
    return NextResponse.json({ error: 'Erro ao excluir cartão' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: session.userId },
    });

    if (!card) return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });

    const { name, lastDigits, brand, color } = await request.json();

    const updated = await prisma.creditCard.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(lastDigits !== undefined && { lastDigits: lastDigits?.trim() || null }),
        ...(brand !== undefined && { brand: brand?.trim() || null }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({
      creditCard: {
        id: updated.id,
        name: updated.name,
        lastDigits: updated.lastDigits,
        brand: updated.brand,
        color: updated.color,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update credit card error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cartão' }, { status: 500 });
  }
}

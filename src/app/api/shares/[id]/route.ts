import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// DELETE - Remove share (owner removes viewer, or viewer stops viewing)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const share = await prisma.accountShare.findUnique({
      where: { id },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Compartilhamento não encontrado' },
        { status: 404 }
      );
    }

    const isOwner = share.ownerId === session.userId;
    const isViewer = share.viewerId === session.userId;

    if (!isOwner && !isViewer) {
      return NextResponse.json(
        { error: 'Você não pode remover este compartilhamento' },
        { status: 403 }
      );
    }

    await prisma.accountShare.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover compartilhamento' },
      { status: 500 }
    );
  }
}

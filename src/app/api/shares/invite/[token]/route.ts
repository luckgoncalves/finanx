import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Public info about invite (owner name) for the accept page
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const share = await prisma.accountShare.findUnique({
      where: { token, status: 'PENDING' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou já expirado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      inviteeEmail: share.inviteeEmail,
      owner: share.owner
        ? {
            id: share.owner.id,
            name: share.owner.name,
            email: share.owner.email,
          }
        : null,
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convite' },
      { status: 500 }
    );
  }
}

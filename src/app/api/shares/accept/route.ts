import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST - Accept or reject invite (logged-in user)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Faça login para aceitar o convite' },
        { status: 401 }
      );
    }

    const { token, accept } = await request.json();
    const inviteToken = typeof token === 'string' ? token.trim() : '';
    const shouldAccept = accept === true;

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Token do convite é obrigatório' },
        { status: 400 }
      );
    }

    const share = await prisma.accountShare.findUnique({
      where: { token: inviteToken, status: 'PENDING' },
      include: { owner: { select: { id: true, email: true, name: true } } },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou já foi utilizado' },
        { status: 404 }
      );
    }

    // Optional: only allow invitee email to accept (or any logged-in user for same email)
    const myEmail = (await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    }))?.email?.toLowerCase();
    const inviteeEmail = share.inviteeEmail.toLowerCase();
    if (myEmail !== inviteeEmail) {
      return NextResponse.json(
        {
          error: `Este convite foi enviado para ${share.inviteeEmail}. Faça login com esse email para aceitar.`,
        },
        { status: 403 }
      );
    }

    if (share.ownerId === session.userId) {
      return NextResponse.json(
        { error: 'Você não pode aceitar seu próprio convite' },
        { status: 400 }
      );
    }

    if (shouldAccept) {
      await prisma.accountShare.update({
        where: { id: share.id },
        data: { viewerId: session.userId, status: 'ACCEPTED' },
      });
      return NextResponse.json({
        success: true,
        accepted: true,
        ownerId: share.ownerId,
        owner: share.owner,
      });
    }

    await prisma.accountShare.update({
      where: { id: share.id },
      data: { status: 'REJECTED' },
    });
    return NextResponse.json({
      success: true,
      accepted: false,
    });
  } catch (error) {
    console.error('Accept share error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar convite' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

function token() {
  return crypto.randomBytes(32).toString('hex');
}

// GET - List shares: as owner (my viewers + pending) and as viewer (accounts I can view)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [asOwner, asViewer] = await Promise.all([
      prisma.accountShare.findMany({
        where: { ownerId: session.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          viewer: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.accountShare.findMany({
        where: { viewerId: session.userId, status: 'ACCEPTED' },
        include: {
          owner: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      asOwner: asOwner.map((s) => ({
        id: s.id,
        inviteeEmail: s.inviteeEmail,
        token: s.token,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        viewer: s.viewer
          ? { id: s.viewer.id, email: s.viewer.email, name: s.viewer.name }
          : null,
      })),
      asViewer: asViewer.map((s) => ({
        id: s.id,
        ownerId: s.ownerId,
        owner: s.owner
          ? { id: s.owner.id, email: s.owner.email, name: s.owner.name }
          : null,
      })),
    });
  } catch (error) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar compartilhamentos' },
      { status: 500 }
    );
  }
}

// POST - Create invite (owner invites by email)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { inviteeEmail } = await request.json();
    const email = (inviteeEmail as string)?.trim()?.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: 'Email do convidado é obrigatório' },
        { status: 400 }
      );
    }

    // Cannot invite yourself
    const me = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });
    if (me?.email?.toLowerCase() === email) {
      return NextResponse.json(
        { error: 'Você não pode convidar a si mesmo' },
        { status: 400 }
      );
    }

    // Check existing pending or accepted for this owner + email
    const existing = await prisma.accountShare.findFirst({
      where: {
        ownerId: session.userId,
        inviteeEmail: email,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === 'ACCEPTED'
              ? 'Este usuário já tem acesso à sua conta'
              : 'Já existe um convite pendente para este email',
        },
        { status: 400 }
      );
    }

    const share = await prisma.accountShare.create({
      data: {
        ownerId: session.userId,
        inviteeEmail: email,
        token: token(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      share: {
        id: share.id,
        inviteeEmail: share.inviteeEmail,
        token: share.token,
        status: share.status,
        createdAt: share.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create share error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar convite' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type SubscriptionKeys = { p256dh: string; auth: string };

function parseSubscription(body: unknown): { endpoint: string; keys: SubscriptionKeys } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const endpoint = typeof b.endpoint === 'string' ? b.endpoint : null;
  const keys = b.keys && typeof b.keys === 'object' && b.keys !== null
    ? (b.keys as Record<string, unknown>)
    : null;
  if (!endpoint || !keys) return null;
  const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh : null;
  const auth = typeof keys.auth === 'string' ? keys.auth : null;
  if (!p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth } };
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const subscription = parseSubscription(body.subscription ?? body);
    if (!subscription) {
      return NextResponse.json(
        { error: 'Payload de inscrição inválido' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.userId,
          endpoint: subscription.endpoint,
        },
      },
      create: {
        userId: session.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    const message =
      error && typeof (error as { code?: string }).code === 'string'
        ? (error as { code: string; message?: string }).message || 'Erro ao salvar inscrição.'
        : 'Erro ao ativar notificações. Tente de novo.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.userId,
        endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar notificações' },
      { status: 500 }
    );
  }
}

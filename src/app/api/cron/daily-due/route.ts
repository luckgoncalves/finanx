import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/web-push';

function getTodayUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const querySecret = new URL(request.url).searchParams.get('secret');
    const token = bearer ?? querySecret;

    if (!secret || token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start, end } = getTodayUTC();

    const dueToday = await prisma.transaction.findMany({
      where: {
        type: 'expense',
        paid: false,
        date: { gte: start, lt: end },
      },
      select: { userId: true, description: true, amount: true },
      orderBy: { userId: 'asc' },
    });

    const byUser = dueToday.reduce((acc, t) => {
      if (!acc[t.userId]) acc[t.userId] = [];
      acc[t.userId].push(t);
      return acc;
    }, {} as Record<string, { description: string; amount: { toString(): string } }[]>);

    let sent = 0;
    let failed = 0;

    for (const [userId, transactions] of Object.entries(byUser)) {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId },
      });
      const count = transactions.length;
      const firstTwo = transactions.slice(0, 2).map((t) => t.description);
      const body =
        count === 1
          ? `1 conta vencendo hoje: ${firstTwo[0]}`
          : `${count} contas vencendo hoje${firstTwo.length ? `: ${firstTwo.join(', ')}${count > 2 ? '...' : ''}` : ''}`;
      const payload = {
        title: 'Contas vencendo hoje',
        body,
        tag: 'finanx-daily-due',
        data: { url: '/despesas' },
      };

      for (const sub of subs) {
        const result = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        if (result.success) {
          sent++;
        } else {
          failed++;
          if (result.statusCode === 410 || result.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      usersWithDue: Object.keys(byUser).length,
      totalDue: dueToday.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Cron daily-due error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

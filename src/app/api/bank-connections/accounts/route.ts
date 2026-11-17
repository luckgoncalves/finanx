import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isPluggyConfigured, listAccounts } from '@/lib/pluggy';

export const maxDuration = 30;

// GET → saldos atuais (conta corrente/poupança) e uso dos cartões, direto da Pluggy
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!isPluggyConfigured()) return NextResponse.json({ error: 'Pluggy não configurada no servidor' }, { status: 503 });

  const conns = await prisma.bankConnection.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'asc' } });
  const banks = await Promise.all(
    conns.map(async (c) => {
      try {
        const accounts = await listAccounts(c.itemId);
        return {
          connectionId: c.id,
          accounts: accounts.map((a) => ({
            id: a.id,
            name: a.name.trim(),
            type: a.type,
            subtype: a.subtype,
            number: a.number,
            // BANK: saldo disponível. CREDIT: valor usado (fatura atual + parcelas).
            balance: a.balance,
            creditLimit: a.creditData?.creditLimit ?? null,
            dueDate: a.creditData?.balanceDueDate ?? null,
          })),
        };
      } catch (error) {
        return { connectionId: c.id, accounts: [], error: error instanceof Error ? error.message : 'erro' };
      }
    })
  );
  return NextResponse.json({ banks });
}

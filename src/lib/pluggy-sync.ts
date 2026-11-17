import { prisma } from './prisma';
import { getItem, listAccounts, listBills, listTransactionsSince, PluggyAccount } from './pluggy';
import { addDays, matchDebits, planBills } from './pluggy-match';

const LOOKBACK_DAYS = 75;

export interface SyncResult {
  connectionId: string;
  bankName: string | null;
  billsCreated: number;
  billsLinked: number;
  billsUpdated: number;
  billsMarkedPaid: number;
  expensesMarkedPaid: { id: string; description: string; paidAt: string }[];
  error?: string;
}

function lastDigits(account: PluggyAccount): string | null {
  const digits = (account.number ?? '').replace(/\D/g, '');
  return digits ? digits.slice(-4) : null;
}

/** Acha o cartão do app ligado a esta conta da Pluggy; vincula pelo final do número ou cria um novo. */
async function ensureCard(userId: string, bankName: string, account: PluggyAccount) {
  const linked = await prisma.creditCard.findUnique({ where: { pluggyAccountId: account.id } });
  if (linked) return linked;

  const digits = lastDigits(account);
  if (digits) {
    const byDigits = await prisma.creditCard.findFirst({
      where: { userId, lastDigits: digits, pluggyAccountId: null },
    });
    if (byDigits) {
      return prisma.creditCard.update({ where: { id: byDigits.id }, data: { pluggyAccountId: account.id } });
    }
  }

  return prisma.creditCard.create({
    data: {
      userId,
      name: `${bankName} ${account.name.trim()}`.trim(),
      lastDigits: digits,
      brand: account.creditData?.brand ?? null,
      pluggyAccountId: account.id,
    },
  });
}

function atNoon(ymd: string) {
  return new Date(ymd + 'T12:00:00');
}

export async function syncConnection(connectionId: string, today = new Date().toISOString().slice(0, 10)): Promise<SyncResult> {
  const conn = await prisma.bankConnection.findUniqueOrThrow({ where: { id: connectionId } });
  const result: SyncResult = {
    connectionId,
    bankName: conn.bankName,
    billsCreated: 0,
    billsLinked: 0,
    billsUpdated: 0,
    billsMarkedPaid: 0,
    expensesMarkedPaid: [],
  };

  try {
    const item = await getItem(conn.itemId);
    const bankName = item.connector?.name ?? conn.bankName ?? 'Banco';
    result.bankName = bankName;
    const since = addDays(today, -LOOKBACK_DAYS);
    const accounts = await listAccounts(conn.itemId);

    // 1) Faturas de cartão → despesas com vencimento
    for (const account of accounts.filter((a) => a.type === 'CREDIT')) {
      const card = await ensureCard(conn.userId, bankName, account);
      const [bills, txs] = await Promise.all([listBills(account.id), listTransactionsSince(account.id, since)]);
      const plans = planBills(bills, txs).filter((p) => p.dueDate >= since);

      for (const plan of plans) {
        const externalId = `pluggy-bill:${plan.billId}`;
        const date = atNoon(plan.dueDate);
        const existing = await prisma.transaction.findUnique({ where: { externalId } });
        const keepPaid = existing?.paid ?? false; // nunca desmarca um pagamento já registrado
        const paid = keepPaid || plan.paid;
        const paidAt = existing?.paidAt ?? (plan.paidAt ? atNoon(plan.paidAt) : null);

        if (!existing) {
          if (plan.totalAmount <= 0) continue;

          // Já existe a fatura cadastrada à mão? Vincula em vez de duplicar:
          // mesma categoria cartão, valor ±1% e data até 10 dias do vencimento.
          const tolerance = Math.max(1, plan.totalAmount * 0.01);
          const manual = await prisma.transaction.findFirst({
            where: {
              userId: conn.userId,
              type: 'expense',
              category: 'cartao',
              externalId: null,
              amount: { gte: plan.totalAmount - tolerance, lte: plan.totalAmount + tolerance },
              date: { gte: atNoon(addDays(plan.dueDate, -10)), lte: atNoon(addDays(plan.dueDate, 10)) },
            },
            orderBy: { date: 'asc' },
          });
          if (manual) {
            const becamePaid = !manual.paid && plan.paid;
            await prisma.transaction.update({
              where: { id: manual.id },
              data: {
                externalId,
                ...(becamePaid ? { paid: true, paidAt: plan.paidAt ? atNoon(plan.paidAt) : new Date() } : {}),
              },
            });
            result.billsLinked++;
            if (becamePaid) result.billsMarkedPaid++;
            continue;
          }

          // Faturas antigas sem correspondente não são criadas, para não inflar meses passados.
          if (plan.dueDate < addDays(today, -10)) continue;
          await prisma.transaction.create({
            data: {
              userId: conn.userId,
              description: `Fatura ${card.name}`,
              amount: plan.totalAmount,
              type: 'expense',
              category: 'cartao',
              date,
              month: date.getMonth() + 1,
              year: date.getFullYear(),
              paid,
              paidAt: paid ? paidAt : null,
              importSource: 'pluggy',
              // sem creditCardId: a fatura não entra no "total gasto" do cartão (as compras já entram)
              externalId,
            },
          });
          result.billsCreated++;
          if (paid) result.billsMarkedPaid++;
        } else {
          const amountChanged = Number(existing.amount) !== plan.totalAmount;
          const becamePaid = !existing.paid && paid;
          if (amountChanged || becamePaid) {
            await prisma.transaction.update({
              where: { id: existing.id },
              data: { amount: plan.totalAmount, paid, paidAt: paid ? paidAt : null },
            });
            result.billsUpdated++;
            if (becamePaid) result.billsMarkedPaid++;
          }
        }
      }
    }

    // 2) Despesas cadastradas à mão (financiamento, seguro, contas) → pagas quando o débito aparece
    const bankAccounts = accounts.filter((a) => a.type === 'BANK');
    const bankTxs = (await Promise.all(bankAccounts.map((a) => listTransactionsSince(a.id, since)))).flat();
    const unpaid = await prisma.transaction.findMany({
      where: {
        userId: conn.userId,
        type: 'expense',
        paid: false,
        externalId: null,
        date: { gte: atNoon(addDays(today, -45)), lte: atNoon(addDays(today, 7)) },
      },
      select: { id: true, description: true, amount: true, date: true },
    });
    const matches = matchDebits(
      unpaid.map((e) => ({ id: e.id, description: e.description, amount: Number(e.amount), date: e.date.toISOString().slice(0, 10) })),
      bankTxs.filter((t) => t.date.slice(0, 10) <= today)
    );
    for (const m of matches) {
      await prisma.transaction.update({ where: { id: m.expenseId }, data: { paid: true, paidAt: atNoon(m.paidAt) } });
      const e = unpaid.find((u) => u.id === m.expenseId)!;
      result.expensesMarkedPaid.push({ id: e.id, description: e.description, paidAt: m.paidAt });
    }

    await prisma.bankConnection.update({
      where: { id: conn.id },
      data: { bankName, status: item.status, lastSyncAt: new Date(), lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.error = message;
    await prisma.bankConnection.update({ where: { id: conn.id }, data: { lastError: message.slice(0, 500) } }).catch(() => {});
  }

  return result;
}

export async function syncUser(userId: string) {
  const conns = await prisma.bankConnection.findMany({ where: { userId } });
  const results: SyncResult[] = [];
  for (const c of conns) results.push(await syncConnection(c.id));
  return results;
}

export async function syncAll() {
  const conns = await prisma.bankConnection.findMany({ select: { id: true } });
  const results: SyncResult[] = [];
  for (const c of conns) results.push(await syncConnection(c.id));
  return results;
}

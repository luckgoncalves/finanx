import { prisma } from './prisma';
import { getItem, listAccounts, listBills, listTransactionsSince, PluggyAccount } from './pluggy';
import {
  addDays,
  day,
  forecastMonth,
  isCardPayment,
  manualBillPattern,
  matchDebits,
  monthOf,
  pickMonthOffset,
  planBills,
  shiftMonth,
} from './pluggy-match';
import { suggestCategory } from './parsers/categoryMapper';

const LOOKBACK_DAYS = 75;
const CARD_LOOKBACK_DAYS = 160; // compras de faturas fechadas nos últimos ~75 dias

export interface SyncResult {
  connectionId: string;
  bankName: string | null;
  billsProcessed: number;
  purchasesImported: number;
  billsMarkedPaid: number;
  manualBillsReplaced: string[];
  manualMovedToCard: string[];
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
    billsProcessed: 0,
    purchasesImported: 0,
    billsMarkedPaid: 0,
    manualBillsReplaced: [],
    manualMovedToCard: [],
    expensesMarkedPaid: [],
  };

  try {
    const item = await getItem(conn.itemId);
    const bankName = item.connector?.name ?? conn.bankName ?? 'Banco';
    result.bankName = bankName;
    const since = addDays(today, -LOOKBACK_DAYS);
    const accounts = await listAccounts(conn.itemId);

    // 1) Cartões: compras de cada fatura fechada entram no cartão (agrupadas pelo app como fatura),
    //    com uma linha de ajuste para o total bater com o banco. A fatura lançada à mão é substituída.
    for (const account of accounts.filter((a) => a.type === 'CREDIT')) {
      const card = await ensureCard(conn.userId, bankName, account);
      const [bills, txs] = await Promise.all([
        listBills(account.id),
        listTransactionsSince(account.id, addDays(today, -CARD_LOOKBACK_DAYS), 40),
      ]);
      const plans = planBills(bills, txs).filter((p) => p.dueDate >= since && p.totalAmount > 0);
      const purchases = txs.filter((t) => !isCardPayment(t));
      const offset = pickMonthOffset(bills, purchases);
      const manualPattern = manualBillPattern(bankName);

      for (const plan of plans) {
        const date = atNoon(plan.dueDate);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const billMonth = shiftMonth(monthOf(plan.dueDate), offset);
        const items = purchases.filter((t) => forecastMonth(t) === billMonth);
        const paidAt = plan.paidAt ? atNoon(plan.paidAt) : null;

        const created = await prisma.transaction.createMany({
          skipDuplicates: true,
          data: items.map((t) => {
            const meta = t.creditCardMetadata;
            const total = meta?.totalInstallments ?? null;
            return {
              userId: conn.userId,
              description: t.description.replace(/\s+/g, ' ').trim(),
              amount: Math.round(t.amount * 100) / 100,
              type: 'expense',
              category: suggestCategory(t.description),
              date,
              month,
              year,
              paid: plan.paid,
              paidAt: plan.paid ? paidAt : null,
              isInstallment: Boolean(total && total > 1),
              installmentNumber: total && total > 1 ? meta?.installmentNumber ?? null : null,
              totalInstallments: total && total > 1 ? total : null,
              importSource: 'pluggy',
              creditCardId: card.id,
              purchaseDate: atNoon(day(meta?.purchaseDate || t.date)),
              externalId: `pluggy-tx:${t.id}`,
            };
          }),
        });
        result.purchasesImported += created.count;

        // Ajuste: diferença entre o total da fatura e a soma das compras listadas pela Pluggy
        // Compras lançadas à mão que já fazem parte deste cartão/mês contam na soma.
        const manualInCard = await prisma.transaction.aggregate({
          where: {
            userId: conn.userId,
            creditCardId: card.id,
            month,
            year,
            OR: [{ importSource: null }, { importSource: { not: 'pluggy' } }],
          },
          _sum: { amount: true },
        });
        let sum = items.reduce((s, t) => s + t.amount, 0) + Number(manualInCard._sum.amount ?? 0);
        let diff = Math.round((plan.totalAmount - sum) * 100) / 100;

        // A diferença é uma compra lançada à mão sem cartão (ex.: parcela que a Pluggy não lista)? Move para o cartão.
        if (Math.abs(diff) >= 0.01) {
          const loose = await prisma.transaction.findFirst({
            where: {
              userId: conn.userId,
              type: 'expense',
              category: 'cartao',
              creditCardId: null,
              externalId: null,
              month,
              year,
              amount: { gte: diff - 0.5, lte: diff + 0.5 },
            },
          });
          if (loose) {
            await prisma.transaction.update({
              where: { id: loose.id },
              data: {
                creditCardId: card.id,
                ...(plan.paid && !loose.paid ? { paid: true, paidAt } : {}),
              },
            });
            sum += Number(loose.amount);
            diff = Math.round((plan.totalAmount - sum) * 100) / 100;
            result.manualMovedToCard.push(loose.description);
          }
        }
        const adjId = `pluggy-adj:${plan.billId}`;
        if (Math.abs(diff) >= 0.01) {
          await prisma.transaction.upsert({
            where: { externalId: adjId },
            create: {
              userId: conn.userId,
              description: 'Ajuste da fatura (encargos, parcelas antigas ou itens não listados)',
              amount: diff,
              type: 'expense',
              category: 'cartao',
              date,
              month,
              year,
              paid: plan.paid,
              paidAt: plan.paid ? paidAt : null,
              importSource: 'pluggy',
              creditCardId: card.id,
              externalId: adjId,
            },
            update: { amount: diff },
          });
        } else {
          await prisma.transaction.deleteMany({ where: { externalId: adjId } });
        }

        // Quitada no banco → marca as linhas desta fatura como pagas (nunca desmarca)
        if (plan.paid) {
          const r = await prisma.transaction.updateMany({
            where: { userId: conn.userId, creditCardId: card.id, month, year, paid: false, importSource: 'pluggy' },
            data: { paid: true, paidAt },
          });
          if (r.count > 0) result.billsMarkedPaid++;
        }

        // Substitui a fatura lançada à mão (ou criada pela versão anterior) deste cartão neste mês
        const candidates = await prisma.transaction.findMany({
          where: {
            userId: conn.userId,
            type: 'expense',
            category: 'cartao',
            creditCardId: null,
            month,
            year,
            OR: [{ externalId: null }, { externalId: `pluggy-bill:${plan.billId}` }],
          },
          select: { id: true, description: true, externalId: true },
        });
        const toRemove = candidates.filter(
          (c) => c.externalId === `pluggy-bill:${plan.billId}` || manualPattern.test(c.description)
        );
        if (toRemove.length) {
          await prisma.transaction.deleteMany({ where: { id: { in: toRemove.map((c) => c.id) } } });
          result.manualBillsReplaced.push(...toRemove.map((c) => c.description));
        }
        result.billsProcessed++;
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

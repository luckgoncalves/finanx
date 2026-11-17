// Regras puras (sem banco nem rede) para transformar dados da Pluggy em contas a pagar.
import type { PluggyBill, PluggyTransaction } from './pluggy';

const DAY = 24 * 60 * 60 * 1000;

export const day = (iso: string) => iso.slice(0, 10);

export function addDays(ymd: string, n: number): string {
  return new Date(new Date(ymd + 'T00:00:00Z').getTime() + n * DAY).toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a + 'T00:00:00Z').getTime() - new Date(b + 'T00:00:00Z').getTime()) / DAY);
}

const PAYMENT_RE = /pagamento|pgto|inclus[aã]o de pagamento/i;

/** Pagamento de fatura lançado na conta do cartão (crédito, valor negativo na Pluggy). */
export function isCardPayment(t: PluggyTransaction): boolean {
  return t.type === 'CREDIT' && PAYMENT_RE.test(t.description) && !/estorno/i.test(t.description);
}

export interface BillPlan {
  billId: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  paid: boolean;
  paidAt: string | null;
}

/**
 * Para cada fatura, soma os pagamentos feitos entre 25 dias antes do vencimento
 * e a véspera do vencimento seguinte. Fatura quitada = pagou ≥ 98% do total.
 */
export function planBills(bills: PluggyBill[], cardTxs: PluggyTransaction[]): BillPlan[] {
  const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const payments = cardTxs
    .filter(isCardPayment)
    .map((t) => ({ id: t.id, date: day(t.date), amount: Math.abs(t.amount) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  // Cada pagamento conta só para a fatura de vencimento mais próximo (até 25 dias antes ou 35 depois).
  const owner = new Map<string, number>();
  for (const p of payments) {
    let best = -1;
    let bestDist = Infinity;
    sorted.forEach((b, i) => {
      const delta = diffDays(p.date, day(b.dueDate)); // >0 = pago depois do vencimento
      if (delta < -25 || delta > 35) return;
      const dist = Math.abs(delta);
      if (dist < bestDist || (dist === bestDist && i > best)) {
        best = i;
        bestDist = dist;
      }
    });
    if (best >= 0) owner.set(p.id, best);
  }

  return sorted.map((bill, i) => {
    const due = day(bill.dueDate);
    let paidAmount = 0;
    let paidAt: string | null = null;
    for (const p of payments) {
      if (owner.get(p.id) !== i) continue;
      paidAmount += p.amount;
      if (!paidAt && paidAmount >= bill.totalAmount * 0.98) paidAt = p.date;
    }
    const total = Math.round(bill.totalAmount * 100) / 100;
    return {
      billId: bill.id,
      dueDate: due,
      totalAmount: total,
      paidAmount: Math.round(paidAmount * 100) / 100,
      paid: total <= 0 || paidAt !== null,
      paidAt: total <= 0 ? due : paidAt,
    };
  });
}

export interface UnpaidExpense {
  id: string;
  description: string;
  amount: number;
  date: string; // vencimento YYYY-MM-DD
}

export interface DebitMatch {
  expenseId: string;
  transactionId: string;
  paidAt: string;
  description: string;
}

/**
 * Casa despesas em aberto cadastradas no app com débitos reais nas contas:
 * mesmo valor (±1% ou ±R$ 1) e data a até 7 dias do vencimento. Cada débito é usado uma vez.
 */
export function matchDebits(expenses: UnpaidExpense[], bankTxs: PluggyTransaction[]): DebitMatch[] {
  const debits = bankTxs.filter((t) => t.amount < 0).map((t) => ({ ...t, abs: Math.abs(t.amount), d: day(t.date) }));
  const used = new Set<string>();
  const matches: DebitMatch[] = [];

  const ordered = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of ordered) {
    const tolerance = Math.max(1, e.amount * 0.01);
    const candidates = debits
      .filter((t) => !used.has(t.id) && Math.abs(t.abs - e.amount) <= tolerance && Math.abs(diffDays(t.d, e.date)) <= 7)
      .sort((a, b) => Math.abs(a.abs - e.amount) - Math.abs(b.abs - e.amount) || Math.abs(diffDays(a.d, e.date)) - Math.abs(diffDays(b.d, e.date)));
    const best = candidates[0];
    if (best) {
      used.add(best.id);
      matches.push({ expenseId: e.id, transactionId: best.id, paidAt: best.d, description: best.description });
    }
  }
  return matches;
}

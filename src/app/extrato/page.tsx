'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon, ChevronDownIcon, LinkIcon, PencilIcon, ArrowUpTrayIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { TransactionForm } from '@/components/TransactionForm';
import { useFinance } from '@/context/FinanceContext';
import { useUI } from '@/context/UIContext';
import { MonthSelector } from '@/components/MonthSelector';
import { ViewerBanner } from '@/components/ViewerBanner';
import { DespesasPageSkeleton } from '@/components/Skeleton';
import { CreditCard, Transaction } from '@/types/finance';

type Tab = 'pagar' | 'historico';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dayMonth = (iso: string) =>
  new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

function dayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const dm = dayMonth(iso);
  if (diff === 0) return `Hoje, ${dm}`;
  if (diff === 1) return `Ontem, ${dm}`;
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${dm}`;
}

interface PayItem {
  key: string;
  name: string;
  meta: string;
  amount: number;
  paid: boolean;
  href?: string;
  txId?: string;
  onToggle: () => Promise<void>;
}

interface HistItem {
  key: string;
  name: string;
  meta: string;
  amount: number;
  income: boolean;
  day: string;
  origin: 'openfinance' | 'import' | 'manual';
  txId?: string;
}

function originOf(t: Transaction): HistItem['origin'] {
  if (t.importSource === 'pluggy') return 'openfinance';
  if (t.importSource) return 'import';
  return 'manual';
}

function ExtratoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get('aba') === 'historico' ? 'historico' : 'pagar';
  const setTab = (t: Tab) => router.replace(t === 'historico' ? '/extrato?aba=historico' : '/extrato', { scroll: false });

  const { state, getMonthlyData, loading, isViewerMode, togglePaid, refreshData, deleteTransaction } = useFinance();
  const { hideValues } = useUI();
  const money = (n: number) => (hideValues ? 'R$ •••••' : brl(n));

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const openTx = (id?: string) => {
    if (id && !isViewerMode) setSheetId(id);
  };
  const sheetTx = sheetId ? state.transactions.find((t) => t.id === sheetId) ?? null : null;

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch('/api/credit-cards');
      const data = await res.json();
      setCards(data.creditCards || []);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const { currentMonth, currentYear } = state;
  const monthly = getMonthlyData(currentMonth, currentYear);
  const cardName = useCallback((id: string) => cards.find((c) => c.id === id)?.name ?? 'Cartão', [cards]);
  const catName = useCallback((id: string) => state.categories.find((c) => c.id === id)?.name ?? '', [state.categories]);

  const run = useCallback(
    (key: string, fn: () => Promise<unknown>) => async () => {
      if (isViewerMode || busy) return;
      setBusy(key);
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    },
    [busy, isViewerMode]
  );

  const toggleInvoice = useCallback(
    (creditCardId: string, month: number, year: number, paid: boolean) => async () => {
      await fetch('/api/transactions/bulk-paid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditCardId, month, year, paid }),
      });
      await refreshData();
    },
    [refreshData]
  );

  // ── A pagar ────────────────────────────────────────────────
  const { open, done, overdue } = useMemo(() => {
    const regular = monthly.expenses.filter((t) => !t.creditCardId);
    const toItem = (t: Transaction): PayItem => {
      const extras = [
        t.isRecurring ? 'todo mês' : '',
        t.isInstallment && t.installmentNumber && t.totalInstallments ? `parcela ${t.installmentNumber} de ${t.totalInstallments}` : '',
      ].filter(Boolean);
      const base = t.paid ? `pago ${dayMonth(t.paidAt || t.date)}` : `vence ${dayMonth(t.date)}`;
      return {
        key: t.id,
        name: t.description,
        meta: [base, ...extras].join(' · '),
        amount: t.amount,
        paid: t.paid,
        txId: t.id,
        onToggle: run(t.id, () => togglePaid(t.id, !t.paid)),
      };
    };

    const byCard: Record<string, Transaction[]> = {};
    monthly.expenses.filter((t) => t.creditCardId).forEach((t) => {
      (byCard[t.creditCardId!] ||= []).push(t);
    });
    const invoices: PayItem[] = Object.entries(byCard).map(([cardId, txns]) => {
      const total = txns.reduce((s, t) => s + t.amount, 0);
      const allPaid = txns.every((t) => t.paid);
      const key = `inv_${cardId}_${currentYear}_${currentMonth}`;
      return {
        key,
        name: `Fatura ${cardName(cardId)}`,
        meta: `${allPaid ? 'paga' : `vence ${dayMonth(txns[0].date)}`} · ${txns.length} compra${txns.length !== 1 ? 's' : ''}${
          txns.some((t) => t.importSource === 'pluggy') ? ' · atualizada pelo banco' : ''
        }`,
        amount: total,
        paid: allPaid,
        href: '/cartoes',
        onToggle: run(key, toggleInvoice(cardId, currentMonth, currentYear, !allPaid)),
      };
    });

    const all = [...regular.map(toItem), ...invoices];

    // pendências de meses anteriores
    const isPast = (t: Transaction) => t.year < currentYear || (t.year === currentYear && t.month < currentMonth);
    const pastRegular = state.transactions
      .filter((t) => t.type === 'expense' && !t.paid && !t.creditCardId && isPast(t))
      .map(toItem);
    const pastGroups: Record<string, { cardId: string; month: number; year: number; total: number; count: number }> = {};
    state.transactions
      .filter((t) => t.type === 'expense' && !t.paid && t.creditCardId && isPast(t))
      .forEach((t) => {
        const k = `${t.creditCardId}_${t.year}_${t.month}`;
        pastGroups[k] ||= { cardId: t.creditCardId!, month: t.month, year: t.year, total: 0, count: 0 };
        pastGroups[k].total += t.amount;
        pastGroups[k].count += 1;
      });
    const pastInvoices: PayItem[] = Object.values(pastGroups).map((g) => {
      const key = `inv_${g.cardId}_${g.year}_${g.month}`;
      return {
        key,
        name: `Fatura ${cardName(g.cardId)}`,
        meta: `${String(g.month).padStart(2, '0')}/${g.year} · ${g.count} compras`,
        amount: g.total,
        paid: false,
        href: '/cartoes',
        onToggle: run(key, toggleInvoice(g.cardId, g.month, g.year, true)),
      };
    });

    return {
      open: all.filter((i) => !i.paid),
      done: all.filter((i) => i.paid),
      overdue: [...pastRegular, ...pastInvoices],
    };
  }, [monthly.expenses, state.transactions, currentMonth, currentYear, cardName, run, togglePaid, toggleInvoice]);

  const remaining = open.reduce((s, i) => s + i.amount, 0);
  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0);

  // ── Histórico ──────────────────────────────────────────────
  const days = useMemo(() => {
    const items: HistItem[] = [];
    monthly.income.forEach((t) =>
      items.push({ key: t.id, txId: t.id, name: t.description, meta: catName(t.category), amount: t.amount, income: true, day: t.date.slice(0, 10), origin: originOf(t) })
    );
    monthly.expenses
      .filter((t) => !t.creditCardId && t.paid)
      .forEach((t) =>
        items.push({
          key: t.id,
          txId: t.id,
          name: t.description,
          meta: t.isRecurring ? 'Conta fixa paga' : catName(t.category),
          amount: t.amount,
          income: false,
          day: (t.paidAt || t.date).slice(0, 10),
          origin: originOf(t),
        })
      );
    const byCard: Record<string, Transaction[]> = {};
    monthly.expenses.filter((t) => t.creditCardId).forEach((t) => (byCard[t.creditCardId!] ||= []).push(t));
    Object.entries(byCard).forEach(([cardId, txns]) => {
      if (!txns.every((t) => t.paid)) return;
      const paidDay = txns.map((t) => (t.paidAt || t.date).slice(0, 10)).sort().pop()!;
      items.push({
        key: `inv_${cardId}`,
        name: `Fatura ${cardName(cardId)}`,
        meta: 'Fatura paga',
        amount: txns.reduce((s, t) => s + t.amount, 0),
        income: false,
        day: paidDay,
        origin: txns.some((t) => t.importSource === 'pluggy') ? 'openfinance' : 'manual',
      });
    });

    const groups: Record<string, HistItem[]> = {};
    items.forEach((i) => (groups[i.day] ||= []).push(i));
    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, list]) => ({
        day,
        list,
        total: list.reduce((s, i) => s + (i.income ? i.amount : -i.amount), 0),
      }));
  }, [monthly.income, monthly.expenses, catName, cardName]);

  if (loading) return <DespesasPageSkeleton />;

  return (
    <div className="min-h-screen">
      <ViewerBanner />
      <div className="px-5 pt-8 pb-6 max-w-lg mx-auto flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Extrato</h1>
          <MonthSelector />
        </header>

        <div role="tablist" aria-label="Seções" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950/5">
          {(['pagar', 'historico'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-10 rounded-[10px] text-[15px] transition-all ${
                tab === t ? 'bg-white text-zinc-950 font-semibold shadow-[0_1px_3px_rgba(11,43,38,0.15)]' : 'text-zinc-700 font-medium'
              }`}
            >
              {t === 'pagar' ? 'A pagar' : 'Histórico'}
            </button>
          ))}
        </div>

        {tab === 'pagar' ? (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-zinc-800">Falta pagar</span>
              <span className="text-[32px] font-bold tracking-tight font-mono text-zinc-950">{money(remaining)}</span>
            </div>

            {overdue.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3">
                <p className="px-1 pb-1 text-sm font-semibold text-amber-800">
                  Atrasadas · {money(overdueTotal)}
                </p>
                <PayList items={overdue} busy={busy} money={money} readOnly={isViewerMode} onOpen={openTx} />
              </div>
            )}

            {open.length > 0 ? (
              <PayList items={open} busy={busy} money={money} readOnly={isViewerMode} onOpen={openTx} />
            ) : (
              <p className="py-4 text-[15px] text-zinc-800">Tudo pago este mês.</p>
            )}

            {done.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPaid((v) => !v)}
                  aria-expanded={showPaid}
                  className="w-full h-12 flex items-center justify-between border-t border-zinc-200 text-[15px] font-medium text-zinc-800"
                >
                  Pagas ({done.length})
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${showPaid ? 'rotate-180' : ''}`} />
                </button>
                {showPaid && <PayList items={done} busy={busy} money={money} readOnly={isViewerMode} onOpen={openTx} muted />}
              </div>
            )}

            <Link href="/despesas" className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 py-2">
              <ArrowUpTrayIcon className="w-4 h-4" />
              Importar fatura e ver detalhes
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-5">
            {days.length === 0 && <p className="py-4 text-[15px] text-zinc-800">Nada por aqui neste mês.</p>}
            {days.map((g) => (
              <div key={g.day} className="flex flex-col">
                <div className="flex items-baseline justify-between pb-1">
                  <h2 className="text-[13px] font-medium text-zinc-800">{dayLabel(g.day)}</h2>
                  <span className={`text-[13px] font-semibold font-mono ${g.total >= 0 ? 'text-zinc-600' : 'text-zinc-950'}`}>
                    {hideValues ? 'R$ •••••' : `${g.total >= 0 ? '+ ' : '− '}${brl(Math.abs(g.total))}`}
                  </span>
                </div>
                <div className="rounded-2xl bg-white/80 border border-zinc-200 divide-y divide-zinc-200/70">
                  {g.list.map((i) => (
                    <button
                      key={i.key}
                      type="button"
                      onClick={() => openTx(i.txId)}
                      disabled={!i.txId || isViewerMode}
                      className="w-full text-left flex items-center gap-3 px-4 min-h-14 py-2 enabled:active:bg-zinc-950/5 disabled:cursor-default"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-zinc-950 truncate">{i.name}</p>
                        <p className="flex items-center gap-1 text-[13px] text-zinc-800">
                          {i.origin === 'openfinance' ? (
                            <LinkIcon className="w-3.5 h-3.5" aria-label="Open Finance" />
                          ) : i.origin === 'import' ? (
                            <ArrowUpTrayIcon className="w-3.5 h-3.5" aria-label="Importado" />
                          ) : (
                            <PencilIcon className="w-3.5 h-3.5" aria-label="Lançado por você" />
                          )}
                          <span className="truncate">{i.meta}</span>
                        </p>
                      </div>
                      <span className={`text-[15px] font-semibold font-mono ${i.income ? 'text-zinc-600' : 'text-zinc-950'}`}>
                        {hideValues ? 'R$ •••••' : `${i.income ? '+ ' : '− '}${brl(i.amount)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {sheetTx && (
        <ActionSheet
          tx={sheetTx}
          money={money}
          onClose={() => setSheetId(null)}
          onEdit={() => {
            setEditing(sheetTx);
            setSheetId(null);
          }}
          onDelete={async () => {
            await deleteTransaction(sheetTx.id);
            setSheetId(null);
          }}
        />
      )}

      {editing && <TransactionForm type={editing.type} editTransaction={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ActionSheet({
  tx,
  money,
  onClose,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  money: (n: number) => string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const extra =
    tx.isInstallment && tx.totalInstallments
      ? ` Só a parcela ${tx.installmentNumber} de ${tx.totalInstallments} será excluída.`
      : tx.isRecurring
        ? ' Só o lançamento deste mês será excluído.'
        : '';

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={tx.description}>
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-zinc-950/30 animate-fade-in" />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-white px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-200" />
        <p className="text-[17px] font-semibold text-zinc-950 truncate">{tx.description}</p>
        <p className="text-sm text-zinc-800">
          {money(tx.amount)} · {dayMonth(tx.date)}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={onEdit} className="h-12 rounded-xl bg-zinc-950/5 flex items-center justify-center gap-2 text-[15px] font-semibold text-zinc-950">
            <PencilSquareIcon className="w-5 h-5" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors disabled:opacity-60 ${
              confirm ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
            }`}
          >
            <TrashIcon className="w-5 h-5" />
            {deleting ? 'Excluindo…' : confirm ? 'Toque de novo para excluir' : 'Excluir'}
          </button>
          {confirm && extra && <p className="text-center text-[13px] text-zinc-800">{extra.trim()}</p>}
          <button onClick={onClose} className="h-12 text-[15px] font-medium text-zinc-800">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function PayList({
  items,
  busy,
  money,
  readOnly,
  muted,
  onOpen,
}: {
  items: PayItem[];
  busy: string | null;
  money: (n: number) => string;
  readOnly: boolean;
  muted?: boolean;
  onOpen: (id?: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white/80 border border-zinc-200 divide-y divide-zinc-200/70">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-1 pr-4">
          <button
            onClick={i.onToggle}
            disabled={readOnly || busy === i.key}
            aria-pressed={i.paid}
            aria-label={`${i.paid ? 'Desmarcar' : 'Marcar'} ${i.name} como paga`}
            className="w-12 h-14 flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                i.paid ? 'bg-zinc-700 text-zinc-100' : 'border-2 border-zinc-400'
              } ${busy === i.key ? 'animate-pulse' : ''}`}
            >
              {i.paid && <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
          </button>
          <div
            className="flex-1 min-w-0 py-2"
            onClick={() => onOpen(i.txId)}
            role={i.txId && !readOnly ? 'button' : undefined}
            tabIndex={i.txId && !readOnly ? 0 : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onOpen(i.txId);
            }}
          >
            <p className={`text-[15px] font-medium truncate ${muted ? 'text-zinc-800' : 'text-zinc-950'}`}>{i.name}</p>
            <p className="text-[13px] text-zinc-800 truncate">
              {i.meta}
              {i.href && (
                <>
                  {' · '}
                  <Link href={i.href} className="font-medium underline-offset-2 hover:underline">
                    ver
                  </Link>
                </>
              )}
            </p>
          </div>
          <span className={`text-[15px] font-semibold font-mono ${muted ? 'text-zinc-800' : 'text-zinc-950'}`}>{money(i.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={null}>
      <ExtratoContent />
    </Suspense>
  );
}

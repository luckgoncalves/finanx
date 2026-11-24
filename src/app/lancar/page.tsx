'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { ViewerBanner } from '@/components/ViewerBanner';
import { TransactionType } from '@/types/finance';

type Repeat = 'single' | 'installment' | 'recurring';

const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

function LancarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, addTransaction, isViewerMode } = useFinance();

  const [type, setType] = useState<TransactionType>(params.get('tipo') === 'entrada' ? 'income' : 'expense');
  const categories = useMemo(() => state.categories.filter((c) => c.type === type), [state.categories, type]);

  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayISO());
  const [repeat, setRepeat] = useState<Repeat>('single');
  const [installments, setInstallments] = useState(2);
  const [recurringMonths, setRecurringMonths] = useState(12);
  const [saving, setSaving] = useState(false);

  // categoria válida para o tipo escolhido
  useEffect(() => {
    if (!categories.find((c) => c.id === category)) setCategory(categories[0]?.id || '');
  }, [categories, category]);

  const amountLabel = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const canSave = amountCents > 0 && description.trim().length > 0 && !!category && !saving && !isViewerMode;

  const handleAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAmountCents(parseInt(digits || '0', 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const [y, m] = date.split('-').map(Number);
    try {
      await addTransaction({
        description: description.trim(),
        amount: amountCents / 100,
        type,
        category,
        date,
        month: m,
        year: y,
        isInstallment: repeat === 'installment',
        totalInstallments: repeat === 'installment' ? installments : undefined,
        isRecurring: repeat === 'recurring',
        recurringMonths: repeat === 'recurring' ? recurringMonths : undefined,
      });
      router.push(type === 'income' ? '/extrato?aba=historico' : '/extrato');
    } finally {
      setSaving(false);
    }
  };

  const seg = (on: boolean) =>
    `h-10 rounded-[10px] text-[15px] font-semibold transition-all ${
      on ? 'bg-white text-zinc-950 shadow-[0_1px_3px_rgba(11,43,38,0.15)]' : 'text-zinc-700'
    }`;
  const chip = (on: boolean) =>
    `h-10 px-4 rounded-full text-sm font-medium border transition-colors ${
      on ? 'bg-zinc-950 text-zinc-100 border-zinc-950' : 'bg-white/70 text-zinc-950 border-zinc-300'
    }`;

  return (
    <div className="min-h-screen">
      <ViewerBanner />
      <form onSubmit={handleSubmit} className="px-5 pt-8 pb-6 max-w-lg mx-auto flex flex-col gap-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Novo lançamento</h1>

        <div role="group" aria-label="Tipo" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950/5">
          <button type="button" aria-pressed={type === 'expense'} onClick={() => setType('expense')} className={seg(type === 'expense')}>
            Despesa
          </button>
          <button type="button" aria-pressed={type === 'income'} onClick={() => setType('income')} className={seg(type === 'income')}>
            Entrada
          </button>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor="valor" className="text-sm text-zinc-800">Valor</label>
          <input
            id="valor"
            inputMode="numeric"
            autoComplete="off"
            value={amountLabel}
            onChange={handleAmount}
            className={`w-full text-center bg-transparent outline-none text-[40px] font-bold tracking-tight font-mono ${
              type === 'income' ? 'text-zinc-700' : 'text-zinc-950'
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="desc" className="text-sm font-medium text-zinc-800">Descrição</label>
          <input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'income' ? 'Ex.: Pagamento cliente' : 'Ex.: Condomínio'}
            className="h-12 rounded-xl border border-zinc-300 bg-white/70 px-4 text-base text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800">Categoria</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={chip(category === c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/70 divide-y divide-zinc-200/70">
          <label className="flex items-center justify-between h-12 px-4 text-[15px]">
            <span className="text-zinc-800">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent font-medium text-zinc-950 outline-none" />
          </label>

          <div className="px-4 py-3 flex flex-col gap-3">
            <span className="text-[15px] text-zinc-800">Repetição</span>
            <div className="flex gap-2">
              {([
                ['single', 'Uma vez'],
                ['installment', 'Parcelado'],
                ['recurring', 'Todo mês'],
              ] as [Repeat, string][]).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={repeat === v} onClick={() => setRepeat(v)} className={chip(repeat === v)}>
                  {l}
                </button>
              ))}
            </div>
            {repeat === 'installment' && (
              <label className="flex items-center justify-between text-[15px]">
                <span className="text-zinc-800">Parcelas</span>
                <input type="number" min={2} max={48} value={installments} onChange={(e) => setInstallments(Math.max(2, Number(e.target.value) || 2))}
                  className="w-20 h-10 rounded-lg border border-zinc-300 bg-white text-center font-medium" />
              </label>
            )}
            {repeat === 'recurring' && (
              <label className="flex items-center justify-between text-[15px]">
                <span className="text-zinc-800">Conta fixa por quantos meses</span>
                <input type="number" min={2} max={60} value={recurringMonths} onChange={(e) => setRecurringMonths(Math.max(2, Number(e.target.value) || 2))}
                  className="w-20 h-10 rounded-lg border border-zinc-300 bg-white text-center font-medium" />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className="h-13 py-3.5 rounded-2xl bg-zinc-700 text-zinc-100 text-base font-semibold disabled:opacity-50 active:scale-[0.99] transition"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}

export default function LancarPage() {
  return (
    <Suspense fallback={null}>
      <LancarForm />
    </Suspense>
  );
}

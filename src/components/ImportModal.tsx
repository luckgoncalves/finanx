'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  PlusIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { PreviewTransaction } from '@/lib/parsers/ofx';
import { CreditCard } from '@/types/finance';

interface ImportModalProps {
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  condominio: 'Condomínio',
  luz: 'Luz',
  telefone: 'Telefone/Internet',
  saude: 'Saúde',
  iptu: 'IPTU',
  ipva: 'IPVA',
  cartao: 'Cartão de Crédito',
  seguro: 'Seguro',
  educacao: 'Educação',
  assinatura: 'Assinaturas',
  outros: 'Outros',
  salario: 'Salário',
  acordo: 'Acordo',
  fgts: 'FGTS',
  cashback: 'Cashback',
  outros_entrada: 'Outros',
};

const CARD_COLORS = [
  '#6366f1', '#f97316', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

type Step = 'upload' | 'card-select' | 'preview' | 'success';

export function ImportModal({ onClose }: ImportModalProps) {
  const { state, refreshData } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<PreviewTransaction[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [importedCount, setImportedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Credit card state
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardDigits, setNewCardDigits] = useState('');
  const [newCardBrand, setNewCardBrand] = useState('');
  const [newCardColor, setNewCardColor] = useState(CARD_COLORS[0]);
  const [savingCard, setSavingCard] = useState(false);

  useEffect(() => {
    fetch('/api/credit-cards')
      .then((r) => r.json())
      .then((d) => setCreditCards(d.creditCards || []))
      .catch(() => {});
  }, []);

  const expenseCategories = state.categories.filter((c) => c.type === 'expense');
  const incomeCategories = state.categories.filter((c) => c.type === 'income');

  const getCategoryOptions = (type: 'income' | 'expense') =>
    type === 'expense' ? expenseCategories : incomeCategories;

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/transactions/import?action=preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar arquivo');
        return;
      }

      const txns: PreviewTransaction[] = data.transactions;
      setPreview(txns);
      setSource(data.source);

      const initialSelected = new Set<number>();
      const initialCategories: Record<number, string> = {};
      txns.forEach((t, i) => {
        if (!t.isDuplicate) initialSelected.add(i);
        initialCategories[i] = t.suggestedCategory;
      });
      setSelected(initialSelected);
      setCategories(initialCategories);
      setStep('card-select');
    } catch {
      setError('Erro ao processar arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCreateCard = async () => {
    if (!newCardName.trim()) return;
    setSavingCard(true);
    try {
      const res = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCardName.trim(),
          lastDigits: newCardDigits.trim() || null,
          brand: newCardBrand.trim() || null,
          color: newCardColor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const newCard: CreditCard = data.creditCard;
        setCreditCards((prev) => [...prev, newCard]);
        setSelectedCardId(newCard.id);
        setShowNewCardForm(false);
        setNewCardName('');
        setNewCardDigits('');
        setNewCardBrand('');
        setNewCardColor(CARD_COLORS[0]);
      }
    } catch {
      // ignore
    } finally {
      setSavingCard(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === preview.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(preview.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');

    const toImportIndexed = Array.from(selected).map((i) => ({
      description: preview[i].description,
      amount: preview[i].amount,
      date: preview[i].date,
      purchaseDate: preview[i].purchaseDate ?? null,
      type: preview[i].type,
      category: categories[i] ?? preview[i].suggestedCategory,
    }));

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: toImportIndexed,
          source,
          creditCardId: selectedCardId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao importar');
        return;
      }

      setImportedCount(data.imported);
      await refreshData();
      setStep('success');
    } catch {
      setError('Erro ao importar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTotal = Array.from(selected).reduce(
    (sum, i) => sum + (preview[i]?.amount ?? 0),
    0
  );

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold">Importar Fatura</h2>
            {step === 'card-select' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Selecione o cartão desta fatura
              </p>
            )}
            {step === 'preview' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {preview.length} transaç{preview.length === 1 ? 'ão' : 'ões'} encontrada{preview.length === 1 ? '' : 's'} •{' '}
                <span className="uppercase text-xs font-semibold text-zinc-400">{source}</span>
                {selectedCard && (
                  <span className="ml-1">
                    •{' '}
                    <span
                      className="font-semibold"
                      style={{ color: selectedCard.color }}
                    >
                      {selectedCard.name}
                    </span>
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Step: Upload ── */}
          {step === 'upload' && (
            <div className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                  dragging
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {loading ? (
                  <div className="w-10 h-10 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
                ) : (
                  <ArrowUpTrayIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                )}
                <div className="text-center">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {loading ? 'Processando...' : 'Soltar arquivo aqui'}
                  </p>
                  {!loading && (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                      ou clique para selecionar
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ofx,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              {/* Supported banks */}
              <div className="mt-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                  Formatos suportados
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>.ofx — Itaú, Bradesco, BB, Santander, Caixa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>.csv — Nubank, Inter, C6 Bank</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Exporte a fatura no app do seu banco e faça o upload aqui.
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Card Select ── */}
          {step === 'card-select' && (
            <div className="p-5 space-y-3">
              {/* Existing cards */}
              {creditCards.length > 0 && (
                <div className="space-y-2">
                  {creditCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedCardId === card.id
                          ? 'border-current bg-opacity-5'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      style={selectedCardId === card.id ? { borderColor: card.color } : {}}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: card.color + '20' }}
                      >
                        <CreditCardIcon className="w-5 h-5" style={{ color: card.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{card.name}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {[card.brand, card.lastDigits ? `•••• ${card.lastDigits}` : null]
                            .filter(Boolean)
                            .join(' · ') || 'Cartão de crédito'}
                        </p>
                      </div>
                      {selectedCardId === card.id && (
                        <CheckCircleIcon className="w-5 h-5 shrink-0" style={{ color: card.color }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Add new card */}
              {!showNewCardForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewCardForm(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700 transition-colors text-zinc-500 dark:text-zinc-400"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Adicionar novo cartão</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <p className="text-sm font-semibold">Novo cartão</p>
                  <input
                    type="text"
                    placeholder="Nome do cartão (ex: Nubank, Itaú Visa)"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bandeira (Visa, Master...)"
                      value={newCardBrand}
                      onChange={(e) => setNewCardBrand(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
                    />
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Últimos 4 dígitos"
                      value={newCardDigits}
                      onChange={(e) => setNewCardDigits(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 shrink-0">Cor:</span>
                    <div className="flex gap-2 flex-wrap">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCardColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${newCardColor === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c, color: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCardForm(false)}
                      className="flex-1 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCard}
                      disabled={!newCardName.trim() || savingCard}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                    >
                      {savingCard ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}

              {creditCards.length === 0 && !showNewCardForm && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                  Nenhum cartão cadastrado ainda
                </p>
              )}
            </div>
          )}

          {/* ── Step: Preview ── */}
          {step === 'preview' && (
            <div>
              {/* Toolbar: select all + busca */}
              <div className="sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between px-5 py-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-rose-500"
                      checked={selected.size === preview.length}
                      onChange={toggleAll}
                    />
                    <span className="text-sm font-medium">Selecionar todas</span>
                  </label>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selected.size} de {preview.length}
                  </span>
                </div>

                {/* Campo de busca */}
                <div className="px-5 pb-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar na fatura..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none border-2 border-transparent focus:border-rose-400 dark:focus:border-rose-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {preview.filter((t) => t.isDuplicate).length > 0 && (
                <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {preview.filter((t) => t.isDuplicate).length} transaç{preview.filter((t) => t.isDuplicate).length === 1 ? 'ão' : 'ões'} já existe{preview.filter((t) => t.isDuplicate).length === 1 ? '' : 'm'} e foi{preview.filter((t) => t.isDuplicate).length === 1 ? ' deselecionada' : 'ram deselecionadas'} automaticamente.
                  </p>
                </div>
              )}

              <div className="px-5 pt-4 pb-2 space-y-3">
                {(() => {
                  const q = searchQuery.toLowerCase().trim();
                  const visible = preview
                    .map((t, i) => ({ t, i }))
                    .filter(({ t }) =>
                      !q ||
                      t.description.toLowerCase().includes(q) ||
                      formatCurrency(t.amount).includes(q) ||
                      formatDate(t.date).toLowerCase().includes(q)
                    );

                  if (visible.length === 0) {
                    return (
                      <div className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        Nenhuma transação encontrada para &quot;{searchQuery}&quot;
                      </div>
                    );
                  }

                  return (
                    <>
                      {q && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 pb-1">
                          {visible.length} de {preview.length} transaç{preview.length !== 1 ? 'ões' : 'ão'}
                        </p>
                      )}
                      {visible.map(({ t, i }) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border transition-colors ${
                            selected.has(i)
                              ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                              : 'bg-zinc-50 dark:bg-zinc-900 border-transparent opacity-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 accent-rose-500 shrink-0"
                              checked={selected.has(i)}
                              onChange={() => toggleSelect(i)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium truncate">{t.description}</p>
                                <p
                                  className={`text-sm font-mono font-semibold shrink-0 ${
                                    t.type === 'income'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {t.purchaseDate && t.purchaseDate !== t.date ? (
                                  <>
                                    <span className="text-xs text-zinc-400">
                                      Compra: {formatDate(t.purchaseDate)}
                                    </span>
                                    <span className="text-xs text-zinc-300 dark:text-zinc-600">→</span>
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                      Fatura: {formatDate(t.date)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-zinc-400">{formatDate(t.date)}</span>
                                )}
                                {t.isDuplicate && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                    Duplicada
                                  </span>
                                )}
                                <select
                                  value={categories[i] ?? t.suggestedCategory}
                                  onChange={(e) => setCategories((prev) => ({ ...prev, [i]: e.target.value }))}
                                  className="text-xs rounded-lg px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-none outline-none cursor-pointer"
                                >
                                  {getCategoryOptions(t.type).map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>

              {error && (
                <p className="mx-5 mb-3 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircleIcon className="w-9 h-9 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">Importado!</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                  {importedCount} transaç{importedCount === 1 ? 'ão importada' : 'ões importadas'} com sucesso.
                </p>
                {selectedCard && (
                  <p className="text-sm mt-1" style={{ color: selectedCard.color }}>
                    Associado ao cartão {selectedCard.name}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'card-select' && (
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
            <div className="flex gap-2">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep('preview')}
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                {selectedCard ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedCard.color }}
                    />
                    {selectedCard.name}
                  </>
                ) : (
                  'Continuar sem cartão'
                )}
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {selected.size} selecionada{selected.size !== 1 ? 's' : ''}
                </p>
                <p className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(selectedTotal)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('card-select')}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0 || loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : null}
                  Importar {selected.size > 0 ? selected.size : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

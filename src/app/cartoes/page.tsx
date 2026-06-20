'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { CreditCardIcon as CreditCardSolid } from '@heroicons/react/24/solid';
import { useFinance } from '@/context/FinanceContext';
import { useUI } from '@/context/UIContext';
import { CreditCard } from '@/types/finance';
import { Transaction } from '@/types/finance';
import { TransactionList } from '@/components/TransactionList';
import { ImportModal } from '@/components/ImportModal';
import { ViewerBanner } from '@/components/ViewerBanner';

const PREVIEW_STORAGE_KEY = 'finanx-card-previews';

function loadPreviews(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const s = localStorage.getItem(PREVIEW_STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function savePreviews(previews: Record<string, number>) {
  localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(previews));
}

const CARD_COLORS = [
  '#6366f1', '#f97316', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

export default function CartoesPage() {
  const { state, isViewerMode, refreshData } = useFinance();
  const { hideValues } = useUI();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState('');

  // Preview (estimated) values per card/month
  const [previews, setPreviews] = useState<Record<string, number>>(loadPreviews);
  const [editingPreviewKey, setEditingPreviewKey] = useState<string | null>(null);
  const [previewInput, setPreviewInput] = useState('');

  const previewKey = (cardId: string, year: number, month: number) =>
    `${cardId}-${year}-${month}`;

  const startEditPreview = (key: string, current: number) => {
    setEditingPreviewKey(key);
    setPreviewInput(current > 0 ? String(current) : '');
  };

  const confirmPreview = (key: string) => {
    const value = parseFloat(previewInput.replace(',', '.')) || 0;
    setPreviews((prev) => {
      const next = { ...prev };
      if (value > 0) next[key] = value;
      else delete next[key];
      savePreviews(next);
      return next;
    });
    setEditingPreviewKey(null);
    setPreviewInput('');
  };

  const clearPreview = (key: string) => {
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[key];
      savePreviews(next);
      return next;
    });
    setEditingPreviewKey(null);
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formDigits, setFormDigits] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formColor, setFormColor] = useState(CARD_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const res = await fetch('/api/credit-cards');
      const data = await res.json();
      setCards(data.creditCards || []);
    } catch {
      // ignore
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError('Nome do cartão é obrigatório');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          lastDigits: formDigits.trim() || null,
          brand: formBrand.trim() || null,
          color: formColor,
        }),
      });
      if (res.ok) {
        setFormName('');
        setFormDigits('');
        setFormBrand('');
        setFormColor(CARD_COLORS[0]);
        setShowForm(false);
        await fetchCards();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Erro ao criar cartão');
      }
    } catch {
      setFormError('Erro ao criar cartão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' });
      if (selectedCard?.id === id) handleSelectCard(null);
      await fetchCards();
      await refreshData();
    } catch {
      // ignore
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleSelectCard = (card: CreditCard | null) => {
    setSelectedCard(card);
    setCardSearch('');
  };

  // Get transactions for a specific card
  const getCardTransactions = (cardId: string): Transaction[] => {
    return state.transactions
      .filter((t) => t.creditCardId === cardId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCardTotal = (cardId: string) => {
    return state.transactions
      .filter((t) => t.creditCardId === cardId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="min-h-screen">
      <ViewerBanner />

      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerenciar</p>
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Cartões
            </h1>
          </div>
          {!isViewerMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Card list or detail */}
      {selectedCard ? (
        /* ── Card Detail ── */
        <div className="px-6 pb-24">
          {/* Back + card header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => handleSelectCard(null)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronUpIcon className="w-5 h-5 rotate-[270deg]" />
            </button>
            <div
              className="flex-1 flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: selectedCard.color + '15' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: selectedCard.color + '30' }}
              >
                <CreditCardSolid className="w-6 h-6" style={{ color: selectedCard.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">{selectedCard.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {[selectedCard.brand, selectedCard.lastDigits ? `•••• ${selectedCard.lastDigits}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Cartão de crédito'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-zinc-400">Total gasto</p>
                <p className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  {hideValues ? 'R$ •••••' : formatCurrency(getCardTotal(selectedCard.id))}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar transação..."
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
            />
            {cardSearch && (
              <button
                type="button"
                onClick={() => setCardSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Transactions */}
          {(() => {
            const allTxns = getCardTransactions(selectedCard.id);
            const q = cardSearch.toLowerCase().trim();
            const txns = q
              ? allTxns.filter(
                  (t) =>
                    t.description.toLowerCase().includes(q) ||
                    formatCurrency(t.amount).includes(q) ||
                    formatDate(t.date).toLowerCase().includes(q) ||
                    (t.purchaseDate && formatDate(t.purchaseDate).toLowerCase().includes(q))
                )
              : allTxns;
            if (txns.length === 0 && allTxns.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <CreditCardIcon className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Nenhuma transação importada para este cartão
                  </p>
                  {!isViewerMode && (
                    <button
                      onClick={() => setShowImport(true)}
                      className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      Importar fatura
                    </button>
                  )}
                </div>
              );
            }

            if (txns.length === 0 && q) {
              return (
                <div className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  Nenhuma transação encontrada para &quot;{cardSearch}&quot;
                </div>
              );
            }

            // Group by month
            const byMonth: Record<string, Transaction[]> = {};
            txns.forEach((t) => {
              const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
              if (!byMonth[key]) byMonth[key] = [];
              byMonth[key].push(t);
            });

            return (
              <div className="space-y-6">
                {q && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {txns.length} resultado{txns.length !== 1 ? 's' : ''} para &quot;{cardSearch}&quot;
                  </p>
                )}
                {Object.entries(byMonth)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([key, monthTxns]) => {
                    const [year, month] = key.split('-').map(Number);
                    const label = new Date(year, month - 1).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    });
                    const realTotal = monthTxns
                      .filter((t) => t.type === 'expense')
                      .reduce((s, t) => s + t.amount, 0);
                    const pk = previewKey(selectedCard.id, year, month);
                    const preview = previews[pk] ?? 0;
                    const projected = realTotal + preview;
                    const isEditing = editingPreviewKey === pk;

                    return (
                      <div key={key}>
                        {/* Month header */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold capitalize text-zinc-500 dark:text-zinc-400">
                            {label}
                          </h3>
                          <div className="flex items-center gap-2">
                            {preview > 0 && !hideValues && (
                              <span className="text-xs text-zinc-400 line-through font-mono">
                                {formatCurrency(realTotal)}
                              </span>
                            )}
                            <span className={`text-sm font-mono font-semibold ${preview > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {hideValues ? 'R$ •••••' : formatCurrency(projected)}
                            </span>
                          </div>
                        </div>

                        {/* Preview row */}
                        <div className="mb-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <PencilSquareIcon className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">Prévia estimada:</span>
                              <input
                                autoFocus
                                type="text"
                                inputMode="decimal"
                                value={previewInput}
                                onChange={(e) => setPreviewInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') confirmPreview(pk);
                                  if (e.key === 'Escape') setEditingPreviewKey(null);
                                }}
                                placeholder="0,00"
                                className="flex-1 min-w-0 bg-transparent text-sm font-mono outline-none placeholder-amber-400/50 text-amber-700 dark:text-amber-300"
                              />
                              <button onClick={() => confirmPreview(pk)} className="p-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                                <CheckIcon className="w-3.5 h-3.5" />
                              </button>
                              {preview > 0 && (
                                <button onClick={() => clearPreview(pk)} className="p-1 rounded-lg text-amber-500 hover:bg-amber-500/20 transition-colors">
                                  <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : preview > 0 ? (
                            <button
                              onClick={() => startEditPreview(pk, preview)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/30 hover:bg-amber-500/15 transition-colors"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex-1 text-left">
                                Prévia estimada: <span className="font-mono font-semibold">{hideValues ? '•••••' : formatCurrency(preview)}</span>
                              </span>
                              <span className="text-xs text-amber-400">editar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditPreview(pk, 0)}
                              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors border border-dashed border-transparent hover:border-amber-500/20"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Adicionar valor prévio
                            </button>
                          )}
                        </div>

                        <TransactionList
                          transactions={monthTxns}
                          type="expense"
                          groupByDate={false}
                        />
                      </div>
                    );
                  })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ── Cards List ── */
        <div className="px-6 pb-24 space-y-3">
          {loadingCards ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : cards.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <CreditCardIcon className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Nenhum cartão cadastrado
              </p>
              {!isViewerMode && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar cartão
                </button>
              )}
            </div>
          ) : (
            <>
              {cards.map((card) => {
                const txCount = state.transactions.filter((t) => t.creditCardId === card.id).length;
                const total = getCardTotal(card.id);

                return (
                  <div key={card.id} className="flex items-center rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark transition-all hover:scale-[1.01] active:scale-[0.99]">
                    <button
                      type="button"
                      onClick={() => handleSelectCard(card)}
                      className="flex-1 flex items-center gap-3 p-4 text-left min-w-0"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: card.color + '20' }}
                      >
                        <CreditCardSolid className="w-6 h-6" style={{ color: card.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{card.name}</p>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 truncate">
                          {[card.brand, card.lastDigits ? `•••• ${card.lastDigits}` : null]
                            .filter(Boolean)
                            .join(' · ') || 'Cartão de crédito'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                          {txCount} transaç{txCount !== 1 ? 'ões' : 'ão'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs text-zinc-400">Total</p>
                        <p className="font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
                          {hideValues ? 'R$ •••••' : formatCurrency(total)}
                        </p>
                      </div>
                      <ChevronDownIcon className="w-4 h-4 text-zinc-400 -rotate-90 shrink-0 ml-1" />
                    </button>

                    {!isViewerMode && (
                      <div className="pr-3 flex items-center shrink-0">
                        {confirmDeleteId === card.id ? (
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                              Excluir
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(card.id);
                            }}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Add card form */}
          {showForm && (
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Novo cartão</p>
                <button
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nome do cartão (ex: Nubank, Itaú Visa)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Bandeira (Visa, Master...)"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
                />
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Últimos 4 dígitos"
                  value={formDigits}
                  onChange={(e) => setFormDigits(e.target.value.replace(/\D/g, ''))}
                  className="px-3 py-2.5 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">Cor:</span>
                <div className="flex gap-2 flex-wrap">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${formColor === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c, color: c }}
                    />
                  ))}
                </div>
              </div>
              {formError && (
                <p className="text-xs text-rose-500">{formError}</p>
              )}
              <button
                onClick={handleCreate}
                disabled={!formName.trim() || saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar cartão'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {!isViewerMode && !selectedCard && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
          aria-label="Adicionar cartão"
        >
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      {showImport && (
        <ImportModal onClose={async () => { setShowImport(false); await fetchCards(); }} />
      )}
    </div>
  );
}

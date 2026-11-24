'use client';

import { useRef, useState } from 'react';
import { ChevronRightIcon, TrashIcon, Cog6ToothIcon, XMarkIcon, LinkIcon, LinkSlashIcon } from '@heroicons/react/24/outline';
import { CreditCard } from '@/types/finance';

interface Props {
  cards: CreditCard[];
  getTotal: (cardId: string) => number;
  getCount: (cardId: string) => number;
  isPaid: (cardId: string) => boolean;
  hideValues: boolean;
  readOnly: boolean;
  onOpen: (card: CreditCard) => void;
  onDelete: (cardId: string) => Promise<void>;
  onSave: (cardId: string, patch: CardPatch) => Promise<boolean>;
  getLink?: (card: CreditCard) => CardLink | null;
  onDisconnect?: (connectionId: string) => Promise<void>;
}

/** Dados do cartão vindos do Open Finance. */
export interface CardLink {
  connectionId: string;
  bankName: string;
  used: number;
  limit: number | null;
  dueDate: string | null;
  lastSyncAt: string | null;
}

export interface CardPatch {
  name: string;
  lastDigits: string | null;
  brand: string | null;
  color: string;
}

export const CARD_PALETTE = [
  '#163832', '#235347', '#0F766E', '#1D4ED8', '#4C1D95',
  '#BE185D', '#B91C1C', '#C2410C', '#A16207', '#111827',
];

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CardFace({ card, dim }: { card: CreditCard; dim?: boolean }) {
  return (
    <div
      className="relative w-full aspect-[1.586] rounded-[20px] p-5 overflow-hidden text-white flex flex-col justify-between shadow-[0_12px_28px_rgba(11,43,38,0.22)] transition-opacity duration-300"
      style={{ backgroundColor: card.color, opacity: dim ? 0.7 : 1 }}
    >
      <span aria-hidden="true" className="absolute -right-16 -top-24 w-64 h-64 rounded-full bg-white/[0.08]" />
      <span aria-hidden="true" className="absolute -right-4 -bottom-32 w-60 h-60 rounded-full bg-white/[0.06]" />

      <div className="relative flex items-start justify-between">
        <span className="text-lg font-bold tracking-tight">{card.name}</span>
      </div>

      <div className="relative flex items-center gap-3" aria-hidden="true">
        <span className="w-10 h-[30px] rounded-md bg-[#D9C48A] grid grid-cols-3 gap-[2px] p-[5px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rounded-[2px] bg-black/10" />
          ))}
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8.5 7.5a6 6 0 0 1 0 9" />
          <path d="M12 5a9.5 9.5 0 0 1 0 14" />
          <path d="M15.5 2.5a13 13 0 0 1 0 19" />
        </svg>
      </div>

      <div className="relative flex flex-col gap-2">
        <span className="text-lg font-medium tracking-[0.14em] font-mono">
          •••• •••• •••• {card.lastDigits || '••••'}
        </span>
        <div className="flex items-end justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider">{card.brand ? `${card.brand} · Crédito` : 'Crédito'}</span>
          <span aria-hidden="true" className="flex">
            <span className="w-6 h-6 rounded-full bg-white/55" />
            <span className="w-6 h-6 rounded-full bg-white/30 -ml-2.5" />
          </span>
        </div>
      </div>

    </div>
  );
}

function LimitInfo({ link, hideValues }: { link: CardLink; hideValues: boolean }) {
  const pct = link.limit ? Math.min(100, Math.round((link.used / link.limit) * 100)) : null;
  const free = link.limit != null ? Math.max(0, link.limit - link.used) : null;
  const m = (n: number) => (hideValues ? 'R$ •••••' : brl(n));
  const synced = link.lastSyncAt
    ? new Date(link.lastSyncAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-800">Limite usado</span>
        <span className="font-mono font-semibold text-zinc-950">
          {m(link.used)}
          {link.limit != null && <span className="font-normal text-zinc-800"> de {m(link.limit)}</span>}
        </span>
      </div>
      {pct != null && (
        <div className="h-1.5 rounded-full bg-zinc-950/10 overflow-hidden" role="img" aria-label={`${pct}% do limite usado`}>
          <div className="h-full rounded-full bg-zinc-700" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between text-[13px] text-zinc-800">
        {free != null ? <span>Disponível {m(free)}</span> : <span />}
        <span className="inline-flex items-center gap-1">
          <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
          {link.bankName}
          {synced ? ` · ${synced}` : ''}
        </span>
      </div>
      <p className="text-[12px] text-zinc-800">O limite usado inclui parcelas futuras, por isso pode ser maior que a fatura.</p>
    </div>
  );
}

function CardSettings({
  card,
  link,
  onDisconnect,
  onClose,
  onSave,
  onDelete,
}: {
  card: CreditCard;
  link: CardLink | null;
  onDisconnect?: (connectionId: string) => Promise<void>;
  onClose: () => void;
  onSave: (patch: CardPatch) => Promise<boolean>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(card.name);
  const [lastDigits, setLastDigits] = useState(card.lastDigits || '');
  const [brand, setBrand] = useState(card.brand || '');
  const [color, setColor] = useState(card.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const preview: CreditCard = { ...card, name: name || card.name, lastDigits: lastDigits || null, brand: brand || null, color };

  const save = async () => {
    if (!name.trim()) {
      setError('Dê um nome ao cartão');
      return;
    }
    setSaving(true);
    setError('');
    const ok = await onSave({ name: name.trim(), lastDigits: lastDigits.trim() || null, brand: brand.trim() || null, color });
    if (!ok) setError('Não foi possível salvar. Tente de novo.');
    setSaving(false);
  };

  const field = 'h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none focus:border-zinc-700';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Configurações do cartão ${card.name}`}>
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-zinc-950/30 animate-fade-in" />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] animate-slide-up">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-200" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-zinc-950">Configurações do cartão</h2>
          <button onClick={onClose} aria-label="Fechar" className="w-11 h-11 -mr-2 flex items-center justify-center text-zinc-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-auto w-[78%] max-w-[300px] mb-5">
          <CardFace card={preview} />
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-800">Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">Final</span>
              <input
                value={lastDigits}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">Bandeira</span>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Visa, Master…" className={field} />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-800">Cor</span>
            <div role="radiogroup" aria-label="Cor do cartão" className="flex flex-wrap gap-2.5">
              {CARD_PALETTE.map((c) => {
                const on = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`Cor ${c}`}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full transition-transform active:scale-90 ${on ? 'ring-2 ring-offset-2 ring-zinc-950 ring-offset-white' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-rose-700">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="h-12 rounded-2xl bg-zinc-700 text-zinc-100 text-base font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>

          {link && onDisconnect && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-200">
              <span className="text-sm font-medium text-zinc-800">Open Finance</span>
              <p className="text-[13px] text-zinc-800">
                Conectado pelo {link.bankName}. Desconectar para de atualizar todas as contas e cartões desse banco; o que já foi importado continua no app.
              </p>
              <button
                onClick={async () => {
                  if (!confirmUnlink) return setConfirmUnlink(true);
                  await onDisconnect(link.connectionId);
                }}
                className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold ${
                  confirmUnlink ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-950/5 text-zinc-950'
                }`}
              >
                <LinkSlashIcon className="w-5 h-5" />
                {confirmUnlink ? `Toque de novo para desconectar o ${link.bankName}` : `Desconectar ${link.bankName}`}
              </button>
            </div>
          )}

          <button
            onClick={async () => {
              if (!confirmDelete) return setConfirmDelete(true);
              await onDelete();
            }}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold ${
              confirmDelete ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
            }`}
          >
            <TrashIcon className="w-5 h-5" />
            {confirmDelete ? 'Toque de novo para remover' : 'Remover cartão'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardCarousel({ cards, getTotal, getCount, isPaid, hideValues, readOnly, onOpen, onDelete, onSave, getLink, onDisconnect }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [settingsFor, setSettingsFor] = useState<CreditCard | null>(null);
  // arrastar com o mouse (no celular o deslize já é nativo)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const onMouseDown = (e: React.MouseEvent) => {
    const el = scroller.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.style.scrollSnapType = 'none';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = scroller.current;
    const d = drag.current;
    if (!el || !d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const el = scroller.current;
    const d = drag.current;
    if (!el || !d) return;
    el.style.scrollSnapType = '';
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 12 : el.clientWidth;
    const i = Math.max(0, Math.min(cards.length - 1, Math.round(el.scrollLeft / step)));
    goTo(i);
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  const current = cards[Math.min(index, cards.length - 1)];
  if (!current) return null;

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 12 : el.clientWidth;
    const i = Math.round(el.scrollLeft / step);
    if (i !== index) {
      setIndex(i);
    }
  };

  const goTo = (i: number) => {
    const el = scroller.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft - el.offsetLeft - 24, behavior: 'smooth' });
  };

  const total = getTotal(current.id);
  const count = getCount(current.id);
  const paid = count > 0 && isPaid(current.id);
  const link = getLink?.(current) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scroller}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-4 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, i) => (
          <div key={card.id} className="relative snap-center shrink-0 w-[84%] max-w-[340px]">
          <button
            type="button"
            onClick={() => {
              if (drag.current?.moved) return;
              if (i === index) onOpen(card);
              else goTo(i);
            }}
            aria-label={`Cartão ${card.name}${card.lastDigits ? ` final ${card.lastDigits}` : ''}`}
            draggable={false}
            className="w-full text-left active:scale-[0.99] transition-transform"
          >
            <CardFace card={card} dim={i !== index} />
          </button>
          {!readOnly && i === index && (
            <button
              type="button"
              onClick={() => setSettingsFor(card)}
              aria-label={`Configurações do cartão ${card.name}`}
              className="absolute top-2.5 right-2.5 w-11 h-11 rounded-full flex items-center justify-center text-white bg-black/15 hover:bg-black/25 backdrop-blur-sm transition-colors"
            >
              <Cog6ToothIcon className="w-[22px] h-[22px]" />
            </button>
          )}
          </div>
        ))}
      </div>

      {cards.length > 1 && (
        <div role="group" aria-label="Escolher cartão" className="flex justify-center -mt-2">
          {cards.map((card, i) => (
            <button key={card.id} onClick={() => goTo(i)} aria-label={`Ver ${card.name}`} className="w-7 h-7 flex items-center justify-center">
              <span className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-5 bg-zinc-950' : 'w-1.5 bg-zinc-300'}`} />
            </button>
          ))}
        </div>
      )}

      <div className="mx-6 rounded-2xl bg-white/80 border border-zinc-200 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-800">Fatura do mês</p>
            <p className="text-[26px] font-bold tracking-tight font-mono text-zinc-950">{hideValues ? 'R$ •••••' : brl(total)}</p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
              count === 0 ? 'bg-zinc-950/5 text-zinc-800' : paid ? 'bg-zinc-100 text-zinc-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {count === 0 ? 'Sem compras' : paid ? 'Paga' : 'Em aberto'}
          </span>
        </div>
        <button
          onClick={() => onOpen(current)}
          className="h-12 rounded-xl bg-zinc-950/5 flex items-center justify-between px-4 text-[15px] font-medium text-zinc-950"
        >
          Ver {count} compra{count !== 1 ? 's' : ''} da fatura
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        {link && <LimitInfo link={link} hideValues={hideValues} />}
      </div>

      {settingsFor && (
        <CardSettings
          card={settingsFor}
          link={getLink?.(settingsFor) ?? null}
          onDisconnect={
            onDisconnect
              ? async (connectionId) => {
                  await onDisconnect(connectionId);
                  setSettingsFor(null);
                }
              : undefined
          }
          onClose={() => setSettingsFor(null)}
          onSave={async (patch) => {
            const ok = await onSave(settingsFor.id, patch);
            if (ok) setSettingsFor(null);
            return ok;
          }}
          onDelete={async () => {
            await onDelete(settingsFor.id);
            setSettingsFor(null);
            setIndex(0);
          }}
        />
      )}
    </div>
  );
}

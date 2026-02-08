'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useShare } from '@/context/ShareContext';
import {
  ArrowLeftIcon,
  ShareIcon,
  EnvelopeIcon,
  UserGroupIcon,
  TrashIcon,
  LinkIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

type ShareAsOwner = {
  id: string;
  inviteeEmail: string;
  token: string;
  status: string;
  createdAt: string;
  viewer: { id: string; email: string; name: string | null } | null;
};

export default function CompartilharPage() {
  const { user } = useAuth();
  const { loadShares, sharedAccountsAsViewer } = useShare();
  const [asOwner, setAsOwner] = useState<ShareAsOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<{ token: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchShares = async () => {
    try {
      const res = await fetch('/api/shares');
      const data = await res.json();
      if (res.ok && data.asOwner) {
        setAsOwner(data.asOwner);
      }
    } catch {
      setAsOwner([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
    loadShares();
  }, [loadShares]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Digite o email do convidado.');
      return;
    }
    setInviteSubmitting(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Erro ao enviar convite.');
        return;
      }
      setInviteSuccess({ token: data.share.token });
      setInviteEmail('');
      setAsOwner((prev) => [
        {
          id: data.share.id,
          inviteeEmail: data.share.inviteeEmail,
          token: data.share.token,
          status: data.share.status,
          createdAt: data.share.createdAt,
          viewer: null,
        },
        ...prev,
      ]);
    } catch {
      setInviteError('Erro ao enviar convite.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/shares/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAsOwner((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setRemovingId(null);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/convite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">Faça login para gerenciar compartilhamentos.</p>
      </div>
    );
  }

  const accepted = asOwner.filter((s) => s.status === 'ACCEPTED');
  const pending = asOwner.filter((s) => s.status === 'PENDING');

  return (
    <div className="min-h-screen pb-24">
      <header className="px-6 pt-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShareIcon className="w-7 h-7 text-emerald-500" />
          Compartilhar conta
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Convide pessoas para visualizar seus gastos e entradas (somente leitura).
        </p>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Convidar por email */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5 text-emerald-500" />
            Convidar por email
          </h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={inviteSubmitting}
            />
            <button
              type="submit"
              disabled={inviteSubmitting}
              className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              {inviteSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LinkIcon className="w-5 h-5" />
              )}
              Convidar
            </button>
          </form>
          {inviteError && (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                Convite criado! Envie o link abaixo para a pessoa:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg truncate">
                  {typeof window !== 'undefined' && `${window.location.origin}/convite/${inviteSuccess.token}`}
                </code>
                <button
                  type="button"
                  onClick={() => copyInviteLink(inviteSuccess.token)}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                  title="Copiar link"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
              {copiedToken === inviteSuccess.token && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Link copiado!</p>
              )}
            </div>
          )}
        </section>

        {/* Pessoas com acesso */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-emerald-500" />
            Pessoas com acesso
          </h2>
          {loading ? (
            <div className="text-zinc-500 text-sm">Carregando...</div>
          ) : accepted.length === 0 && pending.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ninguém tem acesso ainda. Convide pelo email acima.
            </p>
          ) : (
            <ul className="space-y-2">
              {accepted.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium">
                      {s.viewer?.name || s.viewer?.email || s.inviteeEmail}
                    </p>
                    {s.viewer?.email && (
                      <p className="text-sm text-zinc-500">{s.viewer.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    disabled={removingId === s.id}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                    title="Remover acesso"
                  >
                    {removingId === s.id ? (
                      <span className="w-5 h-5 block border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                </li>
              ))}
              {pending.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                >
                  <div>
                    <p className="font-medium">{s.inviteeEmail}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Convite pendente</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyInviteLink(s.token)}
                      className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      title="Copiar link do convite"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemove(s.id)}
                      disabled={removingId === s.id}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                      title="Cancelar convite"
                    >
                      {removingId === s.id ? (
                        <span className="w-5 h-5 block border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contas que você visualiza */}
        {sharedAccountsAsViewer.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Contas que você visualiza</h2>
            <ul className="space-y-2">
              {sharedAccountsAsViewer.map((acc) => (
                <li
                  key={acc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium">
                      Conta de {acc.owner?.name || acc.owner?.email || '...'}
                    </p>
                    <p className="text-sm text-zinc-500">Somente leitura</p>
                  </div>
                  <Link
                    href="/"
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Ver dashboard
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

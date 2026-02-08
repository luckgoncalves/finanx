'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useShare } from '@/context/ShareContext';
import { useFinance } from '@/context/FinanceContext';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type InviteInfo = {
  inviteeEmail: string;
  owner: { id: string; name: string | null; email: string } | null;
};

export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { user } = useAuth();
  const { setViewAs, loadShares } = useShare();
  const { refreshData } = useFinance();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'accepted' | 'rejected' | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Link inválido.');
      return;
    }
    fetch(`/api/shares/invite/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setInvite(null);
        } else {
          setInvite({
            inviteeEmail: data.inviteeEmail,
            owner: data.owner,
          });
        }
      })
      .catch(() => setError('Erro ao carregar convite.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/shares/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accept: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao aceitar.');
        return;
      }
      setResult('accepted');
      setViewAs(data.ownerId);
      await loadShares();
      await refreshData();
      setTimeout(() => router.push('/'), 500);
    } catch {
      setError('Erro ao aceitar convite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/shares/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accept: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao recusar.');
        return;
      }
      setResult('rejected');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setError('Erro ao recusar convite.');
    } finally {
      setSubmitting(false);
    }
  };

  const myEmail = user?.email?.toLowerCase();
  const inviteeEmail = invite?.inviteeEmail?.toLowerCase();
  const canAccept = user && myEmail === inviteeEmail;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen px-6 pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar
        </Link>
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-center">
          <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          <Link href="/" className="inline-block mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  if (result === 'accepted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckIcon className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="text-lg font-medium text-center">Convite aceito! Redirecionando...</p>
      </div>
    );
  }

  if (result === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center mb-4">
          <XMarkIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <p className="text-lg font-medium text-center">Convite recusado. Redirecionando...</p>
      </div>
    );
  }

  const ownerName = invite?.owner?.name || invite?.owner?.email || 'alguém';

  return (
    <div className="min-h-screen px-6 pt-12 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Voltar
      </Link>

      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <UserGroupIcon className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Convite para visualizar conta</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          <strong>{ownerName}</strong> convidou você para visualizar a conta financeira (somente leitura).
        </p>

        {!user ? (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6">
            <p className="text-amber-700 dark:text-amber-400 text-sm mb-4">
              Faça login com o email <strong>{invite?.inviteeEmail}</strong> para aceitar o convite.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/convite/${token}`)}`}
              className="inline-block w-full py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600"
            >
              Ir para login
            </Link>
          </div>
        ) : !canAccept ? (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6">
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Este convite foi enviado para <strong>{invite?.inviteeEmail}</strong>. Você está logado como{' '}
              <strong>{user.email}</strong>. Faça login com o email do convite para aceitar.
            </p>
            <Link href="/login" className="inline-block mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              Trocar de conta
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Recusar
              </button>
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckIcon className="w-5 h-5" />
                )}
                Aceitar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

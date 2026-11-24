'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { OpenFinancePanel } from '@/components/OpenFinancePanel';
import { useFinance } from '@/context/FinanceContext';

export default function ContasPage() {
  const { refreshData } = useFinance();
  return (
    <div className="min-h-screen">
      <div className="px-5 pt-8 pb-6 max-w-lg mx-auto flex flex-col gap-4">
        <Link href="/cartoes" className="self-start -ml-2 inline-flex items-center gap-1 h-11 px-2 text-sm font-medium text-zinc-700">
          <ChevronLeftIcon className="w-4 h-4" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Contas conectadas</h1>
          <p className="text-sm text-zinc-800 mt-1">Bancos ligados pelo Open Finance. Adicione ou desconecte por aqui.</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto">
        <OpenFinancePanel onSynced={refreshData} />
      </div>
    </div>
  );
}

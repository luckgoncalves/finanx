'use client';

import { useShare } from '@/context/ShareContext';
import { useFinance } from '@/context/FinanceContext';
import { EyeIcon } from '@heroicons/react/24/outline';

export function ViewerBanner() {
  const { viewAsOwnerId, sharedAccountsAsViewer } = useShare();
  const { isViewerMode } = useFinance();

  if (!isViewerMode || !viewAsOwnerId) return null;

  const account = sharedAccountsAsViewer.find((a) => a.ownerId === viewAsOwnerId);
  const label = account?.owner?.name || account?.owner?.email || 'esta conta';

  return (
    <div className="mx-4 mt-4 mb-2 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-700 dark:text-amber-400 text-sm">
      <EyeIcon className="w-5 h-5 shrink-0" />
      <span>
        Você está visualizando a conta de <strong>{label}</strong>. Somente leitura.
      </span>
    </div>
  );
}

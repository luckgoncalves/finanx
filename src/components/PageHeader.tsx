'use client';

import { ReactNode } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useUI } from '@/context/UIContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { MonthSelector } from './MonthSelector';
import { UserMenu } from './UserMenu';

interface Props {
  title: string;
  kicker?: string;
  /** botões extras à direita, antes do olho e do perfil */
  actions?: ReactNode;
  showMonth?: boolean;
}

/** Cabeçalho único das telas: título + ações; abaixo, o mês. */
export function PageHeader({ title, kicker, actions, showMonth = true }: Props) {
  const { hideValues, toggleHideValues } = useUI();
  const { showOnboarding } = useOnboarding();

  return (
    <header className="px-5 pt-5 pb-1 max-w-lg mx-auto w-full flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3 min-h-11">
        <div className="min-w-0">
          {kicker && <p className="text-[13px] text-zinc-800">{kicker}</p>}
          <h1 className="text-[26px] leading-tight font-bold tracking-tight text-zinc-950 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <button
            onClick={toggleHideValues}
            aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            className="w-11 h-11 rounded-full flex items-center justify-center text-zinc-800"
          >
            {hideValues ? <EyeSlashIcon className="w-[22px] h-[22px]" /> : <EyeIcon className="w-[22px] h-[22px]" />}
          </button>
          <UserMenu onShowOnboarding={showOnboarding} />
        </div>
      </div>
      {showMonth && <MonthSelector />}
    </header>
  );
}

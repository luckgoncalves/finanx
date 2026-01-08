'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg ${className}`}
    />
  );
}

// Skeleton para o SummaryCard
export function SummaryCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-zinc-200 dark:bg-zinc-800 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-700 rounded" />
          <div className="h-8 w-32 bg-zinc-300 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
        </div>
        <div className="w-9 h-9 bg-zinc-300 dark:bg-zinc-700 rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton para cards menores (Pagas/Pendentes)
export function SmallCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
      <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
  );
}

// Skeleton para o dashboard de categorias
export function CategoryDashboardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark animate-pulse">
      {/* Círculo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-40 h-40 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      
      {/* Barras */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para item de transação
export function TransactionItemSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton para lista de transações
export function TransactionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {/* Date separator */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
      </div>
      
      {Array.from({ length: count }).map((_, i) => (
        <TransactionItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton completo para página de despesas
export function DespesasPageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        <SummaryCardSkeleton />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <SmallCardSkeleton />
          <SmallCardSkeleton />
        </div>
      </header>

      {/* Categories */}
      <section className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <CategoryDashboardSkeleton />
      </section>

      {/* Transaction List */}
      <section className="px-6 pb-24">
        <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
        <TransactionListSkeleton count={4} />
      </section>
    </div>
  );
}

// Skeleton para página de entradas
export function EntradasPageSkeleton() {
  return (
    <div className="min-h-screen">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        <SummaryCardSkeleton />
      </header>

      <section className="px-6 pb-24">
        <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
        <TransactionListSkeleton count={4} />
      </section>
    </div>
  );
}

// Skeleton para dashboard principal
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>

        <div className="flex justify-center mb-6">
          <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        <div className="space-y-4">
          <SummaryCardSkeleton />
          <div className="grid grid-cols-2 gap-3">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        </div>
      </header>

      <section className="px-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
        <TransactionListSkeleton count={3} />
      </section>
    </div>
  );
}


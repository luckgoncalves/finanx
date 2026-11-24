"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  BuildingLibraryIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface Connection {
  id: string;
  itemId: string;
  bankName: string | null;
  status: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface AccountBalance {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  creditLimit: number | null;
  dueDate: string | null;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function accountLabel(a: AccountBalance) {
  if (a.type === "CREDIT") return `Cartão ${a.name}`;
  if (a.subtype === "SAVINGS_ACCOUNT") return "Poupança";
  return "Conta corrente";
}

interface SyncResult {
  bankName: string | null;
  billsProcessed: number;
  purchasesImported: number;
  billsMarkedPaid: number;
  expensesMarkedPaid: { description: string }[];
  error?: string;
}

function formatWhen(iso: string | null) {
  if (!iso) return "nunca sincronizado";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OpenFinancePanel({
  onSynced,
}: {
  onSynced?: () => void | Promise<void>;
}) {
  const [configured, setConfigured] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemId, setItemId] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [balances, setBalances] = useState<Record<string, AccountBalance[]>>(
    {},
  );
  const [balancesLoading, setBalancesLoading] = useState(false);

  const loadBalances = useCallback(async () => {
    setBalancesLoading(true);
    try {
      const res = await fetch("/api/bank-connections/accounts");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, AccountBalance[]> = {};
      for (const b of data.banks || []) map[b.connectionId] = b.accounts;
      setBalances(map);
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/bank-connections");
      if (!res.ok) return;
      const data = await res.json();
      setConfigured(data.configured);
      setConnections(data.connections || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (configured && connections.length > 0) loadBalances();
  }, [configured, connections.length, loadBalances]);

  const add = async () => {
    setAdding(true);
    setMessage("");
    try {
      const res = await fetch("/api/bank-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Erro ao conectar");
      } else {
        setItemId("");
        await load();
      }
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/bank-connections/${id}`, { method: "DELETE" });
    await load();
  };

  const sync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/bank-connections/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Erro ao sincronizar");
      } else {
        const results: SyncResult[] = data.results || [];
        const imported = results.reduce((s, r) => s + r.purchasesImported, 0);
        const paid = results.reduce(
          (s, r) => s + r.billsMarkedPaid + r.expensesMarkedPaid.length,
          0,
        );
        const errors = results
          .filter((r) => r.error)
          .map((r) => r.bankName || "banco");
        setMessage(
          `${imported} compra(s) de cartão importada(s), ${paid} conta(s)/fatura(s) marcada(s) como paga(s).` +
            (errors.length ? ` Falhou: ${errors.join(", ")}.` : ""),
        );
        await onSynced?.();
      }
      await load();
      await loadBalances();
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return null;

  return (
    <section className="mx-6 mb-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BuildingLibraryIcon className="w-5 h-5 text-zinc-700" />
          <h2 className="font-semibold">Open Finance</h2>
        </div>
        {connections.length > 0 && (
          <button
            onClick={sync}
            disabled={syncing || !configured}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        )}
      </div>

      {!configured && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
          Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no servidor para
          ativar.
        </p>
      )}

      {Object.keys(balances).length > 0 && (
        <p className="text-sm mb-3">
          <span className="text-zinc-500 dark:text-zinc-400">
            Saldo em contas:{" "}
          </span>
          <span className="font-mono font-semibold">
            {brl(
              Object.values(balances)
                .flat()
                .filter((a) => a.type !== "CREDIT")
                .reduce((s, a) => s + a.balance, 0),
            )}
          </span>
        </p>
      )}

      {connections.length > 0 && (
        <ul className="space-y-3 mb-3">
          {connections.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {c.bankName || c.itemId}
                  </p>
                  <p
                    className={`text-xs ${c.lastError ? "text-rose-500" : "text-zinc-400"}`}
                  >
                    {c.lastError
                      ? `Erro: ${c.lastError.slice(0, 80)}`
                      : formatWhen(c.lastSyncAt)}
                  </p>
                </div>
                <button
                  onClick={() => remove(c.id)}
                  title="Desconectar"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              {(balances[c.id]?.length ?? 0) > 0 ? (
                <ul className="mt-1 ml-1 space-y-0.5">
                  {balances[c.id].map((a) => (
                    <li
                      key={a.id}
                      className={`flex justify-between gap-x-2 text-xs ${a.type === "CREDIT" ? "flex-wrap items-baseline" : "items-center"}`}
                    >
                      <span className="text-zinc-500 dark:text-zinc-400 min-w-0">
                        {accountLabel(a)}
                      </span>
                      {a.type === "CREDIT" ? (
                        <span className="font-mono text-rose-600 dark:text-rose-400 ml-auto whitespace-nowrap">
                          {brl(a.balance)}
                          {a.creditLimit ? (
                            <span className="text-zinc-400">
                              {" / "}
                              {a.creditLimit.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span
                          className={`font-mono shrink-0 ${a.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                        >
                          {brl(a.balance)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : balancesLoading ? (
                <p className="mt-1 ml-1 text-xs text-zinc-400">
                  Carregando saldos...
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          placeholder="Item ID do Meu Pluggy"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-indigo-400"
        />
        <button
          onClick={add}
          disabled={adding || !itemId.trim() || !configured}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Conectar
        </button>
      </div>

      {message && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
          {message}
        </p>
      )}
      <p className="text-xs text-zinc-400 mt-3">
        Somente leitura. As faturas viram contas a pagar com vencimento, e os
        pagamentos são marcados sozinhos (os dados do banco atualizam a cada
        24h).
      </p>
    </section>
  );
}

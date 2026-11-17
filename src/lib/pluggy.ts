// Cliente mínimo da API da Pluggy (Open Finance, somente leitura).
// Roda apenas no servidor: as credenciais vêm de PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET.

const BASE_URL = 'https://api.pluggy.ai';

export interface PluggyItem {
  id: string;
  status: string;
  lastUpdatedAt: string | null;
  connector: { id: number; name: string };
}

export interface PluggyAccount {
  id: string;
  itemId: string;
  type: 'BANK' | 'CREDIT' | string;
  subtype: string;
  name: string;
  number: string | null;
  balance: number;
  creditData?: {
    brand?: string | null;
    balanceDueDate?: string | null;
    minimumPayment?: number | null;
    creditLimit?: number | null;
  } | null;
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  category: string | null;
  status?: string;
  creditCardMetadata?: {
    billForecastDate?: string | null; // 'YYYY-MM'
    purchaseDate?: string | null;
    installmentNumber?: number | null;
    totalInstallments?: number | null;
  } | null;
}

export interface PluggyBill {
  id: string;
  dueDate: string;
  totalAmount: number;
  minimumPaymentAmount: number | null;
}

let cachedKey: { value: string; expiresAt: number } | null = null;

export function isPluggyConfigured(): boolean {
  return Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
}

async function getApiKey(): Promise<string> {
  if (cachedKey && cachedKey.expiresAt > Date.now()) return cachedKey.value;
  if (!isPluggyConfigured()) throw new Error('PLUGGY_CLIENT_ID/PLUGGY_CLIENT_SECRET não configurados');

  const res = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Pluggy auth falhou (HTTP ${res.status})`);
  const { apiKey } = (await res.json()) as { apiKey: string };
  // A apiKey vale 2h; renova com folga.
  cachedKey = { value: apiKey, expiresAt: Date.now() + 90 * 60 * 1000 };
  return apiKey;
}

async function get<T>(path: string): Promise<T> {
  const apiKey = await getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-API-KEY': apiKey },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pluggy GET ${path.split('?')[0]} falhou (HTTP ${res.status}) ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export function getItem(itemId: string) {
  return get<PluggyItem>(`/items/${encodeURIComponent(itemId)}`);
}

export async function listAccounts(itemId: string) {
  const data = await get<{ results: PluggyAccount[] }>(`/accounts?itemId=${encodeURIComponent(itemId)}`);
  return data.results;
}

export async function listBills(accountId: string) {
  const data = await get<{ results: PluggyBill[] }>(`/bills?accountId=${encodeURIComponent(accountId)}`);
  return data.results ?? [];
}

/**
 * Lista transações (mais recentes primeiro) até a data `since` (YYYY-MM-DD).
 * Usa /v2/transactions com paginação por cursor.
 */
export async function listTransactionsSince(accountId: string, since: string, maxPages = 20) {
  const out: PluggyTransaction[] = [];
  let query: string | null = `?accountId=${encodeURIComponent(accountId)}`;
  for (let page = 0; query && page < maxPages; page++) {
    const data: { results: PluggyTransaction[]; next?: string | null } = await get(`/v2/transactions${query}`);
    const results = data.results ?? [];
    out.push(...results);
    if (results.length === 0 || results.some((t) => t.date.slice(0, 10) < since)) break;
    query = data.next ?? null;
  }
  return out.filter((t) => t.date.slice(0, 10) >= since);
}

import { ParsedTransaction } from './ofx';

function detectSeparator(line: string): string {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons >= commas) return ';';
  return ',';
}

function splitLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseBRDate(dateStr: string): string {
  const s = dateStr.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return s;
}

function parseAmount(raw: string): number {
  const s = raw.trim().replace(/\s/g, '').replace(/R\$\s?/gi, '');
  // 1.234,56 → BR com separador de milhar
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  // 39,90 → BR decimal
  if (/^-?\d+,\d+$/.test(s)) {
    return parseFloat(s.replace(',', '.'));
  }
  // 39.90 padrão
  const num = parseFloat(s.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? NaN : num;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 /]/g, '')
    .trim();
}

// Retorna a data no mês atual (mês de importação), mantendo o dia original
function toImportMonth(dateStr: string): string {
  const day = parseInt(dateStr.split('-')[2], 10);
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(actualDay).padStart(2, '0')
  );
}

// Adiciona N meses a uma data YYYY-MM-DD
function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1 + months, 1);
  // Usa o mínimo entre o dia original e o último dia do mês destino
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Detecta padrão de parcela: "9/10", "9 / 10", "09/10"
function parseInstallment(raw: string): { current: number; total: number } | null {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(raw.trim());
  if (!m) return null;
  const current = parseInt(m[1]);
  const total = parseInt(m[2]);
  if (current < 1 || total < 1 || current > total) return null;
  return { current, total };
}

// Prioridade: nomes mais específicos primeiro para evitar match errado
const DATE_NAMES = [
  'data de compra', 'data compra', 'data lancamento', 'data lançamento',
  'dt lancamento', 'dt lançamento', 'date', 'data', 'dt',
];
const TITLE_NAMES = [
  'descricao', 'descrição', 'lancamento', 'lançamento', 'historico',
  'histórico', 'estabelecimento', 'transacao', 'transação', 'memo',
  'title', 'description', 'nome', 'titulo',
];
// "valor em r" captura "Valor (em R$)" do C6 antes do genérico "valor"
const AMOUNT_NAMES = [
  'valor em r', 'valor r', 'valor brl',
  'amount', 'valor', 'value', 'quantia', 'montante', 'total', 'vlr',
];
const INSTALLMENT_NAMES = [
  'parcela', 'parcel', 'installment', 'parc',
];

function findColumn(headers: string[], names: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const name of names) {
    const norm = normalizeHeader(name);
    const exact = normalized.indexOf(norm);
    if (exact !== -1) return exact;
  }
  // Partial match como fallback
  for (const name of names) {
    const norm = normalizeHeader(name);
    const idx = normalized.findIndex((h) => h.includes(norm) || norm.includes(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

// C6 Bank: gastos são positivos, créditos/pagamentos são negativos
// Nubank e outros: gastos são negativos, créditos são positivos
function detectSignConvention(headers: string[]): 'c6' | 'standard' {
  const norm = headers.map(normalizeHeader);
  const isC6 = norm.some(
    (h) => h.includes('nome no cartao') || h.includes('final do cartao')
  );
  return isC6 ? 'c6' : 'standard';
}

function getTransactionType(amount: number, convention: 'c6' | 'standard'): 'income' | 'expense' {
  if (convention === 'c6') return amount > 0 ? 'expense' : 'income';
  return amount < 0 ? 'expense' : 'income';
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Encontra a linha de cabeçalho real (alguns bancos adicionam linhas antes)
  let headerLineIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const sep = detectSeparator(lines[i]);
    const cols = splitLine(lines[i], sep);
    const textCols = cols.filter((c) => /[a-zA-ZÀ-ú]/.test(c));
    if (textCols.length >= 3) {
      headerLineIdx = i;
      break;
    }
  }

  const sep = detectSeparator(lines[headerLineIdx]);
  const headers = splitLine(lines[headerLineIdx], sep);
  const convention = detectSignConvention(headers);

  const dateIdx = findColumn(headers, DATE_NAMES);
  const titleIdx = findColumn(headers, TITLE_NAMES);
  const amountIdx = findColumn(headers, AMOUNT_NAMES);
  const installmentIdx = findColumn(headers, INSTALLMENT_NAMES);

  if (dateIdx === -1 || titleIdx === -1 || amountIdx === -1) return [];

  const maxIdx = Math.max(dateIdx, titleIdx, amountIdx);
  const transactions: ParsedTransaction[] = [];

  lines.slice(headerLineIdx + 1).forEach((line, idx) => {
    const cols = splitLine(line, sep);
    if (cols.length <= maxIdx) return;

    const date = parseBRDate(cols[dateIdx]);
    const baseDescription = cols[titleIdx].trim();
    const amount = parseAmount(cols[amountIdx]);

    if (!date || !baseDescription || isNaN(amount) || amount === 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

    const type = getTransactionType(amount, convention);
    const absAmount = Math.abs(amount);

    // Verifica se há coluna de parcela com valor "N/X"
    const installmentRaw = installmentIdx !== -1 ? cols[installmentIdx]?.trim() : '';
    const installment = installmentRaw ? parseInstallment(installmentRaw) : null;

    if (installment) {
      const { current, total } = installment;

      if (total === 1) {
        // Parcela única (1/1): usa o mês de importação como data da fatura.
        // Guarda a data original como data da compra.
        const billingDate = toImportMonth(date);
        transactions.push({
          externalId: `csv-${date}-${baseDescription}-${absAmount}-${idx}-p1`,
          description: baseDescription,
          amount: absAmount,
          date: billingDate,
          purchaseDate: date !== billingDate ? date : undefined,
          type,
        });
      } else {
        // A parcela mostrada no CSV é a parcela do mês atual (mês de importação).
        // Parcela `current` → mês de importação, parcela `current+k` → mês de importação + k.
        // Ex: compra 19/01/2026, parcela 5/10, importado em jun/2026
        //   → parcela 5 = jun/2026, 6 = jul, ..., 10 = nov/2026
        const baseDate = toImportMonth(date); // mês de importação, dia da compra
        for (let p = current; p <= total; p++) {
          const billingDate = addMonths(baseDate, p - current);
          transactions.push({
            externalId: `csv-${date}-${baseDescription}-${absAmount}-${idx}-p${p}`,
            description: `${baseDescription} ${p}/${total}`,
            amount: absAmount,
            date: billingDate,
            purchaseDate: date,
            type,
          });
        }
      }
    } else {
      // Se o CSV tem coluna Parcela (Nubank): usa o mês de importação para evitar
      // compras pós-fechamento caírem no mês anterior.
      // Guarda a data original como data da compra quando diferir.
      const txDate = installmentIdx !== -1 ? toImportMonth(date) : date;
      transactions.push({
        externalId: `csv-${date}-${baseDescription}-${amount}-${idx}`,
        description: baseDescription,
        amount: absAmount,
        date: txDate,
        purchaseDate: txDate !== date ? date : undefined,
        type,
      });
    }
  });

  return transactions;
}

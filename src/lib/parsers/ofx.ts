export interface ParsedTransaction {
  externalId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD — data da fatura (billing date)
  purchaseDate?: string; // YYYY-MM-DD — data da compra (só quando diferente de date)
  type: 'income' | 'expense';
}

export interface PreviewTransaction extends ParsedTransaction {
  suggestedCategory: string;
  isDuplicate: boolean;
}

function extractValue(block: string, tag: string): string {
  // XML: <TAG>value</TAG>
  const xmlMatch = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'i').exec(block);
  if (xmlMatch) return xmlMatch[1].trim();

  // SGML: <TAG>value (value until next tag or line break)
  const sgmlMatch = new RegExp(`<${tag}>([^<\\n\\r]+)`, 'i').exec(block);
  if (sgmlMatch) return sgmlMatch[1].trim();

  return '';
}

function parseOFXDate(dateStr: string): string {
  // Formats: 20240115, 20240115120000, 20240115120000[-3:BRT]
  const cleaned = dateStr.replace(/\[.*\]/, '').trim();
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);
  return `${year}-${month}-${day}`;
}

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Split on <STMTTRN> works for both SGML (no closing tags) and XML
  const parts = content.split(/<STMTTRN>/i);

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];

    const fitid = extractValue(block, 'FITID');
    const dtposted = extractValue(block, 'DTPOSTED');
    const trnamt = extractValue(block, 'TRNAMT');
    const memo = extractValue(block, 'MEMO') || extractValue(block, 'NAME');

    if (!dtposted || !trnamt) continue;

    const amount = parseFloat(trnamt.replace(',', '.'));
    if (isNaN(amount)) continue;

    const date = parseOFXDate(dtposted);
    const description = (memo || 'Transação importada').trim();

    transactions.push({
      externalId: fitid || `ofx-${date}-${Math.abs(amount)}-${i}`,
      description,
      amount: Math.abs(amount),
      date,
      type: amount < 0 ? 'expense' : 'income',
    });
  }

  return transactions;
}

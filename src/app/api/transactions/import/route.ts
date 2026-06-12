import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { parseOFX, PreviewTransaction } from '@/lib/parsers/ofx';
import { parseCSV } from '@/lib/parsers/csv';
import { suggestCategory } from '@/lib/parsers/categoryMapper';

export type { PreviewTransaction };

// Lê o token diretamente do NextRequest (sem depender do contexto next/headers)
async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// POST /api/transactions/import?action=preview  → parse + verificar duplicatas
// POST /api/transactions/import                  → salvar transações selecionadas
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'preview') {
      return handlePreview(request, session.userId);
    }

    return handleImport(request, session.userId);
  } catch (error) {
    console.error('[import] Unhandled error:', error);
    return NextResponse.json({ error: 'Erro interno ao processar importação' }, { status: 500 });
  }
}

async function handlePreview(request: NextRequest, userId: string) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
  }

  const content = await file.text();
  const filename = file.name.toLowerCase();

  let parsed;
  let source: string;

  if (filename.endsWith('.ofx') || content.includes('OFXHEADER') || content.includes('<OFX>')) {
    parsed = parseOFX(content);
    source = 'ofx';
  } else if (filename.endsWith('.csv') || content.includes(',')) {
    parsed = parseCSV(content);
    source = 'csv';
  } else {
    return NextResponse.json({ error: 'Formato não suportado. Use .ofx ou .csv' }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo' }, { status: 422 });
  }

  // Verifica duplicatas apenas no intervalo de datas do arquivo
  // Transações são salvas com T12:00:00, então maxDate vai até o fim do último dia
  const parsedDates = parsed.map((t) => new Date(t.date + 'T00:00:00'));
  const minDate = new Date(Math.min(...parsedDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...parsedDates.map((d) => d.getTime())));
  maxDate.setHours(23, 59, 59, 999);

  const existing = await prisma.transaction.findMany({
    where: { userId, date: { gte: minDate, lte: maxDate } },
    select: { date: true, amount: true, description: true },
  });

  const existingKeys = new Set(
    existing.map(
      (t) => `${t.date.toISOString().split('T')[0]}|${Number(t.amount)}|${t.description.toLowerCase()}`
    )
  );

  const transactions: PreviewTransaction[] = parsed.map((t) => ({
    ...t,
    suggestedCategory: suggestCategory(t.description),
    isDuplicate: existingKeys.has(`${t.date}|${t.amount}|${t.description.toLowerCase()}`),
  }));

  return NextResponse.json({ transactions, source, total: transactions.length });
}

async function handleImport(request: NextRequest, userId: string) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const { transactions, source, creditCardId } = body as {
    source: string;
    creditCardId?: string | null;
    transactions: {
      description: string;
      amount: number;
      date: string;
      purchaseDate?: string | null;
      type: 'income' | 'expense';
      category: string;
    }[];
  };

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: 'Nenhuma transação para importar' }, { status: 400 });
  }

  try {
    const result = await prisma.transaction.createMany({
      data: transactions.map((t) => {
        const date = new Date(t.date + 'T12:00:00');
        return {
          userId,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          paid: t.type === 'expense' ? false : true,
          isInstallment: false,
          isRecurring: false,
          importSource: source || 'import',
          creditCardId: creditCardId || null,
          purchaseDate: t.purchaseDate ? new Date(t.purchaseDate + 'T12:00:00') : null,
        };
      }),
    });

    return NextResponse.json({ imported: result.count });
  } catch (error) {
    console.error('[import] Prisma error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar no banco. Verifique se a migration foi aplicada.' },
      { status: 500 }
    );
  }
}

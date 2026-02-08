import { NextResponse } from 'next/server';

/**
 * Diagnóstico das chaves VAPID no servidor.
 * Chame com: GET /api/push/vapid-status?secret=SEU_CRON_SECRET
 * Use só para debug; remova ou proteja em produção.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const querySecret = new URL(request.url).searchParams.get('secret');
  if (!secret || querySecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? '';

  const publicLen = publicKey.length;
  const privateLen = privateKey.length;

  // Chaves VAPID em base64url costumam ter ~88 (pública) e ~43 (privada) caracteres
  const publicOk = publicLen >= 80 && publicLen <= 100;
  const privateOk = privateLen >= 40 && privateLen <= 50;
  const bothSet = publicLen > 0 && privateLen > 0;

  return NextResponse.json({
    publicKeyLength: publicLen,
    privateKeyLength: privateLen,
    publicKeyLooksValid: publicOk,
    privateKeyLooksValid: privateOk,
    bothSet,
    hint: !bothSet
      ? 'Falta definir NEXT_PUBLIC_VAPID_PUBLIC_KEY e/ou VAPID_PRIVATE_KEY no Vercel.'
      : !publicOk || !privateOk
        ? 'Uma das chaves pode estar truncada ou com caractere extra (copie de novo, uma linha só, sem quebra).'
        : 'Tamanhos OK. Se ainda der 403, confira se o par é o mesmo (gerado junto) e se no app você desativou e ativou as notificações depois do último deploy.',
  });
}

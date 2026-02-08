import webPush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (privateKey && publicKey) {
  webPush.setVapidDetails(
    'mailto:finanx@localhost',
    publicKey,
    privateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: { url?: string };
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  if (!privateKey || !publicKey) {
    console.warn('VAPID keys not set, skipping push');
    return false;
  }
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 410 || status === 404) {
      return false;
    }
    console.error('web-push error:', err);
    return false;
  }
}

export function isWebPushConfigured(): boolean {
  return Boolean(privateKey && publicKey);
}

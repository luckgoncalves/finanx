'use client';

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return new Uint8Array(outputArray);
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClient = typeof window !== 'undefined' && typeof navigator !== 'undefined';

  const isIOS = isClient && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const isStandalone = isClient && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  const hasServiceWorker = isClient && 'serviceWorker' in navigator;
  const hasNotification = isClient && typeof Notification !== 'undefined';
  const hasVapid = Boolean(VAPID_PUBLIC);
  const isSupported = isClient &&
    hasServiceWorker &&
    hasNotification &&
    (hasVapid || isIOS);

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      return reg.pushManager.getSubscription();
    }).then((sub) => {
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      setError('Notificações não disponíveis');
      return false;
    }
    if (!VAPID_PUBLIC) {
      setError('Chave de notificação não está no app. No Vercel, confira a variável NEXT_PUBLIC_VAPID_PUBLIC_KEY e faça um novo deploy (Redeploy).');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== 'granted') {
        setError('Permissão negada');
        return false;
      }
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || `Erro ${res.status}. Tente de novo.`);
        return false;
      }
      setIsSubscribed(true);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao ativar notificações';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, registration]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;
    setLoading(true);
    setError(null);
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      return true;
    } catch {
      setError('Erro ao desativar');
      return false;
    } finally {
      setLoading(false);
    }
  }, [registration]);

  const clearAllSubscriptions = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/push/subscribe/all', { method: 'DELETE' });
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      setIsSubscribed(false);
      return true;
    } catch {
      setError('Erro ao limpar inscrições');
      return false;
    } finally {
      setLoading(false);
    }
  }, [registration]);

  return {
    isSupported,
    isIOS: isIOS ?? false,
    isStandalone: isStandalone ?? false,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    clearAllSubscriptions,
    unsubscribe,
  };
}

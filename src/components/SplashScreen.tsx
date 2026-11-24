'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const MIN_MS = 1300;
const KEY = 'finanx-splash-seen';

/** Splash de abertura: aparece uma vez por sessão, até o login carregar (mínimo ~1,3s). */
export function SplashScreen() {
  const { loading } = useAuth();
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [start] = useState(() => Date.now());

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    if (!seen) return;
    const t = setTimeout(() => setShow(false), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show || loading) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - start));
    const t1 = setTimeout(() => setLeaving(true), wait);
    const t2 = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
    }, wait + 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [show, loading, start]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(180deg, #EAF7EC 0%, #DAF1DE 55%, #C3E0CA 100%)' }}
    >
      <span aria-hidden="true" className="absolute -left-[120px] -top-[140px] w-[360px] h-[360px] rounded-full bg-white/45" />
      <span aria-hidden="true" className="absolute -right-[150px] -bottom-[120px] w-[380px] h-[380px] rounded-full bg-[#8EB69B]/20" />

      <div className="relative flex flex-col items-center gap-[22px] -mt-10">
        <div className="relative w-28 h-28">
          <span aria-hidden="true" className="fx-ring absolute inset-0 rounded-[34px] border-2 border-[#8EB69B]" />
          <div
            role="img"
            aria-label="Finanx"
            className="fx-mark absolute inset-0 rounded-[34px] flex items-end justify-center gap-[9px] pb-7 shadow-[0_18px_40px_rgba(11,43,38,0.30),inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={{ background: 'linear-gradient(160deg, #235347 0%, #0B2B26 100%)' }}
          >
            <span className="fx-b1 w-3.5 h-[26px] rounded-[5px] bg-[#8EB69B]" />
            <span className="fx-b2 w-3.5 h-10 rounded-[5px] bg-[#C3E0CA]" />
            <span className="fx-b3 w-3.5 h-14 rounded-[5px] bg-[#DAF1DE]" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="fx-word text-[40px] leading-none font-extrabold tracking-[-0.03em] text-[#051F20]">finanx</span>
          <span className="fx-tag text-[15px] text-[#163832]">Seu dinheiro, simples.</span>
        </div>
      </div>

      <div role="status" aria-label="Carregando" className="absolute bottom-[72px] inset-x-0 flex justify-center gap-2">
        <span className="fx-d1 w-2 h-2 rounded-full bg-[#235347]" />
        <span className="fx-d2 w-2 h-2 rounded-full bg-[#235347]" />
        <span className="fx-d3 w-2 h-2 rounded-full bg-[#235347]" />
      </div>
    </div>
  );
}

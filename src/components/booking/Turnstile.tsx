"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

/**
 * Vérification anti-robot Cloudflare Turnstile — facultative.
 * Active uniquement si NEXT_PUBLIC_TURNSTILE_SITE_KEY est défini (et TURNSTILE_SECRET_KEY côté serveur).
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | null = null;
    const el = ref.current;
    const mount = () => {
      const ts = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (!ts || widgetId) return;
      widgetId = ts.render(el, {
        sitekey: siteKey,
        language: "fr",
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
      });
    };
    if ((window as unknown as { turnstile?: TurnstileApi }).turnstile) mount();
    else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = mount;
      document.head.appendChild(s);
    }
    return () => {
      const ts = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (ts && widgetId) ts.remove(widgetId);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-6" />;
}

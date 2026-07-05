"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service wire and shows an Android-style install banner when
 * the browser fires `beforeinstallprompt`. iOS users get a manual hint stored
 * once we dismiss the banner.
 */
export function PwaInstaller() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // register the SW
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const shouldHint = isIos && !standalone;
    queueMicrotask(() => { if (shouldHint) setIosHint(true); });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;
  const show = installEvt || iosHint;
  if (!show) return null;

  async function install() {
    if (installEvt) {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      if (choice.outcome === "accepted") setDismissed(true);
    }
    setInstallEvt(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)] p-3 shadow-2xl md:bottom-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-brand)]">
        <Download size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Install MovieZone</p>
        <p className="text-xs text-[color:var(--color-text-secondary)]">
          {installEvt ? "Add the app to your home screen for full-screen playback." : "On iOS: tap Share → Add to Home Screen."}
        </p>
      </div>
      {installEvt ? (
        <button onClick={install} className="rounded-full bg-[color:var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white">
          Install
        </button>
      ) : null}
      <button onClick={() => setDismissed(true)} className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--color-text-tertiary)]" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

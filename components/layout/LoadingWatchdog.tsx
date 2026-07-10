"use client";

/**
 * components/layout/LoadingWatchdog.tsx
 * Mounted inside a route's loading.tsx. If the skeleton is still showing
 * after 10s (i.e. this component hasn't been unmounted by the real content
 * replacing it), swap to an ErrorState with retry. (Req 4.7, 4.8, 13.6)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";

const WATCHDOG_MS = 10000;

export function LoadingWatchdog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <ErrorState
        message="This is taking longer than expected to load."
        retrying={retrying}
        onRetry={() => {
          setRetrying(true);
          router.refresh();
          setTimedOut(false);
          setRetrying(false);
        }}
      />
    );
  }

  return <>{children}</>;
}

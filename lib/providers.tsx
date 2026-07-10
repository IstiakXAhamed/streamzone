"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { ConnectivityWatcher } from "@/components/layout/ConnectivityWatcher";

export function Providers({ children }: { children: ReactNode }) {
  // Create the QueryClient once per browser session (not on every render).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* reducedMotion="user" makes every framer-motion animation in the
            tree respect the OS prefers-reduced-motion setting (Req 14.2, 14.5, 16.6). */}
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <ConnectivityWatcher />
            {children}
          </ToastProvider>
        </MotionConfig>
      </QueryClientProvider>
    </SessionProvider>
  );
}

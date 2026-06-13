"use client";

import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;
    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;
    if (posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: false, // fazemos manualmente em mudancas de rota
      capture_pageleave: true,
      person_profiles: "identified_only",
      // LGPD-friendly: nao loga IP completo, respeita Do Not Track
      ip: false,
      respect_dnt: true,
      // Session recording desligado por padrao — liga manualmente quando quiser
      disable_session_recording: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
        }
      },
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}

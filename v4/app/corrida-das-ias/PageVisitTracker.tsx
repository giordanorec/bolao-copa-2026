"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Dispara `corrida_page_visit` UMA vez por visita a /corrida-das-ias.
 * Pageview ($pageview) já é trackado em layout.tsx, mas esse evento
 * dedicado fica fácil de filtrar no dashboard pra ver acessos da feature.
 */
export default function PageVisitTracker() {
  useEffect(() => {
    track("corrida_page_visit");
  }, []);
  return null;
}

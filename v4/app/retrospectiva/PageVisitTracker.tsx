"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Dispara `retrospectiva_page_visit` uma vez por visita a /retrospectiva.
 * Pageview ($pageview) já é trackado em layout.tsx; esse evento dedicado
 * fica fácil de filtrar no dashboard.
 */
export default function PageVisitTracker() {
  useEffect(() => {
    track("retrospectiva_page_visit");
  }, []);
  return null;
}

/**
 * Helper único pra disparar eventos customizados em **Vercel Analytics**
 * e **PostHog** ao mesmo tempo. Pageview ($pageview) já é trackado
 * automaticamente em layout.tsx + PostHogProvider — esses eventos são
 * INTERAÇÕES específicas (cliques, toggles, presets) que aparecem
 * separadamente nos dashboards.
 *
 * Uso (em client component):
 *   import { track } from "@/lib/analytics";
 *   track("corrida_pause", { modo: "A" });
 *
 * Padrão de nome: snake_case, prefixo da feature (corrida_, palpite_,
 * bolao_, etc) pra agrupar nos filtros.
 */

import { track as vercelTrack } from "@vercel/analytics";
import posthog from "posthog-js";

type Props = Record<string, string | number | boolean | null>;

export function track(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(event, props ?? undefined);
  } catch {
    // ignora erros de analytics — não deve quebrar UI
  }
  try {
    if (posthog.__loaded) posthog.capture(event, props);
  } catch {
    // mesmo motivo
  }
}

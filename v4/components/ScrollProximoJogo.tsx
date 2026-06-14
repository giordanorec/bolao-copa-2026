"use client";

import { useEffect } from "react";

// Na carga da página /jogos, rola até o próximo jogo (o primeiro que ainda não
// terminou) com base na data/hora de AGORA no navegador. Os cards expõem
// data-kickoff (ISO BRT) e estão no DOM em ordem cronológica.
export default function ScrollProximoJogo() {
  useEffect(() => {
    // Se o usuário chegou com um hash (deep-link p/ um jogo), respeita o hash.
    if (window.location.hash) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-kickoff]"),
    );
    if (els.length === 0) return;

    const agora = Date.now();
    const GRACE = 2.5 * 60 * 60 * 1000; // jogo "ao vivo" segue sendo o alvo por ~2h30

    let alvo: HTMLElement | null = null;
    for (const el of els) {
      const ts = Date.parse(el.dataset.kickoff || "");
      if (Number.isNaN(ts)) continue;
      if (ts + GRACE >= agora) {
        alvo = el;
        break;
      }
    }
    // Copa acabou (tudo no passado): mostra o último jogo.
    if (!alvo) alvo = els[els.length - 1];

    requestAnimationFrame(() =>
      alvo!.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }, []);

  return null;
}

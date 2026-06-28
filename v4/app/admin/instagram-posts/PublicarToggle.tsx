"use client";

import { useState, useTransition } from "react";
import { marcarPublicado } from "../actions";

export function PublicarToggle({
  postId,
  publicado,
}: {
  postId: string;
  publicado: boolean;
}) {
  const [on, setOn] = useState(publicado);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const proximo = !on;
    setOn(proximo);
    startTransition(async () => {
      try {
        await marcarPublicado(postId, proximo);
      } catch (e) {
        setOn(!proximo);
        alert(
          "Não foi possível salvar. " +
            (e instanceof Error ? e.message : "Tente de novo."),
        );
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`ig-action-btn${on ? " ig-pub-on" : ""}`}
      title={on ? "Marcado como publicado — clique pra desmarcar" : "Marcar como publicado no Instagram"}
      style={{ opacity: pending ? 0.7 : 1 }}
    >
      {on ? "✓ Publicado" : "Marcar publicado"}
    </button>
  );
}

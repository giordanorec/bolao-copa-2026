"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

const TX: Record<
  Locale,
  {
    titulo: string;
    lede: string;
    placeholder: string;
    contato: string;
    contato_hint: string;
    enviar: string;
    enviando: string;
    sucesso: string;
    erro_curto: string;
    erro_generico: string;
    obrigado: string;
  }
> = {
  pt: {
    titulo: "Tem alguma sugestão? Algo pra acrescentar?",
    lede: "Ainda dá tempo! A gente está cozinhando coisas pras próximas rodadas. Sua ideia entra na fila — quanto mais cedo, mais chance de virar feature.",
    placeholder: "Conta o que você gostaria de ver, o que falta, o que poderia melhorar…",
    contato: "Contato (opcional)",
    contato_hint: "E-mail, @ do Instagram, WhatsApp — se quiser resposta",
    enviar: "Mandar sugestão",
    enviando: "Mandando…",
    sucesso: "Recebida ✓",
    erro_curto: "Escreva pelo menos uns 3 caracteres.",
    erro_generico: "Não rolou enviar. Tenta de novo daqui a pouco.",
    obrigado: "Valeu! Vou ler na sequência. Se você passou contato, te respondo.",
  },
  en: {
    titulo: "Got a suggestion? Something to add?",
    lede: "Still time! We're cooking up things for the next rounds. Your idea joins the queue — the earlier, the better.",
    placeholder: "Tell us what you'd like to see, what's missing, what could improve…",
    contato: "Contact (optional)",
    contato_hint: "Email, Instagram @, WhatsApp — if you want a reply",
    enviar: "Send suggestion",
    enviando: "Sending…",
    sucesso: "Received ✓",
    erro_curto: "Please write at least 3 characters.",
    erro_generico: "Couldn't send. Try again in a bit.",
    obrigado: "Thanks! Will read soon. If you left contact, I'll reply.",
  },
  es: {
    titulo: "¿Alguna sugerencia? ¿Algo para agregar?",
    lede: "¡Aún hay tiempo! Estamos cocinando cosas para las próximas jornadas. Tu idea entra en la cola.",
    placeholder: "Cuenta lo que te gustaría ver, qué falta, qué se podría mejorar…",
    contato: "Contacto (opcional)",
    contato_hint: "Email, @ de Instagram, WhatsApp — si quieres respuesta",
    enviar: "Enviar sugerencia",
    enviando: "Enviando…",
    sucesso: "Recibida ✓",
    erro_curto: "Escribe al menos 3 caracteres.",
    erro_generico: "No se pudo enviar. Intenta de nuevo en un rato.",
    obrigado: "¡Gracias! Lo leeré pronto. Si dejaste contacto, te respondo.",
  },
  fr: {
    titulo: "Une suggestion ? Quelque chose à ajouter ?",
    lede: "Encore le temps ! On prépare des choses pour les prochaines journées. Votre idée entre dans la file.",
    placeholder: "Dites ce que vous aimeriez voir, ce qui manque, ce qu'on peut améliorer…",
    contato: "Contact (optionnel)",
    contato_hint: "Email, Instagram @, WhatsApp — si vous voulez une réponse",
    enviar: "Envoyer la suggestion",
    enviando: "Envoi…",
    sucesso: "Reçue ✓",
    erro_curto: "Écrivez au moins 3 caractères.",
    erro_generico: "Échec d'envoi. Réessayez plus tard.",
    obrigado: "Merci ! Je lirai bientôt. Si vous avez laissé un contact, je réponds.",
  },
};

export default function CaixaDeSugestao({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const tx = TX[locale];
  const [conteudo, setConteudo] = useState("");
  const [contato, setContato] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const txt = conteudo.trim();
    if (txt.length < 3) {
      setErroMsg(tx.erro_curto);
      setStatus("erro");
      return;
    }
    setStatus("enviando");
    setErroMsg(null);
    const supabase = createClient();
    // Tenta pegar user logado (vincula a sugestão ao perfil se houver).
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("sugestao").insert({
      conteudo: txt,
      contato: contato.trim() || null,
      user_id: user?.id ?? null,
    });
    if (error) {
      setErroMsg(error.message || tx.erro_generico);
      setStatus("erro");
      return;
    }
    track("sugestao_enviada", { tem_contato: contato.trim().length > 0 });
    setStatus("ok");
    setConteudo("");
    setContato("");
  }

  return (
    <section className="caixa-sug-wrap">
      <div className="caixa-sug-card">
        <div className="caixa-sug-emoji" aria-hidden>💬</div>
        <h2 className="caixa-sug-titulo">{tx.titulo}</h2>
        <p className="caixa-sug-lede">{tx.lede}</p>

        {status === "ok" ? (
          <div className="caixa-sug-ok" role="status">
            <strong>{tx.sucesso}</strong>
            <p>{tx.obrigado}</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="caixa-sug-form">
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder={tx.placeholder}
              maxLength={2000}
              rows={4}
              required
              disabled={status === "enviando"}
              className="caixa-sug-textarea"
            />
            <label className="caixa-sug-contato">
              <span>{tx.contato}</span>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder={tx.contato_hint}
                maxLength={200}
                disabled={status === "enviando"}
              />
            </label>
            {erroMsg && (
              <div className="caixa-sug-erro" role="alert">
                ⚠ {erroMsg}
              </div>
            )}
            <button
              type="submit"
              className="caixa-sug-btn"
              disabled={status === "enviando" || conteudo.trim().length < 3}
            >
              {status === "enviando" ? tx.enviando : tx.enviar} →
            </button>
          </form>
        )}
      </div>

      <style>{`
        .caixa-sug-wrap {
          padding: 16px 0;
        }
        .caixa-sug-card {
          position: relative;
          background:
            linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.04)),
            var(--bg-1);
          border: 1.5px dashed color-mix(in srgb, var(--primary) 45%, transparent);
          border-radius: 20px;
          padding: 26px 24px;
          max-width: 720px;
          margin: 0 auto;
          overflow: hidden;
        }
        .caixa-sug-emoji {
          font-size: 38px; line-height: 1;
          margin-bottom: 10px;
        }
        .caixa-sug-titulo {
          font-family: var(--ff-display);
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 8px;
          color: var(--fg);
        }
        .caixa-sug-lede {
          color: var(--fg-mid);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 18px;
        }
        .caixa-sug-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .caixa-sug-textarea {
          width: 100%;
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          padding: 12px 14px;
          font-size: 14px;
          color: var(--fg);
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
        }
        .caixa-sug-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
        }
        .caixa-sug-contato {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .caixa-sug-contato span {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--fg-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .caixa-sug-contato input {
          width: 100%;
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-s);
          padding: 9px 12px;
          font-size: 13px;
          color: var(--fg);
          font-family: inherit;
        }
        .caixa-sug-contato input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .caixa-sug-erro {
          padding: 10px 12px;
          background: color-mix(in srgb, #ef4444 12%, transparent);
          border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
          border-radius: var(--r-s);
          font-size: 13px;
          color: #fca5a5;
        }
        .caixa-sug-btn {
          align-self: flex-start;
          padding: 11px 22px;
          background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--accent)));
          color: #fff;
          border: none;
          border-radius: 999px;
          font-family: var(--ff-display);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
        }
        .caixa-sug-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px color-mix(in srgb, var(--primary) 50%, transparent);
        }
        .caixa-sug-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .caixa-sug-ok {
          padding: 16px 18px;
          background: color-mix(in srgb, #10b981 10%, transparent);
          border: 1px solid color-mix(in srgb, #10b981 35%, transparent);
          border-radius: var(--r-m);
        }
        .caixa-sug-ok strong {
          color: #10b981;
          font-family: var(--ff-display);
          font-size: 18px;
          display: block;
          margin-bottom: 4px;
        }
        .caixa-sug-ok p {
          margin: 0;
          color: var(--fg-mid);
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>
    </section>
  );
}

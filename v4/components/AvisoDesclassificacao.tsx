import { createClient } from "@/lib/supabase-server";

// IDs de usuários desclassificados do Hall da Fama por uso indevido do
// sistema (palpites alterados depois do jogo acontecer). Aparece um
// aviso no topo só pra essas pessoas quando logam.
const DESCLASSIFICADOS: Record<string, string> = {
  "3edc9095-3f7b-4f65-963b-6bf4b6467004":
    "Identificamos 11 palpites seus alterados depois que o jogo já tinha terminado (jogos 1 ao 11, gravados em 15/06 entre 01h26 e 01h32, todos com placar idêntico ao resultado oficial). Esses palpites foram invalidados e seu nome foi retirado do Hall da Fama público. Você continua podendo palpitar normalmente os próximos jogos — esses contam pra suas estatísticas privadas e pra rankings de bolões em que você esteja. A trava que impede esse padrão já está ativa pra todo mundo desde 15/06.",
};

export default async function AvisoDesclassificacao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const msg = DESCLASSIFICADOS[user.id];
  if (!msg) return null;

  return (
    <div className="aviso-desc" role="alert">
      <div className="aviso-desc-inner">
        <span className="aviso-desc-emoji" aria-hidden>
          ⚠️
        </span>
        <div>
          <strong className="aviso-desc-titulo">
            Aviso da auditoria automática
          </strong>
          <p className="aviso-desc-texto">{msg}</p>
          <p className="aviso-desc-rodape">
            Se você acha que isso é um engano, responde no Instagram{" "}
            <a href="https://instagram.com/arena.das.ias" target="_blank" rel="noopener">
              @arena.das.ias
            </a>{" "}
            que a gente revisa.
          </p>
        </div>
      </div>
      <style>{`
        .aviso-desc {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #1f1500;
          border-bottom: 2px solid #f59e0b;
          padding: 14px 0;
        }
        .aviso-desc-inner {
          max-width: 920px; margin: 0 auto;
          padding: 0 18px;
          display: flex; gap: 14px; align-items: flex-start;
        }
        .aviso-desc-emoji { font-size: 28px; line-height: 1; flex-shrink: 0; }
        .aviso-desc-titulo {
          display: block;
          font-family: var(--ff-display);
          font-size: 17px; font-weight: 800;
          margin-bottom: 6px;
        }
        .aviso-desc-texto {
          margin: 0 0 6px;
          font-size: 14px; line-height: 1.5;
        }
        .aviso-desc-rodape {
          margin: 0;
          font-size: 12px; color: #4d3a00;
        }
        .aviso-desc-rodape a {
          color: #b45309; font-weight: 700;
        }
      `}</style>
    </div>
  );
}

/**
 * /analise-r32 — DESCONTINUADA.
 *
 * Os palpites das IAs para os 16-avos de final (R32, jogos 73–88) agora fazem
 * parte da página de Jogos (/jogos), seguindo o mesmo padrão dos jogos de grupo:
 * cada jogo com placar de consenso, e ao clicar abre o detalhe por IA.
 * Esta rota só existe pra não quebrar links antigos — redireciona pra lá.
 */

import { redirect } from "next/navigation";

export default function AnaliseR32Page() {
  redirect("/jogos#73");
}

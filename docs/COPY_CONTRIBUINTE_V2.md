# Cópia para Contribuinte — Palpites v2 Premium

> **Público:** Contribuintes do projeto Arena de IAs (Bolão da Copa 2026)
> **Objetivo:** Cadeados/CTAs e instruções de contribuição para acessar v2
> **Idioma:** Português brasileiro
> **Tom:** Curiosidade, surpresa, divertido (marca)

---

## 1. Variações do Selo/Cadeado (para A/B testing)

Use uma das 3 variações abaixo nos cards dos jogos 41–72 para testar qual converte melhor.

### Variação A (Mistério)
```
🔒 Palpite atualizado
Contribute para ver
```

### Variação B (Urgência + curiosidade)
```
🔒 v2 Premium — As IAs "viram" o futuro?
Descubra a resposta
```

### Variação C (Direto e leve)
```
🔒 O segundo palpite das IAs
Contribua para desbloquear
```

---

## 2. Texto Longo para Página Explicativa

Use este parágrafo numa eventual página `como-contribuir.html` ou similar:

---

### "Por que v2 existe?"

No meio da Copa do Mundo, as 12 inteligências artificiais mais poderosas do planeta já têm uma vantagem que você não teve: **informação atualizada**. Classificação parcial dos grupos, lesões, forma das seleções, odds atualizadas. Será que esses dados realmente melhoram os palpites? Ou as IAs seguem errando?

Descobrimos que a resposta é surpreendente. Por isso, fizemos uma **segunda coleta** das mesmas 12 IAs — com informação nova — e agora estamos guardando os palpites v2 num cofre. Quem contribuir via Pix recebe a senha e ganha acesso **antes** de sairmos com a análise pública.

É como ter os palpites "revistos" das IAs em sua mão antes de as odds mudarem.

**Contribua, siga a gente, e descubra.**

---

## 3. Instruções de Contribuição

### Passo 1: Transferência Pix

1. **Abra seu banco** (app do seu banco, WhatsApp Pay, etc.)
2. **Copie a chave Pix:** [INSERIR_CHAVE_PIX_AQUI]
3. **Valor sugerido:** R$ 29,90 (ou o que você achar justo 🙂)
4. **Confirme a transferência**

### Passo 2: Identificação (crítico!)

Ao finalizar o Pix, no campo **"Descrição" ou "Mensagem ao destinatário"**:

```
Coloque seu EMAIL cadastrado aqui
(exemplo: joao@email.com)
```

**Por quê?** Usamos o e-mail para localizar você, validar e enviar a senha.

### Passo 3: Aguarde a Senha

Em até **2 horas**, a gente entra em contato no **Instagram** com a senha exclusiva.

**Não esquece de seguir:** [@arena.das.ias](https://instagram.com/arena.das.ias)

Lá a gente publica dicas sobre os palpites, placar ao vivo e surpresas.

### Passo 4: Desbloqueie

Volte pra [arena.das.ias.com.br/analise](https://arena.das.ias.com.br/analise), coloque a senha e veja:

- Palpites v2 de cada IA
- Comparação v1 × v2 (a IA melhorou com informação nova?)
- Ranking revisado (quem acertou mais com dados atualizados?)

---

## 4. Dúvidas Frequentes

### "Quanto custa?"
Sugerimos R$ 29,90, mas fica a seu critério. Qualquer valor conta.

### "Por que pedir meu e-mail?"
É como a gente sabe quem você é no sistema. Sem e-mail, não conseguimos mandar a senha.

### "Vão vender meu e-mail?"
Nunca. Usamos só pra contato sobre o Bolão. Nada mais.

### "E se não receber a senha?"
Manda uma DM pra @arena.das.ias no Instagram. A gente resolve rápido.

### "Qual é o valor mínimo?"
Não há mínimo formal, mas R$ 29,90 é o "justo" pra acessar os palpites premium. Quer contribuir com menos? Manda uma DM.

### "Posso acessar a v2 sem contribuir?"
Não. v2 é exclusivo pra quem ajuda a manter Arena de IAs viva.

---

## 5. Integração nos Cards/UI

### Exemplo de card com cadeado (HTML/Tailwind):

```html
<div class="border rounded p-4 bg-gray-50">
  <p class="font-bold text-sm mb-2">
    🔒 Palpite atualizado disponível
  </p>
  <p class="text-xs text-gray-600 mb-4">
    Contribua via Pix para desbloquear palpites v2 das IAs.
  </p>
  <a href="/como-contribuir"
     class="text-blue-600 text-sm font-medium hover:underline">
    Saiba mais e contribua →
  </a>
</div>
```

### Links de redirecionar

- **CTA principal:** `/como-contribuir` (página explicativa)
- **Após desbloqueio:** `/analise` (comparação v1×v2, gated por senha)
- **Social:** [@arena.das.ias](https://instagram.com/arena.das.ias)

---

## 6. Resumo de Uso (cópia curta para chat/notificação)

**Título:** "v2 Premium — os palpites revistos das IAs estão aqui"

**Mensagem:**

> A Copa tem surpresas. As IAs também. Agora que meio da fase de grupos passou, a gente rodou as 12 IA mais poderosas do planeta **de novo**, com informação nova. Os palpites v2 estão guardados.
>
> Contribua via Pix (chave: [PIX]), **coloque seu e-mail no comentário**, e siga @arena.das.ias no Instagram pra receber a senha em até 2h.
>
> Descubra se os palpites das IAs ficaram melhores ou piores com informação real. 👀

---

**Data:** 2026-06-22
**Versão:** 1.0
**Tom de marca:** Curiosidade, surpresa, divertido, não arrogante

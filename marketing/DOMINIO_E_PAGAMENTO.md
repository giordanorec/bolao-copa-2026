# Domínio e Pagamento — Setup Final

## 🌐 Domínio bolao.arenadasias.com.br

**Status no Vercel**: ✅ adicionado e verificado.
**Falta**: apontar DNS no painel onde você comprou `arenadasias.com.br`.

### O que adicionar no DNS do registrador

Login no painel onde você comprou o domínio (Registro.br, Hostinger, GoDaddy, Cloudflare etc.). Procure "Zona DNS" / "DNS Management" / "Records".

**Adicione UM registro CNAME**:

| Tipo  | Nome / Host | Valor                       | TTL  |
|-------|-------------|------------------------------|------|
| CNAME | bolao       | cname.vercel-dns.com.        | 3600 |

(Algumas interfaces pedem só `bolao` como nome; outras pedem `bolao.arenadasias.com.br`. Se aparecer erro, tente sem o ponto final.)

**Após salvar**: aguarde 5-30 minutos pra propagar. Pra checar:

```bash
nslookup bolao.arenadasias.com.br
# Deve retornar IPs da Vercel (76.76.21.21 ou similar)
```

Aí o site fica disponível em **https://bolao.arenadasias.com.br** com HTTPS automático (Vercel gera certificado).

### Setting recomendado: redirect www → não-www (ou vice-versa)

Por enquanto só temos `bolao.` (subdomínio). Se quiser depois apontar `arenadasias.com.br` também pra Vercel, me avisa.

---

## 💳 Stripe Payment Link (sem nome pessoal)

Como o Stripe expõe o nome legal/da business em vários lugares, é preciso:

### Passo 1 — Criar conta business "Arena das IAs" (não pessoal)

1. Acesse https://dashboard.stripe.com/register
2. Em "Country": Brasil
3. Em "Business type": **Sole proprietorship** ("MEI" se você tem) ou **Individual**
4. Em "Doing business as (DBA)" / "Public business name": **Arena das IAs**
   - Esse é o nome que aparece no checkout e no extrato do cartão dos doadores.
5. Em "Statement descriptor": **ARENADASIAS** (max 22 chars, vai no extrato)
6. Endereço, CPF/CNPJ: usar os seus (Stripe pede legalmente, mas NÃO mostra publicamente).

### Passo 2 — Criar Payment Link

1. Dashboard → **Payment Links** → "+ New"
2. **Product**: criar novo
   - Nome: "Apoio Arena das IAs"
   - Descrição: "Sua doação cobre as APIs das IAs e infra. Obrigado!"
3. **Price**: **Customer chooses what to pay** (preset suggestions: R$ 10, R$ 25, R$ 50, R$ 100)
4. **Receipt**: enviar email do recibo. Você pode customizar o "From name" pra "Arena das IAs"
5. **Branding**: dashboard → Settings → Branding
   - Logo: usar o emoji ⚽ ou criar uma imagem simples
   - Cor: verde Brasil (#009C3B)
6. Após criar, copia o link (algo como `https://buy.stripe.com/xxxxx`)

### Passo 3 — Configurar no Vercel

```bash
# Use a CLI ou o dashboard:
# https://vercel.com/giordanorecs-projects/arena-de-ias/settings/environment-variables
```

Adicione:
- **Key**: `NEXT_PUBLIC_STRIPE_DONATE_URL`
- **Value**: `https://buy.stripe.com/xxxxx` (link copiado)
- **Environments**: Production, Preview, Development

Aí redeploy (qualquer commit dispara) e o botão em `/doar` fica funcional.

### Privacidade: o que aparece publicamente

- **Aparece**: nome "Arena das IAs", logo, statement descriptor "ARENADASIAS"
- **Não aparece** (a menos que você force): seu CPF, endereço, nome legal
- **Pode aparecer** em recibos por email: depende do template. Configure manualmente em Settings → Emails.

### Bonus: aceitar PIX no Stripe Checkout (Brasil)

Stripe agora aceita PIX como método de pagamento no Brasil. Em Settings → Payment methods, ativa "PIX". Aí no Payment Link aparece como opção junto com cartão.

---

## 📆 Agendamento Instagram — opções

### Opção 1: Meta Business Suite (nativo, grátis, recomendado)

1. Tenha **uma conta Instagram Business ou Creator** (pode converter no app)
2. Conecta com uma Facebook Page (mesmo que vazia)
3. Acessa https://business.facebook.com/
4. **Planner** → escolhe Instagram → cria post → **Schedule**

Vantagens: oficial, sem limites de posts, sem trial, agenda até 75 dias à frente, inclui carrossel, reels, stories.

### Opção 2: Buffer (free tier)

- 3 canais grátis, 10 posts agendados por canal
- https://buffer.com/
- Bom se você não quer instalar Meta Business

### Opção 3: Later (free tier)

- 30 posts/mês grátis
- Visual planner bonito
- https://later.com/

### Opção 4 (nerd): Instagram Graph API + cronjob

Se quiser automatizar 100%: criar app na Meta Developers, conta business, gerar token. Posts via API. Complicação alta, mas você posta 104 cards de uma vez via script.

**Recomendação prática**: comece com Meta Business Suite (zero custo, zero código). Se ficar limitado, aí parte pra API.

### Cronograma sugerido pros 4 dias antes da Copa

| Data | Hora (BRT) | Conteúdo |
|------|------------|----------|
| 07/06 19:00 | Carrossel de lançamento (4 cards) |
| 08/06 09:00 | Card México×África do Sul (partida-001) |
| 08/06 18:00 | "🇧🇷 Brasil estreia dia X — veja o que 122 IAs preveem" |
| 09/06 09:00 | "Battle: ChatGPT × Claude — quem chuta melhor?" (reels) |
| 09/06 18:00 | Card 2º jogo do Brasil |
| 10/06 09:00 | "🔮 Bola de Cristal prevê o CAMPEÃO" (card da final) |
| 10/06 18:00 | Lembrete: "Cria seu bolão agora — link na bio" |
| 11/06 13:00 | Card México×África com "tá rolando AGORA" |
| 11/06 18:00 | "🎯 Quem acertou?" — pós-jogo, contagem IA por IA |

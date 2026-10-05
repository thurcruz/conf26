# ALÉM DO PALCO — Conferência de Jovens 2026

Site de reserva de camisas para a conferência **"Além do Palco"** dos jovens do **Ministério Recarga**.
📅 **6, 7 e 8 de novembro de 2026** · Igreja Batista Central de Campo Grande

> A edição anterior ("Até o Fim", adolescentes, jul/2026) está arquivada em [`/ate-o-fim`](src/app/ate-o-fim/page.tsx).
> **Não há link para ela no site público** — só pelo botão "Arquivo" no painel admin.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · Supabase · Vercel

---

## 1. Setup local

```bash
npm install
cp .env.example .env.local
# edite .env.local com suas chaves
npm run dev
```

Abra http://localhost:3000

---

## 2. Identidade visual

**Cores da marca** (em `tailwind.config.ts` e espelhadas em `BRAND` no `products.ts`):

| Token | Hex | Uso |
|---|---|---|
| `navy` / `ink` | `#090424` | texto, seção de anúncio, footer |
| `pink` | `#ff0040` | faixa do comprovante, CTAs, acentos |
| `smoke` · `bone` · `ash` | cinzas azulados | bordas, fundos suaves, texto secundário |

**Fonte:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (grotesk moderna,
pesos 300–700) em todo o site. Instrument Serif fica só nas citações em itálico.

**Logotipos** (lettering 747×106, proporção ~7:1 — use `aspect-logo`), mapeados em `LOGOS`:

| Variante | Arquivo | Onde |
|---|---|---|
| azul-marinho | `public/ADP_LOGOTIPOAZ-MARINHO.png` | hero, header do checkout, OG image |
| rosa | `public/ADP_LOGOTIPOVERMELHO-PINK.png` | seção azul, footer |
| preto | `public/ADP_LOGOTIPOPRETO.png` | reserva (impressão / fundo claro) |

### Ainda falta substituir

| O que | Como |
|---|---|
| **Foto de adoração** (hero) | coloque o arquivo em `public/adoracao.jpg` e troque `WORSHIP_IMAGE` em `src/lib/products.ts` — hoje usa um placeholder SVG |
| Tabelas de medidas | substituir `public/medidas/adulto.jpeg` e `infantil.jpeg` |

> As artes das camisas já são as definitivas (Marfim e Azul Marinho, em `public/camisas/`).
> Os PNGs são 4000×4000 (~35 MB no total); o Next serve WebP de 3–13 KB, mas se o repo
> pesar demais vale exportar versões de 1600 px.

### Estrutura da home

1. **Faixa rosa full-bleed** (`ProofBanner`) — `sticky top-0`, com ícone de placa de aviso e
   texto em marquee; a faixa inteira é link para o WhatsApp. Aparece também no checkout
2. **Hero azul-marinho** (altura da tela) — logo pequena em branco, título, data, local e
   contagem regressiva (`Countdown`, inline) à esquerda; foto de adoração cobrindo toda a
   altura na metade direita (no mobile ela vai para baixo do texto)
3. **Seção branca** — camisas (`ShirtPicker`), com círculo indicando a cor do tecido
4. Tabela de medidas · **Como funciona** (`HowItWorks`, sem caixas) · footer azul

### Acompanhamento do pedido (`/meus-pedidos`)

O cliente consulta a reserva com **WhatsApp + nº do pedido**. Se o comprovante estiver
faltando, ele anexa por ali mesmo.

**O "nº do pedido"** são os 8 primeiros caracteres do uuid da reserva, em maiúsculas —
`protocoloDe()` em [`src/lib/reserva.ts`](src/lib/reserva.ts) é a única fonte desse formato.
O mesmo número aparece em quatro lugares, de propósito:

| Onde | Como |
|---|---|
| Tela final do checkout | em destaque, com botão **Copiar** e um parágrafo explicando para que serve |
| Mensagem do WhatsApp | linha `Nº do pedido: #XXXXXXXX`, junto do link de acompanhamento |
| `/meus-pedidos` | campo de busca + explicação do que é o número e onde achar |
| Painel da secretaria | chip copiável ao lado do nome, e a busca aceita nº do pedido, nome ou telefone |

A tabela `reservations` continua **fechada para o anon** — o acesso passa por duas funções
`SECURITY DEFINER` criadas em [`0005_consulta_reserva.sql`](supabase/migrations/0005_consulta_reserva.sql):

| Função | O que faz |
|---|---|
| `consultar_reservas(p_phone, p_protocol)` | devolve a reserva só quando telefone **e** protocolo batem; não expõe o uuid nem a URL do comprovante, só um booleano `tem_comprovante` |
| `anexar_comprovante(p_phone, p_protocol, p_url)` | grava **apenas** `payment_proof_url`, exige a mesma dupla telefone+protocolo, recusa URL fora do bucket `comprovantes` e não mexe em reserva cancelada |

Para não perder ninguém pelo caminho, o botão "Enviar pelo WhatsApp" do checkout abre em
**nova aba** (antes trocava a página e a pessoa perdia o protocolo), e a tela final mostra o
protocolo em destaque com o campo de anexar comprovante logo abaixo.

### Design system

Tudo que é visual passa pelas classes em [`src/app/globals.css`](src/app/globals.css) —
mudar lá muda o site inteiro, incluindo o admin:

- `.v-btn` — botão **pill redondo** claro, **sem brilho**. Variantes: `.v-btn-pink` (ação
  principal), `.v-btn-dark` (azul-marinho), `.v-btn-outline-light` (sobre fundo azul),
  `.v-btn-sm`, `.v-btn-ghost`
- `.v-card` — card branco `rounded-3xl` com sombra suave. `.v-card-soft` (cinza)
- `.v-chip` — pill de seleção (cor/tamanho/modelo). `+ .v-chip-active`
- `.v-input` — campo de formulário (foco rosa)

---

## 3. Edições da conferência e histórico

Cada reserva carrega a coluna `edition`. A edição ativa fica em
`settings.current_edition` (hoje `alem-do-palco`); as 75 reservas da "Até o Fim" foram
marcadas como `ate-o-fim`.

**O histórico é imutável no banco, não só na tela.** As policies de UPDATE e DELETE só
valem para `edition = edicao_atual()`, então nem a secretária logada consegue alterar ou
apagar uma reserva antiga — a API recusa. No painel ele aparece recolhido no rodapé, com
tabela somente leitura e botão de relatório (PDF/Excel).

> **Ao virar a próxima conferência:** basta
> `update settings set current_edition = 'nome-novo';`. As policies acompanham sozinhas,
> a edição anterior congela e as reservas novas já nascem na edição nova pelo default.

---

## 4. Setup do Supabase (passo a passo)

1. Crie conta em https://supabase.com e clique em **New project**.
2. Region: **São Paulo (sa-east-1)** · defina uma senha forte.
3. Aguarde provisionar (~2 min).
4. Vá em **SQL Editor** → **New query** → rode as migrations de
   [supabase/migrations/](supabase/migrations/) **na ordem** (`0001` → `0004`).
5. Vá em **Authentication → Users → Add user → Create new user**:
   - E-mail: `minisrecarga@gmail.com`
   - Senha: `JesusSalva`
   - **Auto Confirm User: ON**
6. Vá em **Project Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Cole as duas chaves em `.env.local`. A **service_role não é usada pelo código** — não precisa.

> O SQL já cria o bucket `comprovantes` e as policies de RLS:
> – qualquer pessoa pode **inserir** reserva e fazer **upload** de comprovante;
> – apenas usuários autenticados (líderes) podem **ler/atualizar/excluir** reservas.

---

## 5. Deploy na Vercel

1. Suba este projeto pro GitHub.
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas chaves do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` (ex.: `5521964829407`)
   - `NEXT_PUBLIC_PIX_KEY` (ex.: `42.252.288/0001-31`)
4. **Deploy**.

---

## 6. Estrutura

```
public/
  ADP_LOGOTIPO*.png     Logotipos (azul-marinho, rosa, preto)
  adoracao-placeholder.svg  Placeholder da foto de adoração ← substituir
  camisas/              Artes das camisas         ← substituir
  medidas/              Tabelas de medidas        ← substituir
  historico/            Assets da conferência passada (arquivo)
supabase/migrations/    SQL para criar tabelas + bucket + RLS
src/
  app/
    page.tsx            Home (hero, faixa rosa, anúncio azul, camisas, medidas)
    ate-o-fim/          Arquivo da conferência anterior ("Até o Fim")
    checkout/           Checkout com PIX + upload de comprovante / WhatsApp
    admin/              Login + dashboard de reservas
    globals.css         Design system (.v-btn, .v-card, .v-chip, .v-input)
  components/           Countdown, ProofBanner, ShirtPicker, SizeChart,
                        HowItWorks, CartDrawer
  lib/
    products.ts         Cores, tamanhos, preços, EVENT, PAST_EVENT, LOGOS, BRAND
    supabase/           Clients browser/server
  store/cart.ts         Carrinho com persistência (Zustand)
  middleware.ts         Protege /admin
```

---

## 7. Acesso admin

- URL: `/admin/login`
- Usuário: `minisrecarga@gmail.com`
- Senha: `JesusSalva`

No dashboard você vê todas as reservas, comprovantes anexados, pode confirmar/cancelar,
pausar as vendas, abrir o WhatsApp do reservante, exportar relatório (impressão ou Excel)
e ver estatísticas.

---

## 8. Personalização rápida

- **Nome / datas / tagline do evento** → `src/lib/products.ts` (`EVENT`)
- **Countdown** → `src/lib/products.ts` (`EVENT.date` = primeiro dia)
- **Preços** → `src/lib/products.ts` (`TYPES`)
- **Cores das camisas / imagens** → `src/lib/products.ts` (`COLORS`; o `swatch` alimenta o
  círculo de cor e foi amostrado do pixel do tecido no mockup)
- **Local do evento** → `src/lib/products.ts` (`EVENT.venue`, `EVENT.venueAddress`)
- **Conferência arquivada** → `src/lib/products.ts` (`PAST_EVENT`) + `src/app/ate-o-fim/page.tsx`
  (link só no painel admin)
- **Chave PIX / WhatsApp** → variáveis de ambiente
- **Tamanhos** → `src/lib/products.ts` (`ADULT_SIZES`, `INFANT_SIZES`)
- **Logotipos** → `src/lib/products.ts` (`LOGOS`)
- **Foto de adoração** → `src/lib/products.ts` (`WORSHIP_IMAGE`)
- **Aviso do comprovante (faixa rosa)** → `src/components/ProofBanner.tsx` (`MESSAGE`)
- **Estilo visual** → `src/app/globals.css` + `tailwind.config.ts`

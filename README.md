# Conferência 2026 — "Até o Fim"

Site de reserva de camisas para a Conferência 2026 dos adolescentes do **Ministério Recarga**.

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

## 2. Setup do Supabase (passo a passo)

1. Crie conta em https://supabase.com e clique em **New project**.
2. Nome: `conf26-ate-o-fim` · Region: **São Paulo (sa-east-1)** · defina uma senha forte.
3. Aguarde provisionar (~2 min).
4. Vá em **SQL Editor** → **New query** → cole o conteúdo de [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) → **Run**.
5. Vá em **Authentication → Users → Add user → Create new user**:
   - E-mail: `minisrecarga@gmail.com`
   - Senha: `JesusSalva`
   - **Auto Confirm User: ON**
6. Vá em **Project Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
7. Cole essas três chaves em `.env.local`.

> O SQL já cria o bucket `comprovantes` e as policies de RLS:
> – qualquer pessoa pode **inserir** reserva e fazer **upload** de comprovante;
> – apenas usuários autenticados (líderes) podem **ler/atualizar/excluir** reservas.

---

## 3. Deploy na Vercel

1. Suba este projeto pro GitHub (`git init && git add . && git commit -m "init" && git push`).
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas chaves do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` (ex.: `5521964829407`)
   - `NEXT_PUBLIC_PIX_KEY` (ex.: `42.252.288/0001-31`)
   - `NEXT_PUBLIC_PIX_NAME` (ex.: `MINISTERIO RECARGA`)
4. **Deploy**. Em ~1 min você terá uma URL `https://conf26-ate-o-fim.vercel.app`.

---

## 4. Estrutura

```
public/                  Logo + fundo + fotos das camisas
supabase/migrations/     SQL para criar tabela + bucket + RLS
src/
  app/
    page.tsx             Home (fundo 3D, countdown, camisas, carrinho)
    checkout/            Checkout com PIX + upload de comprovante / WhatsApp
    admin/               Login + dashboard de reservas
  components/            Countdown, Background3D, ShirtPicker, CartDrawer
  lib/
    products.ts          Cores, tamanhos, tipos, preços, dados do evento
    supabase/            Clients browser/server
  store/cart.ts          Carrinho com persistência (Zustand)
  middleware.ts          Protege /admin
```

---

## 5. Acesso admin

- URL: `/admin/login`
- Usuário: `minisrecarga@gmail.com`
- Senha: `JesusSalva`

No dashboard você vê todas as reservas, comprovantes anexados, pode confirmar/cancelar, abrir o WhatsApp do reservante e ver estatísticas.

---

## 6. Personalização rápida

- **Preços** → `src/lib/products.ts` (`TYPES`)
- **Data do evento** → `src/lib/products.ts` (`EVENT.date`)
- **Cores das camisas / imagens** → `src/lib/products.ts` (`COLORS`)
- **Chave PIX / WhatsApp** → variáveis de ambiente
- **Tamanhos** → `src/lib/products.ts` (`SIZES`)
- **Estilo visual** → `src/app/globals.css` (`.v-btn`, `.v-card`, `.v-chip`)

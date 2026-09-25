# Capacitações DVS

Sistema de cadastro, avaliação e acompanhamento das capacitações promovidas pela
Divisão de Vigilância Sanitária (DVS/CEVS/SES-RS).

Aplicação pequena e de manutenção simples: 1 Cloudflare Worker servindo HTML/CSS/JS
via Static Assets, com Cloudflare D1 como banco de dados. Sem framework de frontend,
sem ORM, sem serviços pagos — pensada para rodar inteiramente no plano gratuito da
Cloudflare.

## Stack

- **Cloudflare Workers** + **Static Assets** (frontend e backend no mesmo projeto)
- **Cloudflare D1** (SQLite) para persistência
- **Hono** para roteamento
- **TypeScript** no backend, HTML/CSS/JS simples no frontend
- **qrcode** para gerar o QR Code (SVG) de cada capacitação

## Estrutura do projeto

```
src/
  index.ts        # Worker entry, monta as rotas
  routes/          # public.ts (avaliar/qr), auth.ts (admin), criador.ts (Criador de Curso), admin.ts
  services/        # regras de negócio + SQL explícito de acesso ao D1
  views/           # funções que retornam HTML (layout + páginas)
  data/            # listas fechadas: áreas, tipos, municípios do RS, CRS
  utils/           # validação, estatísticas, CSV, escape de HTML
public/
  css/style.css
  js/form.js       # progressive enhancement (toggles de campo, copiar link)
migrations/        # migrations do D1
tests/             # testes da lógica pura (node:test)
```

## Perfis de acesso

- **Admin** (`/login`): senha única (`ADMIN_PASSWORD`), acesso total — cadastra,
  edita e encerra qualquer capacitação, vê resultados, painel geral, exporta
  CSV, cria/exclui contas de Criador de Curso em `/admin/criadores`, e
  cria/edita/desativa as perguntas do formulário de avaliação em `/admin/perguntas`.
- **Criador de Curso** (`/criador/login`): conta com e-mail e senha, criada
  pelo Admin em `/admin/criadores/novo`. Só cadastra novas capacitações e vê a
  lista + link/QR Code das que ele mesmo criou — sem acesso a edição,
  encerramento, resultados, painel ou exportação. Não há recuperação de senha
  nesta versão: se esquecer, o Admin cria uma nova senha excluindo e
  recriando a conta.

## Perguntas do formulário de avaliação

As perguntas não são mais fixas no código: é um template único, compartilhado
por todas as capacitações, editável pelo Admin em `/admin/perguntas`. Cada
pergunta tem um tipo — escala de 1 a 10, Sim/Não, múltipla escolha ou texto
livre — e pode ser marcada como obrigatória e/ou "somente quando houver
instrutor/tutor" (regra sempre decidida pelo backend a partir da capacitação,
nunca pelo participante).

- Uma pergunta desativada some dos formulários novos, mas as respostas já
  registradas continuam aparecendo nos resultados e na exportação CSV daquela
  capacitação.
- As opções de uma pergunta de múltipla escolha ficam fixas depois de criada
  (não há tela de edição de opções). Para mudar as opções, desative a pergunta
  e crie uma nova — evita que uma edição corrompa o sentido de respostas já
  registradas.
- Novas perguntas sempre entram no fim do formulário (sem reordenação nesta
  versão).

## Desenvolvimento local

### 1. Pré-requisitos

- Node.js 20+ instalado.
- Uma conta gratuita na Cloudflare (necessária apenas para o deploy; não é
  necessária para rodar localmente).

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar segredos locais

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .dev.vars.example .dev.vars
```

O `.dev.vars` não deve ser commitado (já está no `.gitignore`). Ele define:

- `ADMIN_PASSWORD`: a senha de acesso administrativo (não há cadastro de usuários).
- `SESSION_SECRET`: string usada para assinar o cookie de sessão administrativa.
- `TURNSTILE_SECRET_KEY`: para desenvolvimento, use a chave de teste oficial da
  Cloudflare que sempre passa na validação (já vem preenchida no arquivo de
  exemplo — não é um segredo real, funciona em qualquer `localhost`):
  https://developers.cloudflare.com/turnstile/troubleshooting/testing/

A chave pública do Turnstile (`TURNSTILE_SITE_KEY`) já vem configurada com a
chave de teste correspondente em `wrangler.jsonc` (`vars`).

### 4. Criar o banco D1 local e aplicar as migrations

O `wrangler.jsonc` já referencia um banco chamado `formulario-capacitacao-dvs`.
Para desenvolvimento local não é necessário criar o banco na Cloudflare — o
Wrangler simula o D1 localmente. Basta aplicar as migrations:

```bash
npm run db:migrations:local
```

### 5. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:8787. A área administrativa fica em
http://localhost:8787/login.

### 6. Rodar os testes e o typecheck

```bash
npm test
npm run typecheck
```

## Publicando na Cloudflare

### 1. Criar o banco D1

```bash
npx wrangler d1 create formulario-capacitacao-dvs
```

O comando acima imprime um `database_id`. Copie esse valor para o campo
`database_id` em `wrangler.jsonc` (substitua `REPLACE_WITH_YOUR_DATABASE_ID`).

### 2. Aplicar as migrations no banco remoto

```bash
npm run db:migrations:remote
```

### 3. Configurar os secrets de produção

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
```

### 4. Configurar o Cloudflare Turnstile

1. No painel da Cloudflare, crie um widget Turnstile para o domínio da
   aplicação (Security → Turnstile).
2. Copie a "Site Key" gerada e substitua o valor de `TURNSTILE_SITE_KEY` em
   `vars` no `wrangler.jsonc` (é uma chave pública, pode ficar no repositório).
3. Copie a "Secret Key" e configure-a com o comando `wrangler secret put
   TURNSTILE_SECRET_KEY` do passo anterior.

### 5. Publicar

```bash
npm run deploy
```

O Wrangler publica o Worker e os Static Assets (pasta `public/`) juntos. A URL
de produção é exibida ao final do comando.

## Limitações conhecidas (por escolha de design)

- O Admin continua sendo uma única senha compartilhada (`ADMIN_PASSWORD`), não
  uma conta no banco — não há múltiplos administradores nesta versão.
- Sem recuperação/troca de senha para o Criador de Curso: se ele esquecer a
  senha, o Admin precisa excluir a conta e criar uma nova. Excluir a conta
  desassocia (mas não apaga) as capacitações que ela criou — elas passam a
  aparecer como criadas por "Admin".
- Não há proteção contra respostas duplicadas por IP/cookie/dispositivo (por
  decisão explícita, para preservar a privacidade dos participantes).
- Exportação apenas em CSV (sem XLSX).

# 💸 Finanças Pessoais

Sistema financeiro pessoal completo, multi-usuário, com tema claro/escuro e deploy no Vercel.

Cada usuário tem conta própria com dados totalmente isolados via **Row Level Security** do Supabase — ninguém vê os dados de ninguém.

---

## ✨ Funcionalidades

| Módulo | O que faz |
|---|---|
| **Dashboard** | Saldo total em bancos, receitas, gastos, alertas de vencimento, gráficos de categoria e uso por cartão |
| **Bancos** | Saldo real por conta bancária, histórico de saldo, gráfico de distribuição patrimonial |
| **Fluxo de Caixa** | Visão mês a mês (2026) com receitas, contas recorrentes, parcelas e valores a receber projetados |
| **Lançamentos** | Receitas e gastos com categoria, data, cartão associado e edição posterior |
| **Contas a Pagar** | Contas recorrentes com reset automático a cada mês, alertas de vencimento e atraso |
| **Parcelas** | Compras parceladas no cartão com barra de progresso e saldo devedor |
| **Cartões** | Controle de crédito por cartão com gráfico de uso e limite |
| **Investimentos** | Aplicações com rentabilidade anual e projeção de 12 meses |
| **A Receber** | Cobranças parceladas e splits (rachão) com exportação de PDF por pessoa |

---

## 🛠 Stack

- **React 18** — UI com hooks funcionais
- **React Router 6** — navegação SPA
- **SASS (CSS Modules)** — estilos modulares com tema claro/escuro via `data-theme`
- **Recharts** — gráficos interativos
- **Lucide React** — ícones
- **Vite 5** — build ultrarrápido
- **Supabase** — autenticação + PostgreSQL + Row Level Security
- **Vercel** — hosting com deploy automático

---

## 📁 Estrutura do projeto

```
financas-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Auth/           # Login, cadastro, loading screen
│   │   ├── Banks/          # Contas bancárias com saldo real
│   │   ├── Bills/          # Contas a pagar recorrentes
│   │   ├── Cards/          # Cartões de crédito
│   │   ├── CashFlow/       # Fluxo de caixa mês a mês
│   │   ├── Dashboard/      # Visão geral com gráficos
│   │   ├── Installments/   # Compras parceladas
│   │   ├── Investments/    # Investimentos
│   │   ├── Receivables/    # A receber (parcelado + split)
│   │   ├── Shared/         # Layout, Modal, StatCard
│   │   └── Transactions/   # Lançamentos
│   ├── context/
│   │   ├── AuthContext.jsx # Sessão do usuário
│   │   └── ThemeContext.jsx# Tema claro/escuro
│   ├── data/
│   │   └── store.js        # Seed data, helpers, funções de cashflow
│   ├── hooks/
│   │   └── useFinance.js   # Hook central — estado + sync Supabase
│   ├── lib/
│   │   └── supabase.js     # Cliente Supabase + helpers de auth/CRUD
│   ├── styles/
│   │   ├── global.scss     # Reset, tokens de tema, utilitários globais
│   │   └── variables.scss  # Variáveis SASS (cores, fontes, radii)
│   ├── App.jsx             # Rotas + guard de autenticação
│   └── main.jsx            # Entry point
├── supabase-schema.sql     # SQL para criar as tabelas no Supabase
├── .env.example            # Template das variáveis de ambiente
├── vercel.json             # Rewrites para SPA funcionar no Vercel
└── vite.config.js
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta gratuita no [Supabase](https://supabase.com)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/financas-pessoais.git
cd financas-pessoais
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase-schema.sql`
3. Vá em **Settings → API** e copie a **Project URL** e a **anon public key**

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

---

## ☁️ Deploy no Vercel

### 1. Suba para o GitHub

```bash
git add .
git commit -m "initial commit"
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

### 2. Conecte ao Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe seu repositório do GitHub
3. Antes de fazer deploy, vá em **Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON` | Chave anon do Supabase |

4. Clique em **Deploy** — pronto em ~60 segundos

> O arquivo `vercel.json` já está configurado para que as rotas do React Router funcionem corretamente.

---

## 🔒 Segurança e privacidade

- **Row Level Security (RLS)** ativado em todas as tabelas — cada query retorna somente dados do usuário autenticado
- **Senhas** gerenciadas pelo Supabase Auth (bcrypt, nunca armazenadas em texto)
- **Sessão** via JWT com expiração automática
- **Nenhum dado financeiro** fica no `localStorage` do navegador — tudo vai para o banco Supabase
- A chave `anon` do Supabase é pública por design, mas sem RLS ela não acessa nada

---

## 🗄️ Banco de dados

O arquivo `supabase-schema.sql` cria as seguintes tabelas:

| Tabela | Descrição |
|---|---|
| `profiles` | Nome e avatar do usuário (criado automaticamente via trigger) |
| `bank_accounts` | Contas bancárias com saldo manual |
| `balance_history` | Histórico de saldos por conta |
| `transactions` | Lançamentos de receita e gasto |
| `bills` | Contas mensais recorrentes |
| `installments` | Compras parceladas |
| `investments` | Aplicações financeiras |
| `receivables` | Cobranças a receber (parcelado + split) — armazenado como JSONB |

---

## 🎨 Temas

O sistema suporta **tema escuro** (padrão) e **tema claro**, alternáveis pelo botão ☀/🌙 na sidebar.

A preferência é salva no `localStorage` e reaplicada automaticamente. Os temas são implementados via CSS custom properties (`--bg-base`, `--bg-card`, `--border`, `--text-primary`, etc.) definidas em `src/styles/global.scss` pelo atributo `[data-theme]`.

---

## 🔄 Contas recorrentes

Ao abrir o app em um novo mês, todas as contas marcadas como `recurring: true` voltam automaticamente para `paid: false`. O controle é feito via `localStorage` (`fp_last_reset_month`) e o reset é aplicado no banco Supabase para todos os itens afetados.

---

## 📄 Exportar Split como PDF

Na página **A Receber**, qualquer cobrança do tipo "Split / Racha" tem um botão **Exportar PDF**. Ele gera uma tabela HTML com nome, telefone, chave Pix, valor, vencimento e status de cada pessoa e abre a janela de impressão do navegador — compatível com "Salvar como PDF" em todos os browsers modernos.

---

## 🧩 Extensibilidade

### Adicionar uma nova categoria de gasto

Edite `src/data/store.js`:

```js
export const CATEGORIES = [
  'Alimentação', 'Moradia', /* ... */ 'Nova Categoria',
]

export const CATEGORY_COLORS = {
  'Nova Categoria': '#hex-da-cor',
}
```

### Adicionar um novo banco

Edite `src/data/store.js`:

```js
export const BANK_ACCOUNT_OPTIONS = [
  // ...
  { value: 'meu-banco', label: 'Meu Banco', color: '#000000' },
]
```

### Adicionar uma nova página

1. Crie `src/components/NovaPagina/NovaPagina.jsx` e `NovaPagina.module.scss`
2. Adicione o estado necessário em `src/hooks/useFinance.js`
3. Adicione a rota em `src/App.jsx`
4. Adicione o link no array `NAV` em `src/components/Shared/Layout.jsx`

---

## 📦 Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (localhost:5173)
npm run build    # Build de produção → pasta dist/
npm run preview  # Preview local do build de produção
```


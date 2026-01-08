# FinanX - Controle Financeiro

Um aplicativo PWA moderno e intuitivo para gerenciar suas finanças pessoais.

![FinanX](public/icons/icon-192x192.png)

## ✨ Funcionalidades

- 📊 **Dashboard** - Visão geral das suas finanças com resumo mensal e anual
- 💰 **Entradas** - Registre suas receitas (salário, acordos, cashback, etc.)
- 💸 **Despesas** - Controle seus gastos por categoria
- 📈 **Relatórios** - Gráficos de evolução mensal e análise por categoria
- 📱 **PWA** - Instale no seu celular como um app nativo
- 🌙 **Tema Escuro** - Interface moderna com tema dark
- 🗄️ **PostgreSQL** - Dados persistidos no seu banco de dados
- 🔐 **Autenticação** - Login com email/senha

## 🚀 Como Usar

### Desenvolvimento (Modo Local)

Sem banco de dados, os dados ficam salvos no localStorage:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🗄️ Configuração do PostgreSQL

### 1. Configure a variável de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Conexão com o PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/finanx?schema=public"

# Habilitar modo com banco de dados
NEXT_PUBLIC_DATABASE_ENABLED=true

# Chave secreta para JWT (mude em produção!)
JWT_SECRET="sua-chave-secreta-muito-segura-aqui"
```

### 2. Execute as migrations do Prisma

```bash
# Gerar o cliente Prisma
npx prisma generate

# Criar as tabelas no banco
npx prisma db push

# (Opcional) Abrir o Prisma Studio para visualizar dados
npx prisma studio
```

### 3. Reinicie o servidor

```bash
npm run dev
```

## 📦 Produção

```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

## 📱 Instalação como PWA

1. Acesse o app pelo navegador no celular
2. Clique em "Adicionar à tela inicial" (iOS) ou no ícone de instalação (Android/Chrome)
3. Pronto! O app estará disponível como um ícone na sua tela inicial

## 🛠️ Tecnologias

- [Next.js 15](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática
- [Tailwind CSS](https://tailwindcss.com/) - Estilização
- [Prisma](https://www.prisma.io/) - ORM para PostgreSQL
- [next-pwa](https://github.com/shadowwalker/next-pwa) - Progressive Web App
- [Heroicons](https://heroicons.com/) - Ícones

## 📂 Estrutura

```
src/
├── app/
│   ├── page.tsx          # Dashboard
│   ├── login/            # Página de login
│   ├── entradas/         # Página de entradas
│   ├── despesas/         # Página de despesas
│   ├── relatorios/       # Página de relatórios
│   └── api/              # API Routes
│       ├── auth/         # Autenticação
│       └── transactions/ # CRUD de transações
├── components/
│   ├── Navigation.tsx    # Barra de navegação
│   ├── MonthSelector.tsx # Seletor de mês
│   ├── UserMenu.tsx      # Menu do usuário
│   ├── TransactionForm.tsx
│   ├── TransactionList.tsx
│   └── SummaryCard.tsx
├── context/
│   ├── AuthContext.tsx   # Contexto de autenticação
│   └── FinanceContext.tsx # Estado global de finanças
├── lib/
│   ├── prisma.ts         # Cliente Prisma
│   └── auth.ts           # Funções de autenticação
└── types/
    └── finance.ts        # Tipos TypeScript

prisma/
└── schema.prisma         # Schema do banco de dados
```

## 💡 Dicas

- Use o seletor de mês para navegar entre os meses
- Clique em "Hoje" no seletor para voltar ao mês atual
- Deslize nas transações para ver opções de editar/excluir
- Sem banco configurado: dados salvos localmente no navegador
- Com banco configurado: dados sincronizados no PostgreSQL

## 🔧 Comandos Úteis

```bash
# Ver o banco de dados
npx prisma studio

# Resetar o banco (CUIDADO: apaga todos os dados)
npx prisma db push --force-reset

# Gerar tipos do Prisma após alterar o schema
npx prisma generate
```

---

Feito com 💚 para organizar suas finanças

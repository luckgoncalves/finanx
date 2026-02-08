# FinanX - Roadmap de Comercialização

> Plano de ação para transformar o FinanX em um produto comercial.
> 
> **Última atualização:** Janeiro 2026

---

## Visão Geral do Progresso

| Fase | Status | Progresso |
|------|--------|-----------|
| Fase 1 - MVP | 🟡 Em andamento | 90% |
| Fase 2 - Segurança | 🔴 Pendente | 0% |
| Fase 3 - Legal/Compliance | 🔴 Pendente | 0% |
| Fase 4 - Perfil do Usuário | 🔴 Pendente | 0% |
| Fase 5 - Monetização | 🔴 Pendente | 0% |
| Fase 6 - Features Premium | 🔴 Pendente | 0% |
| Fase 7 - Marketing | 🔴 Pendente | 0% |
| Fase 8 - Infraestrutura | 🔴 Pendente | 0% |
| Fase 9 - Suporte | 🔴 Pendente | 0% |

---

## Fase 1 - MVP 🟡

### Funcionalidades Base
- [x] PWA (Progressive Web App)
- [x] Instalação no dispositivo
- [x] Tema claro/escuro automático
- [x] Responsividade (mobile-first)

### Autenticação
- [x] Registro de usuário
- [x] Login com email/senha
- [x] JWT com cookies httpOnly
- [x] Logout

### Transações
- [x] Adicionar entradas (receitas)
- [x] Adicionar despesas
- [x] Editar transações
- [x] Excluir transações
- [x] Marcar despesas como pagas
- [x] Parcelamentos (criar múltiplas parcelas)
- [x] Despesas recorrentes

### Dashboard
- [x] Resumo do mês (saldo, entradas, despesas)
- [x] Resumo do ano
- [x] Transações recentes
- [x] Navegação entre meses

### Categorias
- [x] Categorias pré-definidas para despesas
- [x] Categorias pré-definidas para receitas
- [x] Cores por categoria
- [x] Dashboard de gastos por categoria

### UX
- [x] Skeleton loading
- [x] Feedback de loading nos botões
- [x] Onboarding para novos usuários
- [x] Opção de rever tutorial

### Compartilhamento de Conta (Visualizadores)
- [ ] Titular pode convidar usuários para visualizar a conta (ex: por email)
- [ ] Visualizadores acessam a mesma conta em modo somente leitura
- [ ] Visualizadores veem dashboard, gastos, entradas e resumos (sem editar/excluir)
- [ ] Titular gerencia lista de visualizadores (adicionar/remover)
- [ ] Aceitar/rejeitar convite para ser visualizador

> **Futuro (Premium):** O visualizador poder ter conta própria no FinanX e alternar entre "Minha conta" e "Conta que visualizo" — como ter duas contas e trocar entre elas (ex: eu tenho minha conta e a da família que meu cônjuge compartilhou).

---

## Fase 2 - Segurança 🔴

**Estimativa:** 2-3 dias

### Autenticação Robusta
- [ ] Recuperação de senha por email
- [ ] Confirmação de email no registro
- [ ] Limite de tentativas de login (rate limiting)
- [ ] Logout de todos os dispositivos

### Validação de Dados
- [ ] Validação com Zod nas APIs
- [ ] Sanitização de inputs
- [ ] Validação no frontend (formulários)

### Headers de Segurança
- [ ] Content Security Policy (CSP)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security

### Proteção de APIs
- [ ] Rate limiting global
- [ ] CSRF protection
- [ ] Validação de origem das requisições

---

## Fase 3 - Legal/Compliance 🔴

**Estimativa:** 1-2 dias

### Documentos Legais
- [ ] Termos de Uso
- [ ] Política de Privacidade
- [ ] Política de Cookies

### LGPD/GDPR
- [ ] Banner de consentimento de cookies
- [ ] Opção de exportar dados pessoais
- [ ] Opção de deletar conta e todos os dados
- [ ] Log de consentimentos

### Páginas
- [ ] Página /termos
- [ ] Página /privacidade
- [ ] Link no rodapé/menu

---

## Fase 4 - Perfil do Usuário 🔴

**Estimativa:** 1-2 dias

### Gerenciamento de Conta
- [ ] Página de perfil/configurações
- [ ] Editar nome
- [ ] Editar email (com confirmação)
- [ ] Alterar senha
- [ ] Upload de foto de perfil

### Preferências
- [ ] Escolher tema (claro/escuro/sistema)
- [ ] Moeda preferida
- [ ] Formato de data
- [ ] Dia de início do mês financeiro

### Conta
- [ ] Ver sessões ativas
- [ ] Desconectar de outros dispositivos
- [ ] Deletar conta

---

## Fase 5 - Monetização 🔴

**Estimativa:** 3-5 dias

### Planos
- [ ] Definir features do plano Free
- [ ] Definir features do plano Premium
- [ ] Modelo de dados para assinaturas
- [ ] Tela de comparação de planos

### Limites do Plano Free
- [ ] Limite de transações por mês (ex: 50)
- [ ] Limite de categorias personalizadas
- [ ] Aviso quando próximo do limite
- [ ] Bloqueio suave ao atingir limite

### Pagamentos
- [ ] Integração com Stripe
- [ ] Checkout para upgrade
- [ ] Webhooks para confirmação
- [ ] Portal do cliente (gerenciar assinatura)

### Alternativa: Pagamento Nacional
- [ ] Integração com PagSeguro ou Mercado Pago
- [ ] PIX como forma de pagamento
- [ ] Boleto como forma de pagamento

---

## Fase 6 - Features Premium 🔴

**Estimativa:** 5-7 dias

### Exportação de Dados
- [ ] Exportar para CSV
- [ ] Exportar para Excel
- [ ] Exportar para PDF (relatório mensal)
- [ ] Enviar relatório por email

### Gráficos Avançados
- [ ] Gráfico de evolução mensal
- [ ] Gráfico de pizza por categoria
- [ ] Comparativo mês a mês
- [ ] Tendência de gastos

### Orçamentos
- [ ] Definir orçamento por categoria
- [ ] Alertas de orçamento (50%, 80%, 100%)
- [ ] Visualização de progresso

### Metas Financeiras
- [ ] Criar metas de economia
- [ ] Prazo para atingir meta
- [ ] Acompanhamento de progresso
- [ ] Celebração ao atingir

### Múltiplas Contas
- [ ] Adicionar contas bancárias
- [ ] Carteiras/cartões
- [ ] Transferências entre contas
- [ ] Saldo por conta

### Conta Própria + Contas Compartilhadas (Premium)
- [ ] Usuário pode ser titular de uma conta e visualizador de outra(s)
- [ ] Alternar entre "Minha conta" e "Contas que visualizo" no app
- [ ] Indicador visual de qual contexto está ativo (minha conta vs. compartilhada)
- [ ] Útil para casais: cada um tem sua conta e ainda visualiza a conta do outro

### Notificações
- [ ] Push notifications (PWA)
- [ ] Lembrete de contas a vencer
- [ ] Resumo semanal por email
- [ ] Alertas de gastos incomuns

---

## Fase 7 - Marketing 🔴

**Estimativa:** 2-3 dias

### Landing Page
- [ ] Design da landing page
- [ ] Seção de features
- [ ] Seção de preços
- [ ] Depoimentos/social proof
- [ ] Call to action (CTA)
- [ ] FAQ

### SEO
- [ ] Meta tags otimizadas
- [ ] Open Graph para redes sociais
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Schema markup (JSON-LD)

### Analytics
- [ ] Google Analytics 4
- [ ] Eventos personalizados
- [ ] Funil de conversão
- [ ] Mixpanel ou Amplitude (opcional)

### Redes Sociais
- [ ] Compartilhar conquistas
- [ ] Preview cards (og:image)
- [ ] Links para redes sociais

---

## Fase 8 - Infraestrutura 🔴

**Estimativa:** 2-3 dias

### CI/CD
- [ ] GitHub Actions para deploy
- [ ] Testes automatizados no PR
- [ ] Preview deployments (Vercel)
- [ ] Proteção da branch main

### Testes
- [ ] Testes unitários (Jest/Vitest)
- [ ] Testes de integração
- [ ] Testes E2E (Playwright)
- [ ] Cobertura mínima de 70%

### Monitoramento
- [ ] Sentry para erros
- [ ] LogRocket ou FullStory (replay de sessões)
- [ ] Uptime monitoring
- [ ] Alertas de erro por email/Slack

### Banco de Dados
- [ ] Backups automáticos diários
- [ ] Backup antes de migrações
- [ ] Estratégia de restore testada
- [ ] Monitoramento de performance

### Performance
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals otimizados
- [ ] Cache de assets
- [ ] Lazy loading de componentes

---

## Fase 9 - Suporte 🔴

**Estimativa:** 1-2 dias

### Documentação
- [ ] Centro de ajuda
- [ ] FAQ completo
- [ ] Guias de uso
- [ ] Vídeos tutoriais (opcional)

### Suporte ao Cliente
- [ ] Email de suporte
- [ ] Formulário de contato
- [ ] Chat widget (Crisp, Intercom, etc.)
- [ ] Tempo de resposta definido (SLA)

### Feedback
- [ ] Formulário de feedback in-app
- [ ] NPS (Net Promoter Score)
- [ ] Roadmap público (opcional)
- [ ] Changelog de atualizações

---

## Cronograma Sugerido

```
Semana 1: Fase 2 (Segurança) + Fase 3 (Legal)
Semana 2: Fase 4 (Perfil) + Fase 5 (Monetização - início)
Semana 3: Fase 5 (Monetização - conclusão) + Fase 6 (Premium - início)
Semana 4: Fase 6 (Premium - conclusão)
Semana 5: Fase 7 (Marketing) + Fase 8 (Infra)
Semana 6: Fase 9 (Suporte) + Testes finais + Lançamento
```

---

## Prioridade de Implementação

### 🔥 Alta Prioridade (Antes do lançamento)
1. Recuperação de senha
2. Termos de uso e privacidade
3. Opção de deletar conta
4. Landing page básica
5. Monitoramento de erros (Sentry)

### 🟡 Média Prioridade (Primeiras semanas)
1. Compartilhamento de conta (titular adiciona visualizadores)
2. Planos e monetização
3. Exportação para CSV/PDF
4. Gráficos básicos
5. Analytics

### 🟢 Baixa Prioridade (Iterações futuras)
1. Conta própria + alternar entre contas compartilhadas (Premium)
2. Múltiplas contas
3. Metas financeiras
3. Notificações push
4. Chat de suporte

---

## Como Contribuir

1. Escolha um item pendente `[ ]`
2. Crie uma branch: `feature/nome-da-feature`
3. Implemente e teste
4. Abra um PR
5. Após merge, marque como `[x]`

---

## Notas

- Este roadmap é um guia, não uma lista rígida
- Prioridades podem mudar baseado em feedback dos usuários
- Algumas features podem ser adicionadas ou removidas
- Estimativas são aproximadas e podem variar


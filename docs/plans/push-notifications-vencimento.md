# Plano: Notificações push (lembrete no dia do vencimento)

## Cron: GitHub Actions

O job diário que dispara o lembrete de contas vencendo hoje será executado por **GitHub Actions**, não por Vercel Cron. Assim tudo permanece gratuito.

### Workflow

- **Arquivo:** `.github/workflows/daily-due-reminder.yml`
- **Schedule:** `cron: '0 11 * * *'` (11h UTC = 8h BRT; ajuste conforme seu fuso)
- **Passos:**
  1. Trigger no horário definido (e opcionalmente manual `workflow_dispatch`).
  2. Job que faz um `curl` ou `fetch` para a URL da API em produção, por exemplo:
     - `GET https://seu-dominio.vercel.app/api/cron/daily-due`
     - Header: `Authorization: Bearer ${{ secrets.CRON_SECRET }}` ou query `?secret=${{ secrets.CRON_SECRET }}`.
  3. A API `/api/cron/daily-due` valida o `CRON_SECRET` e executa a lógica (buscar despesas com vencimento hoje, enviar push).

### Configuração no repositório

- Em **Settings > Secrets and variables > Actions** do GitHub, criar o secret **CRON_SECRET** com o mesmo valor da variável `CRON_SECRET` definida no ambiente de produção (Vercel/env).
- A URL da API (ex.: `https://finanx.vercel.app/api/cron/daily-due`) pode ficar no workflow em claro ou em um secret **API_BASE_URL** se preferir.

### Exemplo mínimo do workflow

```yaml
name: Daily due reminder
on:
  schedule:
    - cron: '0 11 * * *'
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call daily-due API
        run: |
          curl -X GET "${{ secrets.API_BASE_URL }}/api/cron/daily-due" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

(Alternativa: usar `query string ?secret=${{ secrets.CRON_SECRET }}` se a API validar por query.)

---

O restante do plano (Service Worker, VAPID, PushSubscription, APIs, frontend) permanece como descrito anteriormente; apenas a execução do “cron” passa a ser este workflow no GitHub Actions.

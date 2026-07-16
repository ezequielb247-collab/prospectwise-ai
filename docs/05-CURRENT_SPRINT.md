# Sprint 8 — Follow-up e Fila Controlada

**Status:** Em andamento  
**Objetivo:** Organizar contatos futuros e mensagens aprovadas sem envio externo.

## Entregue

- Follow-ups com criação, reagendamento, conclusão, cancelamento e limites.
- Fila simulada restrita a mensagens aprovadas.
- Ajuste por dias úteis, janela e timezone da campanha.
- Painéis `/follow-ups` e `/fila`, configurações por campanha e agendamento em Mensagens.
- RLS, relações compostas, auditoria e testes de isolamento.

## Ativação

Execute `supabase/migrations/202607160006_follow_up_queue.sql` após a migration da Sprint 7.

## Fora do escopo

- WhatsApp, e-mail, APIs, workers, cron e qualquer envio real.

# Sprint 5 — Persistência Real e Autenticação

## Entregue

- Supabase Auth para cadastro, login, logout, recuperação e sessão por cookies.
- Proteção das rotas privadas e identidade derivada da sessão.
- Migration PostgreSQL das entidades atuais, RLS e relações compostas por usuário.
- Repositórios persistentes para campanhas, leads, mensagens, CRM, configurações e Lead Intelligence.
- CRM otimista com rollback em falha, sem `localStorage` como fonte oficial.
- Telas sem imports diretos dos mocks; demonstração isolada atrás de repositório.
- Seed opcional, idempotente e bloqueado em produção.

## Ativação pendente

Criar um projeto Supabase, executar a migration e configurar as três variáveis indicadas no README. Sem elas, o ambiente local entra explicitamente em modo demonstração.

## Fora do escopo

- OpenAI, WhatsApp e qualquer provedor pago.

# Changelog

## Sprint 9.5 — Produção e Primeiro Uso Real

- Build Next.js dedicado à Vercel, mantendo o fluxo Vinext local.
- Runtime Node 22.13 documentado e headers básicos de segurança configurados.
- Fontes remotas removidas do build para eliminar dependência externa.
- Fallback D1/Cloudflare isolado do caminho Supabase/Vercel por carregamento tardio.
- Agenda, Follow-ups e Fila incluídos no proxy de sessão.
- Checklist de produção e roteiro de primeira campanha real por CSV adicionados.

## Sprint 9 — Organização Comercial

- CRUD de tarefas com Agenda, prioridades, status e auditoria.
- Notas múltiplas e favoritos persistidos por lead.
- Dashboard, pesquisa global, pipeline e detalhes do lead ampliados.
- Histórico comercial ampliado com atividades de tarefas, notas e favoritos.
- Cartões e filtros do CRM enriquecidos para apoiar a rotina comercial.
- Migration com RLS, índices e isolamento por usuário, sem integrações externas.

## Sprint 7 — Sistema de Mensagens Comerciais

- Separação entre diagnósticos `warning` e `blocking_error`.
- Aprovação permitida quando existem apenas avisos sobre dados opcionais ausentes.
- Aprovação bloqueada para opt-out, WhatsApp sem telefone, variável não resolvida, mensagem vazia e conteúdo inseguro.

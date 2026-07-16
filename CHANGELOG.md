# Changelog

## Sprint 9.5 — Produção e Primeiro Uso Real

- Build Next.js dedicado à Vercel, mantendo o fluxo Vinext local.
- Runtime Node 22.13 documentado e headers básicos de segurança configurados.
- Fontes remotas removidas do build para eliminar dependência externa.
- Fallback D1/Cloudflare isolado do caminho Supabase/Vercel por carregamento tardio.
- Agenda, Follow-ups e Fila incluídos no proxy de sessão.
- Checklist de produção e roteiro de primeira campanha real por CSV adicionados.
- Repositório privado conectado à Vercel e primeira publicação concluída em `prospectwise-ai.vercel.app`.
- Redirects de rotas privadas e headers de segurança validados em produção sem sessão.
- Preview CSV corrigido para não depender de colunas opcionais fora das chaves de deduplicação.
- Diagnóstico seguro do preview agora registra metadados e exceção no servidor, expondo nome, mensagem e stack somente em desenvolvimento.
- Endpoint de preview aceita o JSON existente e `multipart/form-data`, sem registrar conteúdo do CSV.
- Endpoint de commit CSV agora preserva a resposta genérica em produção e registra diagnóstico estruturado de `PostgrestError` e `Error` somente no servidor.

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

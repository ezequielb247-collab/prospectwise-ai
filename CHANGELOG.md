# Changelog

## Sprint 10.2 — Refinamento de UX Comercial

- Radar com resumo real de oportunidades por prioridade e score médio.
- Cards mais compactos, clicáveis por mouse e teclado, com score semântico, destaque de seleção, maior oportunidade e serviços em chips.
- Barra de ações em massa com contador permanente, estados desabilitado/processando, seleção filtrada, lista, mensagens, CRM e exportação.
- Filtros com total de resultados, limpeza rápida, limites acessíveis de score e adaptação para telas menores.
- Skeleton completo do Radar, respeito a movimento reduzido e estados de erro preservando a seleção.
- Listas, Prospecção e Assistente de Respostas alinhados às primitivas visuais compartilhadas; Leads e Propostas auditados sem redesenho desnecessário.
- Quinze testes de regressão adicionados para interações, acessibilidade, responsividade e consistência visual.

## Sprint 10.1 — Revisão Visual e Consistência

- Design system interno com primitivas reutilizáveis para páginas, seções, formulários, ações, alertas, indicadores, estados vazios, tabelas e layouts móveis.
- Página de Leads reorganizada com seleção na tabela, checkbox no cabeçalho, plural correto e ações em massa separadas.
- Presença digital e criação de proposta reorganizadas em grids acessíveis, com labels vinculados e feedback de processamento.
- Indicadores de produtividade, menus de ações secundárias, traduções de status, foco por teclado e responsividade padronizados.
- Revisão visual transversal aplicada por estilos compartilhados, sem alterar regras de negócio ou integrações.

## Sprint 10 — Motor Comercial Completo

- Inteligência v2 explicável; listas e ações em massa; presença digital manual.
- Mensagens v2 com CTA e variante A/B; prospecção manual com limite diário.
- Propostas sem preço inventado; objeções; dashboard; onboarding e configurações.
- Providers pagos protegidos por credencial, feature flag e confirmação explícita.

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
- RPC atômica `import_csv_leads` restaurada pela migration `202607160008_fix_import_csv_rpc.sql` e validada no Supabase real.
- Importador CSV validado em produção: preview concluído, commit HTTP 200 e uma empresa persistida sem erros.

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

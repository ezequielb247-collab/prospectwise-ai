# Roadmap

## Sprint 10 — Motor Comercial Completo — concluída localmente

Ativação em produção pendente da migration e validação real no Supabase. Providers pagos permanecem apenas preparados.

## Sprint 7 — concluída

Sistema completo para preparar e organizar mensagens comerciais sem envio externo. A integração com canais permanece posterior e obrigatoriamente isolada por adaptadores.

## Sprint 8 — concluída

Follow-up e fila controlada para organizar contatos futuros, sem worker, cron ou envio externo.

## Sprint 9 — Organização Comercial — concluída

Organização comercial com tarefas, Agenda, notas múltiplas, favoritos, histórico ampliado e melhorias no CRM.

## Sprint 9.5 — Produção e Primeiro Uso Real — em andamento

Publicação segura na Vercel, validação do Supabase real e primeiro uso por importação CSV, sem integrações externas ou envio automático.

1. MVP funcional com campanhas, leads, mensagens e CRM simulados.
2. Providers de busca e configurações de integração, mantendo mocks.
3. CRM orientado por campanhas e relacionamentos persistentes.
4. Lead Intelligence determinística, explicável e Radar de oportunidades.
5. Persistência multiusuário, autenticação, RLS e seed opcional (implementada; ativação do projeto Supabase pendente).
6. Integrações externas autorizadas, filas, limites e observabilidade.
7. IA generativa assistida, com revisão humana e avaliação de qualidade.

Cada etapa preserva contratos de serviço e repositório, permitindo trocar infraestrutura sem acoplar páginas a fornecedores.

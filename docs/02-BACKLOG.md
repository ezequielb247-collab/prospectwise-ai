# Backlog

## Sprint 9

- [x] Tarefas e Agenda comercial.
- [x] Notas múltiplas e favoritos.
- [x] Detalhe completo do lead.
- [x] Pesquisa, dashboard e pipeline ampliados.
- [x] Auditoria e RLS.
- [ ] Validar migration no projeto Supabase remoto.

## Sprint 7 — Sistema de Mensagens Comerciais

- [x] Templates por usuário, tipo e canal.
- [x] Geração determinística com avisos de dados ausentes.
- [x] Rascunho, preparação, aprovação, cancelamento e reabertura.
- [x] Geração em lote, painel, filtros, detalhes e exportação CSV.
- [ ] Envio real por WhatsApp, e-mail ou outro canal (fora desta sprint).

## Sprint 8 — Follow-up e Fila Controlada

- [x] Follow-ups persistentes, regras de tentativas e reagendamento.
- [x] Fila organizacional para mensagens aprovadas.
- [x] Janelas, dias permitidos, timezone e limites diários.
- [ ] Worker, cron e envio externo (fora desta sprint).

## Próximas entregas

- Aplicar a migration Sprint 5 no projeto Supabase definitivo e importar os dados D1 exportados.
- Adicionar testes end-to-end contra um projeto Supabase local para validar cookies e RLS no PostgreSQL real.
- Autenticação e isolamento completo por usuário.
- Importação real via Outscraper com tratamento de limites e reprocessamento.
- Aprovação e envio real de mensagens somente após integração autorizada.
- Configuração visual das regras de score e histórico de versões.
- Paginação do Radar no servidor para grandes volumes.
- Observabilidade, telemetria e alertas de falha.

## Dívidas e auditoria

- Os mocks antigos ainda possuem um score de referência usado em telas legadas.
- Ratings do esquema legado usam inteiros; normalizar a escala ao persistir dados reais.
- O D1 permanece como caminho de rollback até a validação completa da migração PostgreSQL.
- Garantir que a futura persistência mantenha unicidade por lead e trilha de recálculos.

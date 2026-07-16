# Backlog

## Sprint 10

- [x] Motor v2 e módulos comerciais manuais.
- [ ] Aplicar e validar a migration Sprint 10 no Supabase.
- [ ] Habilitar providers pagos somente após credencial e autorização.

## Sprint 9

- [x] Tarefas e Agenda comercial.
- [x] Notas múltiplas e favoritos.
- [x] Detalhe completo do lead.
- [x] Pesquisa, dashboard e pipeline ampliados.
- [x] Auditoria e RLS.
- [ ] Validar migration no projeto Supabase remoto.

## Sprint 9.5

- [x] Preparar build Next.js específico para a Vercel.
- [x] Definir versão do Node e headers básicos de segurança.
- [x] Remover dependência de rede das fontes durante o build.
- [x] Isolar o fallback D1/Cloudflare do runtime Supabase na Vercel.
- [x] Incluir Agenda, Follow-ups e Fila na renovação de sessão do proxy.
- [x] Criar checklist de produção e roteiro da primeira campanha real.
- [ ] Criar ou conectar repositório GitHub privado e enviar a branch `main`.
- [ ] Configurar as variáveis no projeto Vercel sem expor valores.
- [ ] Publicar e validar os fluxos na URL pública.
- [ ] Configurar Site URL e Redirect URLs no Supabase Auth.

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

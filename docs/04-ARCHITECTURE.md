# Arquitetura

## Lead Intelligence

```text
UI → API interna → LeadIntelligenceService → LeadScoringEngine
                                      ↘ LeadAnalysisRepository
                                      ↘ IntelligenceActivityRepository
```

`LeadScoringEngine` é puro e recebe um `LeadIntelligenceInput`. O serviço coordena consulta, prevenção de duplicidade, recálculo e auditoria. Em produção, `SupabaseIntelligenceRepository` persiste análises e atividades com escopo do usuário; o modo de demonstração em memória existe somente sem configuração Supabase.

O Radar consulta somente análises existentes e aplica filtros e ordenação em uma função pura. Dados não analisados não recebem score implícito. Providers externos não participam desta camada.

## Fronteiras

- `app/`: interface e rotas HTTP.
- `lib/intelligence/`: domínio, aplicação e contratos.
- `supabase/migrations/`: modelo PostgreSQL, relações compostas e RLS.
- `db/schema.ts`: modelo D1 legado preservado para rollback.
- `drizzle/`: migrações versionadas.
- `tests/`: regras, serviços, Radar e auditoria.

## Persistência e autenticação

```text
UI → API/Server Action → Serviço de domínio → Interface → Repositório Supabase
```

O SDK do Supabase fica restrito a `lib/supabase`. A identidade vem da sessão validada no servidor. Todas as consultas usam `user_id`, enquanto RLS e chaves estrangeiras compostas aplicam uma segunda barreira no PostgreSQL.

## Mensagens comerciais

```text
MessageCenter → API interna → MessageService → MessageTemplateEngine
                                      ↘ MessageRepository → Supabase + RLS
```

O engine é puro, aceita somente variáveis declaradas e nunca executa conteúdo do template. O serviço valida campanha, propriedade, opt-out, duplicidade e transições. Nenhum componente cliente importa Supabase e não existe provider de envio nesta sprint.

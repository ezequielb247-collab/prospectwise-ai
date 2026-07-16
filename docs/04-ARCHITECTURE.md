# Arquitetura

## Lead Intelligence

```text
UI → API interna → LeadIntelligenceService → LeadScoringEngine
                                      ↘ LeadAnalysisRepository
                                      ↘ IntelligenceActivityRepository
```

`LeadScoringEngine` é puro e recebe um `LeadIntelligenceInput`. O serviço coordena consulta, prevenção de duplicidade, recálculo e auditoria. As interfaces de repositório isolam a persistência; a execução local usa memória temporária e o esquema D1 já contém a entidade definitiva.

O Radar consulta somente análises existentes e aplica filtros e ordenação em uma função pura. Dados não analisados não recebem score implícito. Providers externos não participam desta camada.

## Fronteiras

- `app/`: interface e rotas HTTP.
- `lib/intelligence/`: domínio, aplicação e contratos.
- `db/schema.ts`: modelo relacional.
- `drizzle/`: migrações versionadas.
- `tests/`: regras, serviços, Radar e auditoria.

# Migração Sprint 5: D1 para Supabase/PostgreSQL

## Estado anterior

O projeto usa Drizzle/D1, colunas `user_id` nas entidades principais, dados de demonstração em módulos TypeScript e alguns writes em APIs. A maior parte das leituras ainda usa mocks, o CRM usa `localStorage` e Lead Intelligence usa memória.

## Plano

1. Criar o esquema PostgreSQL em uma migration Supabase independente das migrations D1 existentes.
2. Adicionar chaves estrangeiras compostas `(id, user_id)` para impedir relações entre proprietários diferentes.
3. Ativar RLS em todas as tabelas e aplicar políticas baseadas em `auth.uid()`.
4. Manter contratos de domínio sem dependência do SDK do Supabase.
5. Trocar implementações em memória/localStorage por repositórios persistentes por usuário.
6. Converter os mocks em seed opcional e idempotente, nunca automático em produção.

## Preservação e rollback

- As migrations D1 permanecem intactas para rollback do ambiente anterior.
- A migration PostgreSQL é aditiva e não altera o D1 existente.
- O seed usa IDs estáveis e `ON CONFLICT DO NOTHING`.
- Antes de migrar dados reais, exportar D1 e importar cada usuário em uma transação separada.
- Rollback: desativar as variáveis Supabase e restaurar o binding D1; nenhuma tela depende diretamente do driver.

# ProspectWise AI

## Sprint 5 — Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/migrations/202607160001_sprint5_schema_rls.sql`.
   Se a migration inicial já foi aplicada, execute em seguida `supabase/migrations/202607160002_fix_authenticated_grants.sql`. Ela concede privilégios básicos aos papéis autenticados e administrativos, mantendo o RLS como controle de linhas.
3. Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=CHAVE_SERVICE_ROLE
```

A chave `SUPABASE_SERVICE_ROLE_KEY` é usada somente pelo seed administrativo e nunca entra no bundle do navegador. Para popular uma conta de demonstração opcional, defina `DEMO_USER_EMAIL` e execute `npm run seed:demo` fora de produção. Sem as variáveis públicas, o desenvolvimento local usa modo demonstração explícito.

MVP de um assistente de prospecção comercial para pesquisar, qualificar e organizar empresas locais. Esta versão roda integralmente em modo de demonstração: não consulta APIs pagas e não envia mensagens reais.

## Recursos disponíveis

- Dashboard com métricas, desempenho e campanha ativa.
- Campanhas com cidade, segmento, serviços, limites e pausa segura.
- Leads sem duplicidade por telefone ou identificador externo.
- Lead score e sugestões comerciais simuladas.
- Mensagens personalizadas editáveis, opt-out explícito e aprovação manual.
- Fila simulada com limite diário, intervalo e horário comercial.
- CRM em kanban, configurações e tema claro/escuro.
- CRM orientado por campanhas, com métricas isoladas, histórico da campanha e timeline por empresa.
- Interfaces substituíveis `LeadProvider` e `WhatsAppProvider`.
- Busca de empresas via `SearchCompaniesService`, com providers Mock e Outscraper, deduplicação, métricas de importação e paginação.

## Executar localmente

Requisitos: Node.js 22.13 ou mais recente.

```bash
npm install
npm run dev
```

Abra a URL informada no terminal. Use `/login` ou acesse `/dashboard` diretamente para o modo demonstração.

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Dados e segurança

O esquema relacional em `db/schema.ts` inclui perfis, campanhas, leads, análises, mensagens, tentativas, conversas, atividades de CRM, descadastros e preferências. Todas as entidades comerciais possuem `user_id` e índices de isolamento. Para produção, aplique políticas RLS equivalentes no Supabase e valide o usuário em todas as ações do servidor.

Empresas exigem `campaign_id`; mensagens exigem simultaneamente `lead_id` e `campaign_id`. Mudanças de etapa, criação de campanha, importações e mensagens aprovadas são persistidas e registradas em `campaign_events`. A migration `0002_sparkling_living_tribunal.sql` reassocia dados antigos antes de tornar os relacionamentos obrigatórios e inclui registros demonstrativos consistentes.

Chaves nunca devem ser expostas no navegador. Copie `.env.example` para `.env.local` somente quando for ativar uma integração. Antes disso serão necessárias: projeto Supabase, chave OpenAI, conta/projeto Google Places ou Outscraper e uma conta WhatsApp Business aprovada pela Meta. O adaptador real permanece bloqueado até aprovação manual.

### Configurar a Outscraper

Crie o arquivo `.env.local` na raiz do projeto e adicione:

```env
OUTSCRAPER_API_KEY=sua_chave_aqui
```

Depois reinicie o servidor local e abra **Configurações → Integrações de busca**. O indicador deve mudar para “Chave configurada”; selecione `OutscraperLeadProvider`, escolha o limite e salve. A chave é lida exclusivamente no servidor pelo header `X-API-KEY` e nunca é enviada ou armazenada no navegador.

## Arquitetura

- `app/`: páginas e interface responsiva.
- `db/schema.ts`: modelo relacional e índices.
- `lib/providers.ts`: contratos e provedores mock/real isolados.
- `lib/search-companies-service.ts`: caso de uso independente da interface.
- `lib/d1-lead-repository.ts`: persistência e deduplicação no banco.
- `lib/lead-score.ts`: regra determinística de qualificação.
- `tests/`: testes essenciais de rotas, segurança e opt-out.

## Limites do MVP

Autenticação, persistência hospedada, IA, busca e WhatsApp estão preparados para integração, mas permanecem simulados. Isso evita custos, contatos não autorizados e exposição de credenciais durante o desenvolvimento.

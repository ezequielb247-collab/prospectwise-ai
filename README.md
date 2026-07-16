# ProspectWise AI

MVP de um assistente de prospecção comercial para pesquisar, qualificar e organizar empresas locais. Esta versão roda integralmente em modo de demonstração: não consulta APIs pagas e não envia mensagens reais.

## Recursos disponíveis

- Dashboard com métricas, desempenho e campanha ativa.
- Campanhas com cidade, segmento, serviços, limites e pausa segura.
- Leads sem duplicidade por telefone ou identificador externo.
- Lead score e sugestões comerciais simuladas.
- Mensagens personalizadas editáveis, opt-out explícito e aprovação manual.
- Fila simulada com limite diário, intervalo e horário comercial.
- CRM em kanban, configurações e tema claro/escuro.
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

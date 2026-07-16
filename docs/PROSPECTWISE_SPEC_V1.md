# ProspectWise AI — Especificação de Produto v1.0

## 1. Visão do Produto

**ProspectWise AI** é um assistente comercial de prospecção para freelancers, agências e pequenas empresas que vendem serviços digitais.

O produto deve ajudar o usuário a:

1. Encontrar empresas locais.
2. Identificar oportunidades comerciais.
3. Organizar empresas em campanhas.
4. Gerar abordagens personalizadas.
5. Enviar mensagens de forma controlada.
6. Registrar respostas e movimentações no CRM.
7. Fazer follow-up.
8. Identificar leads interessados.
9. Agendar reuniões.
10. Acompanhar resultados comerciais.

### Proposta de valor

> Encontrar, qualificar e abordar empresas locais com menos trabalho manual.

### Serviços que o sistema poderá oferecer

- Criação de sites.
- Landing pages.
- Bots para WhatsApp.
- Agentes de IA.
- Automações.
- Integrações.
- Google Business Profile.
- Marketing digital.
- Cardápios e catálogos digitais.
- Sistemas internos simples.

---

## 2. Objetivo da Primeira Versão

A versão 1.0 deve ser utilizável para conseguir clientes reais.

Ela não precisa começar como um SaaS complexo. O foco inicial é:

- Criar campanhas.
- Importar empresas.
- Organizar leads.
- Qualificar oportunidades.
- Preparar mensagens.
- Enviar mensagens com controle.
- Registrar respostas.
- Acompanhar o funil comercial.

### Critério de sucesso

O ProspectWise será considerado funcional quando permitir:

1. Criar uma campanha.
2. Vincular empresas à campanha.
3. Gerar mensagens diferentes para cada empresa.
4. Enviar ou agendar mensagens.
5. Registrar respostas.
6. Mover empresas no CRM.
7. Visualizar o histórico completo.
8. Identificar interessados.
9. Marcar uma reunião.
10. Gerar pelo menos uma oportunidade comercial real.

---

## 3. Princípios do Produto

### 3.1 Simplicidade

Evitar funcionalidades que não contribuam diretamente para encontrar ou converter clientes.

### 3.2 Automação controlada

O sistema deve automatizar tarefas repetitivas, mas permitir:

- aprovação manual;
- pausa da campanha;
- limite diário;
- bloqueio de novos contatos;
- opt-out;
- intervenção humana.

### 3.3 Dados confiáveis

O sistema não deve inventar informações sobre empresas.

### 3.4 Arquitetura substituível

Integrações externas devem usar adaptadores, para permitir troca de fornecedor sem reescrever o sistema.

### 3.5 Segurança

Nenhuma chave de API deve ficar disponível no navegador ou no repositório.

---

## 4. Módulos do Sistema

## 4.1 Dashboard

O dashboard deve apresentar:

- campanhas ativas;
- empresas encontradas;
- leads importados;
- mensagens preparadas;
- mensagens enviadas;
- respostas;
- interessados;
- reuniões;
- propostas;
- clientes;
- erros de envio;
- taxa de resposta;
- taxa de conversão.

### Resumo diário

Exemplo:

- Empresas encontradas hoje: 25
- Mensagens preparadas: 15
- Mensagens enviadas: 10
- Respostas: 3
- Interessados: 1
- Reuniões: 1

---

## 4.2 Campanhas

A campanha é a entidade principal do sistema.

### Campos

- ID.
- Nome.
- Cidade.
- Estado.
- Categoria.
- Objetivo.
- Serviços oferecidos.
- Quantidade desejada de empresas.
- Limite diário de mensagens.
- Horário inicial de envio.
- Horário final de envio.
- Dias permitidos.
- Status.
- Data de criação.
- Data de início.
- Data de conclusão.
- Usuário proprietário.

### Status

- Rascunho.
- Ativa.
- Pausada.
- Concluída.
- Arquivada.

### Página da campanha

Deve mostrar:

- informações gerais;
- progresso;
- empresas vinculadas;
- quantidade por etapa do CRM;
- mensagens preparadas;
- mensagens enviadas;
- respostas;
- interessados;
- reuniões;
- clientes;
- erros;
- timeline;
- botão para pausar;
- botão para retomar;
- botão para importar empresas;
- botão para gerar mensagens.

---

## 4.3 Prospecção de Empresas

### Entrada

- Cidade.
- Estado.
- Categoria.
- Quantidade.
- Nota mínima.
- Possui site.
- Possui telefone.
- Possui WhatsApp.
- Possui Instagram.
- Quantidade mínima de avaliações.

### Dados coletados

- ID externo.
- Nome.
- Categoria.
- Telefone.
- Website.
- Instagram.
- Facebook.
- Endereço.
- Cidade.
- Estado.
- CEP.
- Nota.
- Quantidade de avaliações.
- Horário de funcionamento.
- Latitude.
- Longitude.
- URL do Google Maps.
- Data da coleta.
- Provedor utilizado.

### Arquitetura de provedores

```text
LeadProvider
├── MockLeadProvider
├── OutscraperLeadProvider
├── GooglePlacesLeadProvider
├── ApifyLeadProvider
└── ImportFileLeadProvider
```

### Regras de deduplicação

Uma empresa não deve ser cadastrada novamente quando houver correspondência por:

1. identificador externo;
2. telefone normalizado;
3. domínio do site;
4. nome normalizado + cidade;
5. endereço normalizado.

### Resultado da importação

Exibir:

- recebidas;
- importadas;
- duplicadas;
- ignoradas;
- inválidas;
- erros.

---

## 4.4 Leads

Cada lead pertence obrigatoriamente a uma campanha.

### Campos

- ID.
- Campaign ID.
- Nome.
- Categoria.
- Telefone.
- Website.
- Instagram.
- Facebook.
- Endereço.
- Cidade.
- Estado.
- Nota.
- Avaliações.
- Lead Score.
- Prioridade.
- Etapa do CRM.
- Último contato.
- Próximo follow-up.
- Observações.
- Criado em.
- Atualizado em.

### Página de detalhes

Abas:

- Resumo.
- Dados da empresa.
- Inteligência.
- Mensagens.
- Conversa.
- CRM.
- Histórico.
- Observações.

---

## 4.5 Lead Intelligence

O Lead Intelligence Engine qualifica empresas e sugere oportunidades.

### Primeira fase

Regras determinísticas, sem IA.

### Exemplos de pontuação

- Sem site: +30.
- Site sem domínio próprio: +15.
- Telefone disponível: +10.
- WhatsApp disponível: +10.
- Nota acima de 4,5: +10.
- Mais de 50 avaliações: +10.
- Instagram disponível: +5.
- Sem Instagram: +5 para serviço de presença digital.
- Poucas avaliações: +10 para Google Business Profile.
- Dados incompletos: reduzir pontuação.

### Faixas

- 80 a 100: Excelente.
- 60 a 79: Bom.
- 40 a 59: Regular.
- 0 a 39: Baixo.

### Prioridade

- Alta.
- Média.
- Baixa.

### Serviços recomendados

- Site institucional.
- Landing page.
- Bot de WhatsApp.
- Agente de IA.
- Automação.
- Google Business Profile.
- Catálogo digital.
- Cardápio digital.

### Saída esperada

- Lead Score.
- Prioridade.
- Oportunidades encontradas.
- Serviços recomendados.
- Motivos.
- Melhor argumento de abordagem.
- Dados ausentes.

---

## 4.6 Radar de Oportunidades

O Radar deve mostrar os leads com maior potencial.

### Filtros

- Campanha.
- Cidade.
- Categoria.
- Sem site.
- Com telefone.
- Com WhatsApp.
- Nota mínima.
- Avaliações mínimas.
- Lead Score mínimo.
- Serviço recomendado.

### Ordenação

- Maior Lead Score.
- Mais avaliações.
- Melhor nota.
- Mais recente.
- Sem contato anterior.

---

## 4.7 Mensagens

Cada mensagem deve pertencer obrigatoriamente a:

- um lead;
- uma campanha;
- um usuário.

### Tipos

- Primeira abordagem.
- Follow-up 1.
- Follow-up 2.
- Resposta.
- Envio de portfólio.
- Convite para reunião.
- Proposta.
- Encerramento.
- Opt-out confirmado.

### Status

- Rascunho.
- Preparada.
- Aprovada.
- Agendada.
- Em fila.
- Enviada.
- Entregue.
- Respondida.
- Falhou.
- Cancelada.

### Requisitos

- Mensagem editável.
- Personalização por empresa.
- Registro de horário.
- Registro de tentativas.
- Histórico de alterações.
- Não usar fallback silencioso para o primeiro lead.
- Não gerar mensagem sem empresa selecionada.

### Exemplo de abordagem

> Olá, tudo bem? Encontrei a empresa de vocês enquanto pesquisava negócios de Macaé. Trabalho com criação de sites e automações para WhatsApp. Percebi que pode existir uma oportunidade de melhorar o atendimento digital da empresa. Posso mostrar uma demonstração rápida sem compromisso?

---

## 4.8 CRM

### Etapas

- Novo.
- Mensagem preparada.
- Contatado.
- Respondeu.
- Interessado.
- Reunião.
- Proposta.
- Negociação.
- Cliente.
- Sem interesse.
- Opt-out.

### Funcionalidades

- Kanban.
- Drag-and-drop.
- Alternativa por menu “Mover para”.
- Persistência.
- Filtro por campanha.
- Filtro por cidade.
- Filtro por categoria.
- Filtro por data.
- Histórico automático ao mudar de etapa.

---

## 4.9 Timeline e Atividades

Toda ação importante deve gerar uma atividade.

### Tipos de atividade

- Campanha criada.
- Campanha iniciada.
- Campanha pausada.
- Lead importado.
- Lead duplicado.
- Lead adicionado à campanha.
- Score calculado.
- Mensagem criada.
- Mensagem editada.
- Mensagem aprovada.
- Mensagem enviada.
- Mensagem falhou.
- Resposta recebida.
- Etapa alterada.
- Observação adicionada.
- Follow-up agendado.
- Reunião marcada.
- Proposta enviada.
- Lead convertido em cliente.
- Opt-out registrado.

---

## 4.10 Follow-up

### Campos

- Lead.
- Campanha.
- Data do último contato.
- Data do próximo contato.
- Motivo.
- Status.
- Número de tentativas.
- Responsável.

### Regras

- Não enviar após opt-out.
- Não duplicar follow-up.
- Pausar quando houver resposta.
- Permitir reagendamento.
- Limitar quantidade de tentativas.
- Encerrar automaticamente conforme regra da campanha.

---

## 4.11 WhatsApp

A integração deve ser feita por adaptadores.

```text
WhatsAppProvider
├── MockWhatsAppProvider
├── MetaCloudWhatsAppProvider
└── BaileysWhatsAppProvider
```

### Requisitos

- Fila.
- Limite diário.
- Intervalo entre mensagens.
- Horário comercial.
- Aprovação manual.
- Pausa de campanha.
- Registro de falha.
- Reprocessamento.
- Descadastro.
- Bloqueio por telefone.
- Intervenção humana.
- Histórico de conversa.

### Segurança operacional

O sistema não deve:

- burlar bloqueios;
- esconder identidade;
- disparar mensagens sem controle;
- continuar após pedido de descadastro;
- enviar fora do horário configurado;
- repetir contatos de forma excessiva.

---

## 4.12 SDR com IA

O SDR de IA será integrado depois da base estar estável.

### Responsabilidades

- Gerar mensagens.
- Responder perguntas comuns.
- Identificar intenção.
- Classificar interesse.
- Solicitar informações.
- Apresentar serviços.
- Enviar portfólio.
- Propor reunião.
- Encaminhar para humano.
- Atualizar CRM.
- Registrar resumo da conversa.

### Limites

A IA não deve:

- inventar preços;
- prometer prazos não configurados;
- conceder desconto sem autorização;
- confirmar reunião fora da agenda;
- continuar quando o usuário pedir uma pessoa;
- responder temas fora do escopo comercial.

### Escalonamento humano

Encaminhar quando:

- pedir orçamento personalizado;
- pedir contrato;
- pedir desconto;
- demonstrar irritação;
- solicitar falar com uma pessoa;
- houver dúvida técnica complexa;
- houver intenção clara de fechar.

---

## 4.13 Reuniões

### Campos

- Lead.
- Campanha.
- Data.
- Hora.
- Duração.
- Responsável.
- Status.
- Link.
- Observações.
- Origem.

### Status

- Pendente.
- Confirmada.
- Concluída.
- Cancelada.
- Não compareceu.

---

## 4.14 Clientes

Quando um lead virar cliente, registrar:

- Empresa.
- Campanha de origem.
- Serviços vendidos.
- Valor.
- Mensalidade.
- Data de fechamento.
- Status.
- Próxima cobrança.
- Observações.

---

## 5. Modelo de Dados

## 5.1 Entidades principais

- profiles
- campaigns
- leads
- lead_sources
- lead_analyses
- messages
- message_attempts
- conversations
- conversation_messages
- crm_activities
- follow_ups
- meetings
- clients
- opt_outs
- provider_settings
- app_settings

## 5.2 Relacionamentos

```text
User
└── Campaigns
    ├── Leads
    │   ├── LeadAnalysis
    │   ├── Messages
    │   ├── Conversation
    │   ├── Activities
    │   ├── FollowUps
    │   ├── Meetings
    │   └── Client
    └── CampaignActivities
```

### Regras obrigatórias

- Todo lead deve ter `campaign_id`.
- Toda mensagem deve ter `lead_id` e `campaign_id`.
- Toda atividade deve informar usuário e entidade relacionada.
- Todo registro deve ser isolado por usuário.
- Opt-outs devem ser globais por usuário e telefone normalizado.

---

## 6. Arquitetura Técnica

### Stack recomendada

- Next.js.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Supabase Auth.
- PostgreSQL.
- Zod.
- React Hook Form.
- TanStack Query.
- Testes com Vitest ou Jest.

### Serviços

```text
CampaignService
LeadSearchService
LeadImportService
LeadDeduplicationService
LeadIntelligenceService
MessageGenerationService
MessageQueueService
WhatsAppService
ConversationService
CRMService
FollowUpService
MeetingService
ActivityService
```

### Regra de arquitetura

Páginas e componentes não devem chamar provedores diretamente.

Exemplo correto:

```text
UI
→ Server Action/API Route
→ Service
→ Provider
→ External API
```

---

## 7. Segurança

### Obrigatório

- Variáveis de ambiente.
- `.env.local` ignorado pelo Git.
- `.env.example` sem valores reais.
- RLS no Supabase.
- Validação no servidor.
- Rate limiting.
- Logs sem segredos.
- Chaves apenas no servidor.
- Sanitização de entradas.
- Auditoria de alterações sensíveis.
- Isolamento por usuário.

---

## 8. Testes Essenciais

### Leads

- Cada lead abre seus próprios detalhes.
- ID inexistente retorna “Lead não encontrado”.
- Deduplicação funciona.
- Lead pertence a uma campanha.

### Mensagens

- Mensagem usa o lead selecionado.
- Alterar lead altera a prévia.
- Nenhum lead selecionado bloqueia geração.
- Status é persistido.

### CRM

- Card muda de coluna.
- Status interno é atualizado.
- Recarregar mantém posição.
- Histórico é criado.

### Campanhas

- Métricas são calculadas.
- Leads aparecem na campanha correta.
- Pausar bloqueia novos envios.

### WhatsApp

- Opt-out bloqueia envio.
- Limite diário funciona.
- Horário permitido funciona.
- Falha é registrada.
- Mock não envia mensagem real.

---

## 9. Roadmap

## Sprint 1 — Fundação

- Interface.
- Navegação.
- Dashboard.
- Campanhas.
- Leads.
- CRM.
- Mensagens.
- Configurações.

## Sprint 2 — Provedores de busca

- LeadProvider.
- MockLeadProvider.
- OutscraperLeadProvider.
- Serviço de busca.
- Deduplicação.
- Paginação.

## Sprint 3 — CRM por campanhas

- Relacionamentos obrigatórios.
- Página de campanha.
- Timeline.
- Métricas.
- Atividades.
- Filtros.

## Sprint 4 — Lead Intelligence

- Score por regras.
- Prioridade.
- Serviços recomendados.
- Radar de oportunidades.

## Sprint 5 — Persistência e autenticação definitivas

- Supabase.
- RLS.
- Banco real.
- Migrações.
- Seed opcional.

## Sprint 6 — IA

- Geração de mensagens.
- Análise de oportunidade.
- Resumos.
- Prompts versionados.

## Sprint 7 — WhatsApp controlado

- Provider real.
- Fila.
- Limites.
- Horários.
- Opt-out.
- Aprovação manual.

## Sprint 8 — Conversação e SDR

- Recebimento de respostas.
- Classificação de intenção.
- Respostas automáticas.
- Encaminhamento humano.
- Reuniões.

## Sprint 9 — Produção

- Deploy.
- Domínio.
- Monitoramento.
- Logs.
- Backup.
- Alertas.

---

## 10. Funcionalidades Fora da v1.0

Devem esperar:

- múltiplas equipes;
- planos pagos;
- cobrança recorrente;
- white-label;
- aplicativo mobile;
- propostas em PDF avançadas;
- contratos;
- e-mail marketing;
- análise completa de Instagram;
- auditoria técnica profunda de sites;
- marketplace de templates;
- múltiplos idiomas.

---

## 11. Definição de Pronto

Uma funcionalidade só está pronta quando:

- funciona na interface;
- persiste corretamente;
- possui tratamento de erro;
- não utiliza valores fixos indevidos;
- respeita isolamento do usuário;
- possui testes essenciais;
- passa em lint;
- passa em typecheck;
- passa nos testes;
- passa no build;
- está documentada.

---

## 12. Instrução Permanente para o Codex

Ao desenvolver o ProspectWise:

1. Não reiniciar o projeto.
2. Preservar o visual existente, salvo pedido explícito.
3. Trabalhar em pequenas alterações.
4. Criar commits descritivos.
5. Não conectar APIs pagas sem autorização.
6. Não enviar mensagens reais durante testes.
7. Não colocar credenciais no Git.
8. Sempre rodar lint, typecheck, testes e build.
9. Informar arquivos modificados.
10. Explicar a causa de bugs corrigidos.
11. Priorizar funcionalidades que ajudam a conseguir clientes.
12. Evitar complexidade prematura.

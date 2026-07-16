# Sprint 9.5 — Produção e Primeiro Uso Real

**Status:** Em andamento
**Objetivo:** Publicar, validar e começar a usar o ProspectWise com empresas reais.

## Escopo

- Preparar o build Next.js para a Vercel sem remover o fluxo Vinext local.
- Publicar o histórico existente em um repositório privado, sem reescrita.
- Configurar o Supabase Auth para a URL pública e validar cookies, redirects e RLS.
- Validar os fluxos essenciais em produção e executar a primeira campanha real por CSV.
- Corrigir somente falhas encontradas na preparação e validação de produção.

## Restrições

Não conectar APIs externas, OpenAI, WhatsApp, Meta, Evolution, Twilio, e-mail, cron ou worker. Nenhuma mensagem será enviada automaticamente.

## Estado da publicação

- Build local Vinext e build nativo Next/Vercel preparados.
- Checklist de produção e roteiro da primeira campanha criados.
- Repositório privado publicado em `ezequielb247-collab/prospectwise-ai`, branch `main`.
- Produção publicada em `https://prospectwise-ai.vercel.app`.
- Rotas privadas e headers de segurança validados sem sessão.
- Validação autenticada e configuração do Supabase Auth aguardam acesso ao painel e rotação preventiva da service role.

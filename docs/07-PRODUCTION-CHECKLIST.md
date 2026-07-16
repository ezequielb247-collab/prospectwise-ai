# Checklist de Produção

## Sprint 10

- [ ] Aplicar `202607160009_sprint10_commercial_engine.sql`.
- [ ] Confirmar RLS e `anon` revogado nas tabelas novas.
- [ ] Validar isolamento com dois usuários.
- [ ] Manter providers pagos desativados sem credenciais.

## 1. Git e segredos

- [x] O repositório GitHub é privado e a branch de produção é `main`.
- [x] `.env`, `.env.local`, `.env.*.local`, logs, `.vercel`, `.next`, `.vinext`, `dist` e `node_modules` não estão versionados.
- [x] `git ls-files` não retorna credenciais, tokens ou arquivos locais.
- [x] O histórico foi enviado por fast-forward, sem force push ou reescrita.
- [x] A especificação oficial foi autorizada e incluída em `docs/PROSPECTWISE_SPEC_V1.md`.

## 2. Vercel

- [x] Framework: Next.js.
- [x] Node.js: 22.x (mínimo 22.13).
- [x] Build Command: `npm run build:vercel`.
- [x] Variáveis configuradas para Production e Preview:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [x] Nenhum valor foi copiado para documentação, logs ou commits.
- [x] O deploy concluiu e `https://prospectwise-ai.vercel.app` responde por HTTPS.
- [x] Os headers `nosniff`, `DENY`, Referrer Policy, Permissions Policy e HSTS estão presentes.
- [ ] Rotacionar a service role preventivamente antes do primeiro uso real e atualizar a variável na Vercel.

## 3. Supabase Auth

Após obter a URL pública, abrir **Authentication → URL Configuration**:

- [ ] Site URL: `https://SEU-PROJETO.vercel.app`.
- [ ] Redirect URLs:
  - `https://SEU-PROJETO.vercel.app/auth/callback`
  - `https://SEU-PROJETO.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`
- [ ] Confirmação de e-mail ativa e apontando para a URL pública.
- [ ] Recuperação de senha retorna à URL pública.
- [ ] As migrations aplicadas no projeto remoto estão registradas e RLS continua ativo.

## 4. Segurança

- [x] Visitante sem sessão é redirecionado para `/login` em Dashboard, Campanhas, Leads, Radar, CRM, Mensagens, Follow-ups, Fila, Agenda e Configurações.
- [ ] Todas as APIs rejeitam usuário ausente e validam propriedade pelo `user_id`.
- [ ] Usuário A não lê nem altera recursos do usuário B.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` não aparece nos artefatos `.next/static` nem no código entregue ao navegador.
- [ ] Logs do servidor registram somente rota/operação, código e mensagem segura; nunca cookies, chaves ou tokens.
- [ ] Nenhuma rota administrativa, seed ou integração externa está exposta.

## 5. Validação funcional pública

- [ ] Cadastro e confirmação de e-mail.
- [ ] Login, logout, recuperação de senha e sessão após reload.
- [ ] Dashboard e Campanhas.
- [ ] Importação e exportação CSV.
- [ ] Leads, Radar e CRM.
- [ ] Mensagens determinísticas, sem envio.
- [ ] Follow-ups e Fila simulada.
- [ ] Agenda, notas e favoritos.
- [ ] Persistência após logout/login.

## 6. Evidências de conclusão

Registrar URL e commit do deploy, data/hora, conta de teste utilizada (sem senha), fluxos aprovados, erros encontrados e correções. A Sprint 9.5 só pode ser marcada como concluída depois da validação pública.

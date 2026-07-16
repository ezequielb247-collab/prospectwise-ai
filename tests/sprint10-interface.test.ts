import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("barra de ações em massa só mostra ações após seleção", () => {
  const source = read("app/BulkLeadActions.tsx");
  assert.match(source, /Selecione leads para executar ações em massa/);
  assert.match(source, /selected\.length > 0/);
  assert.match(source, /Limpar seleção/);
});

test("tabela possui checkbox acessível para página e para cada lead", () => {
  const source = read("app/Workspace.tsx");
  assert.match(source, /aria-label="Selecionar página"/);
  assert.match(source, /aria-label={`Selecionar \${l\.name}`}/);
  assert.match(source, /allVisibleSelected/);
});

test("plural da seleção é apresentado corretamente", () => {
  const source = read("app/BulkLeadActions.tsx");
  assert.match(source, /selected\.length === 1 \? "selecionado" : "selecionados"/);
});

test("status internos possuem traduções de apresentação", () => {
  const source = read("app/ui/interface.tsx");
  assert.match(source, /new: "Novo"/);
  assert.match(source, /scheduled: "Agendado"/);
  assert.match(source, /sent_manual: "Enviada manualmente"/);
  assert.match(source, /accepted: "Aceita"/);
});

test("presença digital usa grid e labels vinculados", () => {
  const source = read("app/DigitalPresencePanel.tsx");
  assert.match(source, /<FormGrid>/);
  assert.match(source, /id="website-status"/);
  assert.match(source, /Informe apenas dados verificados manualmente/);
  assert.match(source, /ui-section-footer/);
});

test("proposta possui labels acessíveis e aviso de preço", () => {
  const source = read("app/ProposalCreatePanel.tsx");
  assert.match(source, /id="proposal-template"/);
  assert.match(source, /id="proposal-price"/);
  assert.match(source, /O sistema não inventa preços/);
});

test("sistema visual inclui responsividade e foco por teclado", () => {
  const css = read("app/globals.css");
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\(max-width:768px\)[\s\S]*ui-form-grid/);
  assert.match(css, /ui-mobile-card-list/);
});

test("primitivas client-safe não importam módulos server-only", () => {
  const files = ["app/ui/interface.tsx", "app/BulkLeadActions.tsx", "app/DigitalPresencePanel.tsx", "app/ProposalCreatePanel.tsx"];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /server-only|next\/headers|lib\/supabase\/server|lib\/auth\/session/);
  }
});

test("Radar usa o workspace global e as barras do design system", () => {
  const source = read("app/radar/page.tsx");
  assert.match(source, /<WorkspaceShell page="radar"/);
  assert.match(source, /<FilterBar>/);
  assert.match(source, /<BulkActionBar>/);
  assert.doesNotMatch(source, /className="form-page"|className="filters"|className="panel bulk-actions"/);
});

test("Radar separa ações e não apresenta texto colado sem seleção", () => {
  const source = read("app/radar/page.tsx");
  assert.match(source, /Selecione oportunidades para executar ações em massa/);
  assert.match(source, /Selecionar filtrados/);
  assert.match(source, /Adicionar à lista/);
  assert.match(source, /Criar mensagens/);
  assert.match(source, /Limpar seleção/);
  assert.match(source, /selected\.length > 0/);
});

test("checkbox do Radar possui id e label associado", () => {
  const source = read("app/radar/page.tsx");
  assert.match(source, /const checkboxId = `radar-lead-\${lead\.id}`/);
  assert.match(source, /id=\{checkboxId\}/);
  assert.match(source, /htmlFor=\{checkboxId\}/);
});

test("rotas comerciais auditadas usam o mesmo WorkspaceShell", () => {
  for (const route of ["app/listas/page.tsx", "app/prospeccao/page.tsx", "app/propostas/page.tsx", "app/respostas/page.tsx"]) {
    assert.match(read(route), /WorkspaceShell/, route);
  }
});

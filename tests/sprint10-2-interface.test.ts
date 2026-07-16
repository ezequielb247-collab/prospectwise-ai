import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const radar = readFileSync("app/radar/page.tsx", "utf8");
const radarCss = readFileSync("app/intelligence.css", "utf8");
const globalCss = readFileSync("app/globals.css", "utf8");

test("resumo do Radar deriva indicadores dos dados reais carregados", () => {
  assert.match(radar, /total: entries\.length/);
  assert.match(radar, /entries\.reduce\(\(total, item\) => total \+ item\.analysis\.score/);
});

test("barra mostra zero oportunidades selecionadas", () => assert.match(radar, /\{selected\.length\}[\s\S]*oportunidades selecionadas/));

test("ações em massa ficam desabilitadas sem seleção", () => assert.match(radar, /disabled=\{!selected\.length \|\| Boolean\(busyAction\)\}/));

test("ações em massa ficam disponíveis quando existe seleção", () => {
  assert.match(radar, /Adicionar à lista/);
  assert.match(radar, /Criar mensagens/);
  assert.match(radar, /Mover no CRM/);
  assert.match(radar, /Exportar/);
});

test("card selecionado recebe estado visual além do checkbox", () => {
  assert.match(radar, /is-selected/);
  assert.match(radarCss, /radar-card-clickable\.is-selected/);
});

test("checkbox interrompe a navegação do card", () => assert.match(radar, /radar-card-selection.*stopPropagation\(\)/));

test("card abre o lead correto", () => {
  assert.match(radar, /router\.push\(`\/leads\/\$\{id\}`\)/);
  assert.match(radar, /onClick=\{\(\) => openLead\(lead\.id\)\}/);
});

test("teclado abre o card com Enter ou Espaço", () => {
  assert.match(radar, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(radar, /tabIndex=\{0\}/);
});

test("score possui número e rótulo acessível", () => assert.match(radar, /aria-label=\{`Score \$\{analysis\.score\} — \$\{label\}`\}/));

test("serviços recomendados aparecem como chips limitados", () => {
  assert.match(radar, /recommendedServices\.slice\(0, 3\)/);
  assert.match(radar, /radar-service-chips/);
});

test("limpar filtros restaura todos os controles", () => {
  assert.match(radar, /function clearFilters\(\)/);
  assert.match(radar, /setMinimumScore\("0"\)/);
  assert.match(radar, /setWithoutWebsite\(false\)/);
});

test("quantidade filtrada é anunciada", () => assert.match(radar, /role="status">\{visible\.length\}/));

test("skeleton representa resumo e cards", () => {
  assert.match(radar, /radar-summary-skeleton/);
  assert.match(radar, /radar-card-skeletons/);
  assert.match(radarCss, /prefers-reduced-motion:reduce/);
});

test("mobile mantém ações secundárias em menu acessível", () => {
  assert.match(radar, /<summary className="secondary">Mais ações<\/summary>/);
  assert.match(radarCss, /@media\(max-width:760px\)[\s\S]*radar-more-actions/);
});

test("ações permanecem separadas e layouts comerciais são responsivos", () => {
  assert.doesNotMatch(radar, /selecionadosSelecionar|seleçãoAdicionar|listaCriar/);
  assert.match(globalCss, /commercial-action-wrap/);
  for (const route of ["app/listas/page.tsx", "app/prospeccao/page.tsx", "app/propostas/page.tsx", "app/respostas/page.tsx"]) assert.match(readFileSync(route, "utf8"), /WorkspaceShell/);
});

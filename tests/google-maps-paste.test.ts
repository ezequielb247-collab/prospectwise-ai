import assert from "node:assert/strict";
import test from "node:test";
import { googleMapsTextToCsv, parseGoogleMapsText } from "../lib/google-maps-paste";

const lobo = `Oficina Lobo de Macaé
4,9
(106)
Oficina mecânica

Visão geral
Avaliações
Sobre
Rotas
Salvar
Próximo

R. Velho Campos, 190 - Centro, Macaé - RJ, 27910-210
Fechado · Abre sex. às 08:00
(22) 99779-8953
Adicionar website
Resumo de avaliações
4,9
106 avaliações`;

test("extrai dados úteis de um perfil copiado do Google Maps", () => {
  const [lead] = parseGoogleMapsText(lobo);
  assert.ok(lead);
  assert.equal(lead.name, "Oficina Lobo de Macaé");
  assert.equal(lead.phone, "(22) 99779-8953");
  assert.equal(lead.city, "Macaé");
  assert.equal(lead.state, "RJ");
  assert.equal(lead.category, "Oficina mecânica");
  assert.equal(lead.rating, 4.9);
  assert.equal(lead.reviews, 106);
  assert.match(lead.address ?? "", /Velho Campos/);
});

const searchResults = `Oficina wal max
Oficina wal max
5,0(17)
Mecânica para carros · art do amor - Av. Mossoró
Fecha em breve · 17:30 · Abre sex. às 07:30 · (22) 99977-7898
Rotas
Pedro Mecânico
Pedro Mecânico
5,0(14)
Oficina mecânica · Av. dos Bandeirantes, 125
Fecha em breve · 18:00 · Abre sex. às 08:00 · (22) 99819-2548
Rotas`;

test("separa vários resultados copiados e remove repetição do nome", () => {
  const leads = parseGoogleMapsText(searchResults);
  assert.equal(leads.length, 2);
  assert.deepEqual(leads.map((lead) => lead.name), ["Oficina wal max", "Pedro Mecânico"]);
  assert.equal(leads[0].phone, "(22) 99977-7898");
  assert.equal(leads[0].reviews, 17);
  assert.equal(leads[1].phone, "(22) 99819-2548");
  assert.equal(leads[1].rating, 5);
});

test("conversão para CSV usa cabeçalhos compatíveis com o importador", () => {
  const result = googleMapsTextToCsv(lobo);
  assert.equal(result.leads.length, 1);
  assert.match(result.csv, /^"nome","telefone","site","endereco","cidade","estado","categoria","nota","avaliacoes","google_maps_url"/);
  assert.match(result.csv, /"Oficina Lobo de Macaé"/);
  assert.match(result.csv, /"Macaé"/);
});

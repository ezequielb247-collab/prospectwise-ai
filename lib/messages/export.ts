import type { CommercialMessage } from "./types";
export function neutralizeCsv(value: unknown) {
  return `"${String(value ?? "")
    .replace(/^([=+\-@])/, "'$1")
    .replace(/"/g, '""')}"`;
}
export function exportMessagesCsv(messages: CommercialMessage[]) {
  return [
    [
      "Empresa",
      "Telefone",
      "Campanha",
      "Canal",
      "Tipo",
      "Status",
      "Conteúdo",
      "Criado em",
    ],
    ...messages.map((item) => [
      item.leadName ?? "",
      "",
      item.campaignName ?? "",
      item.channel,
      item.type,
      item.status,
      item.body,
      item.createdAt,
    ]),
  ]
    .map((row) => row.map(neutralizeCsv).join(","))
    .join("\r\n");
}

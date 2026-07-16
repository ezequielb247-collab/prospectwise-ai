import type {
  MessageContext,
  RenderResult,
  Template,
  ValidationIssue,
} from "./types";
export const ALLOWED_TEMPLATE_VARIABLES = [
  "empresa",
  "cidade",
  "estado",
  "categoria",
  "telefone",
  "site",
  "campanha",
  "servicos_recomendados",
  "motivo_principal",
  "score",
  "prioridade",
] as const;
function sanitize(value: string) {
  return value
    .replace(/<\/?(?:script|iframe|object|embed|style)[^>]*>/gi, "")
    .replace(/[<>]/g, "");
}
export class MessageTemplateEngine {
  render(context: MessageContext, template: Template): RenderResult {
    const values: Record<string, string | number | null | undefined> = {
      empresa: context.lead.name,
      cidade: context.lead.city,
      estado: context.lead.state,
      categoria: context.lead.category,
      telefone: context.lead.phone,
      site: context.lead.website,
      campanha: context.campaign.name,
      servicos_recomendados:
        context.analysis?.recommendedServices.join(", ") ||
        context.campaign.services.join(", "),
      motivo_principal: context.analysis?.mainReason,
      score: context.analysis?.score,
      prioridade: context.analysis?.priority,
    };
    const warnings: ValidationIssue[] = [];
    if (
      /<\/?(?:script|iframe|object|embed|style)|javascript:/i.test(
        template.content,
      )
    )
      warnings.push({
        type: "blocking_error",
        message: "O template contém conteúdo inválido ou inseguro.",
      });
    const body = template.content.replace(
      /{{\s*([^{}]+?)\s*}}/g,
      (_match, key: string) => {
        if (!ALLOWED_TEMPLATE_VARIABLES.includes(key as never)) {
          warnings.push({
            type: "blocking_error",
            message: `Variável desconhecida: ${key}`,
            field: key,
          });
          return `{{${key}}}`;
        }
        const value = values[key];
        if (value === null || value === undefined || value === "") {
          warnings.push({
            type: "warning",
            message: `Dado opcional ausente: ${key}`,
            field: key,
          });
          return "[não informado]";
        }
        return sanitize(String(value));
      },
    );
    return {
      body: sanitize(body),
      warnings: warnings.filter(
        (item, index, all) =>
          all.findIndex(
            (other) =>
              other.type === item.type && other.message === item.message,
          ) === index,
      ),
      templateVersion: template.version,
    };
  }
}

import type {
  WorkspaceCampaign,
  WorkspaceData,
  WorkspaceLead,
} from "./workspace-model";
export type LeadFilters = {
  query?: string;
  city?: string;
  state?: string;
  category?: string;
  campaignId?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  site?: "all" | "with" | "without";
  phone?: "all" | "with" | "without";
};
export type LeadSort =
  "name" | "city" | "score" | "createdAt" | "reviews" | "rating";
const text = (value: unknown) => String(value ?? "").toLocaleLowerCase("pt-BR");
export function filterLeads(leads: WorkspaceLead[], filters: LeadFilters) {
  return leads.filter((lead) => {
    const q = text(filters.query);
    return (
      (!q ||
        [lead.name, lead.phone, lead.city, lead.state, lead.category].some(
          (value) => text(value).includes(q),
        )) &&
      (!filters.city || text(lead.city).includes(text(filters.city))) &&
      (!filters.state || text(lead.state) === text(filters.state)) &&
      (!filters.category || lead.category === filters.category) &&
      (!filters.campaignId || lead.campaignId === filters.campaignId) &&
      (!filters.status || lead.status === filters.status) &&
      (filters.minScore === undefined ||
        (lead.score !== null && lead.score >= filters.minScore)) &&
      (filters.maxScore === undefined ||
        (lead.score !== null && lead.score <= filters.maxScore)) &&
      (!filters.site ||
        filters.site === "all" ||
        (filters.site === "with" ? lead.site : !lead.site)) &&
      (!filters.phone ||
        filters.phone === "all" ||
        (filters.phone === "with"
          ? Boolean(lead.phone && lead.phone !== "—")
          : !lead.phone || lead.phone === "—"))
    );
  });
}
export function sortLeads(
  leads: WorkspaceLead[],
  sort: LeadSort,
  direction: "asc" | "desc" = "asc",
) {
  const copy = [...leads];
  copy.sort((a, b) => {
    const factor = direction === "asc" ? 1 : -1;
    if (sort === "name" || sort === "city")
      return text(a[sort]).localeCompare(text(b[sort]), "pt-BR") * factor;
    if (sort === "score" && (a.score === null || b.score === null)) {
      if (a.score === b.score) return 0;
      return a.score === null ? 1 : -1;
    }
    const av =
      sort === "createdAt"
        ? Date.parse(a.createdAt ?? "")
        : Number(a[sort] ?? 0);
    const bv =
      sort === "createdAt"
        ? Date.parse(b.createdAt ?? "")
        : Number(b[sort] ?? 0);
    return (av - bv) * factor;
  });
  return copy;
}
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((safe - 1) * pageSize, safe * pageSize),
    page: safe,
    pages,
    total: items.length,
  };
}
export function globalSearch(data: WorkspaceData, query: string) {
  const q = text(query).trim();
  if (!q) return { leads: [], campaigns: [], tasks: [] };
  const activityByLead = new Map<string, string[]>();
  for (const item of data.activities) {
    if (item.leadId)
      activityByLead.set(item.leadId, [
        ...(activityByLead.get(item.leadId) ?? []),
        item.note,
        item.type,
      ]);
  }
  return {
    leads: data.leads
      .filter((lead) =>
        [
          lead.name,
          lead.phone,
          lead.city,
          lead.state,
          lead.category,
          lead.notes,
          ...(activityByLead.get(lead.id) ?? []),
        ].some((value) => text(value).includes(q)),
      )
      .slice(0, 6),
    campaigns: data.campaigns
      .filter((campaign) =>
        [campaign.name, campaign.city].some((value) => text(value).includes(q)),
      )
      .slice(0, 4),
    tasks: (data.tasks ?? [])
      .filter((task) =>
        [task.title, task.status, task.priority].some((value) =>
          text(value).includes(q),
        ),
      )
      .slice(0, 4),
  };
}
function csvCell(value: unknown) {
  const safe = String(value ?? "")
    .replace(/^([=+\-@])/, "'$1")
    .replace(/"/g, '""');
  return `"${safe}"`;
}
export function exportLeadsCsv(
  leads: WorkspaceLead[],
  campaigns: WorkspaceCampaign[],
) {
  const campaignName = new Map(campaigns.map((item) => [item.id, item.name]));
  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.website ?? "",
    lead.city,
    lead.state ?? "",
    lead.category,
    lead.score ?? "Não analisado",
    lead.status,
    lead.provider ?? "",
    campaignName.get(lead.campaignId) ?? "",
  ]);
  return [
    [
      "Nome",
      "Telefone",
      "Site",
      "Cidade",
      "Estado",
      "Categoria",
      "Score",
      "Status CRM",
      "Provider",
      "Campanha",
    ],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
export function dashboardMetrics(data: WorkspaceData) {
  const interested = data.leads.filter(
    (lead) => lead.status === "Interessado",
  ).length;
  const clients = data.leads.filter((lead) => lead.status === "Cliente").length;
  const active = data.leads.filter(
    (lead) => !["Cliente", "Sem interesse"].includes(lead.status),
  ).length;
  const prepared = data.messages.filter((item) =>
    ["Preparada", "Aprovada", "approved", "Agendada", "Em fila"].includes(
      item.status,
    ),
  ).length;
  const responded = data.messages.filter(
    (item) => item.status === "Respondida",
  ).length;
  const tasks = data.tasks ?? [];
  return {
    campaigns: data.campaigns.length,
    companies: data.leads.length,
    active,
    interested,
    clients,
    conversion: data.leads.length
      ? Math.round((clients / data.leads.length) * 1000) / 10
      : 0,
    prepared,
    responded,
    favorites: data.leads.filter((item) => item.favorite).length,
    tasksToday: tasks.filter((item) => item.status === "hoje").length,
    tasksOverdue: tasks.filter((item) => item.status === "atrasada").length,
    tasksCompleted: tasks.filter((item) => item.status === "concluida").length,
    scheduled: data.messages.filter((item) =>
      ["Agendada", "scheduled"].includes(item.status),
    ).length,
  };
}

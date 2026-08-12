import { requireCurrentUser } from "../../lib/auth/session";
import { getWorkspaceData } from "../../lib/workspace-data";
import MessagesWorkspace from "../MessagesWorkspace";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; leadIds?: string }>;
}) {
  const params = await searchParams;
  const requested = [
    ...(params.leadIds?.split(",") ?? []),
    ...(params.leadId ? [params.leadId] : []),
  ]
    .map((value) => value.trim())
    .filter((value) => UUID.test(value));
  const initialLeadIds = [...new Set(requested)].slice(0, 100);
  const user = await requireCurrentUser("/mensagens");
  const data = await getWorkspaceData(user.id);
  const allowed = new Set(data.leads.map((lead) => lead.id));

  return (
    <MessagesWorkspace
      data={data}
      initialLeadIds={initialLeadIds.filter((id) => allowed.has(id))}
    />
  );
}

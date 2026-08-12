import { requireCurrentUser } from "../../lib/auth/session";
import { getWorkspaceData } from "../../lib/workspace-data";
import { prospectLists } from "../../lib/prospect-lists/container";
import ManualProspectingPanel from "../ManualProspectingPanel";
import { WorkspaceShell } from "../ui/interface";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser("/prospeccao");
  const data = await getWorkspaceData(user.id);
  const requestedListId = params.listId?.trim() ?? "";
  const list = requestedListId && UUID.test(requestedListId)
    ? await (await prospectLists()).get(user.id, requestedListId)
    : undefined;
  const initialLeadIds = list?.items?.map((item) => item.leadId) ?? [];

  return (
    <WorkspaceShell
      page="prospeccao"
      title="Prospecção manual"
      subtitle="Revise a abordagem, abra o WhatsApp e registre cada contato com segurança."
    >
      <ManualProspectingPanel
        data={data}
        initialLeadIds={initialLeadIds}
        sourceName={list?.name ?? null}
      />
    </WorkspaceShell>
  );
}

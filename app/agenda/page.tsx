import { requireCurrentUser } from "../../lib/auth/session";
import { getWorkspaceData } from "../../lib/workspace-data";
import { salesProduct } from "../../lib/sales-product/container";
import AgendaPanel from "../AgendaPanel";
export default async function Page() {
  const user = await requireCurrentUser("/agenda"),
    [{ tasks }, data] = await Promise.all([
      salesProduct(),
      getWorkspaceData(user.id),
    ]);
  return <AgendaPanel initial={await tasks.list(user.id)} data={data} />;
}

import { requireCurrentUser } from "../../lib/auth/session";
import { getWorkspaceData } from "../../lib/workspace-data";
import { QueuePanel } from "../OperationsPanel";
export default async function Page() {
  const user = await requireCurrentUser("/fila");
  return <QueuePanel data={await getWorkspaceData(user.id)} />;
}

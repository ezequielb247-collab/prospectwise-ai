import { requireCurrentUser } from "../../lib/auth/session";
import { getWorkspaceData } from "../../lib/workspace-data";
import { FollowUpsPanel } from "../OperationsPanel";
export default async function Page() {
  const user = await requireCurrentUser("/follow-ups");
  return <FollowUpsPanel data={await getWorkspaceData(user.id)} />;
}

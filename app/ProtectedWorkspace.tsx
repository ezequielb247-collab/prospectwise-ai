import {requireCurrentUser} from "../lib/auth/session";
import Workspace from "./Workspace";
import {getWorkspaceData} from "../lib/workspace-data";
export default async function ProtectedWorkspace({page,initialLeadId=null}:{page:string;initialLeadId?:string|null}){const user=await requireCurrentUser(`/${page}`);const data=await getWorkspaceData(user.id);return <Workspace page={page} initialLeadId={initialLeadId} user={{name:user.name,email:user.email,demo:user.demo}} data={data}/>}

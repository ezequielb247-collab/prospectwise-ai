import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { persistenceForUser } from "../../../lib/persistence-container";
import {getWorkspaceData} from "../../../lib/workspace-data";
const schema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  segment: z.string().min(2),
  companyLimit: z.number().int().min(1).max(500),
  dailyLimit: z.number().int().min(1).max(100),
  services: z.array(z.string()).min(1),
});
export async function GET(){try{const user=await requireApiUser();const data=await getWorkspaceData(user.id);return Response.json({campaigns:data.campaigns.map(({id,name})=>({id,name}))})}catch{return Response.json({error:"Não autenticado."},{status:401})}}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = schema.parse(await request.json());
    const service = await persistenceForUser(user.id);
    return Response.json(
      { id: await service.createCampaign(input) },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao criar campanha.",
      },
      { status: 500 },
    );
  }
}

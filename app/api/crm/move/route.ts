import {z} from "zod";
import {requireApiUser} from "../../../../lib/auth/session";
import {persistenceForUser} from "../../../../lib/persistence-container";
const schema=z.object({leadId:z.string().min(1),campaignId:z.string().min(1),stage:z.string().min(1)});
export async function POST(request:Request){try{const user=await requireApiUser();const input=schema.parse(await request.json());const service=await persistenceForUser(user.id);await service.moveLead(input);return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Falha ao salvar etapa."},{status:500})}}

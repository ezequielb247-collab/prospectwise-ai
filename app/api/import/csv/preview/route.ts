import {z} from "zod";
import {requireApiUser} from "../../../../../lib/auth/session";
import {csvImportServiceFor} from "../../../../../lib/csv-import/container";
import {CSV_FIELDS} from "../../../../../lib/csv-import/types";
const field=z.enum([...CSV_FIELDS,"ignore"] as [string,...string[]]);
const schema=z.object({text:z.string().min(1),mapping:z.record(z.string(),field).default({})});
export async function POST(request:Request){try{const length=Number(request.headers.get("content-length")??0);if(length>3*1024*1024)return Response.json({error:"Arquivo maior que 2 MB."},{status:413});const user=await requireApiUser();const input=schema.parse(await request.json());const service=await csvImportServiceFor(user.id);const {rows:_,...preview}=await service.preview(user.id,input.text,input.mapping as never);void _;return Response.json(preview)}catch(error){return Response.json({error:error instanceof Error?error.message:"Falha ao processar CSV."},{status:400})}}

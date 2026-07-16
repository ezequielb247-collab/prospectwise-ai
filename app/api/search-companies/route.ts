import {z} from "zod";
import {createLeadProvider} from "../../../lib/providers";
import {InMemoryLeadRepository,SearchCompaniesService} from "../../../lib/search-companies-service";
import {requireApiUser} from "../../../lib/auth/session";
import {hasSupabaseConfig} from "../../../lib/supabase/config";
import {createSupabaseServerClient} from "../../../lib/supabase/server";
import {SupabaseLeadRepository} from "../../../lib/supabase/lead-repository";

const inputSchema=z.object({campaignId:z.string().trim().min(1),city:z.string().trim().min(2).max(80),state:z.string().trim().max(2).optional(),category:z.string().trim().min(2).max(100),quantity:z.number().int().min(1).max(100),provider:z.enum(["mock","outscraper"]),page:z.number().int().min(1).default(1),pageSize:z.number().int().min(1).max(25).default(5)});
const mockRepository=new InMemoryLeadRepository();
const searchCache=new Map<string,Awaited<ReturnType<SearchCompaniesService["execute"]>>>();
export async function POST(request:Request){try{const user=await requireApiUser();const input=inputSchema.parse(await request.json());const cacheKey=JSON.stringify([user.id,input.campaignId,input.provider,input.city,input.state,input.category,input.quantity]);let result=input.page>1?searchCache.get(cacheKey):undefined;if(!result){const provider=createLeadProvider(input.provider,{OUTSCRAPER_API_KEY:process.env.OUTSCRAPER_API_KEY});let repository;if(hasSupabaseConfig())repository=new SupabaseLeadRepository(await createSupabaseServerClient());else if(input.provider==="mock")repository=mockRepository;else{const {D1LeadRepository}=await import("../../../lib/d1-lead-repository");repository=new D1LeadRepository()}const service=new SearchCompaniesService(provider,repository);result=await service.execute(user.id,input.campaignId,{city:input.city,state:input.state,category:input.category,limit:input.quantity});searchCache.set(cacheKey,result)}const start=(input.page-1)*input.pageSize;return Response.json({...result,companies:result.companies.slice(start,start+input.pageSize),pagination:{page:input.page,pageSize:input.pageSize,total:result.companies.length,totalPages:Math.max(1,Math.ceil(result.companies.length/input.pageSize))}})}catch(error){const message=error instanceof Error?error.message:"Falha inesperada na busca.";return Response.json({error:message},{status:error instanceof z.ZodError?400:500})}}

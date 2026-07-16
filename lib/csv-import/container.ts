import "server-only";
import {hasSupabaseConfig} from "../supabase/config";
import {createSupabaseServerClient} from "../supabase/server";
import {CsvImportService} from "./service";
import {SupabaseCsvLeadRepository} from "./supabase-repository";
import {MemoryCsvLeadRepository} from "./memory-repository";
const demoRepository=new MemoryCsvLeadRepository();
export async function csvImportServiceFor(userId:string,campaignId?:string){if(hasSupabaseConfig())return new CsvImportService(new SupabaseCsvLeadRepository(await createSupabaseServerClient()));if(campaignId)demoRepository.allowCampaign(userId,campaignId);return new CsvImportService(demoRepository)}

import "server-only";
import {createClient} from "@supabase/supabase-js";
import {publicSupabaseConfig} from "./config";
export function createSupabaseAdminClient(){const {url}=publicSupabaseConfig();const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!serviceRoleKey)throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY somente no servidor.");return createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}})}

import {redirect} from "next/navigation";
import {hasSupabaseConfig} from "../supabase/config";
import {createSupabaseServerClient} from "../supabase/server";
export type CurrentUser={id:string;email:string;name:string;demo:boolean};
export async function getCurrentUser():Promise<CurrentUser|null>{if(!hasSupabaseConfig()){if(process.env.NODE_ENV!=="production")return {id:"00000000-0000-4000-8000-000000000001",email:"demo@prospectwise.local",name:"Usuário demonstração",demo:true};return null}const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();return user?{id:user.id,email:user.email??"",name:String(user.user_metadata?.name??user.email??"Usuário"),demo:false}:null}
export async function requireCurrentUser(returnTo="/dashboard"){const user=await getCurrentUser();if(!user)redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);return user}
export async function requireApiUser(){const user=await getCurrentUser();if(!user)throw new Error("UNAUTHENTICATED");return user}

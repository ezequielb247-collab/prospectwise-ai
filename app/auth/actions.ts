"use server";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "../../lib/supabase/server";
function value(form:FormData,name:string){return String(form.get(name)??"").trim()}
export async function loginAction(form:FormData){const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.signInWithPassword({email:value(form,"email"),password:value(form,"password")});if(error)redirect(`/login?error=${encodeURIComponent("E-mail ou senha inválidos.")}`);redirect("/dashboard")}
export async function signupAction(form:FormData){const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.signUp({email:value(form,"email"),password:value(form,"password"),options:{data:{name:value(form,"name")}}});if(error)redirect(`/cadastro?error=${encodeURIComponent(error.message)}`);redirect("/login?message=Confira seu e-mail para confirmar o cadastro.")}
export async function recoverAction(form:FormData){const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.resetPasswordForEmail(value(form,"email"));if(error)redirect(`/recuperar-senha?error=${encodeURIComponent(error.message)}`);redirect("/login?message=Enviamos as instruções de recuperação.")}
export async function logoutAction(){const supabase=await createSupabaseServerClient();await supabase.auth.signOut();redirect("/login")}

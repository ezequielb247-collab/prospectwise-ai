import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import {publicSupabaseConfig} from "./config";
export async function createSupabaseServerClient(){
  const {url,key}=publicSupabaseConfig();
  const store=await cookies();
  return createServerClient(url,key,{cookies:{
    getAll:()=>store.getAll(),
    setAll(items){try{for(const item of items)store.set(item.name,item.value,item.options)}catch{/* Server Components cannot write cookies. */}}
  }});
}

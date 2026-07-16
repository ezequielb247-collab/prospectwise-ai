import "server-only";
import {PersistenceService} from "./persistence-service";
import {hasSupabaseConfig} from "./supabase/config";
import {SupabasePersistenceRepository} from "./supabase/persistence-repository";
import {createSupabaseServerClient} from "./supabase/server";
export async function persistenceForUser(userId:string){
  if(hasSupabaseConfig()){
    return new PersistenceService(new SupabasePersistenceRepository(await createSupabaseServerClient(),userId));
  }
  const {D1PersistenceRepository}=await import("./d1-persistence-repository");
  return new PersistenceService(new D1PersistenceRepository(userId));
}

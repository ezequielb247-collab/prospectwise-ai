import "server-only";
import {D1PersistenceRepository} from "./d1-persistence-repository";
import {PersistenceService} from "./persistence-service";
import {hasSupabaseConfig} from "./supabase/config";
import {SupabasePersistenceRepository} from "./supabase/persistence-repository";
import {createSupabaseServerClient} from "./supabase/server";
export async function persistenceForUser(userId:string){const repository=hasSupabaseConfig()?new SupabasePersistenceRepository(await createSupabaseServerClient(),userId):new D1PersistenceRepository(userId);return new PersistenceService(repository)}

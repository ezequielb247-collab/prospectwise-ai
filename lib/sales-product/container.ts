import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import { NoteService, TaskService } from "./service";
import { SupabaseSalesProductRepository } from "./supabase-repository";
export async function salesProduct() {
  const repo = new SupabaseSalesProductRepository(
    await createSupabaseServerClient(),
  );
  return { repo, tasks: new TaskService(repo), notes: new NoteService(repo) };
}

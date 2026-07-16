import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import { FollowUpService, QueueService } from "./service";
import { SupabaseFollowUpRepository } from "./supabase-repository";
export async function followUpForUser() {
  const repo = new SupabaseFollowUpRepository(
    await createSupabaseServerClient(),
  );
  return {
    repo,
    followUps: new FollowUpService(repo),
    queue: new QueueService(repo),
  };
}

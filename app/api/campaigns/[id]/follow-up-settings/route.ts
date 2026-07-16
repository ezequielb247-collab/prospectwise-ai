import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
const schema = z.object({
  followUpEnabled: z.boolean(),
  maxFollowUpAttempts: z.number().int().min(1).max(3),
  delays: z.tuple([
    z.number().int().min(1),
    z.number().int().min(1),
    z.number().int().min(1),
  ]),
  allowedWeekdays: z.array(z.number().int().min(0).max(6)).min(1),
  sendWindowStart: z.string().regex(/^\d\d:\d\d$/),
  sendWindowEnd: z.string().regex(/^\d\d:\d\d$/),
  timezone: z.string().min(1).max(80),
});
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser(),
      { id } = await params,
      client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("campaigns")
      .select(
        "follow_up_enabled,max_follow_up_attempts,follow_up_delay_days_1,follow_up_delay_days_2,follow_up_delay_days_3,allowed_weekdays,send_window_start,send_window_end,timezone",
      )
      .eq("user_id", user.id)
      .eq("id", id)
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao carregar configuração.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser(),
      { id } = await params,
      input = schema.parse(await request.json()),
      client = await createSupabaseServerClient();
    const { error } = await client
      .from("campaigns")
      .update({
        follow_up_enabled: input.followUpEnabled,
        max_follow_up_attempts: input.maxFollowUpAttempts,
        follow_up_delay_days_1: input.delays[0],
        follow_up_delay_days_2: input.delays[1],
        follow_up_delay_days_3: input.delays[2],
        allowed_weekdays: input.allowedWeekdays,
        send_window_start: input.sendWindowStart,
        send_window_end: input.sendWindowEnd,
        timezone: input.timezone,
      })
      .eq("user_id", user.id)
      .eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao salvar configuração.",
      },
      { status: 400 },
    );
  }
}

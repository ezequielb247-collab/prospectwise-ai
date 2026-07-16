/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FollowUpRepository } from "./service";
import type {
  FollowUp,
  FollowUpContext,
  FollowUpType,
  QueueItem,
} from "./types";
const follow = (r: any): FollowUp => ({
  id: r.id,
  userId: r.user_id,
  campaignId: r.campaign_id,
  leadId: r.lead_id,
  messageId: r.message_id,
  type: r.type,
  status:
    r.status === "pending" && new Date(r.scheduled_for) <= new Date()
      ? "due"
      : r.status,
  attemptNumber: r.attempt_number,
  scheduledFor: r.scheduled_for,
  completedAt: r.completed_at,
  cancelledAt: r.cancelled_at,
  reason: r.reason,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const queue = (r: any): QueueItem => ({
  id: r.id,
  userId: r.user_id,
  campaignId: r.campaign_id,
  leadId: r.lead_id,
  messageId: r.message_id,
  followUpId: r.follow_up_id,
  channel: r.channel,
  status: r.status,
  scheduledFor: r.scheduled_for,
  availableAfter: r.available_after,
  lockedAt: r.locked_at,
  processedAt: r.processed_at,
  failureReason: r.failure_reason,
  retryCount: r.retry_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
export class SupabaseFollowUpRepository implements FollowUpRepository {
  constructor(private client: SupabaseClient) {}
  async context(
    userId: string,
    campaignId: string,
    leadId: string,
    messageId?: string,
  ): Promise<FollowUpContext | undefined> {
    const [
      { data: campaign },
      { data: lead },
      { data: message },
      { data: settings },
    ] = await Promise.all([
      this.client
        .from("campaigns")
        .select(
          "id,status,follow_up_enabled,max_follow_up_attempts,follow_up_delay_days_1,follow_up_delay_days_2,follow_up_delay_days_3,allowed_weekdays,send_window_start,send_window_end,timezone,daily_limit,max_queue_retries",
        )
        .eq("user_id", userId)
        .eq("id", campaignId)
        .maybeSingle(),
      this.client
        .from("leads")
        .select("id,campaign_id,crm_stage,phone")
        .eq("user_id", userId)
        .eq("id", leadId)
        .eq("campaign_id", campaignId)
        .maybeSingle(),
      messageId
        ? this.client
            .from("messages")
            .select("id,campaign_id,lead_id,status,channel")
            .eq("user_id", userId)
            .eq("id", messageId)
            .eq("campaign_id", campaignId)
            .eq("lead_id", leadId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      this.client
        .from("app_settings")
        .select("daily_limit")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (!campaign || !lead) return;
    return {
      campaign: {
        id: campaign.id,
        status: campaign.status,
        config: {
          followUpEnabled: campaign.follow_up_enabled,
          maxFollowUpAttempts: campaign.max_follow_up_attempts,
          delays: [
            campaign.follow_up_delay_days_1,
            campaign.follow_up_delay_days_2,
            campaign.follow_up_delay_days_3,
          ] as [number, number, number],
          allowedWeekdays: campaign.allowed_weekdays,
          sendWindowStart: campaign.send_window_start.slice(0, 5),
          sendWindowEnd: campaign.send_window_end.slice(0, 5),
          timezone: campaign.timezone,
          dailyLimit: campaign.daily_limit,
          userDailyLimit: settings?.daily_limit ?? 50,
          maxRetries: campaign.max_queue_retries,
        },
      },
      lead: {
        id: lead.id,
        campaignId: lead.campaign_id,
        status: lead.crm_stage,
        phone: lead.phone,
      },
      message: message
        ? {
            id: message.id,
            campaignId: message.campaign_id,
            leadId: message.lead_id,
            status: message.status,
            channel: message.channel,
          }
        : null,
    };
  }
  async activeDuplicate(
    userId: string,
    leadId: string,
    type: FollowUpType,
    attempt: number,
  ) {
    const { count } = await this.client
      .from("follow_ups")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .eq("type", type)
      .eq("attempt_number", attempt)
      .in("status", ["pending", "due"]);
    return Boolean(count);
  }
  async activeAttempts(userId: string, leadId: string) {
    const { count } = await this.client
      .from("follow_ups")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .in("status", ["pending", "due", "completed"]);
    return count ?? 0;
  }
  async activity(userId: string, item: FollowUp, type: string) {
    await this.client.from("crm_activities").insert({
      user_id: userId,
      campaign_id: item.campaignId,
      lead_id: item.leadId,
      message_id: item.messageId,
      type,
      note: item.reason ?? "Follow-up atualizado.",
      metadata: { follow_up_id: item.id, status: item.status },
    });
  }
  async createFollowUp(userId: string, input: any, activity: string) {
    const { data, error } = await this.client
      .from("follow_ups")
      .insert({
        user_id: userId,
        campaign_id: input.campaignId,
        lead_id: input.leadId,
        message_id: input.messageId,
        type: input.type,
        status: input.status,
        attempt_number: input.attemptNumber,
        scheduled_for: input.scheduledFor,
        completed_at: input.completedAt,
        cancelled_at: input.cancelledAt,
        reason: input.reason,
        notes: input.notes,
      })
      .select("*")
      .single();
    if (error) throw error;
    const item = follow(data);
    await this.activity(userId, item, activity);
    return item;
  }
  async updateFollowUp(
    userId: string,
    id: string,
    patch: any,
    activity: string,
  ) {
    const columns: any = {};
    for (const [key, value] of Object.entries(patch))
      columns[
        (
          {
            scheduledFor: "scheduled_for",
            completedAt: "completed_at",
            cancelledAt: "cancelled_at",
            attemptNumber: "attempt_number",
          } as any
        )[key] ?? key
      ] = value;
    columns.updated_at = new Date().toISOString();
    const { data, error } = await this.client
      .from("follow_ups")
      .update(columns)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const item = follow(data);
    await this.activity(userId, item, activity);
    return item;
  }
  async cancelActive(userId: string, leadId: string, reason: string) {
    const { data, error } = await this.client
      .from("follow_ups")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        reason,
      })
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .in("status", ["pending", "due"])
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }
  async listFollowUps(userId: string) {
    const { data, error } = await this.client
      .from("follow_ups")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_for");
    if (error) throw error;
    return (data ?? []).map(follow);
  }
  async activeQueueDuplicate(userId: string, messageId: string) {
    const { count } = await this.client
      .from("message_queue")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("message_id", messageId)
      .in("status", ["pending", "scheduled", "ready", "processing"]);
    return Boolean(count);
  }
  async dailyCounts(userId: string, campaignId: string, date: string) {
    const start = date.slice(0, 10) + "T00:00:00.000Z",
      end = date.slice(0, 10) + "T23:59:59.999Z";
    const [{ count: campaign }, { count: user }] = await Promise.all([
      this.client
        .from("message_queue")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("campaign_id", campaignId)
        .gte("scheduled_for", start)
        .lte("scheduled_for", end),
      this.client
        .from("message_queue")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .gte("scheduled_for", start)
        .lte("scheduled_for", end),
    ]);
    return { campaign: campaign ?? 0, user: user ?? 0 };
  }
  async createQueue(userId: string, input: any) {
    const { data, error } = await this.client
      .from("message_queue")
      .insert({
        user_id: userId,
        campaign_id: input.campaignId,
        lead_id: input.leadId,
        message_id: input.messageId,
        follow_up_id: input.followUpId,
        channel: input.channel,
        status: input.status,
        scheduled_for: input.scheduledFor,
        available_after: input.availableAfter,
        retry_count: input.retryCount,
      })
      .select("*")
      .single();
    if (error) throw error;
    return queue(data);
  }
  async updateQueue(userId: string, id: string, patch: any) {
    const columns: any = {};
    for (const [key, value] of Object.entries(patch))
      columns[
        (
          {
            scheduledFor: "scheduled_for",
            availableAfter: "available_after",
            processedAt: "processed_at",
            failureReason: "failure_reason",
            retryCount: "retry_count",
          } as any
        )[key] ?? key
      ] = value;
    columns.updated_at = new Date().toISOString();
    const { data, error } = await this.client
      .from("message_queue")
      .update(columns)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return queue(data);
  }
  async listQueue(userId: string) {
    const { data, error } = await this.client
      .from("message_queue")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_for");
    if (error) throw error;
    return (data ?? []).map(queue);
  }
}

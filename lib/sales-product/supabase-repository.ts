import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SalesProductRepository } from "./service";
import type { LeadNote, SalesTask, TaskInput } from "./types";
const task = (r: any): SalesTask => ({
  id: r.id,
  userId: r.user_id,
  leadId: r.lead_id,
  campaignId: r.campaign_id,
  title: r.title,
  description: r.description,
  type: r.type,
  priority: r.priority,
  scheduledFor: r.scheduled_for,
  status: r.status,
  completedAt: r.completed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  leadName: r.leads?.name,
  campaignName: r.campaigns?.name,
});
const note = (r: any): LeadNote => ({
  id: r.id,
  userId: r.user_id,
  leadId: r.lead_id,
  text: r.text,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
export class SupabaseSalesProductRepository implements SalesProductRepository {
  constructor(private client: SupabaseClient) {}
  async listTasks(userId: string) {
    const { data, error } = await this.client
      .from("tasks")
      .select("*,leads(name),campaigns(name)")
      .eq("user_id", userId)
      .order("scheduled_for");
    if (error) throw error;
    return (data ?? []).map(task);
  }
  async getTask(userId: string, id: string) {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? task(data) : undefined;
  }
  async leadContext(userId: string, leadId: string) {
    const { data, error } = await this.client
      .from("leads")
      .select("campaign_id")
      .eq("user_id", userId)
      .eq("id", leadId)
      .maybeSingle();
    if (error) throw error;
    return data ? { campaignId: data.campaign_id } : undefined;
  }
  async createTask(userId: string, input: TaskInput) {
    const { data, error } = await this.client
      .from("tasks")
      .insert({
        user_id: userId,
        lead_id: input.leadId,
        campaign_id: input.campaignId,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        scheduled_for: input.scheduledFor,
        status: "pendente",
      })
      .select("*")
      .single();
    if (error) throw error;
    return task(data);
  }
  async updateTask(userId: string, id: string, patch: any) {
    const columns: any = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined)
        columns[
          (
            {
              campaignId: "campaign_id",
              leadId: "lead_id",
              scheduledFor: "scheduled_for",
              completedAt: "completed_at",
            } as any
          )[key] ?? key
        ] = value;
    }
    const { data, error } = await this.client
      .from("tasks")
      .update(columns)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return task(data);
  }
  async deleteTask(userId: string, id: string) {
    const { error } = await this.client
      .from("tasks")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    if (error) throw error;
  }
  async listNotes(userId: string, leadId: string) {
    let query = this.client
      .from("lead_notes")
      .select("*")
      .eq("user_id", userId);
    if (leadId) query = query.eq("lead_id", leadId);
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return (data ?? []).map(note);
  }
  async getNote(userId: string, id: string) {
    const { data, error } = await this.client
      .from("lead_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? note(data) : undefined;
  }
  async createNote(userId: string, leadId: string, text: string) {
    const { data, error } = await this.client
      .from("lead_notes")
      .insert({ user_id: userId, lead_id: leadId, text })
      .select("*")
      .single();
    if (error) throw error;
    return note(data);
  }
  async updateNote(userId: string, id: string, text: string) {
    const { data, error } = await this.client
      .from("lead_notes")
      .update({ text, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return note(data);
  }
  async deleteNote(userId: string, id: string) {
    const { error } = await this.client
      .from("lead_notes")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    if (error) throw error;
  }
  async setFavorite(userId: string, leadId: string, favorite: boolean) {
    const { data, error } = await this.client
      .from("leads")
      .update({ favorite, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", leadId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Lead não encontrado.");
  }
  async activity(
    userId: string,
    input: { leadId: string; campaignId: string; type: string; note: string },
  ) {
    const { error } = await this.client
      .from("crm_activities")
      .insert({
        user_id: userId,
        lead_id: input.leadId,
        campaign_id: input.campaignId,
        type: input.type,
        note: input.note,
      });
    if (error) throw error;
  }
}

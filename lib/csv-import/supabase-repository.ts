import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { duplicateKeys } from "./parser";
import type { CsvLeadRepository } from "./service";
import type { NormalizedCsvLead } from "./types";

export class SupabaseCsvLeadRepository implements CsvLeadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async campaignBelongsToUser(userId: string, campaignId: string) {
    const { data, error } = await this.client
      .from("campaigns")
      .select("id")
      .eq("user_id", userId)
      .eq("id", campaignId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async existingDuplicateKeys(userId: string) {
    // Only fetch columns that participate in the five documented duplicate keys.
    // Optional enrichment columns must not make CSV preview depend on schema drift.
    const { data, error } = await this.client
      .from("leads")
      .select("name,phone,website,address,city,maps_url")
      .eq("user_id", userId);
    if (error) throw error;
    const keys = new Set<string>();
    for (const row of data ?? []) {
      const lead: NormalizedCsvLead = {
        name: row.name,
        phone: row.phone,
        website: row.website,
        address: row.address,
        city: row.city,
        state: null,
        category: null,
        rating: null,
        reviews: null,
        mapsUrl: row.maps_url,
        instagram: null,
        facebook: null,
        provider: "csv_import",
      };
      duplicateKeys(lead).forEach((key) => keys.add(key));
    }
    return keys;
  }

  async importLeads(_: string, campaignId: string, leads: NormalizedCsvLead[]) {
    if (!leads.length) return [];
    const { data, error } = await this.client.rpc("import_csv_leads", {
      p_campaign_id: campaignId,
      p_leads: leads,
    });
    if (error) throw error;
    return (data ?? []).map((row: { lead_id: string }) => row.lead_id);
  }
}

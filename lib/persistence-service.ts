export type CampaignStatus =
  "active" | "paused" | "draft" | "completed" | "archived";

export interface PersistentRepository {
  createCampaign(input: {
    name: string;
    city: string;
    state: string;
    segment: string;
    companyLimit: number;
    dailyLimit: number;
    services: string[];
  }): Promise<string>;
  updateCampaignStatus(input: {
    campaignId: string;
    status: "active" | "paused";
  }): Promise<void>;
  moveLead(input: {
    leadId: string;
    campaignId: string;
    stage: string;
  }): Promise<void>;
  prepareMessage(input: {
    leadId: string;
    campaignId: string;
    body: string;
  }): Promise<string>;
}

export class PersistenceService {
  constructor(private readonly repository: PersistentRepository) {}
  createCampaign(input: Parameters<PersistentRepository["createCampaign"]>[0]) {
    return this.repository.createCampaign(input);
  }
  updateCampaignStatus(
    input: Parameters<PersistentRepository["updateCampaignStatus"]>[0],
  ) {
    return this.repository.updateCampaignStatus(input);
  }
  moveLead(input: Parameters<PersistentRepository["moveLead"]>[0]) {
    return this.repository.moveLead(input);
  }
  prepareMessage(input: Parameters<PersistentRepository["prepareMessage"]>[0]) {
    return this.repository.prepareMessage(input);
  }
}

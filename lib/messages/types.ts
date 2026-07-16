export const MESSAGE_TYPES = [
  "first_contact",
  "follow_up_1",
  "follow_up_2",
  "portfolio",
  "meeting_invite",
  "proposal",
  "closing",
  "opt_out_confirmation",
] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];
export const MESSAGE_CHANNELS = ["whatsapp", "email", "manual"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];
export const MESSAGE_STATUSES = [
  "draft",
  "prepared",
  "approved",
  "scheduled",
  "queued",
  "sent",
  "delivered",
  "responded",
  "failed",
  "cancelled",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export const MANUAL_STATUSES = [
  "draft",
  "prepared",
  "approved",
  "cancelled",
] as const;
export type Template = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  service: string | null;
  type: MessageType;
  channel: MessageChannel;
  content: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type MessageContext = {
  lead: {
    id: string;
    campaignId: string;
    name: string;
    phone: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    category: string | null;
    crmStage: string;
  };
  campaign: { id: string; name: string; services: string[] };
  analysis?: {
    score: number;
    priority: string;
    recommendedServices: string[];
    mainReason: string;
  } | null;
};
export type CommercialMessage = {
  id: string;
  userId: string;
  campaignId: string;
  leadId: string;
  templateId: string | null;
  type: MessageType;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  version: number;
  approvedAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  warnings: ValidationIssue[];
  leadName?: string;
  campaignName?: string;
  templateName?: string;
};
export type ValidationIssue = {
  type: "warning" | "blocking_error";
  message: string;
  field?: string;
};
export type RenderResult = {
  body: string;
  warnings: ValidationIssue[];
  templateVersion: number;
};

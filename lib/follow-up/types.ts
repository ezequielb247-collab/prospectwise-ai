export const FOLLOW_UP_TYPES = [
  "first_follow_up",
  "second_follow_up",
  "third_follow_up",
  "manual",
  "meeting_reminder",
  "proposal_reminder",
] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];
export const FOLLOW_UP_STATUSES = [
  "pending",
  "due",
  "completed",
  "cancelled",
  "skipped",
  "blocked",
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export const QUEUE_STATUSES = [
  "pending",
  "scheduled",
  "ready",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "blocked",
] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];
export type CampaignQueueConfig = {
  followUpEnabled: boolean;
  maxFollowUpAttempts: number;
  delays: [number, number, number];
  allowedWeekdays: number[];
  sendWindowStart: string;
  sendWindowEnd: string;
  timezone: string;
  dailyLimit: number;
  userDailyLimit: number;
  maxRetries: number;
};
export type FollowUpContext = {
  campaign: { id: string; status: string; config: CampaignQueueConfig };
  lead: {
    id: string;
    campaignId: string;
    status: string;
    phone: string | null;
  };
  message?: {
    id: string;
    campaignId: string;
    leadId: string;
    status: string;
    channel: string;
  } | null;
};
export type FollowUp = {
  id: string;
  userId: string;
  campaignId: string;
  leadId: string;
  messageId: string | null;
  type: FollowUpType;
  status: FollowUpStatus;
  attemptNumber: number;
  scheduledFor: string;
  completedAt: string | null;
  cancelledAt: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export type QueueItem = {
  id: string;
  userId: string;
  campaignId: string;
  leadId: string;
  messageId: string;
  followUpId: string | null;
  channel: string;
  status: QueueStatus;
  scheduledFor: string;
  availableAfter: string;
  lockedAt: string | null;
  processedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
};

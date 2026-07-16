export const TASK_TYPES = [
  "ligacao",
  "proposta",
  "follow_up",
  "reuniao",
  "visita",
  "orcamento",
  "personalizada",
] as const;
export const TASK_PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;
export const TASK_STATUSES = [
  "pendente",
  "hoje",
  "atrasada",
  "concluida",
  "cancelada",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type SalesTask = {
  id: string;
  userId: string;
  leadId: string;
  campaignId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  scheduledFor: string;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  leadName?: string;
  campaignName?: string;
};
export type LeadNote = {
  id: string;
  userId: string;
  leadId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};
export type TaskInput = {
  leadId: string;
  campaignId?: string | null;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  scheduledFor: string;
};

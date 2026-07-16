import type { LeadNote, SalesTask, TaskInput, TaskStatus } from "./types";
export interface SalesProductRepository {
  listTasks(userId: string): Promise<SalesTask[]>;
  getTask(userId: string, id: string): Promise<SalesTask | undefined>;
  leadContext(
    userId: string,
    leadId: string,
  ): Promise<{ campaignId: string } | undefined>;
  createTask(userId: string, input: TaskInput): Promise<SalesTask>;
  updateTask(
    userId: string,
    id: string,
    patch: Partial<TaskInput> & {
      status?: TaskStatus;
      completedAt?: string | null;
    },
  ): Promise<SalesTask>;
  deleteTask(userId: string, id: string): Promise<void>;
  listNotes(userId: string, leadId: string): Promise<LeadNote[]>;
  getNote(userId: string, id: string): Promise<LeadNote | undefined>;
  createNote(userId: string, leadId: string, text: string): Promise<LeadNote>;
  updateNote(userId: string, id: string, text: string): Promise<LeadNote>;
  deleteNote(userId: string, id: string): Promise<void>;
  setFavorite(userId: string, leadId: string, favorite: boolean): Promise<void>;
  activity(
    userId: string,
    input: { leadId: string; campaignId: string; type: string; note: string },
  ): Promise<void>;
}
const clean = (value: string, max: number) =>
  value.replace(/[<>]/g, "").trim().slice(0, max);
export function derivedTaskStatus(
  task: SalesTask,
  now = new Date(),
): TaskStatus {
  if (["concluida", "cancelada"].includes(task.status)) return task.status;
  const date = new Date(task.scheduledFor),
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(now),
    scheduled = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(date);
  return scheduled < today
    ? "atrasada"
    : scheduled === today
      ? "hoje"
      : "pendente";
}
export class TaskService {
  constructor(private repo: SalesProductRepository) {}
  async list(userId: string) {
    return (await this.repo.listTasks(userId)).map((task) => ({
      ...task,
      status: derivedTaskStatus(task),
    }));
  }
  async create(userId: string, input: TaskInput) {
    const lead = await this.repo.leadContext(userId, input.leadId);
    if (!lead) throw new Error("Lead não encontrado.");
    if (input.campaignId && input.campaignId !== lead.campaignId)
      throw new Error("Lead não pertence à campanha.");
    const task = await this.repo.createTask(userId, {
      ...input,
      campaignId: input.campaignId ?? lead.campaignId,
      title: clean(input.title, 180),
      description: input.description ? clean(input.description, 2000) : null,
    });
    await this.repo.activity(userId, {
      leadId: task.leadId,
      campaignId: lead.campaignId,
      type: "task_created",
      note: `Tarefa criada: ${task.title}`,
    });
    return task;
  }
  async update(
    userId: string,
    id: string,
    patch: Partial<TaskInput> & { status?: TaskStatus },
  ) {
    const current = await this.repo.getTask(userId, id);
    if (!current) throw new Error("Tarefa não encontrada.");
    const completedAt =
      patch.status === "concluida"
        ? new Date().toISOString()
        : patch.status
          ? null
          : undefined;
    const task = await this.repo.updateTask(userId, id, {
      ...patch,
      title: patch.title ? clean(patch.title, 180) : undefined,
      description: patch.description
        ? clean(patch.description, 2000)
        : patch.description,
      completedAt,
    });
    await this.repo.activity(userId, {
      leadId: task.leadId,
      campaignId: task.campaignId!,
      type: patch.status === "concluida" ? "task_completed" : "task_updated",
      note: `Tarefa atualizada: ${task.title}`,
    });
    return task;
  }
  async delete(userId: string, id: string) {
    const task = await this.repo.getTask(userId, id);
    if (!task) throw new Error("Tarefa não encontrada.");
    await this.repo.deleteTask(userId, id);
    await this.repo.activity(userId, {
      leadId: task.leadId,
      campaignId: task.campaignId!,
      type: "task_deleted",
      note: `Tarefa removida: ${task.title}`,
    });
  }
}
export class NoteService {
  constructor(private repo: SalesProductRepository) {}
  list(userId: string, leadId: string) {
    return this.repo.listNotes(userId, leadId);
  }
  async create(userId: string, leadId: string, text: string) {
    const lead = await this.repo.leadContext(userId, leadId);
    if (!lead) throw new Error("Lead não encontrado.");
    const note = await this.repo.createNote(userId, leadId, clean(text, 4000));
    await this.repo.activity(userId, {
      leadId,
      campaignId: lead.campaignId,
      type: "note_created",
      note: "Nota adicionada.",
    });
    return note;
  }
  async update(userId: string, id: string, text: string) {
    const note = await this.repo.updateNote(userId, id, clean(text, 4000));
    const lead = await this.repo.leadContext(userId, note.leadId);
    if (!lead) throw new Error("Lead não encontrado.");
    await this.repo.activity(userId, {
      leadId: note.leadId,
      campaignId: lead.campaignId,
      type: "note_updated",
      note: "Nota editada.",
    });
    return note;
  }
  async delete(userId: string, id: string) {
    const note = await this.repo.getNote(userId, id);
    if (!note) throw new Error("Nota não encontrada.");
    await this.repo.deleteNote(userId, id);
    const lead = await this.repo.leadContext(userId, note.leadId);
    if (lead)
      await this.repo.activity(userId, {
        leadId: note.leadId,
        campaignId: lead.campaignId,
        type: "note_deleted",
        note: "Nota excluída.",
      });
  }
  async favorite(userId: string, leadId: string, favorite: boolean) {
    const lead = await this.repo.leadContext(userId, leadId);
    if (!lead) throw new Error("Lead não encontrado.");
    await this.repo.setFavorite(userId, leadId, favorite);
    await this.repo.activity(userId, {
      leadId,
      campaignId: lead.campaignId,
      type: favorite ? "lead_favorited" : "lead_unfavorited",
      note: favorite ? "Lead favoritado." : "Lead desfavoritado.",
    });
  }
}

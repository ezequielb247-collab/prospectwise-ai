"use client";
import { useState } from "react";
import type { LeadNote, SalesTask } from "../lib/sales-product/types";
import { StatCard, StatusBadge } from "./ui/interface";
export default function LeadSalesPanel({
  leadId,
  initialFavorite,
  initialNotes,
  initialTasks,
  messageCount,
  followUpCount,
}: {
  leadId: string;
  initialFavorite: boolean;
  initialNotes: LeadNote[];
  initialTasks: SalesTask[];
  messageCount: number;
  followUpCount: number;
}) {
  const [favorite, setFavorite] = useState(initialFavorite),
    [notes, setNotes] = useState(initialNotes),
    [tasks, setTasks] = useState(initialTasks),
    [notice, setNotice] = useState("");
  async function reload() {
    const [noteResponse, taskResponse] = await Promise.all([
      fetch(`/api/notes?leadId=${leadId}`),
      fetch("/api/tasks"),
    ]);
    if (noteResponse.ok) setNotes(await noteResponse.json());
    if (taskResponse.ok)
      setTasks(
        (await taskResponse.json()).filter(
          (item: SalesTask) => item.leadId === leadId,
        ),
      );
  }
  async function noteAction(payload: object) {
    const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      result = await response.json();
    setNotice(response.ok ? "Notas atualizadas." : result.error);
    if (response.ok) await reload();
  }
  async function addNote() {
    const text = window.prompt("Nova nota:");
    if (text) await noteAction({ action: "create", leadId, text });
  }
  async function addTask() {
    const title = window.prompt("Título da tarefa:", "Próximo contato");
    if (!title) return;
    const date = window.prompt(
      "Data e hora:",
      new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    );
    if (date) {
      const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "create",
            leadId,
            title,
            type: "personalizada",
            priority: "media",
            scheduledFor: new Date(date).toISOString(),
          }),
        }),
        result = await response.json();
      setNotice(response.ok ? "Tarefa criada." : result.error);
      if (response.ok) await reload();
    }
  }
  async function toggle() {
    const next = !favorite;
    setFavorite(next);
    const response = await fetch(`/api/leads/${leadId}/favorite`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
    if (!response.ok) {
      setFavorite(!next);
      setNotice("Não foi possível atualizar o favorito.");
    } else setNotice(next ? "Lead favoritado." : "Lead desfavoritado.");
  }
  return (
    <div className="lead-sections">
      {notice && <div className="toast">{notice}</div>}
      <article className="panel">
        <div className="panel-head">
          <div>
            <h3>Produtividade comercial</h3>
            <p>Favorito, notas e tarefas persistidas</p>
          </div>
          <button
            className="secondary"
            onClick={() => void toggle()}
            aria-label={favorite ? "Desfavoritar lead" : "Favoritar lead"}
          >
            {favorite ? "★ Favorito" : "☆ Favoritar"}
          </button>
        </div>
        <div className="lead-facts"><StatCard value={tasks.filter(item => item.status !== "concluida").length} label="Tarefas abertas" /><StatCard value={notes.length} label="Notas" /><StatCard value={tasks.filter(item => item.status === "atrasada").length} label="Atrasadas" /><StatCard value={messageCount} label="Mensagens" /><StatCard value={followUpCount} label="Follow-ups" /></div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <h3>Notas</h3>
          <button onClick={() => void addNote()}>Adicionar</button>
        </div>
        {notes.map((item) => (
          <div className="note-card" key={item.id}>
            <p>{item.text}</p>
            <small>{new Date(item.createdAt).toLocaleString("pt-BR")}</small>
            <div className="row-actions">
              <button
                onClick={() => {
                  const text = window.prompt("Editar nota:", item.text);
                  if (text)
                    void noteAction({ action: "update", id: item.id, text });
                }}
              >
                Editar
              </button>
              <button
                onClick={() =>
                  void noteAction({ action: "delete", id: item.id })
                }
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {!notes.length && (
          <div className="empty small">
            <p>Nenhuma nota cadastrada.</p>
          </div>
        )}
      </article>
      <article className="panel">
        <div className="panel-head">
          <h3>Tarefas</h3>
          <button onClick={() => void addTask()}>Adicionar</button>
        </div>
        {tasks.map((item) => (
          <div className="task-row" key={item.id}>
            <div>
              <b>{item.title}</b>
              <small>
                {new Date(item.scheduledFor).toLocaleString("pt-BR")}
              </small>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
        {!tasks.length && (
          <div className="empty small">
            <p>Nenhuma tarefa para este lead.</p>
          </div>
        )}
      </article>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ProspectList } from "../lib/prospect-lists/types";
import { InlineAlert } from "./ui/interface";

export default function ProspectListPicker({
  leadIds,
  campaignId = null,
  disabled = false,
  label = "Adicionar à lista",
  onSuccess,
}: {
  leadIds: string[];
  campaignId?: string | null;
  disabled?: boolean;
  label?: string;
  onSuccess?: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function readJson(response: Response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "Não foi possível concluir a ação.");
    }
    return payload;
  }

  async function showPicker() {
    if (!leadIds.length) return;
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/prospect-lists", { cache: "no-store" });
      const payload = (await readJson(response)) as ProspectList[];
      setLists(payload);
      setSelectedListId((current) =>
        current && payload.some((item) => item.id === current)
          ? current
          : (payload[0]?.id ?? ""),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar listas.");
    } finally {
      setLoading(false);
    }
  }

  async function addToList(listId: string) {
    const response = await fetch("/api/prospect-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "add", listId, leadIds }),
    });
    await readJson(response);
  }

  async function submit() {
    if (!selectedListId) {
      setError("Selecione uma lista.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addToList(selectedListId);
      const target = lists.find((item) => item.id === selectedListId);
      const message = `${leadIds.length} ${leadIds.length === 1 ? "oportunidade adicionada" : "oportunidades adicionadas"} à lista${target?.name ? ` “${target.name}”` : ""}.`;
      setOpen(false);
      onSuccess?.(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao adicionar à lista.");
    } finally {
      setLoading(false);
    }
  }

  async function createAndAdd() {
    const name = newListName.trim();
    if (!name) {
      setError("Informe o nome da nova lista.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const createResponse = await fetch("/api/prospect-lists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name,
          campaignId: campaignId || null,
        }),
      });
      const created = (await readJson(createResponse)) as ProspectList;
      await addToList(created.id);
      const message = `Lista “${created.name}” criada com ${leadIds.length} ${leadIds.length === 1 ? "oportunidade" : "oportunidades"}.`;
      setOpen(false);
      setNewListName("");
      onSuccess?.(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar a lista.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" disabled={disabled || !leadIds.length || loading} onClick={() => void showPicker()}>
        {loading && !open ? "Carregando…" : label}
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !loading && setOpen(false)}>
          <article
            className="panel lead-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-list-picker-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <h3 id="prospect-list-picker-title">Adicionar oportunidades à lista</h3>
                <p>{leadIds.length} {leadIds.length === 1 ? "lead selecionado" : "leads selecionados"}</p>
              </div>
              <button type="button" className="icon-button" aria-label="Fechar" disabled={loading} onClick={() => setOpen(false)}>×</button>
            </div>

            {error && <InlineAlert tone="error">{error}</InlineAlert>}

            <label>
              Lista existente
              <select value={selectedListId} disabled={loading || !lists.length} onChange={(event) => setSelectedListId(event.target.value)}>
                {!lists.length && <option value="">Nenhuma lista criada</option>}
                {lists.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.count ?? 0})</option>
                ))}
              </select>
            </label>
            <button type="button" className="secondary" disabled={loading || !selectedListId} onClick={() => void submit()}>
              {loading ? "Salvando…" : "Adicionar à lista selecionada"}
            </button>

            <div className="divider" aria-hidden="true" />

            <label>
              Ou crie uma nova lista
              <input
                value={newListName}
                maxLength={120}
                placeholder="Ex.: Oficinas prioritárias — Macaé"
                disabled={loading}
                onChange={(event) => setNewListName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createAndAdd();
                  }
                }}
              />
            </label>
            <button type="button" className="primary" disabled={loading || !newListName.trim()} onClick={() => void createAndAdd()}>
              {loading ? "Criando…" : "Criar lista e adicionar"}
            </button>
          </article>
        </div>
      )}
    </>
  );
}

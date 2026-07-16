"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProspectList } from "../lib/prospect-lists/types";
import { ActionBar, EmptyState, InlineAlert, SectionCard } from "./ui/interface";

export default function ProspectListsPanel({ initial }: { initial: ProspectList[] }) {
  const [lists, setLists] = useState(initial);
  const [notice, setNotice] = useState("");
  async function refresh() { const response = await fetch("/api/prospect-lists"); if (response.ok) setLists(await response.json()); }
  async function create() { const name = window.prompt("Nome da lista:"); if (!name) return; const response = await fetch("/api/prospect-lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", name }) }); const result = await response.json(); setNotice(response.ok ? "Lista criada." : result.error); if (response.ok) await refresh(); }
  return <section className="commercial-workspace">
    <ActionBar className="commercial-toolbar"><button className="primary" onClick={() => void create()}>Nova lista</button></ActionBar>
    {notice && <InlineAlert tone={notice === "Lista criada." ? "success" : "error"}>{notice}</InlineAlert>}
    {lists.length ? <div className="commercial-card-grid">{lists.map(item => <SectionCard key={item.id}><div className="panel-head"><div><h3>{item.name}</h3><p>{item.description ?? "Lista comercial"}</p></div><span className="badge info">{item.count ?? 0} leads</span></div><Link className="secondary" href={`/listas/${item.id}`}>Abrir lista</Link></SectionCard>)}</div> : <EmptyState title="Nenhuma lista criada" description="Selecione leads e crie sua primeira lista comercial." action={<Link href="/leads" className="primary">Selecionar leads</Link>} />}
  </section>;
}

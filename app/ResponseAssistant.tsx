"use client";

import { useState } from "react";
import { RESPONSE_LIBRARY, type ResponseCategory } from "../lib/responses/library";
import { ActionBar, FormField, InlineAlert, SectionCard } from "./ui/interface";

export default function ResponseAssistant() {
  const [category, setCategory] = useState<ResponseCategory>("preco"), [text, setText] = useState<string>(RESPONSE_LIBRARY.preco[0]), [notice, setNotice] = useState("");
  function change(value: ResponseCategory) { setCategory(value); setText(RESPONSE_LIBRARY[value][0]); }
  async function save() { const response = await fetch("/api/response-templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, title: category, body: text, favorite: true }) }); setNotice(response.ok ? "Resposta salva como favorita." : "Falha ao salvar resposta."); }
  return <SectionCard className="commercial-workspace"><FormField id="response-category" label="Objeção"><select id="response-category" value={category} onChange={event => change(event.target.value as ResponseCategory)}>{Object.keys(RESPONSE_LIBRARY).map(item => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></FormField><FormField id="response-text" label="Resposta editável"><textarea id="response-text" rows={6} value={text} onChange={event => setText(event.target.value)} /></FormField><ActionBar><button onClick={() => void navigator.clipboard.writeText(text)}>Copiar</button><button className="primary" onClick={() => void save()}>Salvar favorita</button></ActionBar>{notice && <InlineAlert tone={notice.includes("salva") ? "success" : "error"}>{notice}</InlineAlert>}</SectionCard>;
}

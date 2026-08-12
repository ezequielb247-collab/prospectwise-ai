"use client";

import { useState } from "react";
import type { WorkspaceData } from "../lib/workspace-model";
import MessageCenter from "./MessageCenter";
import { InlineAlert, WorkspaceShell } from "./ui/interface";

export default function MessagesWorkspace({
  data,
  initialLeadIds,
}: {
  data: WorkspaceData;
  initialLeadIds: string[];
}) {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error" | "info">("success");

  function showNotice(value: string) {
    setNotice(value);
    setNoticeTone(/falha|erro|inválid|não foi possível|bloquead/i.test(value) ? "error" : "success");
  }

  return (
    <WorkspaceShell
      page="mensagens"
      title="Mensagens comerciais"
      subtitle="Gere, revise e salve abordagens antes de qualquer contato externo."
    >
      {notice && (
        <InlineAlert tone={noticeTone}>
          {notice}
        </InlineAlert>
      )}
      <MessageCenter
        data={data}
        setNotice={showNotice}
        initialLeadIds={initialLeadIds}
      />
    </WorkspaceShell>
  );
}

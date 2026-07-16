"use client";
import { useEffect, useState } from "react";
export default function CampaignFollowUpSettings({
  campaignId,
}: {
  campaignId: string;
}) {
  const [value, setValue] = useState({
      followUpEnabled: false,
      maxFollowUpAttempts: 2,
      delays: [3, 7, 14] as [number, number, number],
      allowedWeekdays: [1, 2, 3, 4, 5],
      sendWindowStart: "09:00",
      sendWindowEnd: "17:00",
      timezone: "America/Sao_Paulo",
    }),
    [notice, setNotice] = useState("");
  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/follow-up-settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.follow_up_enabled !== undefined)
          setValue({
            followUpEnabled: data.follow_up_enabled,
            maxFollowUpAttempts: data.max_follow_up_attempts,
            delays: [
              data.follow_up_delay_days_1,
              data.follow_up_delay_days_2,
              data.follow_up_delay_days_3,
            ],
            allowedWeekdays: data.allowed_weekdays,
            sendWindowStart: data.send_window_start.slice(0, 5),
            sendWindowEnd: data.send_window_end.slice(0, 5),
            timezone: data.timezone,
          });
      });
  }, [campaignId]);
  async function save() {
    const response = await fetch(
      `/api/campaigns/${campaignId}/follow-up-settings`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
      },
    );
    setNotice(response.ok ? "Configuração salva." : "Não foi possível salvar.");
  }
  return (
    <article className="panel follow-up-settings">
      <div className="panel-head">
        <div>
          <h3>Configuração de follow-up</h3>
          <p>Desativada por padrão e sem execução automática.</p>
        </div>
        <label>
          <input
            type="checkbox"
            checked={value.followUpEnabled}
            onChange={(e) =>
              setValue((current) => ({
                ...current,
                followUpEnabled: e.target.checked,
              }))
            }
          />{" "}
          Habilitar
        </label>
      </div>
      <div className="composer-selects">
        <label>
          Máximo de tentativas
          <input
            type="number"
            min="1"
            max="3"
            value={value.maxFollowUpAttempts}
            onChange={(e) =>
              setValue((current) => ({
                ...current,
                maxFollowUpAttempts: Number(e.target.value),
              }))
            }
          />
        </label>
        <label>
          Timezone
          <input
            value={value.timezone}
            onChange={(e) =>
              setValue((current) => ({ ...current, timezone: e.target.value }))
            }
          />
        </label>
        <label>
          Janela inicial
          <input
            type="time"
            value={value.sendWindowStart}
            onChange={(e) =>
              setValue((current) => ({
                ...current,
                sendWindowStart: e.target.value,
              }))
            }
          />
        </label>
        <label>
          Janela final
          <input
            type="time"
            value={value.sendWindowEnd}
            onChange={(e) =>
              setValue((current) => ({
                ...current,
                sendWindowEnd: e.target.value,
              }))
            }
          />
        </label>
      </div>
      <button className="primary compact" onClick={() => void save()}>
        Salvar configuração
      </button>
      {notice && <p>{notice}</p>}
    </article>
  );
}

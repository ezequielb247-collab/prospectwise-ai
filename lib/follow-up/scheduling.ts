import type { CampaignQueueConfig } from "./types";
function parts(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  return Object.fromEntries(values.map((item) => [item.type, item.value]));
}
function atLocal(date: Date, time: string, timeZone: string) {
  const p = parts(date, timeZone),
    [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    minute,
  );
  const observed = parts(new Date(desired), timeZone);
  const represented = Date.UTC(
    Number(observed.year),
    Number(observed.month) - 1,
    Number(observed.day),
    Number(observed.hour),
    Number(observed.minute),
  );
  return new Date(desired + (desired - represented));
}
export function adjustSchedule(value: string, config: CampaignQueueConfig) {
  let date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("Data de agendamento inválida.");
  const reasons: string[] = [];
  for (let guard = 0; guard < 8; guard++) {
    const p = parts(date, config.timezone);
    const weekday =
      { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday] ??
      0;
    if (!config.allowedWeekdays.includes(weekday)) {
      date = new Date(date.getTime() + 86400000);
      date = atLocal(date, config.sendWindowStart, config.timezone);
      reasons.push("Dia ajustado para o próximo dia permitido.");
      continue;
    }
    const current = `${p.hour}:${p.minute}`;
    if (current < config.sendWindowStart) {
      date = atLocal(date, config.sendWindowStart, config.timezone);
      reasons.push(`Horário ajustado para ${config.sendWindowStart}.`);
    } else if (current > config.sendWindowEnd) {
      date = new Date(date.getTime() + 86400000);
      date = atLocal(date, config.sendWindowStart, config.timezone);
      reasons.push("Horário ajustado para a próxima janela permitida.");
      continue;
    }
    break;
  }
  return {
    scheduledFor: date.toISOString(),
    timezone: config.timezone,
    reasons,
  };
}

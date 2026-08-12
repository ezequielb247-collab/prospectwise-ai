export type GoogleMapsPastedLead = {
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
};

const UI_LINES = new Set([
  "visão geral", "avaliações", "sobre", "rotas", "salvar", "próximo",
  "enviar para o smartphone", "compartilhar", "sugerir mudança",
  "adic. informações ausentes", "adicionar website", "adicionar uma foto",
  "adicionar fotos e vídeos", "fotos e vídeos", "tudo", "do proprietário",
  "street view e 360°", "resumo de avaliações", "avaliar", "ordenar",
  "lugares também pesquisados", "resultados da web", "mais avaliações",
]);

const STREET_HINT = /\b(?:rua|r\.|avenida|av\.|rodovia|rod\.|estrada|estr\.|travessa|tv\.|alameda|praça|pç\.)\b/i;
const PHONE = /(?:\(?\d{2}\)?\s*)?(?:9\d{4}|\d{4})[-\s]?\d{4}/;
const URL = /https?:\/\/[^\s]+/i;

function cleanLine(value: string) {
  return value
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/^[\s\p{So}\p{Sk}\p{Cn}]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value: string) {
  return cleanLine(value).toLocaleLowerCase("pt-BR");
}

function isNoise(value: string) {
  const line = normalized(value);
  if (!line) return true;
  if (UI_LINES.has(line)) return true;
  if (/^(aberto|fechado)(?:\s|$)/i.test(line)) return true;
  if (/^(fecha|abre)\b/i.test(line)) return true;
  if (/^(segunda|terça|quarta|quinta|sexta|sábado|domingo)s?-feiras?$/i.test(line)) return true;
  if (/^\d{1,2}(?::\d{2})?$/.test(line)) return true;
  if (/^[1-5]$/.test(line)) return true;
  if (/^\+\d+$/.test(line)) return true;
  return false;
}

function isNameCandidate(value: string) {
  const line = cleanLine(value);
  if (!line || isNoise(line)) return false;
  if (PHONE.test(line) || URL.test(line)) return false;
  if (/^[0-5](?:[.,]\d)?(?:\s*\([\d.]+\))?$/.test(line)) return false;
  if (/^\([\d.]+\)$/.test(line)) return false;
  if (/avaliaç/i.test(line) || /horários? de pico/i.test(line)) return false;
  return line.length >= 2 && line.length <= 160;
}

function splitRecords(lines: string[]) {
  const starts: number[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (
      isNameCandidate(lines[index]) &&
      normalized(lines[index]) === normalized(lines[index + 1])
    ) {
      starts.push(index);
    }
  }
  if (!starts.length) return [lines];
  return starts.map((start, index) =>
    lines.slice(start, starts[index + 1] ?? lines.length),
  );
}

function parseRatingAndReviews(lines: string[]) {
  let rating: number | null = null;
  let reviews: number | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanLine(lines[index]);
    const combined = line.match(/^([0-5](?:[.,]\d)?)\s*\(([\d.]+)\)/);
    if (combined) {
      rating = Number(combined[1].replace(",", "."));
      reviews = Number(combined[2].replace(/\./g, ""));
      break;
    }
    if (/^[0-5](?:[.,]\d)$/.test(line)) {
      rating = Number(line.replace(",", "."));
      const next = cleanLine(lines[index + 1] ?? "");
      const count = next.match(/^\(([\d.]+)\)$/);
      if (count) reviews = Number(count[1].replace(/\./g, ""));
      break;
    }
    if (/nenhuma avaliação/i.test(line)) reviews = 0;
  }
  return { rating, reviews };
}

function parseLocation(address: string | null) {
  if (!address) return { city: null, state: null };
  const matches = [...address.matchAll(/(?:,|\s-\s)\s*([^,\-]+?)\s*-\s*([A-Z]{2})(?=,|\s|$)/g)];
  const match = matches.at(-1);
  if (match) return { city: match[1].trim(), state: match[2] };
  const simple = address.match(/\b([^,]+),\s*([A-Z]{2})(?:\s|$)/);
  return simple ? { city: simple[1].trim(), state: simple[2] } : { city: null, state: null };
}

function parseRecord(rawLines: string[]): GoogleMapsPastedLead | null {
  const lines = rawLines.map(cleanLine).filter(Boolean);
  if (!lines.length) return null;

  const duplicatedName = lines.findIndex(
    (line, index) => index < lines.length - 1 && isNameCandidate(line) && normalized(line) === normalized(lines[index + 1]),
  );
  const name = cleanLine(
    duplicatedName >= 0
      ? lines[duplicatedName]
      : (lines.find((line) => isNameCandidate(line)) ?? ""),
  );
  if (!name) return null;

  const { rating, reviews } = parseRatingAndReviews(lines);
  const phoneLine = lines.find((line) => PHONE.test(line));
  const phone = phoneLine?.match(PHONE)?.[0]?.trim() ?? null;

  const website =
    lines
      .map((line) => line.match(URL)?.[0] ?? null)
      .find((url) => url && !/google\.(?:com|com\.br)\/maps|maps\.app\.goo\.gl/i.test(url)) ?? null;
  const mapsUrl =
    lines
      .map((line) => line.match(URL)?.[0] ?? null)
      .find((url) => url && /google\.(?:com|com\.br)\/maps|maps\.app\.goo\.gl/i.test(url)) ?? null;

  let address: string | null = null;
  for (const line of lines) {
    if (STREET_HINT.test(line) && (/\b[A-Z]{2}\b/.test(line) || /\d{3,}/.test(line))) {
      address = line;
      break;
    }
  }
  if (!address) {
    address = lines.find((line) => /\b[A-Z]{2}\b/.test(line) && /\d{5}-?\d{3}/.test(line)) ?? null;
  }

  let category: string | null = null;
  const ratingIndex = lines.findIndex((line) => /^([0-5](?:[.,]\d)?)(?:\s*\([\d.]+\))?$/.test(line));
  const categoryCandidates = lines.slice(1, Math.min(lines.length, 10));
  for (const line of categoryCandidates) {
    if (isNoise(line) || PHONE.test(line) || STREET_HINT.test(line)) continue;
    if (/^[0-5](?:[.,]\d)?/.test(line) || /^\([\d.]+\)$/.test(line)) continue;
    const first = cleanLine(line.split("·")[0]);
    if (first && first !== name && !/avaliaç/i.test(first) && !/seu histórico/i.test(first)) {
      category = first;
      break;
    }
  }
  if (!category && ratingIndex >= 0) {
    const next = lines.slice(ratingIndex + 1).find((line) => !isNoise(line) && !/^\([\d.]+\)$/.test(line));
    if (next && !PHONE.test(next) && !STREET_HINT.test(next)) category = cleanLine(next.split("·")[0]);
  }

  const location = parseLocation(address);
  return {
    name,
    phone,
    website,
    address,
    city: location.city,
    state: location.state,
    category,
    rating,
    reviews,
    mapsUrl,
  };
}

export function parseGoogleMapsText(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const records = splitRecords(lines)
    .map(parseRecord)
    .filter((lead): lead is GoogleMapsPastedLead => Boolean(lead?.name));
  const unique = new Map<string, GoogleMapsPastedLead>();
  for (const lead of records) {
    const key = `${normalized(lead.name)}|${lead.phone ?? ""}|${normalized(lead.address ?? "")}`;
    if (!unique.has(key)) unique.set(key, lead);
  }
  return [...unique.values()];
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function googleMapsTextToCsv(text: string) {
  const leads = parseGoogleMapsText(text);
  const headers = [
    "nome",
    "telefone",
    "site",
    "endereco",
    "cidade",
    "estado",
    "categoria",
    "nota",
    "avaliacoes",
    "google_maps_url",
  ];
  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.website,
    lead.address,
    lead.city,
    lead.state,
    lead.category,
    lead.rating,
    lead.reviews,
    lead.mapsUrl,
  ]);
  return {
    leads,
    csv: [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n"),
  };
}

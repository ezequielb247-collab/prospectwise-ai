import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { csvImportServiceFor } from "../../../../../lib/csv-import/container";
import { MAX_CSV_BYTES } from "../../../../../lib/csv-import/parser";
import { CSV_FIELDS } from "../../../../../lib/csv-import/types";

const endpoint = "/api/import/csv/preview";
const maximumBodyBytes = 3 * 1024 * 1024;
const field = z.enum([...CSV_FIELDS, "ignore"] as [string, ...string[]]);
const schema = z.object({
  campaignId: z.string().trim().min(1),
  text: z.string().min(1),
  mapping: z.record(z.string(), field).default({}),
});
type ErrorLike = {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  code?: unknown;
};

function errorDetails(error: unknown) {
  const value = (
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }
  ) as ErrorLike;
  return {
    name:
      typeof value.name === "string"
        ? value.name
        : error instanceof Error
          ? error.name
          : "UnknownError",
    message: typeof value.message === "string" ? value.message : String(error),
    stack:
      typeof value.stack === "string"
        ? value.stack
        : error instanceof Error
          ? error.stack
          : undefined,
    code: typeof value.code === "string" ? value.code : undefined,
  };
}

function parseMapping(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return {};
  return JSON.parse(value) as Record<string, string>;
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data"))
    return schema.parse(await request.json());
  const form = await request.formData();
  const file = form.get("file");
  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function"
  )
    throw new Error("Campo file ausente ou inválido.");
  if (file.size > MAX_CSV_BYTES) throw new Error("Arquivo maior que 2 MB.");
  const text = new TextDecoder("utf-8").decode(await file.arrayBuffer());
  return schema.parse({
    campaignId: String(form.get("campaignId") ?? ""),
    text,
    mapping: parseMapping(form.get("mapping")),
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  let campaignId: string | undefined;
  let fileSize = contentLength;
  try {
    if (contentLength > maximumBodyBytes)
      return Response.json(
        { error: "Arquivo maior que 2 MB." },
        { status: 413 },
      );
    const user = await requireApiUser();
    const input = await readPayload(request);
    campaignId = input.campaignId;
    fileSize = new TextEncoder().encode(input.text).length;
    if (fileSize > MAX_CSV_BYTES)
      return Response.json(
        { error: "Arquivo maior que 2 MB." },
        { status: 413 },
      );
    const service = await csvImportServiceFor(user.id, input.campaignId);
    const { rows: _, ...preview } = await service.preview(
      user.id,
      input.text,
      input.mapping as never,
    );
    void _;
    return Response.json(preview);
  } catch (error) {
    const details = errorDetails(error);
    console.error("CSV preview failed", {
      endpoint,
      campaignId: campaignId ?? null,
      fileSize,
      errorName: details.name,
      errorCode: details.code ?? null,
      errorMessage: details.message,
      stack: details.stack ?? null,
    });
    return Response.json(
      {
        error: "Falha ao processar CSV.",
        ...(process.env.NODE_ENV !== "production"
          ? {
              message: details.message,
              name: details.name,
              stack: details.stack,
            }
          : {}),
      },
      { status: 400 },
    );
  }
}

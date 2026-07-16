import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { csvImportServiceFor } from "../../../../../lib/csv-import/container";
import { CSV_FIELDS } from "../../../../../lib/csv-import/types";

const endpoint = "/api/import/csv/commit";
const field = z.enum([...CSV_FIELDS, "ignore"] as [string, ...string[]]);
const schema = z.object({
  campaignId: z.string().min(1),
  text: z.string().min(1),
  mapping: z.record(z.string(), field).default({}),
});
type ErrorLike = {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function diagnostics(error: unknown) {
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
    code: typeof value.code === "string" ? value.code : undefined,
    details: typeof value.details === "string" ? value.details : undefined,
    hint: typeof value.hint === "string" ? value.hint : undefined,
    stack:
      typeof value.stack === "string"
        ? value.stack
        : error instanceof Error
          ? error.stack
          : undefined,
  };
}

function countRows(text: string) {
  return Math.max(
    0,
    text.split(/\r?\n/).filter((line) => line.trim()).length - 1,
  );
}

export async function POST(request: Request) {
  let campaignId: string | null = null;
  let userId: string | null = null;
  let rows = 0;
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 3 * 1024 * 1024)
      return Response.json(
        { error: "Arquivo maior que 2 MB." },
        { status: 413 },
      );
    const user = await requireApiUser();
    userId = user.id;
    const input = schema.parse(await request.json());
    campaignId = input.campaignId;
    rows = countRows(input.text);
    const service = await csvImportServiceFor(user.id, input.campaignId);
    return Response.json(
      await service.import(
        user.id,
        input.campaignId,
        input.text,
        input.mapping as never,
      ),
    );
  } catch (error) {
    const info = diagnostics(error);
    console.error("CSV commit failed", {
      endpoint,
      campaignId,
      userId,
      rows,
      code: info.code ?? null,
      message: info.message,
      details: info.details ?? null,
      hint: info.hint ?? null,
      stack: info.stack ?? null,
    });
    return Response.json(
      process.env.NODE_ENV === "production"
        ? { error: "Falha ao importar CSV." }
        : {
            error: "Falha ao importar CSV.",
            name: info.name,
            message: info.message,
            code: info.code,
            details: info.details,
            hint: info.hint,
            stack: info.stack,
          },
      { status: 400 },
    );
  }
}

import { requireApiUser } from "../../../lib/auth/session";
import { logDatabaseError } from "../../../lib/safe-db-log";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
export async function GET() {
  try {
    const user = await requireApiUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,name")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      logDatabaseError({
        table: "profiles",
        operation: "select own profile",
        error,
        authenticated: true,
      });
      throw error;
    }
    if (!data)
      return Response.json(
        { error: "Profile não encontrado." },
        { status: 404 },
      );
    return Response.json({ profile: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não autenticado." },
      { status: 401 },
    );
  }
}

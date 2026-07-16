import { requireApiUser } from "../../../lib/auth/session";
import { logDatabaseError } from "../../../lib/safe-db-log";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
export async function GET() {
  try {
    const user = await requireApiUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,name,professional_name,company_name,phone,city,logo_url,pix_key,commercial_notes")
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
export async function POST(request: Request) {
  try {
    const user = await requireApiUser(), input = await request.json(), supabase = await createSupabaseServerClient();
    const safe = (value: unknown, max = 500) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max) || null;
    const { data, error } = await supabase.from("profiles").update({professional_name:safe(input.professionalName),company_name:safe(input.companyName),phone:safe(input.phone),city:safe(input.city),logo_url:safe(input.logoUrl,1000),pix_key:safe(input.pixKey),commercial_notes:safe(input.commercialNotes,2000),updated_at:new Date().toISOString()}).eq("id",user.id).select("*").single();
    if (error) throw error; return Response.json({profile:data});
  } catch (error) { return Response.json({error:error instanceof Error?error.message:"Falha ao salvar perfil."},{status:400}); }
}

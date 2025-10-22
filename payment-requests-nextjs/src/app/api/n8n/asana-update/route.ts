import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-n8n-signature");
  if (secret !== process.env.N8N_SHARED_SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { asana_task_gid, fields } = await req.json();
  const patch: Record<string, any> = {};
  if (fields?.completed === true) patch.status = "won";

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
  const supabase = admin();
  const { error } = await supabase.from("leads").update(patch).eq("asana_task_gid", asana_task_gid);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

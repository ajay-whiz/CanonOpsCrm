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

  const { lead_id, asana_task_gid } = await req.json();
  const supabase = admin();
  const { error } = await supabase.from("leads").update({ asana_task_gid }).eq("id", lead_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

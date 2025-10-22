"use server";

import { supabaseServer } from "@/lib/supabase-server";

export async function createLeadAction(formData: FormData) {
  const contact_id = Number(formData.get("contact_id"));
  const title = String(formData.get("title"));
  const description = (formData.get("description") as string) || null;
  const priority = (formData.get("priority") as string) || "medium";
  const source = (formData.get("source") as string) || "web_form";

  const insert = {
    contact_id,
    title,
    description,
    priority,
    source,
    created_by: null,
  } as any;

  const { data, error } = await supabaseServer.from("leads").insert(insert).select("*").single();
  if (error) throw new Error(error.message);

  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/n8n/lead-created`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lead: data }),
  }).catch(() => {});

  return data;
}

export async function updateLeadAction(id: number, patch: Partial<{ title: string; description: string | null; status: "new"|"contacted"|"qualified"|"won"|"lost"|"spam"; priority: "low"|"medium"|"high"|"urgent"; assigned_to: number | null; next_touch_at: string | null; }>) {
  const { error } = await supabaseServer.from("leads").update(patch as any).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLeadAction(id: number) {
  const { error } = await supabaseServer.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function assignLeadAction(id: number, assignedTo: number | null) {
  return updateLeadAction(id, { assigned_to: assignedTo });
}

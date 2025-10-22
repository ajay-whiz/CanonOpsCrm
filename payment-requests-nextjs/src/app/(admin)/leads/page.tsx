import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

type LeadRow = {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: number | null;
  asana_task_gid: string | null;
};

export default async function LeadsPage() {
  const { data: leads } = await supabaseServer
    .from("leads")
    .select("id,title,status,priority,created_at,assigned_to,asana_task_gid")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link className="btn" href="/leads/new">New Lead</Link>
      </div>
      <div className="mt-4 space-y-2">
        {leads?.map((l: LeadRow) => (
          <Link key={l.id} href={`/leads/${l.id}`} className="block border p-3 rounded">
            <div className="font-medium">{l.title}</div>
            <div className="text-sm opacity-70">{l.status} · {l.priority}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

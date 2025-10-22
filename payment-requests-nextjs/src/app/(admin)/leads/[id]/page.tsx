import { supabaseServer } from "@/lib/supabase-server";
import { assignLeadAction, updateLeadAction } from "../actions";

type Lead = {
  id: number;
  title: string;
  description: string | null;
  status: "new"|"contacted"|"qualified"|"won"|"lost"|"spam";
  priority: "low"|"medium"|"high"|"urgent";
  assigned_to: number | null;
  asana_task_gid: string | null;
};

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const { data: leadRaw } = await supabaseServer.from("leads").select("*").eq("id", Number(params.id)).single();
  const lead = leadRaw as unknown as Lead | null;
  if (!lead) return <div className="p-6">Not found</div>;
  const leadSafe = lead as Lead;

  async function actionUpdateStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    await updateLeadAction(leadSafe.id, { status: status as any });
  }

  async function actionAssign(formData: FormData) {
    "use server";
    const assigned_to_raw = formData.get("assigned_to") as string;
    const assigned_to = assigned_to_raw ? Number(assigned_to_raw) : null;
    await assignLeadAction(leadSafe.id, assigned_to);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">{leadSafe.title}</h1>
      <div>Status: {leadSafe.status}</div>
      <div>Priority: {leadSafe.priority}</div>
      <div>
        Asana: {leadSafe.asana_task_gid ? (
          <a href={`https://app.asana.com/0/0/${leadSafe.asana_task_gid}`}>Open Task</a>
        ) : (
          "Not linked"
        )}
      </div>

      <form action={actionUpdateStatus} className="flex gap-2 items-center">
        <select name="status" defaultValue={leadSafe.status} className="select">
          <option>new</option>
          <option>contacted</option>
          <option>qualified</option>
          <option>won</option>
          <option>lost</option>
          <option>spam</option>
        </select>
        <button className="btn">Update Status</button>
      </form>

      <form action={actionAssign} className="flex gap-2 items-center">
        <input name="assigned_to" placeholder="User ID (integer)" defaultValue={leadSafe.assigned_to ?? ""} className="input" />
        <button className="btn">Assign</button>
      </form>
    </div>
  );
}

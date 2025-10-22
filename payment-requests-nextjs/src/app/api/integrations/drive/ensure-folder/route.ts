import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase-server';

// NOTE: In production, you may call Google Drive API here using a service account.
// For Sprint 3, we support two modes:
// - If client (n8n) already created the folder, pass drive_folder_id and we persist it (idempotent).
// - Else we pseudo-generate a stable folder id (for staging) and persist it.

export async function POST(req: NextRequest) {
  try {
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { pr_id, drive_folder_id, folder_name } = body || {};

    if (!pr_id) {
      return NextResponse.json({ ok: false, error: 'pr_id required' }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'drive:ensure-folder', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      if (idemErr) {
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message }, { status: 500 });
      }
    }

    // If folder id not provided, generate pseudo stable id for staging envs
    const folderId = drive_folder_id || `drv_${pr_id}_${(folder_name || 'pr').toString().slice(0, 16)}`;

    const { data, error } = await supabaseServer
      .from('payment_request')
      .update({ drive_folder_id: folderId })
      .eq('id', pr_id)
      .select('id, drive_folder_id')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await supabaseServer
      .from('audit_log')
      .insert([{
        actor_user_id: null,
        entity_type: 'payment_request',
        entity_id: String(pr_id),
        action: 'drive_folder_attached',
        details: { drive_folder_id: data.drive_folder_id }
      }]);

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../../lib/logger';
import { verifyN8NToken } from '../../../../../lib/n8n-auth';

// NOTE: In production, you may call Google Drive API here using a service account.
// For Sprint 3, we support two modes:
// - If client (n8n) already created the folder, pass drive_folder_id and we persist it (idempotent).
// - Else we pseudo-generate a stable folder id (for staging) and persist it.

export async function POST(req: NextRequest) {
  try {
    initSentry();
    const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
    const trace = req.headers.get('traceparent');
    const auth = verifyN8NToken(req);
    if (!auth.ok) return auth.res;
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { pr_id, drive_folder_id, folder_name } = body || {};

    if (!pr_id) {
      return NextResponse.json({ ok: false, error: 'pr_id required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'drive:ensure-folder', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('drive.ensure.duplicate_ignored', { requestId, idemKey, trace });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('drive.ensure.idempotency_failed', { requestId, error: idemErr.message, trace });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
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
      logError('drive.ensure.update_failed', { requestId, error: error.message, trace });
      return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
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

    logInfo('drive.ensure.ok', { requestId, prId: pr_id, drive_folder_id: data.drive_folder_id, trace });
    return NextResponse.json({ ok: true, data, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

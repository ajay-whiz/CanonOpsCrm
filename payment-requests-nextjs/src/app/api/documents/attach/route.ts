import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../lib/logger';
import { verifyN8NToken } from '../../../../lib/n8n-auth';

// Attach a document record to a payment request or contact
// Body: { pr_id?: number, contact_id?: number, drive_file_id?: string, file_name?: string, meta?: object }
// Requires at least one of pr_id/contact_id and drive_file_id or file_name.
// Idempotent via optional x-idempotency-key (on (pr_id, drive_file_id)).
export async function POST(req: NextRequest) {
  initSentry();
  const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
  const auth = verifyN8NToken(req);
  if (!auth.ok) return auth.res;

  try {
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { pr_id, contact_id, drive_file_id, file_name, meta } = body || {};

    if (!pr_id && !contact_id) {
      return NextResponse.json({ ok: false, error: 'pr_id or contact_id required', requestId }, { status: 400 });
    }
    if (!drive_file_id && !file_name) {
      return NextResponse.json({ ok: false, error: 'drive_file_id or file_name required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'documents:attach', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('documents.attach.duplicate_ignored', { requestId, idemKey });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('documents.attach.idempotency_failed', { requestId, error: idemErr.message });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }

    const payload: any = {
      pr_id: pr_id ?? null,
      contact_id: contact_id ?? null,
      drive_file_id: drive_file_id ?? null,
      file_name: file_name ?? null,
      meta: meta ?? {},
    };

    const { data, error } = await supabaseServer
      .from('document')
      .insert([payload])
      .select('id, pr_id, contact_id, drive_file_id, file_name, meta, created_at')
      .single();

    if (error) {
      logError('documents.attach.insert_failed', { requestId, error: error.message });
      return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
    }

    await supabaseServer
      .from('audit_log')
      .insert([{
        actor_user_id: null,
        entity_type: payload.pr_id ? 'payment_request' : 'contact',
        entity_id: String(payload.pr_id ?? payload.contact_id),
        action: 'document_attached',
        details: { document_id: data.id, drive_file_id: data.drive_file_id, file_name: data.file_name }
      }]);

    logInfo('documents.attach.ok', { requestId, documentId: data.id });
    return NextResponse.json({ ok: true, data, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

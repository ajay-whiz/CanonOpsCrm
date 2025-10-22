import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase-server';
import { verifyN8NToken } from '../../../../../lib/n8n-auth';
import { initSentry, Sentry } from '../../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../../lib/logger';

// QBO Upsert Vendor endpoint
// - Reads OAuth creds/tokens from `secrets` table (keys you manage: e.g. qbo_credentials, qbo_tokens)
// - For Sprint 3, we mock the upstream call and persist qbo_vendor_id on the payment_request row
// - Idempotent via optional x-idempotency-key

export async function POST(req: NextRequest) {
  try {
    initSentry();
    const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
    const auth = verifyN8NToken(req);
    if (!auth.ok) return auth.res;
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { pr_id, vendor_name, vendor_email } = body || {};

    if (!pr_id || !vendor_name) {
      return NextResponse.json({ ok: false, error: 'pr_id and vendor_name are required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'qbo:upsert-vendor', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('qbo.vendor.duplicate_ignored', { requestId, idemKey });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('qbo.vendor.idempotency_failed', { requestId, error: idemErr.message });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }

    // Load QBO tokens from secrets (admin writes secrets; app reads via RLS policy for admin only)
    const { data: secrets, error: secretsErr } = await supabaseServer
      .from('secrets')
      .select('key, value')
      .in('key', ['qbo_credentials', 'qbo_tokens']);
    if (secretsErr) {
      logError('qbo.vendor.secrets_failed', { requestId, error: secretsErr.message });
      return NextResponse.json({ ok: false, error: 'Failed to read QBO secrets: ' + secretsErr.message, requestId }, { status: 500 });
    }

    const creds = (secrets || []).find((s: any) => s.key === 'qbo_credentials');
    const tokens = (secrets || []).find((s: any) => s.key === 'qbo_tokens');

    if (!creds || !tokens) {
      // For staging: allow mock; in production enforce presence
      // return NextResponse.json({ ok: false, error: 'QBO secrets not set' }, { status: 400 });
    }

    // Simulate QBO upsert and produce a stable vendor id (mock for staging)
    const qboVendorId = `qbo_${vendor_name.toString().toLowerCase().replace(/\s+/g, '_')}`;

    const { data: pr, error: prErr } = await supabaseServer
      .from('payment_request')
      .update({ qbo_vendor_id: qboVendorId })
      .eq('id', pr_id)
      .select('id, qbo_vendor_id')
      .single();

    if (prErr) {
      logError('qbo.vendor.update_failed', { requestId, error: prErr.message });
      return NextResponse.json({ ok: false, error: prErr.message, requestId }, { status: 500 });
    }

    await supabaseServer
      .from('audit_log')
      .insert([{
        actor_user_id: null,
        entity_type: 'payment_request',
        entity_id: String(pr_id),
        action: 'qbo_vendor_upserted',
        details: { qbo_vendor_id: pr.qbo_vendor_id, vendor_name, vendor_email }
      }]);

    logInfo('qbo.vendor.upsert_ok', { requestId, prId: pr_id, qbo_vendor_id: pr.qbo_vendor_id });
    return NextResponse.json({ ok: true, data: pr, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
